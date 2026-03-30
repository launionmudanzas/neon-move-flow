
-- 1. Enable RLS on documentos table (policies already exist)
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- 2. Drop anonymous access to publicaciones_carga (internal commission data)
DROP POLICY IF EXISTS "pub_anon_select_active" ON public.publicaciones_carga;

-- 3. Ensure protect_cotizacion_financials trigger is attached
-- (function exists but trigger may be missing)
DROP TRIGGER IF EXISTS enforce_cotizacion_financials ON public.cotizaciones;
CREATE TRIGGER enforce_cotizacion_financials
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.protect_cotizacion_financials();

-- 4. Fix search_path on functions missing it
CREATE OR REPLACE FUNCTION public.generar_folio()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  return 'LU-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random()*10000);
end;
$function$;

CREATE OR REPLACE FUNCTION public.crear_orden_servicio()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  insert into public.ordenes_servicio (
    cotizacion_id,
    folio,
    fecha_salida,
    fecha_llegada,
    tipo_carga
  )
  values (
    new.id,
    public.generar_folio(),
    new.fecha_servicio,
    new.fecha_servicio + interval '1 day',
    new.tipo_servicio
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.validar_pagos()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  total numeric;
begin
  select precio_total into total from public.cotizaciones where id = new.cotizacion_id;
  if new.tipo_pago = 'apartado' and new.monto <= 0 then
    raise exception 'El apartado no puede ser 0';
  end if;
  if new.tipo_pago = 'carga' and new.monto != (total * 0.5) then
    raise exception 'El pago de carga debe ser 50%% del total';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.actualizar_estatus()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.tipo_pago = 'apartado' then
    update public.cotizaciones set estatus = 'apartado' where id = new.cotizacion_id;
  elsif new.tipo_pago = 'carga' then
    update public.cotizaciones set estatus = 'confirmado' where id = new.cotizacion_id;
  elsif new.tipo_pago = 'final' then
    update public.cotizaciones set estatus = 'finalizado' where id = new.cotizacion_id;
  end if;
  return new;
end;
$function$;
