
-- ─────────────────────────────────────────────
-- SEED: clientes
-- ─────────────────────────────────────────────
INSERT INTO public.clientes
  (id, nombre_completo, whatsapp, correo, direccion_principal, notas, created_at, updated_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Mariana López García',       '5512345678', 'mariana.lopez@gmail.com',   'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',            'Cliente frecuente, mudanzas corporativas', now() - interval '30 days', now()),
  ('11111111-0000-0000-0000-000000000002', 'Roberto Sánchez Herrera',     '5598765432', 'roberto.sh@outlook.com',    'Calle Reforma 456, Col. Polanco, CDMX',                    'Mudanza internacional pendiente',          now() - interval '20 days', now()),
  ('11111111-0000-0000-0000-000000000003', 'Alejandra Torres Mendoza',    '5533221100', 'ale.torres@yahoo.com',      'Blvd. Manuel Ávila Camacho 789, Naucalpan, Edo. Mex.',     NULL,                                       now() - interval '15 days', now()),
  ('11111111-0000-0000-0000-000000000004', 'Carlos Eduardo Ramírez Vega', '5544556677', 'carlos.ramirez@empresa.mx', 'Periférico Sur 3000, Col. Pedregal, CDMX',                 'Empresa: Logística Ramírez S.A. de C.V.',  now() - interval '10 days', now()),
  ('11111111-0000-0000-0000-000000000005', 'Sofía Ibáñez Castillo',       '5566778899', 'sofia.ibanez@hotmail.com',  'Calle Plateros 12, Col. Santa Fe, Guadalajara, Jalisco',   'Requiere embalaje especial para cuadros',  now() - interval '5 days',  now())
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- SEED: cotizaciones
-- ─────────────────────────────────────────────
INSERT INTO public.cotizaciones
  (id, folio, cliente_id, origen, destino, tipo_servicio, modalidad, modalidad_sugerida,
   unidad_sugerida, urgencia, porcentaje_urgencia,
   volumen_total, volumen_cobrable,
   precio_base, costo_recoleccion, costo_entrega, costo_adicionales,
   margen_negocio, comision_app, seguro_porcentaje, seguro_monto, seguro_costo,
   precio_total, estatus, cliente_acepto,
   fecha_salida, fecha_llegada,
   observaciones, created_at, updated_at)
VALUES
  -- 1. Completada
  ('22222222-0000-0000-0000-000000000001',
   'LUM-20260301-0001', '11111111-0000-0000-0000-000000000001',
   'CDMX', 'Monterrey, NL',
   'foraneo', 'exclusivo', 'exclusivo', 'camion_3.5t',
   false, 0,
   18.5, 18.5,
   5550, 800, 800, 200,
   1480, 740, 2, 200000, 4000,
   13570, 'completada', true,
   current_date - 25, current_date - 24,
   'Mudanza de casa habitación completa. Cliente muy satisfecho.',
   now() - interval '28 days', now() - interval '24 days'),

  -- 2. En proceso – urgente
  ('22222222-0000-0000-0000-000000000002',
   'LUM-20260308-0002', '11111111-0000-0000-0000-000000000002',
   'CDMX', 'Guadalajara, Jalisco',
   'foraneo', 'exclusivo', 'exclusivo', 'camion_10t',
   true, 20,
   45.0, 45.0,
   13500, 1200, 1200, 500,
   3240, 1620, 3, 500000, 15000,
   36260, 'en_proceso', true,
   current_date + 2, current_date + 3,
   'Mudanza corporativa urgente. 3 oficinas completas.',
   now() - interval '14 days', now() - interval '2 days'),

  -- 3. Aceptada
  ('22222222-0000-0000-0000-000000000003',
   'LUM-20260312-0003', '11111111-0000-0000-0000-000000000003',
   'Naucalpan, Edo. Mex.', 'Querétaro, Qro.',
   'foraneo', 'compartido', 'compartido', 'camioneta',
   false, 0,
   8.0, 8.0,
   2400, 400, 400, 0,
   640, 320, 2, 80000, 1600,
   5760, 'aceptada', true,
   current_date + 5, current_date + 6,
   'Poca carga, se comparte unidad.',
   now() - interval '10 days', now() - interval '8 days'),

  -- 4. Enviada
  ('22222222-0000-0000-0000-000000000004',
   'LUM-20260315-0004', '11111111-0000-0000-0000-000000000004',
   'CDMX', 'Puebla, Pue.',
   'foraneo', 'exclusivo', 'exclusivo', 'camion_3.5t',
   false, 0,
   22.0, 22.0,
   6600, 600, 600, 300,
   1760, 880, 2.5, 300000, 7500,
   18240, 'enviada', false,
   current_date + 10, current_date + 11,
   'Esperar confirmación del cliente.',
   now() - interval '7 days', now() - interval '6 days'),

  -- 5. Borrador
  ('22222222-0000-0000-0000-000000000005',
   NULL, '11111111-0000-0000-0000-000000000005',
   'Guadalajara, Jalisco', 'Puerto Vallarta, Jalisco',
   'local', 'exclusivo', 'exclusivo', 'camioneta',
   false, 0,
   6.0, 6.0,
   3000, 300, 300, 150,
   750, 375, 2, 50000, 1000,
   5875, 'borrador', false,
   current_date + 15, current_date + 15,
   'Mudanza residencial, incluye cuadros con embalaje especial.',
   now() - interval '3 days', now() - interval '3 days'),

  -- 6. Cancelada
  ('22222222-0000-0000-0000-000000000006',
   'LUM-20260318-0005', '11111111-0000-0000-0000-000000000001',
   'CDMX', 'Cancún, Q. Roo',
   'foraneo', 'compartido', 'compartido', 'camion_3.5t',
   false, 0,
   12.0, 12.0,
   4800, 500, 500, 200,
   1200, 600, 2, 120000, 2400,
   10200, 'cancelada', false,
   current_date - 5, current_date - 4,
   'Cliente canceló por cambio de planes.',
   now() - interval '12 days', now() - interval '9 days')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- SEED: ordenes_servicio
-- ─────────────────────────────────────────────
INSERT INTO public.ordenes_servicio
  (id, folio, cotizacion_id, estatus, pdf_url, created_at)
VALUES
  ('33333333-0000-0000-0000-000000000001',
   'LUM-20260301-0001', '22222222-0000-0000-0000-000000000001',
   'completada', NULL,
   now() - interval '27 days'),

  ('33333333-0000-0000-0000-000000000002',
   'LUM-20260308-0002', '22222222-0000-0000-0000-000000000002',
   'en_proceso', NULL,
   now() - interval '13 days'),

  ('33333333-0000-0000-0000-000000000003',
   'LUM-20260312-0003', '22222222-0000-0000-0000-000000000003',
   'generada', NULL,
   now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;
