import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useProduct, useProducts, useToggleFavorite, useFavorites } from '../hooks/useSupabase';
import { formatCurrency } from '../lib/utils';
import { useCartStore } from '../stores/cartStore';
import { toast } from 'sonner';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id ?? '');
  const { data: allProducts = [] } = useProducts();
  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const isFavorite = favorites.some((f: any) => f.target_id === id && f.target_type === 'product');
  const { addItem, items } = useCartStore();
  const inCart = items.some((i) => i.product.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
        <Link to="/marketplace">
          <Button>Volver al Marketplace</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (inCart) return;
    addItem(product, quantity);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate('/cart');
  };

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative mb-4 rounded-2xl overflow-hidden bg-secondary/20"
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-[240px] sm:h-[380px] md:h-[500px] object-cover"
              />
              {product.featured && (
                <Badge variant="accent" className="absolute top-4 left-4">
                  Destacado
                </Badge>
              )}
              {product.stock < 10 && (
                <Badge variant="warning" className="absolute top-4 right-4">
                  Últimas {product.stock} unidades
                </Badge>
              )}
            </motion.div>

            <div className="grid grid-cols-4 gap-3">
              {(product.images ?? []).map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4">
              <Badge variant="outline" className="mb-3">
                {product.category}
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-accent text-accent'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm">
                  <span className="font-semibold">{product.rating}</span> ({product?.review_count ?? 0}{' '}
                  reseñas)
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6 p-4 bg-secondary/20 rounded-lg">
                <img
                  src={((product as any).profiles?.avatar ?? product.vendor?.avatar) ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=vendor`}
                  alt={((product as any).profiles?.name ?? product.vendor?.name ?? "Vendedor") ?? 'Vendedor'}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{((product as any).profiles?.name ?? product.vendor?.name ?? "Vendedor") ?? 'Vendedor'}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span>{((product as any).profiles?.rating ?? product.vendor?.rating ?? 4.8) ?? 4.8} vendedor confiable</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                {formatCurrency(product.price)}
              </div>
              {product.stock > 0 ? (
                <Badge variant="success">
                  <Check className="w-3 h-3 mr-1" />
                  En stock ({product.stock} disponibles)
                </Badge>
              ) : (
                <Badge variant="destructive">Agotado</Badge>
              )}
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {(product.tags ?? []).map((tag: string) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Cantidad</label>
                <span className="text-xs text-muted-foreground">
                  {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-lg border border-border hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  className="w-20 h-10 text-center border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 rounded-lg border border-border hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button
                onClick={handleAddToCart}
                variant={inCart ? 'default' : 'outline'}
                disabled={product.stock === 0 || inCart}
                className={`flex-1 gap-2 transition-colors ${inCart ? 'bg-success text-white border-success hover:bg-success' : ''}`}
              >
                {inCart ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                {inCart ? 'Agregado' : 'Agregar al Carrito'}
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1"
              >
                Comprar Ahora
              </Button>
              <button
                onClick={() => {
                  toggleFavorite.mutate({ targetId: id!, targetType: 'product', isFav: isFavorite });
                  toast.success(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos');
                }}
                className="w-12 h-12 rounded-lg border border-border hover:bg-secondary/50 transition-colors flex items-center justify-center"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium mb-1">Envío Gratis</p>
                <p className="text-xs text-muted-foreground">En compras +$100k</p>
              </Card>
              <Card className="text-center p-4">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium mb-1">Garantía</p>
                <p className="text-xs text-muted-foreground">30 días</p>
              </Card>
              <Card className="text-center p-4">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium mb-1">Devoluciones</p>
                <p className="text-xs text-muted-foreground">Fáciles y rápidas</p>
              </Card>
            </div>
          </motion.div>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Productos Relacionados</h2>
              <Link to="/marketplace">
                <Button variant="ghost">Ver más</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} to={`/marketplace/product/${relatedProduct.id}`}>
                  <Card hover className="overflow-hidden">
                    <img
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{relatedProduct.name}</h3>
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(relatedProduct.price)}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
