/**
 * Bitácora service — auto-registers all status changes & events
 */
import { supabase } from '@/integrations/supabase/client';

export async function registrarBitacora(params: {
  ordenId?: string;
  cotizacionId?: string;
  evento: string;
  descripcion?: string;
  estatusAnterior?: string;
  estatusNuevo?: string;
  usuarioId?: string;
}): Promise<void> {
  try {
    await supabase.from('bitacora_servicio').insert({
      orden_id: params.ordenId ?? null,
      cotizacion_id: params.cotizacionId ?? null,
      evento: params.evento,
      descripcion: params.descripcion ?? null,
      estatus_anterior: params.estatusAnterior ?? null,
      estatus_nuevo: params.estatusNuevo ?? null,
      usuario_id: params.usuarioId ?? null,
    });
  } catch {
    // Non-blocking — never break the main flow
    console.warn('[bitacora] Failed to register event:', params.evento);
  }
}

export const EVENTOS = {
  COTIZACION_CREADA: 'cotizacion_creada',
  PAGO_RECIBIDO: 'pago_recibido',
  ORDEN_GENERADA: 'orden_generada',
  ESTATUS_CAMBIADO: 'estatus_cambiado',
  EVIDENCIA_SUBIDA: 'evidencia_subida',
  EMAIL_ENVIADO: 'email_enviado',
  WHATSAPP_ENVIADO: 'whatsapp_enviado',
  INCIDENCIA_REPORTADA: 'incidencia_reportada',
  REAGENDACION: 'reagendacion',
  PROVEEDOR_ASIGNADO: 'proveedor_asignado',
  PROVEEDOR_ACEPTO: 'proveedor_acepto',
  PROVEEDOR_RECHAZO: 'proveedor_rechazo',
  SERVICIO_FINALIZADO: 'servicio_finalizado',
} as const;
