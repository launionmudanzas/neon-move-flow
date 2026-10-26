# mi flete.mx — frente comercial y reutilización de datos

## Decisión de arquitectura
Este repositorio ya contiene un sitio de captación funcional a nivel de código: `src/components/LeadFormPublic.tsx` invoca la función Supabase `submit-public-lead`, y `src/pages/AdminCRM.tsx` consulta clientes y cotizaciones. Por lo tanto **no se construirá un segundo CRM ni se duplicarán clientes**.

## Productos separados
1. **mi flete.mx**: sitio comercial público para clientes finales reales, con el formulario y el embudo de captación.
2. **La Unión Mudanzas**: operación, tarifas privadas y seguimiento en la app existente.
3. **Módulos para oficinas**: cotizador privado, documentos, directorio y capacitación; se implementarán después, sin mezclar datos de empresas.

## Integración con la plataforma desarrollada con Claude
Fuente de reglas: repositorio privado `launionmudanzas/plataforma-logistica`, NO se publica ni se copia a este sitio.
Fuente de solicitudes online actual: backend de Supabase utilizado por `neon-move-flow`.
El repositorio privado dispone de motores y PostgreSQL local, pero según `docs/ESTADO_REAL_DEL_PROYECTO.md` **no tiene API autenticada ni interfaz**. Por ello **no existe sincronización automática confirmada** entre PostgreSQL local y Supabase.

El enlace se hará a través de una **API autenticada de integración**, con registros de procedencia, IDs externos, deduplicación e idempotencia. Hasta que exista, el formulario actual continuará guardando únicamente en Supabase; nunca simular sincronización.

## Prioridad: captar clientes finales
- Registrar la condición del solicitante: dueño de la mudanza / encargado autorizado / transportista o intermediario.
- Mantener los intermediarios fuera del embudo de clientes finales, pero conservar su contacto en canal profesional separado si lo autorizan.
- Obtener origen, destino, fecha de carga, inventario y accesos para calificar solicitudes.
- Guardar fuente de adquisición, fecha, consentimiento, estado de validación, estado comercial y próxima acción.
- Una cotización solicitada NO es una cotización enviada y una solicitud NO es una venta.
- Nunca mostrar costos de proveedor, tablas internas ni márgenes al público.
- No calcular precio final automático sin tarifas vigentes y margen autorizado.

## Seguridad previa al despliegue
- Existe un archivo `.env` versionado en este repositorio público y en `launionmudanzas/app.js`. **Auditar su contenido de forma segura y rotar cualquier secreto real**; no copiar secretos a tickets o frontend.
- Verificar políticas RLS y límites de la función `submit-public-lead`.
- Verificar antispam, duplicados, aviso de privacidad y consentimiento.
- El dominio `mi flete.mx` no se considera conectado hasta verificar DNS y despliegue.

## Criterio de éxito
Solicitudes recibidas, solicitantes finales verificados, cotizaciones efectivamente enviadas y servicios contratados; además tasa de conversión por canal.

## Pendientes antes del lanzamiento
1. Determinar hosting y configuración del dominio `mi flete.mx`.
2. Validar operación real de `submit-public-lead` y tablas en Supabase.
3. Diseñar un límite de acceso entre la marca pública y los datos privados.
4. Incorporar clasificación de solicitantes y medición de adquisición.
5. Añadir API autenticada e integración idempotente a la matriz privada, con pruebas.
6. Precios de módulos y suscripciones se definen al final, como decisión comercial separada.
