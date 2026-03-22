-- Fix function_search_path_mutable warnings for the 3 affected functions

CREATE OR REPLACE FUNCTION public.sync_premium_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if (tg_op = 'INSERT') or (tg_op = 'UPDATE') then
    update public.proveedores p
      set premium_activo = case
        when (new.estatus is not null and new.estatus not in ('active','trialing')) or (new.fecha_renovacion is not null and new.fecha_renovacion < now()) then false
        else p.premium_activo
      end,
      updated_at = now()
    where p.id = new.proveedor_id;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.expire_publicaciones_now()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  n int;
begin
  update public.publicaciones_carga
    set estatus = 'expirada'
  where expira_at is not null and expira_at <= now() and coalesce(estatus,'') <> 'expirada';
  get diagnostics n = row_count;
  return n;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_reembolso_incumplido()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.estatus = 'incumplido' then
    update public.proveedores p
      set 
        premium_activo = false,
        supervision_especial = true,
        servicios_sin_anticipo_restantes = greatest(p.servicios_sin_anticipo_restantes, 10),
        cuota_reingreso_pendiente = 5000 + coalesce(p.adeudo_cliente_pendiente,0),
        updated_at = now()
    where p.id = new.proveedor_id;
  end if;
  return new;
end;
$function$;