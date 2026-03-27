
-- 1. Horarios de disponibilidad para visitas oculares de proveedores
CREATE TABLE public.horarios_visita_proveedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL DEFAULT '09:00',
  hora_fin TIME NOT NULL DEFAULT '17:00',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.horarios_visita_proveedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "horarios_admin_all" ON public.horarios_visita_proveedor
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "horarios_owner_select" ON public.horarios_visita_proveedor
  FOR SELECT TO authenticated
  USING (proveedor_id = (SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()));

CREATE POLICY "horarios_owner_manage" ON public.horarios_visita_proveedor
  FOR ALL TO authenticated
  USING (proveedor_id = (SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()))
  WITH CHECK (proveedor_id = (SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()));

-- 2. Solicitudes de visita ocular
CREATE TABLE public.solicitudes_visita (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
  fecha_solicitada DATE NOT NULL,
  hora_solicitada TIME,
  direccion TEXT,
  notas TEXT,
  estatus TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitudes_visita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visita_admin_all" ON public.solicitudes_visita
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "visita_proveedor_select" ON public.solicitudes_visita
  FOR SELECT TO authenticated
  USING (proveedor_id = (SELECT ui.proveedor_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()));

CREATE POLICY "visita_cliente_select" ON public.solicitudes_visita
  FOR SELECT TO authenticated
  USING (cliente_id = (SELECT ui.cliente_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()));

-- 3. Allow anon/public SELECT on proveedores for provider matching (filtered columns only via view)
-- We create a public-facing view to expose ONLY safe fields
CREATE OR REPLACE VIEW public.proveedores_publico AS
SELECT
  id,
  nombre_comercial,
  logo_url,
  calificacion,
  ciudades_cobertura,
  rutas_frecuentes,
  premium_activo,
  activo
FROM public.proveedores
WHERE activo = true;

-- Allow anon read on the view (proveedores table itself stays protected)
GRANT SELECT ON public.proveedores_publico TO anon;
GRANT SELECT ON public.proveedores_publico TO authenticated;

-- 4. Add RLS policy for public/anon read on rutas (currently only authenticated)
CREATE POLICY "rutas_select_anon" ON public.rutas
  FOR SELECT TO anon USING (true);

-- 5. Allow anon insert on clientes and cotizaciones for the public cotizador
CREATE POLICY "clientes_anon_insert" ON public.clientes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "cotizaciones_anon_insert" ON public.cotizaciones
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "cotizaciones_anon_select" ON public.cotizaciones
  FOR SELECT TO anon USING (true);
