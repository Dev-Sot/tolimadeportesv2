import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Star, BookOpen, Award, Bell, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PlanStatus } from '../components/shared/PlanStatus';
import { useMyCoach, useUpsertCoach, useNotifications, useMarkNotificationRead } from '../hooks/useSupabase';
import { formatRelativeTime } from '../lib/utils';

type Tab = 'profile' | 'requests';

const SPECIALTIES = [
  'Fútbol','Tenis','Baloncesto','Natación','Ciclismo',
  'Running','Gimnasio','Volleyball','Pádel','Artes Marciales',
];

const AVAILABILITY_OPTIONS = [
  'Lunes a Viernes','Fines de semana','Todos los días',
  'Mañanas','Tardes','Noches','Horario flexible',
];

const EMPTY = {
  specialties: [] as string[],
  experience: '',
  certifications: '',
  bio: '',
  hourly_rate: '',
  availability: 'Horario flexible',
};

export function CoachDashboardPage() {
  const { data: coach, isLoading } = useMyCoach();
  const upsert = useUpsertCoach();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [tab, setTab] = useState<Tab>('profile');
  const [form, setForm] = useState(EMPTY);

  const requests = notifications.filter((n: any) => n.type === 'session_request');
  const unreadRequests = requests.filter((n: any) => !n.read).length;

  useEffect(() => {
    if (coach) {
      setForm({
        specialties:    coach.specialties ?? [],
        experience:     coach.experience ?? '',
        certifications: (coach.certifications ?? []).join('\n'),
        bio:            coach.bio ?? '',
        hourly_rate:    String(coach.hourly_rate ?? ''),
        availability:   coach.availability ?? 'Horario flexible',
      });
    }
  }, [coach]);

  function toggleSpecialty(s: string) {
    setForm(p => ({
      ...p,
      specialties: p.specialties.includes(s)
        ? p.specialties.filter(x => x !== s)
        : [...p.specialties, s],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hourly_rate || form.specialties.length === 0) return;
    await upsert.mutateAsync({
      specialties:    form.specialties,
      experience:     form.experience,
      certifications: form.certifications.split('\n').map(s => s.trim()).filter(Boolean),
      bio:            form.bio,
      hourly_rate:    parseFloat(form.hourly_rate),
      availability:   form.availability,
    });
  }

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">Mi perfil de Entrenador</h1>
              <PlanStatus />
            </div>
            <p className="text-muted-foreground mt-1">
              {coach ? 'Actualiza tu información profesional' : 'Completa tu perfil para aparecer en el directorio'}
            </p>
          </div>
          {coach && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{(coach.rating ?? 0).toFixed(1)} · {coach.review_count ?? 0} reseñas</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-6 w-fit">
          {([['profile', 'Mi perfil'], ['requests', `Solicitudes${unreadRequests > 0 ? ` (${unreadRequests})` : ''}`]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: REQUESTS ── */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-20">
                <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin solicitudes aún</h3>
                <p className="text-muted-foreground">Cuando un atleta quiera contratarte aparecerá aquí</p>
              </div>
            ) : requests.map((n: any) => (
              <Card key={n.id} className={`p-4 cursor-pointer transition-colors ${!n.read ? 'border-primary/30 bg-primary/5' : ''}`}
                onClick={() => !n.read && markRead.mutate(n.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      {!n.read && <Badge variant="primary" size="sm">Nueva</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── TAB: PROFILE ── */}
        {tab === 'profile' && <form onSubmit={handleSave} className="space-y-6">

          {/* Especialidades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="w-4 h-4 text-primary" /> Especialidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      form.specialties.includes(s)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
              {form.specialties.length === 0 && (
                <p className="text-xs text-destructive mt-2">Selecciona al menos una especialidad</p>
              )}
            </CardContent>
          </Card>

          {/* Info profesional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-4 h-4 text-primary" /> Información profesional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Tarifa por hora (COP) <span className="text-destructive">*</span>
                  </label>
                  <input type="number" min="0" required
                    value={form.hourly_rate}
                    onChange={e => setForm(p => ({ ...p, hourly_rate: e.target.value }))}
                    placeholder="Ej: 80000"
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Disponibilidad</label>
                  <select value={form.availability}
                    onChange={e => setForm(p => ({ ...p, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    {AVAILABILITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Años / descripción de experiencia</label>
                <input type="text"
                  value={form.experience}
                  onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
                  placeholder="Ej: 5 años entrenando fútbol juvenil en Ibagué"
                  className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Certificaciones <span className="text-xs text-muted-foreground">(una por línea)</span>
                </label>
                <textarea rows={3}
                  value={form.certifications}
                  onChange={e => setForm(p => ({ ...p, certifications: e.target.value }))}
                  placeholder="Ej: Licencia UEFA C&#10;Certificado Federación Colombiana de Fútbol"
                  className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Descripción personal</label>
                <textarea rows={4}
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Cuéntale a los atletas sobre tu metodología, logros y estilo de entrenamiento..."
                  className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" fullWidth size="lg" loading={upsert.isPending}
            disabled={upsert.isPending || form.specialties.length === 0 || !form.hourly_rate}>
            <Save className="w-4 h-4" />
            {coach ? 'Guardar cambios' : 'Publicar perfil de entrenador'}
          </Button>
        </form>}
      </div>
    </div>
  );
}
