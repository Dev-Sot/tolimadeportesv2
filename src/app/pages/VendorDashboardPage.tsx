import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, Edit3, Trash2, X, DollarSign, Layers, ArrowLeft, AlertCircle, ShoppingBag, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ImageUpload } from '../components/shared/ImageUpload';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useMyProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useVendorOrders } from '../hooks/useSupabase';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';

type Tab = 'products' | 'orders' | 'stats';

const ORDER_STATUS: Record<string, { label: string; variant: any }> = {
  pending:    { label: 'Pendiente',   variant: 'warning' },
  processing: { label: 'Procesando', variant: 'info' },
  shipped:    { label: 'Enviado',     variant: 'info' },
  delivered:  { label: 'Entregado',  variant: 'success' },
  cancelled:  { label: 'Cancelado',  variant: 'destructive' },
};

const CATEGORIES = ['Fútbol','Tenis','Baloncesto','Gimnasio','Natación','Ciclismo','Running','Volleyball'];

interface ProductForm {
  name: string; description: string; price: string; category: string;
  subcategory: string; stock: string; images: string[]; tags: string;
}
const EMPTY: ProductForm = {
  name:'', description:'', price:'', category:'Fútbol',
  subcategory:'', stock:'', images:[], tags:''
};

export function VendorDashboardPage() {
  const { data: products = [], isLoading } = useMyProducts();
  const { data: vendorOrders = [], isLoading: loadingOrders } = useVendorOrders();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [tab, setTab]         = useState<Tab>('products');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState<ProductForm>(EMPTY);

  // Stats calculadas
  const totalRevenue = vendorOrders
    .filter((o: any) => o.orders?.status === 'delivered')
    .reduce((s: number, o: any) => s + o.unit_price * o.quantity, 0);
  const lowStock = products.filter((p: any) => p.stock > 0 && p.stock <= 5);
  const salesByCategory = Object.entries(
    products.reduce((acc: Record<string, number>, p: any) => {
      acc[p.category] = (acc[p.category] ?? 0) + p.price;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  function openCreate() {
    setForm(EMPTY); setEditId(null); setFormError(''); setShowForm(true);
  }

  function openEdit(p: any) {
    setFormError('');
    setForm({
      name: p.name, description: p.description ?? '',
      price: String(p.price), category: p.category,
      subcategory: p.subcategory ?? '', stock: String(p.stock),
      images: p.images ?? [],
      tags: (p.tags ?? []).join(', '),
    });
    setEditId(p.id); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim())  { setFormError('El nombre es obligatorio'); return; }
    if (!form.price)        { setFormError('El precio es obligatorio'); return; }
    if (!form.stock)        { setFormError('El stock es obligatorio'); return; }
    if (parseFloat(form.price) <= 0) { setFormError('El precio debe ser mayor a 0'); return; }

    const payload = {
      name:        form.name.trim(),
      description: form.description.trim(),
      price:       parseFloat(form.price),
      category:    form.category,
      subcategory: form.subcategory.trim() || undefined,
      stock:       parseInt(form.stock),
      images:      form.images,
      tags:        form.tags.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (editId) {
        await updateProduct.mutateAsync({ id: editId, ...payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      setShowForm(false);
      setFormError('');
    } catch (err: any) {
      console.error('Form submit error:', err);
      setFormError(err?.message ?? 'Error desconocido al publicar');
    }
  }

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <Link to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis Productos</h1>
            <p className="text-muted-foreground mt-1">Gestiona tu inventario en el Marketplace</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Nuevo producto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Productos',       value: products.length,                                                icon: Package },
            { label: 'En stock',        value: products.filter((p: any) => p.stock > 0).length,               icon: Layers },
            { label: 'Pedidos totales', value: vendorOrders.length,                                           icon: ShoppingBag },
            { label: 'Ingresos',        value: formatCurrency(totalRevenue),                                  icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-4">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>

        {/* Alerta stock bajo */}
        {lowStock.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Stock bajo en {lowStock.length} producto{lowStock.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lowStock.map((p: any) => `${p.name} (${p.stock})`).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-6 w-fit">
          {([['products', 'Productos'], ['orders', 'Pedidos'], ['stats', 'Estadísticas']] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <h2 className="text-xl font-bold">
                      {editId ? 'Editar producto' : 'Nuevo producto'}
                    </h2>
                    <button onClick={() => setShowForm(false)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Error display */}
                  {formError && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl mb-4">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-destructive">{formError}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">

                      {/* Name */}
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">
                          Nombre del producto <span className="text-destructive">*</span>
                        </label>
                        <input
                          required value={form.name}
                          onChange={e => setForm({...form, name: e.target.value})}
                          placeholder="Ej: Balón de Fútbol Profesional"
                          className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Descripción</label>
                        <textarea
                          value={form.description}
                          onChange={e => setForm({...form, description: e.target.value})}
                          rows={3} placeholder="Describe tu producto..."
                          className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Precio (COP) <span className="text-destructive">*</span>
                        </label>
                        <input
                          required type="number" min="1"
                          value={form.price}
                          onChange={e => setForm({...form, price: e.target.value})}
                          placeholder="Ej: 120000"
                          className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      {/* Stock */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Stock <span className="text-destructive">*</span>
                        </label>
                        <input
                          required type="number" min="0"
                          value={form.stock}
                          onChange={e => setForm({...form, stock: e.target.value})}
                          placeholder="10"
                          className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Categoría <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={form.category}
                          onChange={e => setForm({...form, category: e.target.value})}
                          className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      {/* Subcategory */}
                      <div>
                        <label className="text-sm font-medium mb-1 block">Subcategoría</label>
                        <input
                          value={form.subcategory}
                          onChange={e => setForm({...form, subcategory: e.target.value})}
                          placeholder="Ej: Balones"
                          className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      {/* Images */}
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-2 block">Imágenes del producto</label>
                        <ImageUpload
                          value={form.images}
                          onChange={(urls) => setForm({ ...form, images: urls })}
                          max={6}
                        />
                      </div>

                      {/* Tags */}
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">
                          Etiquetas
                          <span className="text-xs text-muted-foreground ml-1">(separadas por coma)</span>
                        </label>
                        <input
                          value={form.tags}
                          onChange={e => setForm({...form, tags: e.target.value})}
                          placeholder="fútbol, profesional, talla 5"
                          className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" fullWidth loading={isPending} disabled={isPending}>
                        {isPending
                          ? (editId ? 'Guardando...' : 'Publicando...')
                          : (editId ? 'Guardar cambios' : 'Publicar producto')}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TAB: PRODUCTS ── */}
        {/* Show skeleton only on initial fetch — not when data is already cached */}
        {tab === 'products' && isLoading && products.length === 0 ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : tab === 'products' && products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aún no tienes productos</h3>
            <p className="text-muted-foreground mb-6">
              Publica tu primer producto y empieza a vender en el Marketplace del Tolima
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Publicar primer producto
            </Button>
          </div>
        ) : tab === 'products' ? (
          <div className="space-y-3">
            {products.map((p: any) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <Package className="w-6 h-6 text-muted-foreground" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <Badge variant="outline" size="sm">{p.category}</Badge>
                        {p.stock === 0
                          ? <Badge variant="destructive" size="sm">Agotado</Badge>
                          : p.stock <= 5
                          ? <Badge variant="warning" size="sm">Stock bajo ({p.stock})</Badge>
                          : null
                        }
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span className="font-semibold text-primary">{formatCurrency(p.price)}</span>
                        <span>Stock: {p.stock}</span>
                        <span>⭐ {(p.rating ?? 0).toFixed(1)} ({p.review_count ?? 0} reseñas)</span>
                        <span>{formatRelativeTime(p.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title="Editar producto"
                      >
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) {
                            deleteProduct.mutate(p.id);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : null}

        {/* ── TAB: ORDERS ── */}
        {tab === 'orders' && (
          loadingOrders ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded-xl" />)}</div>
          ) : vendorOrders.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aún no tienes pedidos</h3>
              <p className="text-muted-foreground">Cuando alguien compre tus productos aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendorOrders.map((item: any) => {
                const s = ORDER_STATUS[item.orders?.status] ?? { label: item.orders?.status, variant: 'default' };
                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                        {item.products?.images?.[0]
                          ? <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                          : <Package className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.products?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          x{item.quantity} · {item.orders?.profiles?.name ?? 'Cliente'} · {formatRelativeTime(item.orders?.created_at)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-primary">{formatCurrency(item.unit_price * item.quantity)}</p>
                        <Badge variant={s.variant} size="sm">{s.label}</Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        )}

        {/* ── TAB: STATS ── */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Valor de catálogo por categoría</CardTitle></CardHeader>
              <CardContent>
                {salesByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos aún</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={salesByCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="value" fill="var(--primary)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Productos agotados', value: products.filter((p: any) => p.stock === 0).length },
                { label: 'Pedidos entregados', value: vendorOrders.filter((o: any) => o.orders?.status === 'delivered').length },
                { label: 'Rating promedio',    value: products.length ? (products.reduce((s: number, p: any) => s + (p.rating ?? 0), 0) / products.length).toFixed(1) : '—' },
              ].map(({ label, value }) => (
                <Card key={label} className="p-5 text-center">
                  <p className="text-3xl font-bold text-primary">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}