import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Calendar, MapPin, Users, DollarSign, ChevronLeft, Shield, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useTournament, useJoinTournament } from '../hooks/useSupabase';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, formatDate } from '../lib/utils';

const STATUS_MAP: Record<string, { label: string; variant: any }> = {
  upcoming:  { label: 'Próximo',    variant: 'info' },
  ongoing:   { label: 'En Curso',   variant: 'success' },
  completed: { label: 'Finalizado', variant: 'default' },
  cancelled: { label: 'Cancelado',  variant: 'destructive' },
};

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { data: tournament, isLoading } = useTournament(id!);
  const join = useJoinTournament();
  const [teamName, setTeamName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  if (isLoading) return <LoadingSkeleton />;
  if (!tournament) return <div className="p-8 text-center text-muted-foreground">Torneo no encontrado</div>;

  const status = STATUS_MAP[tournament.status] ?? { label: tournament.status, variant: 'default' };
  const participants = tournament.tournament_participants ?? [];
  const isJoined = participants.some((p: any) => p.user_id === user?.id && p.status !== 'withdrawn');
  const isFull = tournament.current_participants >= tournament.max_participants;
  const canJoin = !isJoined && !isFull && tournament.status === 'upcoming' && isAuthenticated;
  const spotsLeft = tournament.max_participants - tournament.current_participants;
  const fillPct = Math.round((tournament.current_participants / tournament.max_participants) * 100);

  async function handleJoin() {
    await join.mutateAsync({ tournamentId: id!, teamName: teamName || undefined });
    setShowJoinForm(false);
    setTeamName('');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={tournament.image ?? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'}
          alt={tournament.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-6 left-6 right-6">
          <Badge variant={status.variant} className="mb-2">{status.label}</Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{tournament.name}</h1>
          <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
            <MapPin className="w-3 h-3" />{tournament.location}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: 'Inicio', value: formatDate(tournament.start_date) },
                { icon: Calendar, label: 'Fin', value: formatDate(tournament.end_date) },
                { icon: DollarSign, label: 'Inscripción', value: tournament.entry_fee > 0 ? formatCurrency(tournament.entry_fee) : 'Gratis' },
                { icon: Users, label: 'Equipos', value: `${tournament.current_participants}/${tournament.max_participants}` },
              ].map(({ icon: Icon, label, value }) => (
                <Card key={label} className="p-4 text-center">
                  <Icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold text-sm">{value}</p>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle>Descripción</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{tournament.description}</p>
              </CardContent>
            </Card>

            {/* Prizes */}
            {(tournament.prizes ?? []).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" /> Premios
                </CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(tournament.prizes ?? []).map((prize: string, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                          ${i === 0 ? 'bg-yellow-400/20 text-yellow-600' :
                            i === 1 ? 'bg-gray-300/20 text-gray-500' :
                            'bg-orange-400/20 text-orange-600'}`}>
                          {i + 1}
                        </div>
                        <span className="text-sm">{prize}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules */}
            {tournament.rules && (
              <Card>
                <CardHeader><CardTitle>Reglamento</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{tournament.rules}</p>
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Participantes ({participants.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {participants.slice(0, 12).map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                        <img src={p.profiles?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`}
                          alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{p.profiles?.name}</p>
                          {p.team_name && <p className="text-xs text-muted-foreground truncate">{p.team_name}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Cupos</span>
                    <span className="font-medium">{tournament.current_participants}/{tournament.max_participants}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${fillPct}%` }} />
                  </div>
                  {spotsLeft <= 5 && spotsLeft > 0 && (
                    <p className="text-xs text-accent mt-1 font-medium">¡Solo {spotsLeft} cupos disponibles!</p>
                  )}
                  {isFull && <p className="text-xs text-destructive mt-1 font-medium">Torneo lleno</p>}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Registro hasta</span>
                    <span>{formatDate(tournament.registration_deadline)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deporte</span>
                    <Badge variant="outline" size="sm">{tournament.sport}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inscripción</span>
                    <span className="font-semibold text-primary">
                      {tournament.entry_fee > 0 ? formatCurrency(tournament.entry_fee) : 'Gratis'}
                    </span>
                  </div>
                </div>

                {isJoined ? (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-success">✓ Ya estás inscrito</p>
                  </div>
                ) : showJoinForm ? (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <input value={teamName} onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Nombre del equipo (opcional)"
                      className="w-full px-3 py-2 border border-input rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowJoinForm(false)} fullWidth size="sm">Cancelar</Button>
                      <Button onClick={handleJoin} loading={join.isPending} fullWidth size="sm">Confirmar</Button>
                    </div>
                  </motion.div>
                ) : (
                  <Button fullWidth size="lg"
                    disabled={!canJoin}
                    onClick={() => { if (!isAuthenticated) { toast.error('Debes iniciar sesión para inscribirte'); return; } setShowJoinForm(true); }}>
                    <Trophy className="w-4 h-4" />
                    {!isAuthenticated ? 'Inicia sesión para inscribirte' :
                      isFull ? 'Torneo lleno' :
                      tournament.status !== 'upcoming' ? 'Inscripciones cerradas' :
                      'Inscribirme'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Organizer */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3 text-muted-foreground">Organizado por</p>
                <div className="flex items-center gap-3">
                  <img src={tournament.profiles?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=org`}
                    alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-sm">{tournament.profiles?.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Organizador verificado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-64 bg-secondary" />
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 bg-secondary rounded w-1/2" />
          <div className="h-24 bg-secondary rounded" />
        </div>
        <div className="h-64 bg-secondary rounded-xl" />
      </div>
    </div>
  );
}
