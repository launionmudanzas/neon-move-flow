-- Rutas principales La Unión Mudanzas (bidireccionales)
-- Precios por m³ basados en tarifas reales de mercado México 2024

INSERT INTO public.rutas (origen, destino, costo_m3, es_directa, activa, notas) VALUES

-- Querétaro ↔ Ciudad de México (~220 km)
('Querétaro',        'Ciudad de México', 380, true, true, 'Salida lunes y jueves'),
('Ciudad de México', 'Querétaro',        380, true, true, 'Salida martes y viernes'),

-- Querétaro ↔ Guadalajara (~310 km)
('Querétaro',        'Guadalajara',      420, true, true, 'Salida miércoles'),
('Guadalajara',      'Querétaro',        420, true, true, 'Salida miércoles'),

-- Querétaro ↔ Monterrey (~640 km)
('Querétaro',        'Monterrey',        520, true, true, 'Salida lunes'),
('Monterrey',        'Querétaro',        520, true, true, 'Salida lunes'),

-- Ciudad de México ↔ Guadalajara (~540 km)
('Ciudad de México', 'Guadalajara',      480, true, true, 'Salida martes y sábado'),
('Guadalajara',      'Ciudad de México', 480, true, true, 'Salida martes y sábado'),

-- Ciudad de México ↔ Monterrey (~900 km)
('Ciudad de México', 'Monterrey',        580, true, true, 'Salida lunes'),
('Monterrey',        'Ciudad de México', 580, true, true, 'Salida lunes'),

-- Guadalajara ↔ Monterrey (~750 km)
('Guadalajara',      'Monterrey',        540, true, true, 'Salida miércoles'),
('Monterrey',        'Guadalajara',      540, true, true, 'Salida miércoles'),

-- Querétaro ↔ León (~130 km)
('Querétaro',        'León',             280, true, true, 'Salida todos los viernes'),
('León',             'Querétaro',        280, true, true, 'Salida todos los viernes'),

-- Querétaro ↔ San Luis Potosí (~200 km)
('Querétaro',        'San Luis Potosí',  350, true, true, 'Salida martes'),
('San Luis Potosí',  'Querétaro',        350, true, true, 'Salida martes'),

-- Ciudad de México ↔ Puebla (~130 km)
('Ciudad de México', 'Puebla',           300, true, true, 'Salida lunes, miércoles y viernes'),
('Puebla',           'Ciudad de México', 300, true, true, 'Salida lunes, miércoles y viernes'),

-- Ciudad de México ↔ Cancún (~1,750 km)
('Ciudad de México', 'Cancún',           780, true, true, 'Salida lunes — servicio directo'),
('Cancún',           'Ciudad de México', 780, true, true, 'Salida lunes — servicio directo'),

-- Ciudad de México ↔ Tijuana (~2,800 km)
('Ciudad de México', 'Tijuana',          950, true, true, 'Salida lunes — tráiler exclusivo'),
('Tijuana',          'Ciudad de México', 950, true, true, 'Salida lunes — tráiler exclusivo'),

-- Guadalajara ↔ Tijuana (~2,100 km)
('Guadalajara',      'Tijuana',          880, true, true, 'Salida lunes'),
('Tijuana',          'Guadalajara',      880, true, true, 'Salida lunes'),

-- Querétaro ↔ Tijuana (~2,600 km)
('Querétaro',        'Tijuana',          920, true, true, 'Salida lunes'),
('Tijuana',          'Querétaro',        920, true, true, 'Salida lunes'),

-- Monterrey ↔ Tijuana (~1,700 km)
('Monterrey',        'Tijuana',          860, true, true, 'Salida lunes'),
('Tijuana',          'Monterrey',        860, true, true, 'Salida lunes');