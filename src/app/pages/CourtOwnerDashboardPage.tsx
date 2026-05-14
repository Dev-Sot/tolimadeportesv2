import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MapPin, Edit3, X, Star, Clock , ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useMyCourts, useCreateCourt } from '../hooks/useSupabase';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';

const SPORTS = ['Fútbol','Tenis','Baloncesto','Voleibol','Pádel','Squash'];
const AMENITIES_LIST = ['Estacionamiento','Vestidores','Iluminación LED','Cafetería','Equipos disponibles','Techada','Gradas','Baños'];
const EMPTY = { name:'', description:'', sport:'Fútbol', address:'', city:'Ibagué', price_per_hour:'', images:'', amenities: [] as string[] };

export function CourtOwnerDashboardPage() {
  const { data: courts = [], isLoading } = useMyCourts();
  const createCourt = useCreateCourt();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const f = (k: string, v: any) => setForm(p => ({...p, [k]: v}));
  const toggleAmenity = (a: string) => f('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.address || !form.price_per_hour) { toast.error('Completa los campos obligatorios'); return; }
    await createCourt.mutateAsync({
      name: form.name, description: form.description, sport: form.sport,
      address: form.address, city: form.city,
      price_per_hour: parseFloat(form.price_per_hour),
      amenities: form.amenities,
      images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
    });
    setShowForm(false); setForm(EMPTY);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
                      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <h1 className="text-3xl font-bold">Mis Canchas</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus instalaciones deportivas</p>
          </div>
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Nueva cancha</Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Registrar Cancha</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nombre de la cancha *</label>
                    <input required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej: Cancha Sintética El Jordán"
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Descripción</label>
                    <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Deporte *</label>
                      <select value={form.sport} onChange={e => f('sport', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                        {SPORTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Precio por hora (COP) *</label>
                      <input type="number" min="0" required value={form.price_per_hour} onChange={e => f('price_per_hour', e.target.value)} placeholder="80000"
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Dirección *</label>
                      <input required value={form.address} onChange={e => f('address', e.target.value)} placeholder="Cra 5 #25-30"
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Ciudad *</label>
                      <input required value={form.city} onChange={e => f('city', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amenidades</label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES_LIST.map(a => (
                        <button key={a} type="button" onClick={() => toggleAmenity(a)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.amenities.includes(a) ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">URLs de imágenes (una por línea)</label>
                    <textarea value={form.images} onChange={e => f('images', e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                    <Button type="submit" fullWidth loading={createCourt.isPending}>Publicar cancha</Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded-xl" />)}</div>
        ) : courts.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aún no tienes canchas</h3>
            <p className="text-muted-foreground mb-6">Registra tu primera cancha y recibe reservas digitales</p>
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Registrar cancha</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {courts.map((c: any) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                    {c.images?.[0] ? <img src={c.images[0]} alt={c.name} className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 m-auto mt-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold">{c.name}</p>
                      <Badge variant="outline" size="sm">{c.sport}</Badge>
                    </div>
                    <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatCurrency(c.price_per_hour)}/hora</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" />{c.rating ?? 0} ({c.review_count ?? 0})</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
