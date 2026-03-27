import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Naturaleza del servicio',
    content: 'La Unión Mudanzas actúa como intermediario logístico, coordinando servicios de transporte mediante una red de proveedores verificados. El proveedor asignado es el responsable directo de la ejecución del servicio.',
  },
  {
    title: '2. Modalidades de servicio',
    content: 'Se ofrecen tres modalidades principales:\n• **Compartido:** Tu mudanza comparte espacio con otras cargas en la misma unidad, optimizando costos.\n• **Directo:** La unidad transporta exclusivamente tu carga sin compartir espacio.\n• **Exclusivo:** Servicio premium con unidad dedicada, prioridad de carga y tiempos garantizados.',
  },
  {
    title: '3. Forma de pago',
    content: '• **Apartado:** Corresponde a la plataforma y asegura tu servicio.\n• **50% al cargar:** Se paga al momento de la recolección de tu mudanza.\n• **Resto antes de descargar:** Se liquida el saldo restante antes de la entrega.\n• **No se realiza descarga sin liquidación total del servicio.**',
  },
  {
    title: '4. Cancelaciones',
    content: '• Cancelación con menos de 24 horas de anticipación: **sin reembolso.**\n• Si la unidad ya está en camino: se retiene el anticipo.\n• Si el servicio ya está en ejecución: se considera servicio completo y se cobra en su totalidad.',
  },
  {
    title: '5. Volumen y cambios',
    content: 'El cliente declara el volumen estimado de su mudanza al momento de la cotización. Si al momento de la carga se detecta mayor volumen, mayor peso, maniobras adicionales o accesos no informados, el costo del servicio se ajustará proporcionalmente.',
  },
  {
    title: '6. Accesos y maniobras',
    content: 'Se pueden generar cargos adicionales por:\n• Calles angostas o sin acceso para la unidad\n• Pisos adicionales sin elevador\n• Acarreos de larga distancia\n• Restricciones de acceso al inmueble\n• Uso de camioneta de apoyo\n• Maniobras especiales (objetos pesados, voluminosos o delicados)',
  },
  {
    title: '7. Responsabilidad',
    content: 'La Unión Mudanzas coordina e intermedia el servicio. El proveedor asignado ejecuta físicamente el traslado. La empresa no se hace responsable por acuerdos, negociaciones o pagos realizados fuera de la plataforma.',
  },
  {
    title: '8. Daños y reclamos',
    content: 'Todo reclamo por daño debe presentarse conforme al protocolo establecido, dentro de las primeras 24 horas posteriores a la entrega. Quedan excluidos de cobertura:\n• Piezas frágiles no declaradas\n• Artículos mal empacados por el cliente\n• Contenido no declarado en el inventario\n• Desgaste natural por uso',
  },
  {
    title: '9. Vehículos',
    content: 'Los traslados de automóviles y motocicletas requieren documentación vigente del vehículo (tarjeta de circulación, póliza de seguro) y seguro de traslado vigente. El cliente es responsable de informar cualquier condición mecánica o estética previa.',
  },
  {
    title: '10. Tiempos de entrega',
    content: 'Los tiempos de entrega son estimados y pueden variar por condiciones de ruta, clima, retenes, tráfico o situaciones operativas fuera del control de la empresa. La Unión Mudanzas no garantiza tiempos exactos de entrega.',
  },
  {
    title: '11. Aceptación',
    content: 'La aceptación digital, pago, apartado o confirmación del servicio a través de la plataforma implica la aceptación plena e irrevocable de estos términos y condiciones.',
  },
];

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-3xl py-8 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-cyan transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-neon-cyan" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl text-foreground">
              Términos y Condiciones
            </h1>
            <p className="text-sm text-muted-foreground">
              La Unión Mudanzas · Última actualización: {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="p-5 rounded-xl bg-surface border border-border">
              <h2 className="font-display font-bold text-foreground text-lg mb-3">{s.title}</h2>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {s.content.split('**').map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i} className="text-foreground font-semibold">{part}</strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 text-center">
          <p className="text-xs text-muted-foreground">
            ¿Tienes dudas sobre estos términos?{' '}
            <a href="https://wa.me/4421270514" target="_blank" rel="noopener noreferrer" className="text-neon-green hover:underline font-semibold">
              Contáctanos por WhatsApp
            </a>{' '}
            o escríbenos a{' '}
            <a href="mailto:launionmudanzas@gmail.com" className="text-neon-cyan hover:underline font-semibold">
              launionmudanzas@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
