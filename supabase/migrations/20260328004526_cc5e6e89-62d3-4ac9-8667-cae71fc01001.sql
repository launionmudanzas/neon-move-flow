-- Enable RLS (safe even if already enabled)
ALTER TABLE public.whatsapp_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_contacts' AND policyname = 'whatsapp_contacts_admin_all') THEN
    CREATE POLICY "whatsapp_contacts_admin_all" ON public.whatsapp_contacts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_messages' AND policyname = 'whatsapp_messages_admin_all') THEN
    CREATE POLICY "whatsapp_messages_admin_all" ON public.whatsapp_messages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;