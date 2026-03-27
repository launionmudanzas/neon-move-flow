import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function AvisoPrivacidad() {
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
          <div className="w-12 h-12 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-neon-purple" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl text-foreground">
              Aviso de Privacidad
            </h1>
            <p className="text-sm text-muted-foreground">
              La Unión Mudanzas · Última actualización: {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-surface border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              En <strong className="text-foreground">La Unión Mudanzas</strong> protegemos la información personal y operativa de nuestros clientes, proveedores y colaboradores. El presente aviso de privacidad describe cómo recopilamos, usamos y protegemos tu información.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface border border-border">
            <h2 className="font-display font-bold text-foreground text-lg mb-3">Datos que recopilamos</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {['Nombre completo', 'Número de teléfono / WhatsApp', 'Correo electrónico', 'Direcciones de origen y destino', 'Datos del servicio (volumen, inventario, fechas)', 'Documentos como INE, facturas y archivos relacionados con el servicio'].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-surface border border-border">
            <h2 className="font-display font-bold text-foreground text-lg mb-3">Uso de la información</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {['Generación de cotizaciones y órdenes de servicio', 'Coordinación logística del traslado', 'Seguimiento en tiempo real del servicio', 'Facturación y comprobantes de pago', 'Atención al cliente y soporte operativo', 'Mejora continua de la operación del servicio'].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-surface border border-border">
            <h2 className="font-display font-bold text-foreground text-lg mb-3">Protección de datos</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                'No vendemos tu información personal a terceros.',
                'Solo compartimos datos con proveedores o terceros involucrados directamente en la operación de tu servicio.',
                'Implementamos medidas razonables de confidencialidad y seguridad para proteger tus datos.',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-purple mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
            <h2 className="font-display font-bold text-foreground text-lg mb-3">Contacto</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Si tienes preguntas sobre el manejo de tu información, contáctanos:
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-sm">
                📧{' '}
                <a href="mailto:launionmudanzas@gmail.com" className="text-neon-cyan hover:underline font-semibold">
                  launionmudanzas@gmail.com
                </a>
              </p>
              <p className="text-sm">
                📱{' '}
                <a href="https://wa.me/4421270514" target="_blank" rel="noopener noreferrer" className="text-neon-green hover:underline font-semibold">
                  WhatsApp: 442 127 0514
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
