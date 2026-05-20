import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../lib/utils';
import type { Product } from '../../types';
import { toast } from 'sonner';

interface Props {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, viewMode = 'grid' }: Props) {
  const { addItem, items } = useCartStore();
  const [isFav, setIsFav] = useState(false);
  const [imgError, setImgError] = useState(false);
  const inCart = items.some((i) => i.product.id === product.id);

  const reviewCount = product.review_count ?? product.reviewCount ?? 0;
  const vendorName  = product.profiles?.name ?? product.vendor?.name ?? 'Vendedor';
  const img = (!imgError && product.images?.[0]) ? product.images[0] : 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400';

  function handleAddToCart(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (inCart || product.stock === 0) return;
    addItem(product);
    toast.success(`${product.name} agregado al carrito`);
  }

  function handleFav(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsFav((p) => !p);
    toast.success(isFav ? 'Eliminado de favoritos' : 'Guardado en favoritos');
  }

  if (viewMode === 'list') {
    return (
      <Link to={`/marketplace/product/${product.id}`}>
        <motion.div whileHover={{ y: -2 }} className="bg-card border border-border rounded-xl overflow-hidden flex gap-4 p-4 hover:shadow-md transition-shadow">
          <img src={img} alt={product.name} onError={() => setImgError(true)}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
              <p className="text-lg font-bold text-primary flex-shrink-0">{formatCurrency(product.price)}</p>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{product.rating}</span>
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              </div>
              <span className="text-xs text-muted-foreground">{product.category}</span>
              {product.stock <= 5 && product.stock > 0 && (
                <Badge variant="warning" size="sm">¡Últimas {product.stock}!</Badge>
              )}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={inCart || product.stock === 0}
            aria-label={inCart ? `${product.name} ya está en el carrito` : `Agregar ${product.name} al carrito`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all self-center ${inCart ? 'bg-success' : 'bg-primary hover:bg-primary/90'} disabled:cursor-not-allowed`}
          >
            {inCart ? 'Agregado' : <ShoppingCart aria-hidden="true" className="w-4 h-4" />}
          </button>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/marketplace/product/${product.id}`}>
      <motion.div whileHover={{ y: -4 }} className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <img src={img} alt={product.name} onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {product.featured && (
            <Badge variant="accent" size="sm" className="absolute top-3 left-3">Destacado</Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Agotado</Badge>
            </div>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <Badge variant="warning" size="sm" className="absolute top-3 right-3">¡Últimas {product.stock}!</Badge>
          )}
          {/* Hover actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-end justify-end p-3 gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleFav}
              aria-label={isFav ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
              aria-pressed={isFav}
              className={`p-2 rounded-full transition-all ${isFav ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-red-50'}`}
            >
              <Heart aria-hidden="true" className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={inCart || product.stock === 0}
              aria-label={inCart ? `${product.name} ya está en el carrito` : `Agregar ${product.name} al carrito`}
              className={`p-2 rounded-full text-white transition-all disabled:cursor-not-allowed ${inCart ? 'bg-success' : 'bg-primary hover:bg-primary/90 disabled:opacity-50'}`}
            >
              <ShoppingCart aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <Badge variant="outline" size="sm" className="w-fit mb-2">{product.category}</Badge>
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors flex-1">{product.name}</h3>
          
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{product.rating?.toFixed(1) ?? '0.0'}</span>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div>
              <p className="text-xl font-bold text-primary">{formatCurrency(product.price)}</p>
              {product.stock > 0 && product.stock <= 10 && (
                <p className="text-xs text-muted-foreground">{product.stock} disponibles</p>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={inCart || product.stock === 0}
              aria-label={inCart ? `${product.name} ya está en el carrito` : `Agregar ${product.name} al carrito`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-medium transition-colors disabled:cursor-not-allowed ${inCart ? 'bg-success' : 'bg-primary hover:bg-primary/90 disabled:opacity-50'}`}
            >
              <ShoppingCart aria-hidden="true" className="w-3.5 h-3.5" />
              {inCart ? 'Agregado' : 'Agregar'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${vendorName}`} alt=""
              className="w-5 h-5 rounded-full object-cover" />
            <span className="text-xs text-muted-foreground truncate">{vendorName}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
