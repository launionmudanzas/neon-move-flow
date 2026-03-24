
-- ── Bitácora de servicios (audit log) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bitacora_servicio (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id      uuid REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  cotizacion_id uuid REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  evento        text NOT NULL,
  descripcion   text,
  estatus_anterior text,
  estatus_nuevo    text,
  usuario_id    uuid,
  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bitacora_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bitacora_admin_all" ON public.bitacora_servicio
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "bitacora_cliente_select" ON public.bitacora_servicio
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cotizaciones c
      WHERE c.id = bitacora_servicio.cotizacion_id
        AND c.cliente_id = (SELECT cliente_id FROM public.user_identities WHERE user_id = auth.uid())
    )
  );

-- ── Evidencias del servicio (fotos, audio, firma) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.evidencias_servicio (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id      uuid REFERENCES public.ordenes_servicio(id) ON DELETE CASCADE,
  cotizacion_id uuid REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  tipo          text NOT NULL,
  url           text NOT NULL,
  descripcion   text,
  subido_por    uuid,
  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.evidencias_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidencias_admin_all" ON public.evidencias_servicio
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "evidencias_cliente_select" ON public.evidencias_servicio
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cotizaciones c
      WHERE c.id = evidencias_servicio.cotizacion_id
        AND c.cliente_id = (SELECT cliente_id FROM public.user_identities WHERE user_id = auth.uid())
    )
  );

-- ── Storage bucket for service evidences ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias-servicio', 'evidencias-servicio', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'evidencias_servicio_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "evidencias_servicio_public_read" ON storage.objects FOR SELECT USING (bucket_id = ''evidencias-servicio'')';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'evidencias_servicio_auth_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "evidencias_servicio_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''evidencias-servicio'')';
  END IF;
END $$;

-- ── Extra fields on cotizaciones ──────────────────────────────────────────
ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.proveedores(id) ON DELETE SET NULL;
