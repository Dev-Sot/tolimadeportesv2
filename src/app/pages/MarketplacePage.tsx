import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, Grid3x3, List, Store } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ProductCard } from '../components/marketplace/ProductCard';
import { useProducts } from '../hooks/useSupabase';

const CATEGORIES = ['Fútbol','Tenis','Baloncesto','Gimnasio','Natación','Ciclismo','Running','Volleyball'];

export function MarketplacePage() {
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange]           = useState<[number, number]>([0, 5000000]);
  const [sortBy, setSortBy]                   = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [showFilters, setShowFilters]         = useState(false);
  const [viewMode, setViewMode]               = useState<'grid' | 'list'>('grid');

  const { data: products = [], isLoading } = useProducts({
    category: selectedCategory || undefined,
    search:   searchQuery      || undefined,
    minPrice: priceRange[0] > 0        ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 5000000  ? priceRange[1] : undefined,
    sortBy,
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange([0, 5000000]);
    setSortBy('featured');
  };

  const hasFilters = !!(searchQuery || selectedCategory || priceRange[1] < 5000000);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-2">Marketplace Deportivo</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Equipamiento deportivo de vendedores verificados del Tolima
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar productos, marcas, categorías..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                  className="bg-background"
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                Filtros
                {hasFilters && <Badge variant="primary" size="sm">Activos</Badge>}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar filters */}
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <Card className="sticky top-20 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filtros</h3>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar</Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Categoría</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === '' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'
                      }`}
                    >
                      Todas
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="featured">Destacados</option>
                    <option value="price-asc">Precio: Menor a Mayor</option>
                    <option value="price-desc">Precio: Mayor a Menor</option>
                    <option value="rating">Mejor Calificados</option>
                  </select>
                </div>

                {/* Price range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Precio máximo: ${(priceRange[1] / 1000).toFixed(0)}K COP
                  </label>
                  <input
                    type="range" min="0" max="5000000" step="50000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>$0</span>
                    <span>$5.000K</span>
                  </div>
                </div>
              </div>
            </Card>
          </aside>

          {/* Product grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Cargando...' : `${products.length} producto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/50'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="h-72 bg-secondary/50 animate-pulse rounded-2xl" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                  <Store className="w-10 h-10 text-muted-foreground" />
                </div>
                {hasFilters ? (
                  <>
                    <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Intenta con otros filtros</p>
                    <Button onClick={clearFilters}>Limpiar filtros</Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Aún no hay productos</h3>
                    <p className="text-muted-foreground mb-5 text-sm max-w-xs">
                      Sé el primero en publicar productos deportivos en Tolima Deportes
                    </p>
                    <Link to="/register">
                      <Button>Registrarme como vendedor</Button>
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Products */}
            {!isLoading && products.length > 0 && (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                {products.map((product, index) => (
                  <motion.div key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <ProductCard product={product} viewMode={viewMode} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
