import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useCartStore } from '../../stores/cartStore';
import { useState } from 'react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success('Producto agregado al carrito');
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos');
  };

  return (
    <Link to={`/marketplace/product/${product.id}`}>
      <Card hover className="h-full overflow-hidden group">
        <div className="relative overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.featured && (
            <Badge variant="accent" className="absolute top-3 left-3">
              Destacado
            </Badge>
          )}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'
              }`}
            />
          </button>
          {product.stock < 10 && (
            <Badge variant="warning" className="absolute bottom-3 left-3">
              Últimas {product.stock} unidades
            </Badge>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" size="sm">
              {product.category}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.review_count ?? (product.review_count ?? product.reviewCount ?? 0) ?? 0})</span>
            </div>
          </div>

          <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <img
              src={(product.profiles?.avatar ?? product.vendor?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=vendor`)}
              alt={(product.profiles?.name ?? product.vendor?.name ?? "Vendedor")}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-muted-foreground">{(product.profiles?.name ?? product.vendor?.name ?? "Vendedor")}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(product.price)}
              </div>
              {product.stock > 0 ? (
                <p className="text-xs text-success">En stock</p>
              ) : (
                <p className="text-xs text-destructive">Agotado</p>
              )}
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="sm"
              className="gap-1"
            >
              <ShoppingCart className="w-4 h-4" />
              Agregar
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
