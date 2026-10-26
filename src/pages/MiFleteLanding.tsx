import LeadFormPublic from '@/components/LeadFormPublic';
import { siteConfig } from '@/lib/site-config';

/** Entrada comercial separada. Reutiliza el mismo backend de leads del sitio principal. */
export default function MiFleteLanding() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-5">
          <a href="/mi-flete" className="text-2xl font-black tracking-tight text-neon-cyan">mi flete.mx</a>
          <a href="#lead-form" className="rounded-xl bg-neon-cyan px-5 py-3 font-bold text-background">Solicitar cotización</a>
        </div>
      </header>

      <section className="container mx-auto grid max-w-6xl gap-8 px-4 pb-5 pt-12 md:grid-cols-2 md:items-center md:pt-20">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[.18em] text-neon-cyan">Mudanzas y fletes en México</p>
          <h1 className="font-display text-4xl font-black leading-tight md:text-6xl">Tu mudanza empieza con una cotización clara.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">Dinos de dónde a dónde, qué necesitas mover y para cuándo. Una persona revisará tu solicitud y te ayudará a encontrar la modalidad adecuada.</p>
          <a href="#lead-form" className="mt-6 inline-block rounded-xl bg-neon-cyan px-6 py-3.5 font-bold text-background">Cotiza tu traslado</a>
        </div>
        <div className="rounded-3xl border border-neon-cyan/20 bg-surface p-6 md:p-10">
          <h2 className="text-xl font-bold">¿Qué puedes solicitar?</h2>
          <ul className="mt-5 space-y-4 text-muted-foreground">
            <li>✓ Mudanzas compartidas, directas y exclusivas</li>
            <li>✓ Fletes de muebles y mercancía propia</li>
            <li>✓ Traslado de vehículos y servicios especiales</li>
            <li>✓ Asesoría para inventario, accesos y maniobras</li>
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">Sin tarifas inventadas: el precio se determina al revisar los datos del servicio.</p>
        </div>
      </section>

      <LeadFormPublic />
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        mi flete.mx · Solicitudes atendidas por {siteConfig.brandName} ·
        {' '}<a className="underline" href={siteConfig.privacyUrl}>Aviso de privacidad</a> ·
        {' '}<a className="underline" href={siteConfig.termsUrl}>Términos</a>
      </footer>
    </main>
  );
}
