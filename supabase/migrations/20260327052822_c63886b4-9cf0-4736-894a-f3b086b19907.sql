
-- V3G leads table
CREATE TABLE public.leads_v3g (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE,
  nombre text NOT NULL,
  telefono text NOT NULL,
  origen text NOT NULL,
  destino text NOT NULL,
  fecha_tentativa date,
  tipo_servicio text,
  tipo_inmueble text,
  piso_elevador text,
  mensaje_adicional text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_v3g ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_v3g_anon_insert" ON public.leads_v3g FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "leads_v3g_admin_all" ON public.leads_v3g FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- WhatsApp contacts with BSUID
CREATE TABLE public.whatsapp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads_v3g(id) ON DELETE SET NULL,
  bsuid text NOT NULL UNIQUE,
  telefono_whatsapp text,
  nombre text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_contacts_admin_all" ON public.whatsapp_contacts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- WhatsApp messages
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_id text,
  body text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_messages_admin_all" ON public.whatsapp_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- V3G folio counter
CREATE TABLE public.folio_counters_v3g (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  yyyymmdd text NOT NULL UNIQUE,
  seq integer NOT NULL DEFAULT 0
);

ALTER TABLE public.folio_counters_v3g ENABLE ROW LEVEL SECURITY;
CREATE POLICY "folio_v3g_admin_all" ON public.folio_counters_v3g FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- V3G folio generator function
CREATE OR REPLACE FUNCTION public.next_folio_v3g()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  today  text := to_char(now() AT TIME ZONE 'America/Mexico_City', 'YYYYMMDD');
  newseq integer;
BEGIN
  INSERT INTO public.folio_counters_v3g(yyyymmdd, seq)
  VALUES (today, 1)
  ON CONFLICT (yyyymmdd) DO UPDATE
    SET seq = public.folio_counters_v3g.seq + 1
  RETURNING public.folio_counters_v3g.seq INTO newseq;

  RETURN format('V3G-%s-%04s', today, newseq::text);
END;
$$;

-- Auto-set folio on lead insert
CREATE OR REPLACE FUNCTION public.set_folio_v3g_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.folio IS NULL THEN
    NEW.folio := public.next_folio_v3g();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_folio_v3g
  BEFORE INSERT ON public.leads_v3g
  FOR EACH ROW
  EXECUTE FUNCTION public.set_folio_v3g_on_insert();
