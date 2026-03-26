
-- Table: seguimientos (follow-up reminders for cotizaciones)
CREATE TABLE public.seguimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'automatico',
  mensaje text,
  fecha_programada timestamp with time zone NOT NULL,
  fecha_completado timestamp with time zone,
  estatus text NOT NULL DEFAULT 'pendiente',
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seg_admin_all" ON public.seguimientos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "seg_cliente_select" ON public.seguimientos
  FOR SELECT TO authenticated
  USING (cliente_id = (SELECT ui.cliente_id FROM public.user_identities ui WHERE ui.user_id = auth.uid()));

CREATE INDEX idx_seguimientos_fecha ON public.seguimientos(fecha_programada);
CREATE INDEX idx_seguimientos_estatus ON public.seguimientos(estatus);
CREATE INDEX idx_seguimientos_cotizacion ON public.seguimientos(cotizacion_id);

-- Table: notas_lead (internal notes per cotizacion)
CREATE TABLE public.notas_lead (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  autor_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notas_lead ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notas_admin_all" ON public.notas_lead
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX idx_notas_lead_cotizacion ON public.notas_lead(cotizacion_id);
CREATE INDEX idx_notas_lead_cliente ON public.notas_lead(cliente_id);
