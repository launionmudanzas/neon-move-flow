/**
 * AdminCiudades — City & Route Type Management Panel
 * La Unión Mudanzas — admin-only
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Globe, Plus, Trash2, Search,
  CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight,
  Save, Filter,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CITY_DATABASE,
  type CityEntry, type CityType,
  getCityTypeLabel,
} from '@/lib/city-database';
import logoOficial from '@/assets/logo-oficial.png';

// ─── Type config ───────────────────────────────────────────────────────────

const TYPE_CFG: Record<CityType, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  ruta_regular:   { label: 'Ruta regular',    color: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',       icon: CheckCircle2 },
  fuera_de_ruta:  { label: 'Fuera de ruta',   color: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30', icon: AlertTriangle },
  internacional:  { label: 'Internacional',   color: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',       icon: Globe },
};

const COUNTRY_FLAGS: Record<string, string> = { MX: '🇲🇽', USA: '🇺🇸' };

export default function AdminCiudades() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<CityType | 'all'>('all');
  const [filterCountry, setFilterCountry] = useState<'MX' | 'USA' | 'all'>('all');

  // In a real implementation these would be stored in Supabase
  // For now we display the static database with admin UI ready
  const cities = useMemo(() => {
    let list = [...CITY_DATABASE];
    if (filterType !== 'all') list = list.filter(c => c.type === filterType);
    if (filterCountry !== 'all') list = list.filter(c => c.country === filterCountry);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.display.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, filterType, filterCountry]);

  const stats = useMemo(() => ({
    total: CITY_DATABASE.length,
    ruta: CITY_DATABASE.filter(c => c.type === 'ruta_regular').length,
    fuera: CITY_DATABASE.filter(c => c.type === 'fuera_de_ruta').length,
    intl: CITY_DATABASE.filter(c => c.type === 'internacional').length,
    mx: CITY_DATABASE.filter(c => c.country === 'MX').length,
    usa: CITY_DATABASE.filter(c => c.country === 'USA').length,
  }), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logoOficial} alt="Logo" className="h-8 w-auto" />
            <div>
              <h1 className="font-display font-black text-lg text-foreground">Gestión de Ciudades</h1>
              <p className="text-xs text-muted-foreground">Administra ciudades, estados y clasificación de rutas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Ruta regular', value: stats.ruta, color: 'text-neon-cyan' },
            { label: 'Fuera de ruta', value: stats.fuera, color: 'text-neon-orange' },
            { label: 'Internacional', value: stats.intl, color: 'text-neon-blue' },
            { label: '🇲🇽 México', value: stats.mx, color: 'text-foreground' },
            { label: '🇺🇸 USA', value: stats.usa, color: 'text-foreground' },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-xl border border-border p-3 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ciudad, estado..."
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'ruta_regular', 'fuera_de_ruta', 'internacional'] as const).map(t => (
              <Button
                key={t}
                variant={filterType === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(t)}
                className="text-xs"
              >
                {t === 'all' ? 'Todos' : getCityTypeLabel(t)}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            {(['all', 'MX', 'USA'] as const).map(c => (
              <Button
                key={c}
                variant={filterCountry === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCountry(c)}
                className="text-xs"
              >
                {c === 'all' ? '🌎 Todos' : `${COUNTRY_FLAGS[c]} ${c}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-3">
          Mostrando <strong>{cities.length}</strong> de {CITY_DATABASE.length} ciudades
        </p>

        {/* City table */}
        <div className="glass-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ciudad</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">País</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Orden</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Activa</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city, i) => {
                  const typeCfg = TYPE_CFG[city.type];
                  const TypeIcon = typeCfg.icon;
                  return (
                    <motion.tr
                      key={city.display}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.01, 0.5) }}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="font-semibold text-sm text-foreground">{city.city}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{city.state}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{COUNTRY_FLAGS[city.country]} {city.country}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeCfg.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{city.order}</td>
                      <td className="px-4 py-3 text-center">
                        {city.active ? (
                          <ToggleRight className="w-5 h-5 text-neon-cyan mx-auto" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {cities.length === 0 && (
            <div className="py-12 text-center">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No se encontraron ciudades con estos filtros</p>
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> Para editar ciudades, estados o tipos de ruta a escala, se recomienda migrar esta tabla
            a Supabase. Actualmente el catálogo se gestiona desde el código fuente en <code className="text-neon-cyan">src/lib/city-database.ts</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
