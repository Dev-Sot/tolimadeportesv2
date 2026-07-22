import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Award, Clock, DollarSign, MapPin, Shield, Phone, Mail, Send, BadgeCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useCoach } from '../hooks/useSupabase';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { ReviewSection } from '../components/shared/ReviewSection';
import { toast } from 'sonner';

export function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: coach, isLoading } = useCoach(id!);
  const { user, isAuthenticated } = useAuthStore();
  const [showRequest, setShowRequest] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !coach) return;
    setSending(true);
    try {
      const coachUserId = coach.user_id ?? coach.profiles?.id;
      if (!coachUserId) throw new Error('No se encontró el entrenador');
      await supabase.from('notifications').insert({
        user_id: coachUserId,
        type: 'session_request',
        title: 'Solicitud de sesión',
        message: `${user.name} quiere contratar tus servicios${message ? `: "${message}"` : ''}. Contáctale: ${user.email}${user.phone ? ` · ${user.phone}` : ''}`,
        link: '/coach',
        read: false,
      });
      toast.success('Solicitud enviada al entrenador');
      setShowRequest(false);
      setMessage('');
    } catch (e: any) {
      toast.error(e.message ?? 'Error al enviar la solicitud');
    } finally {
      setSending(false);
    }
  }

  if (isLoading) return <LoadingSkeleton />;
  if (!coach) return <div className="p-8 text-center text-muted-foreground">Entrenador no encontrado</div>;

  const profile = coach.profiles ?? {};

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent py-12 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="w-4 h-4" /> Volver a entrenadores
          </button>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <img src={profile.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`}
              alt={profile.name} className="w-28 h-28 rounded-full border-4 border-background shadow-lg object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {coach.featured && (
                  <Badge variant="accent"><Award className="w-3 h-3 mr-1" /> Destacado</Badge>
                )}
                {coach.verified && (
                  <Badge variant="success"><BadgeCheck className="w-3 h-3 mr-1" /> Verificado</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="font-semibold">{coach.rating}</span>
                  <span className="text-sm text-muted-foreground">({coach.review_count} reseñas)</span>
                </div>
                {profile.location && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{profile.location}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(coach.specialties ?? []).map((s: string) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Sobre mí</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{coach.bio ?? profile.bio}</p>
                {coach.experience && (
                  <p className="text-sm mt-3 text-muted-foreground">{coach.experience}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> Certificaciones
              </CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(coach.certifications ?? []).map((cert: string) => (
                    <div key={cert} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {coach.availability && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Disponibilidad
                </CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{coach.availability}</p>
                </CardContent>
              </Card>
            )}

            <ReviewSection targetId={id!} targetType="coach" />
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Tarifa por hora</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(coach.hourly_rate)}</p>
                </div>
                {!showRequest ? (
                  <Button fullWidth size="lg" onClick={() => {
                    if (!isAuthenticated) { toast.error('Inicia sesión para contactar al entrenador'); return; }
                    setShowRequest(true);
                  }}>
                    <Send className="w-4 h-4" /> Solicitar sesión
                  </Button>
                ) : (
                  <form onSubmit={handleRequest} className="space-y-3">
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Cuéntale qué necesitas (opcional)..."
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" fullWidth onClick={() => setShowRequest(false)}>Cancelar</Button>
                      <Button type="submit" fullWidth loading={sending}>
                        <Send className="w-4 h-4" /> Enviar
                      </Button>
                    </div>
                  </form>
                )}
                {profile.phone && (
                  <Button fullWidth variant="outline" onClick={() => window.open(`tel:${profile.phone}`)}>
                    <Phone className="w-4 h-4" /> Llamar
                  </Button>
                )}
                {profile.email && (
                  <Button fullWidth variant="ghost" onClick={() => window.open(`mailto:${profile.email}`)}>
                    <Mail className="w-4 h-4" /> Enviar mensaje
                  </Button>
                )}
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
      <div className="h-48 bg-secondary" />
      <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="h-24 bg-secondary rounded" />
          <div className="h-32 bg-secondary rounded" />
        </div>
        <div className="h-48 bg-secondary rounded-xl" />
      </div>
    </div>
  );
}
