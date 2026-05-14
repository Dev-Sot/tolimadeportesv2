import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, Edit3, Trash2, X, DollarSign, Layers, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useMyProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useSupabase';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';

const CATEGORIES = ['Fútbol','Tenis','Baloncesto','Gimnasio','Natación','Ciclismo','Running','Volleyball'];

interface ProductForm {
  name: string; description: string; price: string; category: string;
  subcategory: string; stock: string; images: string; tags: string;
}
const EMPTY: ProductForm = {
  name:'', description:'', price:'', category:'Fútbol',
  subcategory:'', stock:'', images:'', tags:''
};

export function VendorDashboardPage() {
  const { data: products = [], isLoading } = useMyProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState<ProductForm>(EMPTY);

  function openCreate() {
    setForm(EMPTY); setEditId(null); setFormError(''); setShowForm(true);
  }

  function openEdit(p: any) {
    setFormError('');
    setForm({
      name: p.name, description: p.description ?? '',
      price: String(p.price), category: p.category,
      subcategory: p.subcategory ?? '', stock: String(p.stock),
      images: (p.images ?? []).join('\n'),
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
      images:      form.images.split('\n').map(s => s.trim()).filter(Boolean),
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
      const msg = err?.message ?? 'Error desconocido';
      setFormError(
        msg.includes('row-level security')
          ? 'Sin permiso: asegúrate de tener rol "vendor" en tu perfil y haber corrido fix_rls_products.sql en Supabase'
          : msg
      );
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
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total productos',    value: products.length,                                           icon: Package },
            { label: 'En stock',           value: products.filter((p: any) => p.stock > 0).length,           icon: Layers },
            { label: 'Valor del catálogo', value: formatCurrency(products.reduce((s: number, p: any) => s + p.price, 0)), icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
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
                className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
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
                        <label className="text-sm font-medium mb-1 block">
                          URLs de imágenes
                          <span className="text-xs text-muted-foreground ml-1">(una por línea)</span>
                        </label>
                        <textarea
                          value={form.images}
                          onChange={e => setForm({...form, images: e.target.value})}
                          rows={3}
                          placeholder={`https://images.unsplash.com/photo-xxx?w=800\nhttps://tu-dominio.com/imagen2.jpg`}
                          className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Puedes usar URLs de Unsplash, Cloudinary o Supabase Storage
                        </p>
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

        {/* Products list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
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
        ) : (
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
        )}
      </div>
    </div>
  );
}
