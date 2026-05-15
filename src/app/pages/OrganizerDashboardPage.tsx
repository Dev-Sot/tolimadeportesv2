import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trophy, Edit3, Trash2, Users, X, Calendar, ArrowLeft, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useMyTournaments, useCreateTournament, useUpdateTournament, useDeleteTournament } from '../hooks/useSupabase';
import { formatCurrency, formatDate, formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';

const SPORTS = ['Fútbol','Tenis','Baloncesto','Ciclismo','Natación','Running','Volleyball'];
const EMPTY = { name:'', description:'', sport:'Fútbol', location:'Ibagué, Tolima', start_date:'', end_date:'', registration_deadline:'', max_participants:'', entry_fee:'0', prizes:'', rules:'' };

const STATUS_MAP: Record<string, any> = {
  upcoming: { label: 'Próximo', variant: 'info' },
  ongoing:  { label: 'En curso', variant: 'success' },
  completed:{ label: 'Finalizado', variant: 'default' },
  cancelled:{ label: 'Cancelado', variant: 'destructive' },
};

export function OrganizerDashboardPage() {
  const { data: tournaments = [], isLoading } = useMyTournaments();
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const deleteTournament = useDeleteTournament();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  function openCreate() { setForm(EMPTY); setEditId(null); setShowForm(true); }

  function openEdit(t: any) {
    setForm({
      name: t.name, description: t.description ?? '', sport: t.sport,
      location: t.location, start_date: t.start_date?.slice(0,10) ?? '',
      end_date: t.end_date?.slice(0,10) ?? '',
      registration_deadline: t.registration_deadline?.slice(0,10) ?? '',
      max_participants: String(t.max_participants), entry_fee: String(t.entry_fee ?? 0),
      prizes: (t.prizes ?? []).join('\n'), rules: t.rules ?? '',
    });
    setEditId(t.id); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.start_date || !form.end_date || !form.registration_deadline || !form.max_participants) {
      toast.error('Completa todos los campos obligatorios'); return;
    }
    const payload = {
      name: form.name, description: form.description, sport: form.sport, location: form.location,
      start_date: form.start_date, end_date: form.end_date, registration_deadline: form.registration_deadline,
      max_participants: parseInt(form.max_participants), entry_fee: parseFloat(form.entry_fee) || 0,
      prizes: form.prizes.split('\n').map(s => s.trim()).filter(Boolean),
      rules: form.rules || undefined,
    };
    try {
      if (editId) { await updateTournament.mutateAsync({ id: editId, ...payload }); }
      else { await createTournament.mutateAsync(payload); }
      setShowForm(false); setForm(EMPTY); setEditId(null);
    } catch (err: any) { console.error(err?.message); }
  }

  const isPending = createTournament.isPending || updateTournament.isPending;
  const f = (k: string, v: string) => setForm(p => ({...p, [k]: v}));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
                      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <h1 className="text-3xl font-bold">Mis Torneos</h1>
            <p className="text-muted-foreground mt-1">Crea y gestiona torneos deportivos</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> Nuevo torneo</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total torneos',   value: tournaments.length,                                                     icon: Trophy },
            { label: 'Activos/Próximos',value: tournaments.filter((t: any) => t.status === 'upcoming' || t.status === 'ongoing').length, icon: Calendar },
            { label: 'Participantes',   value: tournaments.reduce((s: number, t: any) => s + (t.current_participants ?? 0), 0), icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{editId ? 'Editar Torneo' : 'Crear Torneo'}</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nombre del torneo *</label>
                    <input required value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej: Copa Deportiva Tolima 2026"
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
                        {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Ubicación *</label>
                      <input value={form.location} onChange={e => f('location', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Fecha inicio *</label>
                      <input type="date" required value={form.start_date} onChange={e => f('start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Fecha fin *</label>
                      <input type="date" required value={form.end_date} onChange={e => f('end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cierre inscripciones *</label>
                      <input type="date" required value={form.registration_deadline} onChange={e => f('registration_deadline', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cupos máximos *</label>
                      <input type="number" required min="2" value={form.max_participants} onChange={e => f('max_participants', e.target.value)} placeholder="16"
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cuota inscripción (COP)</label>
                      <input type="number" min="0" value={form.entry_fee} onChange={e => f('entry_fee', e.target.value)} placeholder="0 = gratis"
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Premios (uno por línea)</label>
                      <textarea value={form.prizes} onChange={e => f('prizes', e.target.value)} rows={2} placeholder="1er: $1.000.000&#10;2do: $500.000"
                        className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Reglamento</label>
                    <textarea value={form.rules} onChange={e => f('rules', e.target.value)} rows={3}
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
                    <Button type="submit" fullWidth loading={isPending}>
                      {isPending ? (editId ? 'Guardando...' : 'Creando...') : (editId ? 'Guardar cambios' : 'Crear torneo')}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-secondary animate-pulse rounded-xl" />)}</div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aún no has creado torneos</h3>
            <p className="text-muted-foreground mb-6">Organiza el primer torneo deportivo de tu comunidad</p>
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Crear primer torneo</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t: any) => {
              const s = STATUS_MAP[t.status] ?? { label: t.status, variant: 'default' };
              return (
                <Card key={t.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold">{t.name}</p>
                        <Badge variant={s.variant} size="sm">{s.label}</Badge>
                        <Badge variant="outline" size="sm">{t.sport}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(t.start_date)}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.current_participants ?? 0}/{t.max_participants} equipos</span>
                        <span>{t.entry_fee > 0 ? formatCurrency(t.entry_fee) : 'Gratis'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(t)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title="Editar torneo">
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`¿Cancelar "${t.name}"?`)) deleteTournament.mutate(t.id); }}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                        title="Cancelar torneo">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
