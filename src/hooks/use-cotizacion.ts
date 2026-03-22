import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RutaData {
  costo_m3: number;
  notas: string | null;
  es_directa: boolean;
}

interface CotizacionInput {
  nombre: string;
  whatsapp: string;
  origen: string;
  destino: string;
  fecha: string;
  tipoServicio: string;
  modalidad: string;
  volumenTotal: number;
  volumenCobrable: number;
  unidadSugerida: string;
  seguro: boolean;
  montoSeguro: number;
  costoPisos: number;
  costoAcarreo: number;
  urgente: boolean;
}

export interface CotizacionResult {
  cotizacionId: string;
  clienteId: string;
  folio: string;
  precioBase: number;
  precioTotal: number;
  costoRuta: number;
}

const MARGEN_APP = 0.30;
const URGENCIA_PCT = 0.15;
const COSTO_RECOLECCION = 500;
const COSTO_ENTREGA = 500;

function normalize(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function useCotizacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarRuta = useCallback(async (origen: string, destino: string): Promise<RutaData | null> => {
    const o = normalize(origen);
    const d = normalize(destino);

    const { data: rutas } = await supabase
      .from('rutas')
      .select('origen,destino,costo_m3,notas,es_directa')
      .eq('activa', true);

    if (!rutas || rutas.length === 0) return null;

    // Find direct match first
    const directa = rutas.find(r =>
      normalize(r.origen).includes(o.split(',')[0]) &&
      normalize(r.destino).includes(d.split(',')[0])
    );
    if (directa) return directa;

    // Reverse match
    const reversa = rutas.find(r =>
      normalize(r.destino).includes(o.split(',')[0]) &&
      normalize(r.origen).includes(d.split(',')[0])
    );
    if (reversa) return reversa;

    // Partial match
    const parcial = rutas.find(r =>
      (normalize(r.origen).includes(o.split(',')[0]) || o.split(',')[0].includes(normalize(r.origen).split(',')[0])) &&
      (normalize(r.destino).includes(d.split(',')[0]) || d.split(',')[0].includes(normalize(r.destino).split(',')[0]))
    );
    return parcial || null;
  }, []);

  const guardarCotizacion = useCallback(async (input: CotizacionInput): Promise<CotizacionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Find or create cliente
      let clienteId: string;
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('whatsapp', input.whatsapp)
        .maybeSingle();

      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        const { data: nuevoCliente, error: errCliente } = await supabase
          .from('clientes')
          .insert({
            nombre_completo: input.nombre,
            whatsapp: input.whatsapp,
          })
          .select('id')
          .single();
        if (errCliente || !nuevoCliente) throw new Error('Error creando cliente');
        clienteId = nuevoCliente.id;
      }

      // 2. Look up route price from Supabase
      const ruta = await buscarRuta(input.origen, input.destino);
      const costoM3 = ruta?.costo_m3 || 180; // fallback price
      const precioBase = input.volumenCobrable * costoM3;

      // 3. Calculate totals
      const costoAdicionales = input.costoPisos + input.costoAcarreo;
      const subtotal = precioBase + COSTO_RECOLECCION + COSTO_ENTREGA + costoAdicionales;
      const conMargen = subtotal * (1 + MARGEN_APP);
      const conUrgencia = input.urgente ? conMargen * (1 + URGENCIA_PCT) : conMargen;
      const seguroCosto = input.seguro ? input.montoSeguro * 0.025 : 0;
      const precioTotal = Math.round(conUrgencia + seguroCosto);

      // 4. Get folio from DB function
      const { data: folioData } = await supabase.rpc('next_folio');
      const folio = folioData || `LUM-${Date.now()}`;

      // 5. Save cotizacion
      const { data: cot, error: errCot } = await supabase
        .from('cotizaciones')
        .insert({
          cliente_id: clienteId,
          folio,
          origen: input.origen,
          destino: input.destino,
          fecha_salida: input.fecha || null,
          tipo_servicio: input.tipoServicio,
          modalidad: input.modalidad,
          volumen_total: input.volumenTotal,
          volumen_cobrable: input.volumenCobrable,
          unidad_sugerida: input.unidadSugerida,
          precio_base: precioBase,
          costo_recoleccion: COSTO_RECOLECCION,
          costo_entrega: COSTO_ENTREGA,
          costo_adicionales: costoAdicionales,
          margen_negocio: MARGEN_APP * 100,
          precio_total: precioTotal,
          urgencia: input.urgente,
          porcentaje_urgencia: input.urgente ? URGENCIA_PCT * 100 : 0,
          seguro_monto: input.seguro ? input.montoSeguro : null,
          seguro_costo: input.seguro ? seguroCosto : null,
          seguro_porcentaje: input.seguro ? 2.5 : null,
          estatus: 'borrador',
          cliente_acepto: false,
        })
        .select('id')
        .single();

      if (errCot || !cot) throw new Error('Error guardando cotización');

      return {
        cotizacionId: cot.id,
        clienteId,
        folio,
        precioBase,
        precioTotal,
        costoRuta: costoM3,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [buscarRuta]);

  const crearOrdenServicio = useCallback(async (cotizacionId: string): Promise<string | null> => {
    const { data: orden, error } = await supabase
      .from('ordenes_servicio')
      .insert({
        cotizacion_id: cotizacionId,
        estatus: 'generada',
      })
      .select('id,folio')
      .single();

    if (error || !orden) return null;
    return orden.id;
  }, []);

  return { loading, error, guardarCotizacion, crearOrdenServicio, buscarRuta };
}
