
-- Add assignment tracking fields to ordenes_servicio
ALTER TABLE public.ordenes_servicio
  ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.proveedores(id),
  ADD COLUMN IF NOT EXISTS unidad_asignada_id uuid REFERENCES public.proveedor_unidades(id),
  ADD COLUMN IF NOT EXISTS origen_asignacion text DEFAULT 'cliente',
  ADD COLUMN IF NOT EXISTS fecha_asignacion timestamptz,
  ADD COLUMN IF NOT EXISTS aceptado_proveedor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_aceptacion_proveedor timestamptz,
  ADD COLUMN IF NOT EXISTS evidencias_carga boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidencias_entrega boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS firma_cliente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pago_completo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notas_cierre text;

-- RLS: provider can see their assigned services
CREATE POLICY "orden_proveedor_select" ON public.ordenes_servicio
  FOR SELECT TO authenticated
  USING (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()
    )
  );

-- RLS: provider can update their assigned services (limited fields via trigger)
CREATE POLICY "orden_proveedor_update" ON public.ordenes_servicio
  FOR UPDATE TO authenticated
  USING (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()
    )
  )
  WITH CHECK (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()
    )
  );

-- RLS: provider can insert evidencias for their orders
CREATE POLICY "evidencias_proveedor_insert" ON public.evidencias_servicio
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ordenes_servicio os
      WHERE os.id = evidencias_servicio.orden_id
        AND os.proveedor_id = (
          SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()
        )
    )
  );

-- RLS: provider can view evidencias for their orders
CREATE POLICY "evidencias_proveedor_select" ON public.evidencias_servicio
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_servicio os
      WHERE os.id = evidencias_servicio.orden_id
        AND os.proveedor_id = (
          SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()
        )
    )
  );

-- RLS: provider can view bitacora for their orders
CREATE POLICY "bitacora_proveedor_select" ON public.bitacora_servicio
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ordenes_servicio os
      WHERE os.id = bitacora_servicio.orden_id
        AND os.proveedor_id = (
          SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()
        )
    )
  );

-- RLS: provider can insert bitacora for their orders
CREATE POLICY "bitacora_proveedor_insert" ON public.bitacora_servicio
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ordenes_servicio os
      WHERE os.id = bitacora_servicio.orden_id
        AND os.proveedor_id = (
          SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()
        )
    )
  );

-- Trigger: sync proveedor_id from cotizacion to orden on insert/update
CREATE OR REPLACE FUNCTION public.sync_orden_proveedor()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.proveedor_id IS NULL THEN
    SELECT c.proveedor_id INTO NEW.proveedor_id
    FROM public.cotizaciones c WHERE c.id = NEW.cotizacion_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_orden_proveedor
  BEFORE INSERT ON public.ordenes_servicio
  FOR EACH ROW EXECUTE FUNCTION public.sync_orden_proveedor();

-- Trigger: validate closure requirements
CREATE OR REPLACE FUNCTION public.validate_orden_closure()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.estatus = 'finalizado' AND OLD.estatus <> 'finalizado' THEN
    -- Check evidence flags
    IF NOT COALESCE(NEW.evidencias_carga, false) THEN
      RAISE EXCEPTION 'No se puede finalizar sin evidencias de carga.';
    END IF;
    IF NOT COALESCE(NEW.evidencias_entrega, false) THEN
      RAISE EXCEPTION 'No se puede finalizar sin evidencias de entrega.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_orden_closure
  BEFORE UPDATE ON public.ordenes_servicio
  FOR EACH ROW EXECUTE FUNCTION public.validate_orden_closure();

-- RLS: provider can report incidencias for their orders
CREATE POLICY "incidencias_proveedor_insert" ON public.incidencias
  FOR INSERT TO authenticated
  WITH CHECK (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()
    )
  );
