
-- =============================================
-- 1. Convert views to SECURITY INVOKER
-- =============================================

CREATE OR REPLACE VIEW public.proveedores_publico
WITH (security_invoker = true)
AS
SELECT id, nombre_comercial, logo_url, calificacion,
       ciudades_cobertura, rutas_frecuentes, premium_activo, activo
FROM proveedores
WHERE activo = true;

CREATE OR REPLACE VIEW public.calificaciones_publico
WITH (security_invoker = true)
AS
SELECT id, proveedor_id, puntualidad, trato, cuidado_carga,
       cumplimiento, experiencia_general, promedio, comentario, created_at
FROM calificaciones_servicio;

CREATE OR REPLACE VIEW public.rutas_publico
WITH (security_invoker = true)
AS
SELECT id, origen, destino, activa, es_directa, notas
FROM rutas;

GRANT SELECT ON public.proveedores_publico TO anon, authenticated;
GRANT SELECT ON public.calificaciones_publico TO anon, authenticated;
GRANT SELECT ON public.rutas_publico TO anon, authenticated;

-- =============================================
-- 2. Policies for unidades table (RLS on, no policies)
-- =============================================

CREATE POLICY "unidades_admin_all"
  ON public.unidades FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "unidades_owner_select"
  ON public.unidades FOR SELECT TO authenticated
  USING (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui
      WHERE ui.user_id = auth.uid()
    )
  );

CREATE POLICY "unidades_owner_insert"
  ON public.unidades FOR INSERT TO authenticated
  WITH CHECK (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui
      WHERE ui.user_id = auth.uid()
    )
  );

CREATE POLICY "unidades_owner_update"
  ON public.unidades FOR UPDATE TO authenticated
  USING (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui
      WHERE ui.user_id = auth.uid()
    )
  )
  WITH CHECK (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui
      WHERE ui.user_id = auth.uid()
    )
  );

CREATE POLICY "unidades_owner_delete"
  ON public.unidades FOR DELETE TO authenticated
  USING (
    proveedor_id = (
      SELECT ui.proveedor_id FROM public.user_identities ui
      WHERE ui.user_id = auth.uid()
    )
  );

-- =============================================
-- 3. Storage bucket policies for private buckets
-- =============================================

CREATE POLICY "ine_clientes_admin_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ine-clientes' AND public.is_admin());
CREATE POLICY "ine_clientes_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ine-clientes' AND public.is_admin());
CREATE POLICY "ine_clientes_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ine-clientes' AND public.is_admin());

CREATE POLICY "evidencias_cotizacion_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'evidencias-cotizacion' AND public.is_admin())
  WITH CHECK (bucket_id = 'evidencias-cotizacion' AND public.is_admin());
CREATE POLICY "evidencias_cotizacion_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidencias-cotizacion');
CREATE POLICY "evidencias_cotizacion_auth_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidencias-cotizacion');

CREATE POLICY "contratos_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'contratos' AND public.is_admin())
  WITH CHECK (bucket_id = 'contratos' AND public.is_admin());
CREATE POLICY "contratos_auth_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contratos');

CREATE POLICY "polizas_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'polizas-seguro' AND public.is_admin())
  WITH CHECK (bucket_id = 'polizas-seguro' AND public.is_admin());
CREATE POLICY "polizas_auth_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'polizas-seguro');

CREATE POLICY "comprobantes_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'comprobantes-pago' AND public.is_admin())
  WITH CHECK (bucket_id = 'comprobantes-pago' AND public.is_admin());
CREATE POLICY "comprobantes_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprobantes-pago');
CREATE POLICY "comprobantes_auth_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'comprobantes-pago');

CREATE POLICY "galerias_auth_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'galerias-proveedores');
CREATE POLICY "galerias_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'galerias-proveedores');
CREATE POLICY "galerias_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'galerias-proveedores' AND public.is_admin());

CREATE POLICY "logos_anon_select" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'logos-proveedor');
CREATE POLICY "logos_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos-proveedor');
CREATE POLICY "logos_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos-proveedor' AND public.is_admin());

CREATE POLICY "evidencias_incidencias_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'evidencias-incidencias' AND public.is_admin())
  WITH CHECK (bucket_id = 'evidencias-incidencias' AND public.is_admin());
CREATE POLICY "evidencias_incidencias_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidencias-incidencias');
CREATE POLICY "evidencias_incidencias_auth_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidencias-incidencias');
