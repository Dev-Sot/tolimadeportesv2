import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package , ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useCartStore } from '../stores/cartStore';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  const subtotal = getTotal();
  const shipping = subtotal > 100000 ? 0 : 15000;
  const tax = subtotal * 0.19;
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
              <p className="text-muted-foreground mb-8">
                Agrega productos al carrito para continuar comprando
              </p>
              <Link to="/marketplace">
                <Button size="lg">
                  Ir al Marketplace
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Carrito de Compras</h1>
          <p className="text-muted-foreground">{items.length} productos en tu carrito</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-4">
                    <div className="flex gap-4">
                      <Link to={`/marketplace/product/${item.product.id}`}>
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <Link to={`/marketplace/product/${item.product.id}`}>
                              <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                                {item.product.name}
                              </h3>
                            </Link>
                            <Badge variant="outline" size="sm" className="mt-1">
                              {item.product.category}
                            </Badge>
                          </div>
                          <button
                            onClick={() => {
                              removeItem(item.product.id);
                              toast.success('Producto eliminado del carrito');
                            }}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                          {item.product.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-lg border border-border hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="w-8 h-8 rounded-lg border border-border hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">
                              {formatCurrency(item.product.price * item.quantity)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(item.product.price)} c/u
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={() => {
                clearCart();
                toast.success('Carrito vaciado');
              }}
              className="text-sm text-destructive hover:underline"
            >
              Vaciar carrito
            </button>
          </div>

          <div>
            <Card className="sticky top-20 p-6">
              <h3 className="font-semibold text-lg mb-4">Resumen del Pedido</h3>

              <div className="space-y-3 mb-4 pb-4 border-b border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  {shipping === 0 ? (
                    <Badge variant="success" size="sm">
                      Gratis
                    </Badge>
                  ) : (
                    <span className="font-medium">{formatCurrency(shipping)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>

              <Button onClick={handleCheckout} fullWidth size="lg" className="mb-3">
                Proceder al Pago
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Link to="/marketplace">
                <Button variant="outline" fullWidth>
                  Continuar Comprando
                </Button>
              </Link>

              {shipping > 0 && (
                <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-info">
                      Añade {formatCurrency(100000 - subtotal)} más para envío gratis
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Compra 100% segura</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Garantía de 30 días</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Devoluciones fáciles</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
