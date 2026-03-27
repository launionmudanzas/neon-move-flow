import { Facebook, Instagram, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoOficial from '@/assets/logo-oficial.png';

const WHATSAPP_NUMBER = '4421270514';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30">
      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src={logoOficial}
                alt="La Unión Mudanzas"
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-3">
              Cada mudanza es una historia. Somos el equipo que te acompaña en cada nueva etapa con logística profesional y atención humana real.
            </p>
            {/* Leyenda de marca */}
            <div className="mb-5 px-3 py-2.5 rounded-xl bg-neon-cyan/5 border border-neon-cyan/15">
              <p className="text-neon-cyan text-xs font-bold">
                #LaUnionMudanzas 🚛❤️
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Salidas todas las semanas · Servicios compartidos · Más de 28 rutas activas
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/launionmudanzasmx"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-neon-blue hover:border-neon-blue/50 transition-all duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/launionmudanzasmx/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-neon-pink hover:border-neon-pink/50 transition-all duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-neon-green hover:border-neon-green/50 transition-all duration-200"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-bold text-foreground text-sm uppercase tracking-wider mb-4">Servicios</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {['Mudanza Residencial', 'Mudanza Corporativa', 'Servicio Compartido', 'Servicio Directo', 'Traslado de Vehículos', 'Paquetería', 'Almacenaje'].map((s) => (
                <li key={s}>
                  <a href="#servicios" className="hover:text-neon-cyan transition-colors duration-200">{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-foreground text-sm uppercase tracking-wider mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-neon-green flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="hover:text-neon-green transition-colors">
                  442 127 0514
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                <a href={`tel:${WHATSAPP_NUMBER}`} className="hover:text-neon-cyan transition-colors">
                  442 127 0514
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-neon-blue flex-shrink-0" />
                <a href="https://www.facebook.com/launionmudanzasmx" target="_blank" rel="noopener noreferrer" className="hover:text-neon-blue transition-colors">
                  /launionmudanzasmx
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-neon-pink flex-shrink-0" />
                <a href="https://www.instagram.com/launionmudanzasmx/" target="_blank" rel="noopener noreferrer" className="hover:text-neon-pink transition-colors">
                  @launionmudanzasmx
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="neon-line mb-6" />

        {/* Phrases of trust */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            'No se descarga sin liquidación del servicio',
            'Toda mudanza se valida con orden de servicio',
            'Cada servicio tiene seguimiento en tiempo real',
            'Tu mercancía viaja bajo condiciones claras y documentadas',
          ].map((phrase) => (
            <div key={phrase} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan flex-shrink-0 mt-1.5" />
              <span className="text-xs text-muted-foreground">{phrase}</span>
            </div>
          ))}
        </div>

        <div className="neon-line mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} La Unión Mudanzas · <span className="text-neon-cyan">#LaUnionMudanzas 🚛❤️</span></span>
          <div className="flex gap-5">
            <Link to="/aviso-de-privacidad" className="hover:text-neon-cyan transition-colors">Aviso de privacidad</Link>
            <Link to="/terminos-y-condiciones" className="hover:text-neon-cyan transition-colors">Términos y condiciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
