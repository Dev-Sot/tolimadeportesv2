import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CreditCard, Building2, Smartphone, MapPin, ChevronLeft, Check, ShoppingBag, AlertCircle, Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useCreateOrder } from '../hooks/useSupabase';
import { useWompiScript, WOMPI_PUBLIC_KEY } from '../hooks/useWompi';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

// ─── Wompi types ─────────────────────────────────────────────────────────────
interface WompiTransaction {
  id: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  reference: string;
  amount_in_cents: number;
}

type Step = 1 | 2 | 3;
type PaymentMethod = 'wompi' | 'pse' | 'cash';

interface ShippingForm {
  [key: string]: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  icon: typeof CreditCard;
  color: string;
  title: string;
  sub: string;
  badge?: string;
}> = [
  {
    id: 'wompi',
    icon: CreditCard,
    color: 'text-primary',
    title: 'Tarjeta de crédito / débito',
    sub: 'Visa, Mastercard, Amex · Procesado por Wompi (Bancolombia)',
    badge: 'Recomendado',
  },
  {
    id: 'pse',
    icon: Building2,
    color: 'text-blue-600',
    title: 'PSE — Débito bancario',
    sub: 'Transferencia directa desde tu cuenta bancaria colombiana',
  },
  {
    id: 'cash',
    icon: Smartphone,
    color: 'text-green-600',
    title: 'Contra entrega',
    sub: 'Paga en efectivo cuando recibas tu pedido',
  },
];

const SHIPPING_FIELDS: Array<{
  label: string; key: keyof ShippingForm;
  type: string; placeholder: string; autoComplete: string;
}> = [
  { label: 'Nombre completo',    key: 'fullName', type: 'text',  placeholder: 'Tu nombre',     autoComplete: 'name' },
  { label: 'Correo electrónico', key: 'email',    type: 'email', placeholder: 'tu@email.com',  autoComplete: 'email' },
  { label: 'Teléfono',           key: 'phone',    type: 'tel',   placeholder: '3001234567',    autoComplete: 'tel' },
  { label: 'Dirección',          key: 'address',  type: 'text',  placeholder: 'Cra 5 #25-30',  autoComplete: 'street-address' },
  { label: 'Ciudad',             key: 'city',     type: 'text',  placeholder: 'Ibagué',        autoComplete: 'address-level2' },
  { label: 'Código postal',      key: 'zipCode',  type: 'text',  placeholder: '730001',        autoComplete: 'postal-code' },
];

export function CheckoutPage() {
  const navigate    = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user }    = useAuthStore();
  const createOrder = useCreateOrder();

  const [step, setStep]               = useState<Step>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wompi');
  const wompiReady                    = useWompiScript();
  const [paying, setPaying]           = useState(false);
  const isSubmitting                  = useRef(false);

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: user?.name  ?? '',
    email:    user?.email ?? '',
    phone:    user?.phone ?? '',
    address:  '',
    city:     'Ibagué',
    state:    'Tolima',
    zipCode:  '',
  });

  // Referencia estable, generada una sola vez por sesión de checkout. Un
  // inicializador de useState (no useMemo) es la forma correcta de ejecutar
  // algo impuro (Date.now/Math.random) exactamente una vez por instancia del
  // componente — useMemo no lo garantiza bajo el compilador de React.
  const [orderRef] = useState(
    () => `TOLIMA-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  );

  const subtotal     = getTotal();
  const shippingCost = subtotal >= 100_000 ? 0 : 15_000;
  const tax          = Math.round(subtotal * 0.19);
  const total        = subtotal + shippingCost + tax;

  // ── Flujo principal de pago ───────────────────────────────────────────────
  async function handlePay() {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setPaying(true);

    try {
      // ── Contra entrega: crear orden directamente ──────────────────────────
      if (paymentMethod === 'cash') {
        await createOrder.mutateAsync({
          items:            items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          total,
          shipping_address: shipping,
          payment_method:   'cash',
          payment_reference: orderRef,
        });
        clearCart();
        setStep(3);
        return;
      }

      // ── Wompi / PSE: abrir widget PRIMERO ─────────────────────────────────
      // El widget se abre inmediatamente. Solo si el pago es aprobado
      // se crea la orden en la base de datos.
      if (!window.WidgetCheckout) {
        toast.error('El widget de pago no está listo. Recarga la página e intenta de nuevo.');
        return;
      }
      if (!WOMPI_PUBLIC_KEY) {
        toast.error('Clave pública de Wompi no configurada. Contacta al administrador.');
        return;
      }

      // Wompi toma el control; liberamos el flag de submit mientras está abierto
      isSubmitting.current = false;
      setPaying(false);

      new window.WidgetCheckout({
        currency:      'COP',
        amountInCents: Math.round(total * 100),
        reference:     orderRef,
        publicKey:     WOMPI_PUBLIC_KEY,
        redirectUrl:   `${window.location.origin}/dashboard`,
        customerData: {
          email:    shipping.email,
          fullName: shipping.fullName || '',
        },
      }).open(async (result: { transaction: WompiTransaction | null }) => {
        const tx = result?.transaction;
        if (!tx) {
          toast.info('Pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
          return; // usuario cerró el widget sin pagar
        }

        if (tx.status === 'APPROVED') {
          setPaying(true);
          try {
            await createOrder.mutateAsync({
              items:            items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
              total,
              shipping_address: shipping,
              payment_method:   paymentMethod,
              payment_reference: orderRef,
            });
            clearCart();
            setStep(3);
            toast.success('¡Pago aprobado! Tu pedido fue creado.');
          } catch (err) {
            // El pago fue aprobado pero falló la creación del pedido
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            toast.error(`Pago aprobado pero error al guardar el pedido. Referencia: ${orderRef}. Contacta soporte.`);
            console.error('createOrder after Wompi approval:', msg);
          } finally {
            setPaying(false);
          }
        } else if (tx.status === 'DECLINED') {
          toast.error('Pago rechazado. Verifica los datos de tu tarjeta e intenta de nuevo.');
        } else if (tx.status === 'VOIDED') {
          toast.error('La transacción fue anulada.');
        } else if (tx.status === 'ERROR') {
          toast.error('Error al procesar el pago. Intenta con otro método o contacta a tu banco.');
        } else if (tx.status === 'PENDING') {
          toast.info('El pago está en proceso. Te notificaremos cuando se confirme.');
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al procesar el pago';
      toast.error(msg);
    } finally {
      isSubmitting.current = false;
      setPaying(false);
    }
  }

  const shippingComplete = Boolean(shipping.fullName && shipping.email && shipping.address);

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          <h1 className="text-xl font-semibold mb-2">Tu carrito está vacío</h1>
          <Link to="/marketplace"><Button>Ir al Marketplace</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Barra de progreso */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver atrás"
            className="p-2 hover:bg-secondary rounded-lg mr-2"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          {([
            { n: 1 as Step, l: 'Envío' },
            { n: 2 as Step, l: 'Pago' },
            { n: 3 as Step, l: 'Confirmación' },
          ]).map(({ n, l }, i, arr) => (
            <div key={n} className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${step >= n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                {step > n ? <Check className="w-4 h-4" aria-hidden="true" /> : n}
              </div>
              <span className={`text-sm hidden sm:block ${step === n ? 'font-medium' : 'text-muted-foreground'}`}>{l}</span>
              {i < arr.length - 1 && (
                <div aria-hidden="true" className={`h-px w-8 sm:w-16 ${step > n ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Paso 3 — Confirmación */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold mb-3">¡Pedido confirmado!</h1>
            <p className="text-muted-foreground mb-2">
              Referencia: <span className="font-mono font-medium">{orderRef}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Recibirás un correo en <strong>{shipping.email}</strong>
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link to="/profile"><Button>Ver mis pedidos</Button></Link>
              <Link to="/marketplace"><Button variant="outline">Seguir comprando</Button></Link>
            </div>
          </motion.div>
        )}

        {step !== 3 && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

              {/* Paso 1 — Envío */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
                        Información de envío
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {SHIPPING_FIELDS.map(({ label, key, type, placeholder, autoComplete }) => (
                          <div key={key}>
                            <label htmlFor={`ship-${key}`} className="text-sm font-medium mb-1 block">
                              {label}
                            </label>
                            <input
                              id={`ship-${key}`}
                              type={type}
                              value={shipping[key]}
                              placeholder={placeholder}
                              autoComplete={autoComplete}
                              onChange={(e) => setShipping({ ...shipping, [key]: e.target.value })}
                              className="w-full px-3 py-2.5 border border-input rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        fullWidth size="lg" className="mt-6"
                        disabled={!shippingComplete}
                        onClick={() => setStep(2)}
                      >
                        Continuar al pago
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Paso 2 — Pago */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" aria-hidden="true" />
                        Método de pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <fieldset>
                        <legend className="sr-only">Selecciona el método de pago</legend>
                        <div className="space-y-3">
                          {PAYMENT_OPTIONS.map(({ id, icon: Icon, color, title, sub, badge }) => (
                            <label
                              key={id}
                              htmlFor={`pay-${id}`}
                              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${paymentMethod === id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                            >
                              <input
                                id={`pay-${id}`}
                                type="radio"
                                name="paymentMethod"
                                value={id}
                                checked={paymentMethod === id}
                                onChange={() => setPaymentMethod(id)}
                                className="sr-only"
                              />
                              <div
                                aria-hidden="true"
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                                  ${paymentMethod === id ? 'border-primary' : 'border-muted-foreground'}`}
                              >
                                {paymentMethod === id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
                                  <span className="font-medium text-sm">{title}</span>
                                  {badge && <Badge variant="success" size="sm">{badge}</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{sub}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-xs text-muted-foreground">
                          Pagos seguros procesados por Wompi, plataforma oficial de Bancolombia.
                          {!wompiReady && paymentMethod !== 'cash' && (
                            <span className="ml-1 inline-flex items-center gap-1 text-yellow-600">
                              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                              Cargando pasarela de pago…
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setStep(1)} disabled={paying}>
                          Volver
                        </Button>
                        <Button
                          fullWidth
                          size="lg"
                          loading={paying || createOrder.isPending}
                          disabled={paymentMethod !== 'cash' && !wompiReady}
                          onClick={handlePay}
                        >
                          {paymentMethod === 'cash'
                            ? 'Confirmar pedido'
                            : paymentMethod === 'pse'
                            ? 'Pagar con PSE'
                            : 'Pagar con Wompi'}
                          {' · '}{formatCurrency(total)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Resumen del pedido */}
            <aside aria-label="Resumen del pedido">
              <Card className="sticky top-24">
                <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 max-h-52 overflow-y-auto" aria-label="Productos en tu carrito">
                    {items.map((item) => (
                      <li key={item.product.id} className="flex gap-3">
                        <img
                          src={item.product.images?.[0] ?? 'https://placehold.co/48x48'}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-secondary flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium flex-shrink-0">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <dl className="space-y-2 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Subtotal</dt><dd>{formatCurrency(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Envío</dt>
                      <dd>{shippingCost === 0 ? <span className="text-success">Gratis</span> : formatCurrency(shippingCost)}</dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>IVA (19%)</dt><dd>{formatCurrency(tax)}</dd>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                      <dt>Total</dt><dd className="text-primary">{formatCurrency(total)}</dd>
                    </div>
                  </dl>

                  {subtotal < 100_000 && (
                    <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2 text-center">
                      Agrega {formatCurrency(100_000 - subtotal)} más para envío gratis
                    </p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
