import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Lead = {
  id: string; folio: string; nombre: string; telefono: string;
  origen: string; destino: string; fecha_tentativa: string | null;
  created_at: string; tipo_solicitante: string | null;
  fuente_consulta: string; mensaje_adicional: string | null;
};
export default function AdminMiFleteLeads() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/auth');
  }, [isLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    let active = true;
    supabase.from('leads_v3g')
      .select('id,folio,nombre,telefono,origen,destino,fecha_tentativa,created_at,tipo_solicitante,fuente_consulta,mensaje_adicional')
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data, error: e }) => {
        if (!active) return;
        setRows((data ?? []) as Lead[]);
        setError(e?.message ?? '');
        setLoading(false);
      });
    return () => { active = false; };
  }, [user, isAdmin]);

  const visible = useMemo(() => rows.filter(r =>
    [r.folio, r.nombre, r.telefono, r.origen, r.destino].join(' ').toLowerCase()
      .includes(filter.toLowerCase())
  ), [rows, filter]);

  if (isLoading || !isAdmin) return <main className="p-8 text-foreground">Verificando acceso…</main>;
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-6xl">
        <Link to="/admin" className="text-neon-cyan">← Volver a administración</Link>
        <h1 className="mt-5 text-3xl font-black">Solicitudes · mi flete.mx</h1>
        <p className="mt-2 text-sm text-muted-foreground">Solicitudes no equivalen a ventas ni a cotizaciones enviadas. La calificación requiere confirmar contacto y servicio.</p>
        <input aria-label="Buscar solicitudes" value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Buscar por folio, cliente, teléfono o ruta"
          className="my-5 w-full rounded-lg border border-border bg-surface px-4 py-3" />
        {loading && <p>Consultando solicitudes…</p>}
        {error && <p role="alert" className="text-red-400">No fue posible consultar las solicitudes: {error}</p>}
        {!loading && !error && <p className="mb-4 text-sm text-muted-foreground">{visible.length} solicitudes visibles (máximo 200 registros recientes).</p>}
        <div className="grid gap-3">
          {visible.map(r => <article key={r.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{r.nombre} · {r.folio}</strong>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('es-MX')}</span>
            </div>
            <p className="mt-2">{r.origen} → {r.destino} {r.fecha_tentativa ? '· '+r.fecha_tentativa : '· fecha sin definir'}</p>
            <p className="text-sm text-muted-foreground">Solicitante: {r.tipo_solicitante ?? 'histórico sin clasificar'} · Fuente: {r.fuente_consulta}</p>
            {r.mensaje_adicional && <p className="mt-1 text-sm">{r.mensaje_adicional}</p>}
            <a className="mt-3 inline-block font-semibold text-neon-cyan underline" href={'https://wa.me/' + (r.telefono.length === 10 ? '52' : '') + r.telefono} target="_blank" rel="noreferrer">Contactar por WhatsApp</a>
          </article>)}
          {!loading && !error && visible.length === 0 && <p className="text-muted-foreground">Sin solicitudes para mostrar.</p>}
        </div>
      </div>
    </main>
  );
}
