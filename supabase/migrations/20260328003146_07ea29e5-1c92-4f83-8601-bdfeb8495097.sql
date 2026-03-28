-- Fix function_search_path_mutable for all 7 affected functions

CREATE OR REPLACE FUNCTION public.obtener_proveedores_disponibles(p_origen text, p_destino text, p_fecha date)
 RETURNS TABLE(proveedor_id uuid, nombre text, calificacion numeric, disponible boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nombre_comercial, p.calificacion, true
  FROM public.proveedores p
  WHERE p.activo = true AND p.estatus = 'aprobado'
    AND p.rutas_frecuentes @> ARRAY[p_origen, p_destino]
  LIMIT 5;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validar_cotizacion_compleja()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.volumen_total > 80 OR NEW.tipo_servicio IS NULL OR NEW.origen IS NULL THEN
    NEW.estatus := 'requiere_asesor';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generar_orden()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.estatus = 'confirmado' THEN
    INSERT INTO public.ordenes_servicio (cotizacion_id, folio, estatus)
    VALUES (NEW.id, 'LUM-' || EXTRACT(EPOCH FROM NOW())::bigint, 'activo');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.desbloquear_chat(p_chat_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.chats_publicaciones SET contacto_desbloqueado = true WHERE id = p_chat_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.crear_seguimientos_auto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.seguimientos (cotizacion_id, cliente_id, fecha_programada)
  VALUES
  (NEW.id, NEW.cliente_id, NOW() + INTERVAL '1 hour'),
  (NEW.id, NEW.cliente_id, NOW() + INTERVAL '24 hour'),
  (NEW.id, NEW.cliente_id, NOW() + INTERVAL '3 day'),
  (NEW.id, NEW.cliente_id, NOW() + INTERVAL '5 day');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guardar_aceptacion(p_cotizacion_id uuid, p_cliente_id uuid, p_ip text, p_user_agent text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.aceptaciones_legales (
    cotizacion_id, cliente_id, acepta_terminos, acepta_privacidad,
    acepta_condiciones, acepta_cancelaciones, acepta_pago_total,
    texto_aceptacion, ip, user_agent
  ) VALUES (
    p_cotizacion_id, p_cliente_id, true, true, true, true, true,
    'CONFIRMO DE RECIBIDO Y ACEPTO LOS TERMINOS Y CONDICIONES DEL SERVICIO CON LA UNION MUDANZAS',
    p_ip, p_user_agent
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.obtener_proveedores_priorizados(p_origen text, p_destino text, p_fecha date, p_tipo_servicio text, p_volumen numeric)
 RETURNS TABLE(proveedor_id uuid, nombre_comercial text, logo_url text, calificacion numeric, score numeric, oportunidad boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.nombre_comercial, p.logo_url,
    COALESCE(p.calificacion, 0) AS calificacion,
    (
      COALESCE(p.calificacion, 0) * 10
      + CASE WHEN p.activo THEN 20 ELSE 0 END
      + CASE WHEN p.premium_activo THEN 5 ELSE 0 END
      + CASE WHEN p.supervision_especial THEN -20 ELSE 0 END
      + CASE WHEN EXISTS (
          SELECT 1 FROM public.publicaciones_carga pc
          WHERE pc.proveedor_id = p.id AND pc.origen = p_origen AND pc.destino = p_destino
            AND pc.fecha_salida = p_fecha AND pc.volumen_disponible >= p_volumen AND pc.estatus = 'activo'
        ) THEN 30 ELSE 0 END
    )::numeric AS score,
    EXISTS (
      SELECT 1 FROM public.publicaciones_carga pc
      WHERE pc.proveedor_id = p.id AND pc.origen = p_origen AND pc.destino = p_destino
        AND pc.fecha_salida = p_fecha AND pc.volumen_disponible >= p_volumen AND pc.estatus = 'activo'
    ) AS oportunidad
  FROM public.proveedores p
  WHERE p.activo = true
  ORDER BY score DESC
  LIMIT 5;
END;
$function$;