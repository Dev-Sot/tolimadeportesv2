import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Star, Clock, DollarSign, Calendar, Check, ChevronLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useCourt, useCourtReservations, useCreateReservation, useReviews } from '../hooks/useSupabase';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { ReviewSection } from '../components/shared/ReviewSection';

const TIME_SLOTS = [
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00',
];

const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: court, isLoading } = useCourt(id!);
  const createReservation = useCreateReservation();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  const { data: occupied = [] } = useCourtReservations(id!, selectedDate);

  function isSlotOccupied(slot: string) {
    return occupied.some(
      (r: any) => slot >= r.start_time.slice(0,5) && slot < r.end_time.slice(0,5)
    );
  }

  function calcTotal() {
    if (!selectedStart || !selectedEnd || !court) return 0;
    const [sh, sm] = selectedStart.split(':').map(Number);
    const [eh, em] = selectedEnd.split(':').map(Number);
    const hours = (eh * 60 + em - sh * 60 - sm) / 60;
    return hours * court.price_per_hour;
  }

  async function handleReserve() {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedStart || !selectedEnd) return;
    await createReservation.mutateAsync({
      court_id: id!,
      date: selectedDate,
      start_time: selectedStart + ':00',
      end_time: selectedEnd + ':00',
      total_price: calcTotal(),
    });
  }

  if (isLoading) return <LoadingSkeleton />;
  if (!court) return <div className="p-8 text-center text-muted-foreground">Cancha no encontrada</div>;

  const imgs = court.images?.length ? court.images : ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'];
  const availability = court.court_availability ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Gallery */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src={imgs[activeImg]} alt={court.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {imgs.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {imgs.map((_: string, i: number) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
        {imgs.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {imgs.slice(0,4).map((img: string, i: number) => (
              <img key={i} src={img} alt="" onClick={() => setActiveImg(i)}
                className={`w-12 h-12 object-cover rounded-lg cursor-pointer border-2 transition-all ${i === activeImg ? 'border-white' : 'border-transparent opacity-70'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Badge variant="primary" className="mb-2">{court.sport}</Badge>
                  <h1 className="text-3xl font-bold">{court.name}</h1>
                </div>
                <div className="flex items-center gap-1 bg-secondary/50 px-3 py-1 rounded-lg">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="font-semibold">{court.rating ?? 0}</span>
                  <span className="text-sm text-muted-foreground">({court.review_count ?? 0})</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{court.address}, {court.city}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{court.description}</p>
            </div>

            <Card>
              <CardHeader><CardTitle>Amenidades</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(court.amenities ?? []).map((a: string) => (
                    <div key={a} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {availability.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Horario disponible</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {availability.map((av: any) => (
                      <div key={av.id} className="text-center">
                        <div className="text-xs font-medium text-muted-foreground mb-1">{DAY_NAMES[av.day_of_week]}</div>
                        <div className="text-xs">{av.start_time.slice(0,5)}</div>
                        <div className="text-xs text-muted-foreground">a</div>
                        <div className="text-xs">{av.end_time.slice(0,5)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {court.profiles?.name?.[0] ?? 'D'}
                  </div>
                  <div>
                    <p className="font-semibold">{court.profiles?.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Propietario verificado
                    </p>
                    {court.profiles?.phone && (
                      <p className="text-sm text-muted-foreground">{court.profiles.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <ReviewSection targetId={id!} targetType="court" />
          </div>

          {/* Booking widget */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reservar Cancha</CardTitle>
                  <div>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(court.price_per_hour)}</span>
                    <span className="text-sm text-muted-foreground">/hora</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha</label>
                  <input type="date" value={selectedDate} min={today}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedStart(''); setSelectedEnd(''); }}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Hora de inicio</label>
                  <div className="grid grid-cols-4 gap-1">
                    {TIME_SLOTS.slice(0, -1).map((slot) => {
                      const occ = isSlotOccupied(slot);
                      const sel = selectedStart === slot;
                      return (
                        <button key={slot} disabled={occ}
                          onClick={() => { setSelectedStart(slot); setSelectedEnd(''); }}
                          className={`px-1 py-1.5 rounded text-xs font-medium transition-colors
                            ${occ ? 'bg-destructive/10 text-destructive/50 cursor-not-allowed' :
                              sel ? 'bg-primary text-primary-foreground' :
                              'bg-secondary hover:bg-secondary/80'}`}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedStart && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Hora de fin</label>
                    <div className="grid grid-cols-4 gap-1">
                      {TIME_SLOTS.filter((s) => s > selectedStart).map((slot) => {
                        const occ = isSlotOccupied(slot);
                        const sel = selectedEnd === slot;
                        return (
                          <button key={slot} disabled={occ}
                            onClick={() => setSelectedEnd(slot)}
                            className={`px-1 py-1.5 rounded text-xs font-medium transition-colors
                              ${occ ? 'bg-destructive/10 text-destructive/50 cursor-not-allowed' :
                                sel ? 'bg-primary text-primary-foreground' :
                                'bg-secondary hover:bg-secondary/80'}`}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedStart && selectedEnd && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary/50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horario</span>
                      <span>{selectedStart} – {selectedEnd}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha</span>
                      <span>{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(calcTotal())}</span>
                    </div>
                  </motion.div>
                )}

                <Button fullWidth size="lg"
                  disabled={!selectedStart || !selectedEnd || createReservation.isPending}
                  loading={createReservation.isPending}
                  onClick={handleReserve}>
                  <Calendar className="w-4 h-4" />
                  {isAuthenticated ? 'Confirmar Reserva' : 'Inicia sesión para reservar'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Sin cargos adicionales · Cancelación hasta 24h antes
                </p>
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
      <div className="h-72 bg-secondary" />
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-secondary rounded w-2/3" />
          <div className="h-4 bg-secondary rounded w-1/3" />
          <div className="h-32 bg-secondary rounded" />
        </div>
        <div className="h-80 bg-secondary rounded-xl" />
      </div>
    </div>
  );
}
