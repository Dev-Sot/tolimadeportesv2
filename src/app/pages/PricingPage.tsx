import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../stores/authStore';
import { useIsPro, useMySubscription, useActivateProPlan } from '../hooks/useSupabase';
import { useWompiScript, WOMPI_PUBLIC_KEY } from '../hooks/useWompi';
import { formatCurrency, formatDate } from '../lib/utils';
import { toast } from 'sonner';

const PRO_PRICE = 39_900;

interface WompiTransaction {
  id: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
}

const FAN_FEATURES = ['Comprar, reservar e inscribirte', 'Perfil, favoritos y comunidad', 'Reseñas y notificaciones'];
const PRO_FEATURES = [
  'Listados ilimitados y posición prioritaria',
  'Panel de analítica con exportación a CSV',
  'Comisión reducida: 3% en vez de 8%',
  'Insignia de Plan Pro visible en tu perfil',
];
const CITY_FEATURES = ['Instancia con marca propia de la ciudad', 'Consola de administración y moderación', 'Analítica agregada del ecosistema local'];

export function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const isPro = useIsPro();
  const { data: subscription } = useMySubscription();
  const activatePro = useActivateProPlan();
  const wompiReady = useWompiScript();

  function handleUpgrade() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!wompiReady || !window.WidgetCheckout) {
      toast.error('El widget de pago no está listo. Recarga la página e intenta de nuevo.');
      return;
    }
    if (!WOMPI_PUBLIC_KEY) {
      toast.error('Clave pública de Wompi no configurada. Contacta al administrador.');
      return;
    }

    const reference = `CANCHAZO-PRO-${Date.now()}`;
    new window.WidgetCheckout({
      currency: 'COP',
      amountInCents: PRO_PRICE * 100,
      reference,
      publicKey: WOMPI_PUBLIC_KEY,
      redirectUrl: `${window.location.origin}/pricing`,
    }).open((result: { transaction: WompiTransaction | null }) => {
      const tx = result?.transaction;
      if (!tx) {
        toast.info('Pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
        return;
      }
      if (tx.status === 'APPROVED') {
        activatePro.mutate({ wompi_reference: tx.id });
      } else {
        toast.error('El pago no fue aprobado. Intenta de nuevo o usa otro medio de pago.');
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b border-border py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="primary" className="mb-4">Precios</Badge>
            <h1 className="text-4xl font-bold mb-4">Un plan para cada lado del mercado</h1>
            <p className="text-xl text-muted-foreground">
              Deportistas siempre gratis. Los negocios que venden a través de Canchazo pagan
              una suscripción o una comisión — nunca las dos cosas al tope.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">

          {/* Fan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Fan</CardTitle>
              <p className="text-3xl font-bold mt-2">$0</p>
              <p className="text-sm text-muted-foreground">Deportistas y aficionados</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 flex-1">
                {FAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/marketplace" className="mt-6">
                <Button variant="outline" fullWidth>Explorar Canchazo</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="flex flex-col border-primary shadow-lg relative">
            <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">Recomendado</Badge>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" /> Pro
              </CardTitle>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(PRO_PRICE)}<span className="text-sm font-normal text-muted-foreground"> /mes</span>
              </p>
              <p className="text-sm text-muted-foreground">Vendedor · dueño de cancha · organizador · entrenador</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              {isPro ? (
                <div className="mt-6 text-center p-3 bg-primary/10 rounded-xl">
                  <p className="text-sm font-medium text-primary">Ya tienes Pro activo</p>
                  {subscription?.current_period_end && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vence el {formatDate(subscription.current_period_end)}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  fullWidth
                  className="mt-6"
                  loading={activatePro.isPending}
                  disabled={activatePro.isPending || (isAuthenticated && !wompiReady)}
                  onClick={handleUpgrade}
                >
                  {activatePro.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Activando...</>
                    : 'Actualizar a Pro'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Ciudad */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Licencia de ciudad</CardTitle>
              <p className="text-3xl font-bold mt-2">A cotizar</p>
              <p className="text-sm text-muted-foreground">Ligas municipales · secretarías de deporte</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 flex-1">
                {CITY_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="mt-6">
                <Button variant="outline" fullWidth>Contactar</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-8 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">8%</p>
            <p className="text-xs text-muted-foreground">Comisión estándar por transacción</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">3%</p>
            <p className="text-xs text-muted-foreground">Comisión con plan Pro activo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">$0</p>
            <p className="text-xs text-muted-foreground">Costo para el usuario final, siempre</p>
          </div>
        </div>
      </div>
    </div>
  );
}
