import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CreditCard, Building2, Smartphone, MapPin, ChevronLeft, Check, ShoppingBag, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useCreateOrder, useUpdateOrder } from '../hooks/useSupabase';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

// ─── Wompi widget types ────────────────────────────────────────────────────────
interface WompiTransaction {
  id: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type: string;
}

interface WompiWidgetConfig {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  redirectUrl: string;
  customerData: {
    email: string;
    fullName: string;
    phoneNumber: string;
    phoneNumberPrefix: string;
    legalId: string;
    legalIdType: string;
  };
}

declare global {
  interface Window {
    WidgetCheckout: new (config: WompiWidgetConfig) => { open: (cb: (result: { transaction: WompiTransaction | null }) => void) => void };
  }
}

const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY as string;

type Step = 1 | 2 | 3;
type PaymentMethod = 'wompi' | 'pse' | 'cash';

interface ShippingForm {
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

const SHIPPING_FIELDS: Array<{ label: string; key: keyof ShippingForm; type: string; placeholder: string; autoComplete: string }> = [
  { label: 'Nombre completo',  key: 'fullName', type: 'text',  placeholder: 'Tu nombre',    autoComplete: 'name' },
  { label: 'Correo electrónico', key: 'email', type: 'email', placeholder: 'tu@email.com', autoComplete: 'email' },
  { label: 'Teléfono',          key: 'phone', type: 'tel',   placeholder: '3001234567',   autoComplete: 'tel' },
  { label: 'Dirección',         key: 'address', type: 'text', placeholder: 'Cra 5 #25-30', autoComplete: 'street-address' },
  { label: 'Ciudad',            key: 'city',    type: 'text', placeholder: 'Ibagué',       autoComplete: 'address-level2' },
  { label: 'Código postal',     key: 'zipCode', type: 'text', placeholder: '730001',       autoComplete: 'postal-code' },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();

  const [step, setStep] = useState<Step>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wompi');
  const [wompiLoaded, setWompiLoaded] = useState(false);
  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: user?.name ?? '',
    email:    user?.email ?? '',
    phone:    user?.phone ?? '',
    address:  '',
    city:     'Ibagué',
    state:    'Tolima',
    zipCode:  '',
  });

  // Stable across renders — computed ONCE per checkout session.
  // BUG FIXED: previously `Date.now()` ran on every render, causing reference
  // mismatch between what Wompi received and what the success screen showed.
  const orderRef = useMemo(
    () => `TOLIMA-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    []
  );

  // Prevents double-submission from rapid button clicks or duplicate renders.
  const isSubmitting = useRef(false);

  const subtotal     = getTotal();
  const shippingCost = subtotal >= 100_000 ? 0 : 15_000;
  const tax          = Math.round(subtotal * 0.19);
  const total        = subtotal + shippingCost + tax;

  // Load Wompi widget script once
  useEffect(() => {
    if (document.getElementById('wompi-script')) { setWompiLoaded(true); return; }
    const s = document.createElement('script');
    s.id = 'wompi-script';
    s.src = 'https://checkout.wompi.co/widget.js';
    s.setAttribute('data-render', 'false');
    s.onload  = () => setWompiLoaded(true);
    s.onerror = () => toast.error('No se pudo cargar el sistema de pagos. Verifica tu conexión.');
    document.head.appendChild(s);
  }, []);

  // ── Wompi widget wrapper ─────────────────────────────────────────────────────
  function openWompiWidget(
    onApproved: (tx: WompiTransaction) => Promise<void>
  ): void {
    if (!window.WidgetCheckout) {
      toast.error('El widget de pago no está disponible. Recarga la página.');
      isSubmitting.current = false;
      return;
    }
    if (!WOMPI_PUBLIC_KEY) {
      toast.error('Pasarela de pago no configurada (clave pública faltante).');
      isSubmitting.current = false;
      return;
    }

    new window.WidgetCheckout({
      currency:       'COP',
      amountInCents:  Math.round(total * 100),
      reference:      orderRef,
      publicKey:      WOMPI_PUBLIC_KEY,
      redirectUrl:    `${window.location.origin}/dashboard`,
      customerData: {
        email:               shipping.email,
        fullName:            shipping.fullName,
        phoneNumber:         shipping.phone || '',
        phoneNumberPrefix:   '+57',
        legalId:             '',
        legalIdType:         'CC',
      },
    }).open(async (result) => {
      const tx = result?.transaction;
      if (!tx) {
        isSubmitting.current = false;
        return;
      }

      switch (tx.status) {
        case 'APPROVED':
          await onApproved(tx);
          break;
        case 'DECLINED':
          toast.error('Pago rechazado. Verifica los datos de tu tarjeta e intenta de nuevo.');
          break;
        case 'VOIDED':
          toast.error('La transacción fue anulada.');
          break;
        case 'ERROR':
          toast.error('Error en el procesamiento del pago. Contacta a tu banco.');
          break;
        case 'PENDING':
          toast.info('El pago está en proceso. Recibirás una notificación cuando se confirme.');
          break;
      }
      isSubmitting.current = false;
    });
  }

  // ── Main payment handler ─────────────────────────────────────────────────────
  async function handlePay() {
    // Idempotency guard
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    try {
      if (paymentMethod === 'cash') {
        // Contra entrega: create order directly, no widget needed
        await createOrder.mutateAsync({
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity:   i.quantity,
            unit_price: i.product.price,
          })),
          total,
          shipping_address: shipping,
          payment_method:   'cash',
          payment_reference: orderRef,
        });
        clearCart();
        setStep(3);
        isSubmitting.current = false;
        return;
      }

      // Wompi & PSE: two-phase commit
      // Phase 1 — persist order to DB BEFORE opening widget so we have a record
      // even if the user closes the tab mid-payment.
      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity:   i.quantity,
          unit_price: i.product.price,
        })),
        total,
        shipping_address:  shipping,
        payment_method:    paymentMethod,
        payment_reference: orderRef,
      });

      // Phase 2 — open Wompi widget, update order on success
      openWompiWidget(async (tx) => {
        try {
          await updateOrder.mutateAsync({
            id:                   order.id,
            status:               'processing',
            wompi_transaction_id: tx.id,
          });
          clearCart();
          setStep(3);
          toast.success('¡Pago procesado exitosamente!');
        } catch {
          // Payment was approved but order update failed.
          // The order exists in DB with status 'pending'. Customer service can reconcile.
          toast.error(
            `Pago aprobado pero error al actualizar el pedido. ` +
            `Guarda esta referencia: ${orderRef}`
          );
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pedido';
      toast.error(msg);
      isSubmitting.current = false;
    }
  }

  const shippingComplete = Boolean(shipping.fullName && shipping.email && shipping.address);

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          <h1 className="text-xl font-semibold mb-2">Tu carrito está vacío</h1>
          <Link to="/marketplace">
            <Button>Ir al Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Progress steps */}
        <div
          className="flex items-center gap-2 mb-8"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Paso ${step} de 3`}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver atrás"
            className="p-2 hover:bg-secondary rounded-lg mr-2 focus-visible:ring-2 focus-visible:ring-ring"
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
              <span className={`text-sm hidden sm:block ${step === n ? 'font-medium' : 'text-muted-foreground'}`}>
                {l}
              </span>
              {i < arr.length - 1 && (
                <div aria-hidden="true" className={`h-px w-8 sm:w-16 ${step > n ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 3: Success ───────────────────────────────────────────────── */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
            role="status"
            aria-live="polite"
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
              <Link to="/profile">
                <Button>Ver mis pedidos</Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline">Seguir comprando</Button>
              </Link>
            </div>
          </motion.div>
        )}

        {step !== 3 && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

              {/* ── Step 1: Shipping ─────────────────────────────────────────── */}
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
                            <label
                              htmlFor={`shipping-${key}`}
                              className="text-sm font-medium mb-1 block"
                            >
                              {label}
                            </label>
                            <input
                              id={`shipping-${key}`}
                              type={type}
                              value={shipping[key]}
                              placeholder={placeholder}
                              autoComplete={autoComplete}
                              onChange={(e) => setShipping({ ...shipping, [key]: e.target.value })}
                              className="w-full px-3 py-2 border border-input rounded-lg bg-input-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        fullWidth
                        size="lg"
                        className="mt-6"
                        disabled={!shippingComplete}
                        onClick={() => setStep(2)}
                      >
                        Continuar al pago
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ── Step 2: Payment ──────────────────────────────────────────── */}
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
                      {/* Proper radio group for payment methods */}
                      <fieldset>
                        <legend className="sr-only">Selecciona el método de pago</legend>
                        <div className="space-y-3">
                          {PAYMENT_OPTIONS.map(({ id, icon: Icon, color, title, sub, badge }) => (
                            <label
                              key={id}
                              htmlFor={`payment-${id}`}
                              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${paymentMethod === id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/40'
                                }`}
                            >
                              <input
                                id={`payment-${id}`}
                                type="radio"
                                name="paymentMethod"
                                value={id}
                                checked={paymentMethod === id}
                                onChange={() => setPaymentMethod(id)}
                                className="sr-only"
                              />
                              {/* Custom radio indicator */}
                              <div
                                aria-hidden="true"
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                                  ${paymentMethod === id ? 'border-primary' : 'border-muted-foreground'}`}
                              >
                                {paymentMethod === id && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
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
                          Pagos seguros y encriptados. Wompi es la plataforma oficial de Bancolombia.
                          {!wompiLoaded && paymentMethod !== 'cash' && (
                            <span className="text-yellow-600"> (Cargando widget de pago…)</span>
                          )}
                        </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setStep(1)}>
                          Volver
                        </Button>
                        <Button
                          fullWidth
                          size="lg"
                          loading={createOrder.isPending || updateOrder.isPending}
                          disabled={
                            createOrder.isPending ||
                            updateOrder.isPending ||
                            (!wompiLoaded && paymentMethod !== 'cash')
                          }
                          onClick={handlePay}
                        >
                          {paymentMethod === 'cash' ? 'Confirmar pedido' : `Pagar con ${paymentMethod === 'pse' ? 'PSE' : 'Wompi'}`}
                          {' · '}
                          {formatCurrency(total)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Order summary */}
            <aside aria-label="Resumen del pedido">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
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
                        <p className="text-sm font-medium">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <dl className="space-y-2 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Subtotal</dt>
                      <dd>{formatCurrency(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Envío</dt>
                      <dd>
                        {shippingCost === 0
                          ? <span className="text-success">Gratis</span>
                          : formatCurrency(shippingCost)}
                      </dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>IVA (19%)</dt>
                      <dd>{formatCurrency(tax)}</dd>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                      <dt>Total</dt>
                      <dd className="text-primary">{formatCurrency(total)}</dd>
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
