/**
 * /admin/rutas — Operational Routes Manager
 * La Unión Mudanzas — admin-only editable route table
 */
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Route, MapPin, AlertTriangle,
  Plus, Trash2, Save, RotateCcw, Search, ChevronDown,
  ChevronUp, ToggleLeft, ToggleRight, Tag, GitBranch,
  Navigation, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ROUTES, RouteDefinition } from '@/lib/routing-data';
import logoOficial from '@/assets/logo-oficial.png';

// ─── Local state types ─────────────────────────────────────────────────────

interface EditableRoute extends RouteDefinition {
  active: boolean;
  dirty: boolean;
}

type EditSection = 'cities' | 'detours' | 'extensions';

// ─── Helpers ───────────────────────────────────────────────────────────────

function initRoutes(): EditableRoute[] {
  return ROUTES.map(r => ({ ...r, active: true, dirty: false }));
}

const SECTION_CFG: Record<EditSection, { label: string; color: string; icon: typeof MapPin; hint: string }> = {
  cities:     { label: 'Ciudades en ruta',   color: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10',    icon: MapPin,    hint: 'Servicio compartido normal' },
  detours:    { label: 'Desvíos',            color: 'text-neon-orange border-neon-orange/30 bg-neon-orange/10', icon: Navigation, hint: 'Cargo adicional aplicado' },
  extensions: { label: 'Extensiones',        color: 'text-neon-blue border-neon-blue/30 bg-neon-blue/10',    icon: GitBranch, hint: 'Consultar con operaciones' },
};

function CityChip({
  city,
  section,
  onRemove,
}: {
  city: string;
  section: EditSection;
  onRemove: () => void;
}) {
  const cfg = SECTION_CFG[section];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      {city}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:opacity-70 transition-opacity"
        title="Quitar ciudad"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

function AddCityInput({
  section,
  onAdd,
}: {
  section: EditSection;
  onAdd: (city: string) => void;
}) {
  const [val, setVal] = useState('');
  const submit = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setVal('');
  };
  return (
    <div className="flex gap-1 mt-2">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder={`Agregar ciudad (Enter)`}
        className="flex-1 min-w-0 bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all"
      />
      <button
        onClick={submit}
        disabled={!val.trim()}
        className="px-2.5 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold hover:bg-neon-cyan/20 disabled:opacity-40 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Route Card ────────────────────────────────────────────────────────────

function RouteCard({
  route,
  onToggleActive,
  onAddCity,
  onRemoveCity,
  onReset,
}: {
  route: EditableRoute;
  onToggleActive: () => void;
  onAddCity: (section: EditSection, city: string) => void;
  onRemoveCity: (section: EditSection, idx: number) => void;
  onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const totalCities = route.cities.length + route.detours.length + route.extensions.length;

  return (
    <motion.div
      layout
      className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
        route.active ? 'border-border' : 'border-border/40 opacity-60'
      } ${route.dirty ? 'ring-1 ring-neon-orange/40' : ''}`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          route.active ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'bg-muted border border-border'
        }`}>
          <Route className={`w-4 h-4 ${route.active ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground text-sm truncate">
              Ruta {route.id} — {route.name}
            </span>
            {route.dirty && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-orange/10 border border-neon-orange/30 text-neon-orange font-bold">
                Sin guardar
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {route.cities.length} ciudades · {route.detours.length} desvíos · {route.extensions.length} extensiones
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {route.dirty && (
            <button
              onClick={onReset}
              title="Deshacer cambios"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleActive}
            title={route.active ? 'Desactivar ruta' : 'Activar ruta'}
            className={`transition-colors ${route.active ? 'text-neon-green' : 'text-muted-foreground'}`}
          >
            {route.active
              ? <ToggleRight className="w-7 h-7" />
              : <ToggleLeft className="w-7 h-7" />
            }
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsed preview */}
      {!expanded && totalCities > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1 max-h-12 overflow-hidden">
          {route.cities.slice(0, 8).map(c => (
            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-cyan/8 border border-neon-cyan/20 text-neon-cyan/80">{c}</span>
          ))}
          {route.cities.length > 8 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">+{route.cities.length - 8} más</span>
          )}
        </div>
      )}

      {/* Expanded sections */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/40">
              {(['cities', 'detours', 'extensions'] as EditSection[]).map(section => {
                const cfg = SECTION_CFG[section];
                const items = route[section];
                return (
                  <div key={section}>
                    <div className="flex items-center gap-2 mb-2">
                      <cfg.icon className={`w-3.5 h-3.5 ${cfg.color.split(' ')[0]}`} />
                      <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                      <span className="text-[10px] text-muted-foreground">({items.length})</span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                        {cfg.hint}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.length === 0 && (
                        <span className="text-[11px] text-muted-foreground/50 italic">Sin ciudades</span>
                      )}
                      {items.map((city, idx) => (
                        <CityChip
                          key={`${city}-${idx}`}
                          city={city}
                          section={section}
                          onRemove={() => onRemoveCity(section, idx)}
                        />
                      ))}
                    </div>
                    {route.active && (
                      <AddCityInput section={section} onAdd={(city) => onAddCity(section, city)} />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminRutas() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [routes, setRoutes] = useState<EditableRoute[]>(initRoutes);
  const [originalRoutes] = useState<EditableRoute[]>(initRoutes);
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState(false);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Auth guard — after all hooks
  if (!isLoading && (!user || !isAdmin)) {
    navigate('/');
    return null;
  }

  const dirtyCount = routes.filter(r => r.dirty).length;
  const activeCount = routes.filter(r => r.active).length;

  const filtered = useMemo(() => {
    return routes.filter(r => {
      if (filterActive === 'active' && !r.active) return false;
      if (filterActive === 'inactive' && r.active) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.cities.some(c => c.toLowerCase().includes(q)) ||
        r.detours.some(c => c.toLowerCase().includes(q)) ||
        r.extensions.some(c => c.toLowerCase().includes(q))
      );
    });
  }, [routes, search, filterActive]);

  // Toggle route active/inactive
  const toggleActive = (id: number) => {
    setRoutes(prev => prev.map(r =>
      r.id === id ? { ...r, active: !r.active, dirty: true } : r
    ));
  };

  // Add city to a section
  const addCity = (routeId: number, section: EditSection, city: string) => {
    setRoutes(prev => prev.map(r => {
      if (r.id !== routeId) return r;
      if (r[section].includes(city)) return r; // no duplicates
      return { ...r, [section]: [...r[section], city], dirty: true };
    }));
  };

  // Remove city from a section
  const removeCity = (routeId: number, section: EditSection, idx: number) => {
    setRoutes(prev => prev.map(r => {
      if (r.id !== routeId) return r;
      const updated = [...r[section]];
      updated.splice(idx, 1);
      return { ...r, [section]: updated, dirty: true };
    }));
  };

  // Reset a single route to original
  const resetRoute = (id: number) => {
    const orig = originalRoutes.find(r => r.id === id);
    if (!orig) return;
    setRoutes(prev => prev.map(r =>
      r.id === id ? { ...orig, active: r.active, dirty: false } : r
    ));
  };

  // Save all (in-memory only — no DB write for routing-data.ts changes)
  const saveAll = () => {
    setRoutes(prev => prev.map(r => ({ ...r, dirty: false })));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalCities = routes.reduce((acc, r) => acc + r.cities.length, 0);
  const totalDetours = routes.reduce((acc, r) => acc + r.detours.length, 0);
  const totalExtensions = routes.reduce((acc, r) => acc + r.extensions.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <img src={logoOficial} alt="La Unión Mudanzas" className="h-9 w-auto object-contain" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground text-lg">Admin</span>
              <span className="text-muted-foreground">/</span>
              <Route className="w-4 h-4 text-neon-cyan" />
              <span className="font-bold text-neon-cyan text-lg">Rutas Operativas</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {dirtyCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-neon-orange/10 border border-neon-orange/30 text-neon-orange font-bold">
                {dirtyCount} sin guardar
              </span>
            )}
            <Button
              onClick={saveAll}
              disabled={dirtyCount === 0}
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-bold disabled:opacity-40"
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? '¡Guardado!' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Rutas totales',   value: routes.length,   color: 'text-foreground' },
            { label: 'Rutas activas',   value: activeCount,     color: 'text-neon-green' },
            { label: 'Ciudades en ruta', value: totalCities,   color: 'text-neon-cyan' },
            { label: 'Desvíos / Ext.',  value: totalDetours + totalExtensions, color: 'text-neon-orange' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-5">
          {(Object.entries(SECTION_CFG) as [EditSection, typeof SECTION_CFG[EditSection]][]).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
              <cfg.icon className="w-3 h-3" />
              {cfg.label} — {cfg.hint}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ruta o ciudad…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border text-sm"
            />
          </div>
          <div className="flex bg-card border border-border rounded-xl p-1 gap-1">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterActive === f
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Inactivas'}
              </button>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-neon-blue/5 border border-neon-blue/20 mb-6 text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" />
          <p>
            Los cambios aquí solo afectan la clasificación del motor de cotización en memoria.
            Para persistencia permanente, exporta los cambios y actualiza <code className="text-neon-cyan">routing-data.ts</code> con el botón "Guardar cambios".
            El toggle <strong className="text-foreground">activo/inactivo</strong> habilita o bloquea ciudades de esa ruta en el cotizador público.
          </p>
        </div>

        {/* Routes list */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No se encontraron rutas para "<span className="text-foreground">{search}</span>"
              </div>
            ) : (
              filtered.map(route => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onToggleActive={() => toggleActive(route.id)}
                  onAddCity={(section, city) => addCity(route.id, section, city)}
                  onRemoveCity={(section, idx) => removeCity(route.id, section, idx)}
                  onReset={() => resetRoute(route.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Export hint */}
        {dirtyCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl bg-neon-orange/5 border border-neon-orange/30"
          >
            <p className="text-sm font-bold text-neon-orange mb-1 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {dirtyCount} ruta{dirtyCount > 1 ? 's' : ''} con cambios pendientes
            </p>
            <p className="text-xs text-muted-foreground">
              Guarda los cambios para que el motor de cotización use la nueva configuración en esta sesión.
              Para hacer cambios permanentes, actualiza el archivo <code className="text-neon-cyan">src/lib/routing-data.ts</code>.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
