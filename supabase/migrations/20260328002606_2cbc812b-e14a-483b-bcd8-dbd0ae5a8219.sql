-- Fix: make the view SECURITY INVOKER (default safe behavior)
ALTER VIEW public.calificaciones_publico SET (security_invoker = on);