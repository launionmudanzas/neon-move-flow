-- Enable RLS on tables (idempotent)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aceptaciones_legales ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for aceptaciones_legales (currently has none)
CREATE POLICY "acep_admin_all" ON public.aceptaciones_legales
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "acep_cliente_select" ON public.aceptaciones_legales
  FOR SELECT TO authenticated
  USING (cliente_id = (SELECT ui.cliente_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()));