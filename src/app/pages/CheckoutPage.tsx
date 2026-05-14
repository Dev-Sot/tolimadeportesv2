import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CreditCard, Building2, Smartphone, MapPin, Phone, Mail, User, ChevronLeft, Check, ShoppingBag, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useCreateOrder } from '../hooks/useSupabase';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY as string;

function openWompi(amount: number, reference: string, email: string, onSuccess: (tx: any) => void) {
  const WC = (window as any).WidgetCheckout;
  if (!WC) { toast.error('Error al cargar el sistema de pagos. Recarga la página.'); return; }
  if (!WOMPI_PUBLIC_KEY) { toast.error('Pasarela de pago no configurada.'); return; }
  new WC({
    currency: 'COP',
    amountInCents: Math.round(amount * 100),
    reference,
    publicKey: WOMPI_PUBLIC_KEY,
    redirectUrl: `${window.location.origin}/dashboard`,
    customerData: { email, fullName: '' },
  }).open((result: any) => {
    const tx = result?.transaction;
    if (tx?.status === 'APPROVED') onSuccess(tx);
    else if (tx?.status === 'DECLINED') toast.error('Pago rechazado. Intenta con otro método.');
  });
}

type Step = 1 | 2 | 3;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const createOrder = useCreateOrder();
  const [step, setStep] = useState<Step>(1);
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'pse' | 'cash'>('wompi');
  const [wompiLoaded, setWompiLoaded] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: '',
    city: 'Ibagué',
    state: 'Tolima',
    zipCode: '',
  });

  const subtotal = getTotal();
  const shippingCost = subtotal >= 100000 ? 0 : 15000;
  const tax = subtotal * 0.19;
  const total = subtotal + shippingCost + tax;
  const orderRef = `TOLIMA-${Date.now()}`;

  useEffect(() => {
    if (document.getElementById('wompi-script')) { setWompiLoaded(true); return; }
    const s = document.createElement('script');
    s.id = 'wompi-script';
    s.src = 'https://checkout.wompi.co/widget.js';
    s.setAttribute('data-render', 'false');
    s.onload = () => setWompiLoaded(true);
    document.head.appendChild(s);
  }, []);

  async function finalize(method: string) {
    const order = await createOrder.mutateAsync({
      items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity, unit_price: i.product.price })),
      total, shipping_address: shipping, payment_method: method,
    });
    clearCart();
    return order;
  }

  async function handlePay() {
    if (paymentMethod === 'wompi') {
      openWompi(total, orderRef, shipping.email, async () => { await finalize('wompi'); setStep(3); });
    } else {
      await finalize(paymentMethod);
      setStep(3);
    }
  }

  if (items.length === 0 && step !== 3) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
        <Link to="/marketplace"><Button>Ir al Marketplace</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg mr-2"><ChevronLeft className="w-5 h-5" /></button>
          {[{n:1,l:'Envío'},{n:2,l:'Pago'},{n:3,l:'Confirmación'}].map(({n,l},i,arr) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                ${step>=n?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground'}`}>
                {step>n?<Check className="w-4 h-4"/>:n}
              </div>
              <span className={`text-sm hidden sm:block ${step===n?'font-medium':'text-muted-foreground'}`}>{l}</span>
              {i<arr.length-1&&<div className={`h-px w-8 sm:w-16 ${step>n?'bg-primary':'bg-border'}`}/>}
            </div>
          ))}
        </div>

        {/* Success */}
        {step === 3 && (
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold mb-3">¡Pedido confirmado!</h2>
            <p className="text-muted-foreground mb-2">Referencia: <span className="font-mono font-medium">{orderRef}</span></p>
            <p className="text-sm text-muted-foreground mb-8">Recibirás un correo en <strong>{shipping.email}</strong></p>
            <div className="flex justify-center gap-3">
              <Link to="/profile"><Button>Ver mis pedidos</Button></Link>
              <Link to="/marketplace"><Button variant="outline">Seguir comprando</Button></Link>
            </div>
          </motion.div>
        )}

        {step !== 3 && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 1 && (
                <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/>Información de envío</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          {l:'Nombre',k:'fullName',t:'text',p:'Tu nombre'},
                          {l:'Email',k:'email',t:'email',p:'tu@email.com'},
                          {l:'Teléfono',k:'phone',t:'tel',p:'3001234567'},
                          {l:'Dirección',k:'address',t:'text',p:'Cra 5 #25-30'},
                          {l:'Ciudad',k:'city',t:'text',p:'Ibagué'},
                          {l:'Código postal',k:'zipCode',t:'text',p:'730001'},
                        ].map(({l,k,t,p})=>(
                          <div key={k}>
                            <label className="text-sm font-medium mb-1 block">{l}</label>
                            <input type={t} value={(shipping as any)[k]} placeholder={p}
                              onChange={(e)=>setShipping({...shipping,[k]:e.target.value})}
                              className="w-full px-3 py-2 border border-input rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
                          </div>
                        ))}
                      </div>
                      <Button fullWidth size="lg" className="mt-6"
                        disabled={!shipping.fullName||!shipping.email||!shipping.address}
                        onClick={()=>setStep(2)}>
                        Continuar al pago
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary"/>Método de pago</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        {id:'wompi',icon:CreditCard,color:'text-primary',title:'Tarjeta de crédito / débito',sub:'Visa, Mastercard, Amex · Procesado por Wompi (Bancolombia)',badge:'Recomendado'},
                        {id:'pse',icon:Building2,color:'text-blue-600',title:'PSE — Débito bancario',sub:'Transferencia directa desde tu cuenta bancaria colombiana'},
                        {id:'cash',icon:Smartphone,color:'text-green-600',title:'Contra entrega',sub:'Paga en efectivo cuando recibas tu pedido'},
                      ].map(({id,icon:Icon,color,title,sub,badge})=>(
                        <div key={id} onClick={()=>setPaymentMethod(id as any)}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${paymentMethod===id?'border-primary bg-primary/5':'border-border hover:border-primary/40'}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                            ${paymentMethod===id?'border-primary':'border-muted-foreground'}`}>
                            {paymentMethod===id&&<div className="w-2.5 h-2.5 rounded-full bg-primary"/>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-4 h-4 ${color}`}/>
                              <span className="font-medium text-sm">{title}</span>
                              {badge&&<Badge variant="success" size="sm">{badge}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{sub}</p>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"/>
                        <p className="text-xs text-muted-foreground">
                          Pagos seguros y encriptados. Wompi es la plataforma oficial de Bancolombia.
                          {!wompiLoaded&&paymentMethod==='wompi'&&<span className="text-yellow-600"> (Cargando widget...)</span>}
                        </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={()=>setStep(1)}>Volver</Button>
                        <Button fullWidth size="lg" loading={createOrder.isPending} onClick={handlePay}>
                          {paymentMethod==='wompi'?'Pagar con Wompi':paymentMethod==='pse'?'Pagar con PSE':'Confirmar pedido'}
                          {' · '}{formatCurrency(total)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-52 overflow-y-auto">
                    {items.map((item)=>(
                      <div key={item.product.id} className="flex gap-3">
                        <img src={item.product.images?.[0]??'https://placehold.co/48x48'} alt={item.product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-secondary flex-shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(item.product.price*item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Envío</span><span>{shippingCost===0?<span className="text-success">Gratis</span>:formatCurrency(shippingCost)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>IVA (19%)</span><span>{formatCurrency(tax)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t border-border pt-2"><span>Total</span><span className="text-primary">{formatCurrency(total)}</span></div>
                  </div>
                  {subtotal<100000&&(
                    <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2 text-center">
                      Agrega {formatCurrency(100000-subtotal)} más para envío gratis 🚚
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
