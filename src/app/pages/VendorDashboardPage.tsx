import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, Edit3, Trash2, Eye, EyeOff, X, Upload, DollarSign, Tag, Layers , ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useMyProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useSupabase';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';

const CATEGORIES = ['Fútbol','Tenis','Baloncesto','Gimnasio','Natación','Ciclismo','Running','Volleyball'];

interface ProductForm {
  name: string; description: string; price: string; category: string;
  subcategory: string; stock: string; images: string; tags: string;
}

const EMPTY: ProductForm = { name:'', description:'', price:'', category:'Fútbol', subcategory:'', stock:'', images:'', tags:'' };

export function VendorDashboardPage() {
  const { data: products = [], isLoading } = useMyProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY);

  function openCreate() { setForm(EMPTY); setEditId(null); setShowForm(true); }
  function openEdit(p: any) {
    setForm({ name: p.name, description: p.description, price: String(p.price), category: p.category, subcategory: p.subcategory ?? '', stock: String(p.stock), images: (p.images ?? []).join('\n'), tags: (p.tags ?? []).join(', ') });
    setEditId(p.id); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) { toast.error('Completa los campos obligatorios'); return; }
    const payload = {
      name: form.name, description: form.description,
      price: parseFloat(form.price), category: form.category,
      subcategory: form.subcategory || undefined,
      stock: parseInt(form.stock),
      images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    };
    if (editId) await updateProduct.mutateAsync({ id: editId, ...payload });
    else await createProduct.mutateAsync(payload);
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
                      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <h1 className="text-3xl font-bold">Mis Productos</h1>
            <p className="text-muted-foreground mt-1">Gestiona tu inventario en el Marketplace</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> Nuevo producto</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total productos', value: products.length, icon: Package },
            { label: 'En stock', value: products.filter((p: any) => p.stock > 0).length, icon: Layers },
            { label: 'Ingresos estimados', value: formatCurrency(products.reduce((s: number, p: any) => s + p.price, 0)), icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>

        {/* Product form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
                    <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Nombre del producto *</label>
                        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Balón de Fútbol Profesional"
                          className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Descripción</label>
                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="Describe tu producto..."
                          className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Precio (COP) *</label>
                        <input required type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Ej: 120000"
                          className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Stock *</label>
                        <input required type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="Unidades disponibles"
                          className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Categoría *</label>
                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                          className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Subcategoría</label>
                        <input value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})} placeholder="Ej: Balones"
                          className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">URLs de imágenes (una por línea)</label>
                        <textarea value={form.images} onChange={e => setForm({...form, images: e.target.value})} rows={3} placeholder="https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.jpg"
                          className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                        <p className="text-xs text-muted-foreground mt-1">Usa URLs de Supabase Storage, Cloudinary o Unsplash</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Etiquetas (separadas por coma)</label>
                        <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="fútbol, profesional, FIFA"
                          className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                      <Button type="submit" fullWidth loading={createProduct.isPending || updateProduct.isPending}>
                        {editId ? 'Guardar cambios' : 'Publicar producto'}
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
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded-xl" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aún no tienes productos</h3>
            <p className="text-muted-foreground mb-6">Publica tu primer producto y empieza a vender en el Marketplace del Tolima</p>
            <Button onClick={openCreate}><Plus className="w-4 h-4" /> Publicar primer producto</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p: any) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 m-auto mt-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <Badge variant="outline" size="sm">{p.category}</Badge>
                        {p.stock === 0 && <Badge variant="destructive" size="sm">Agotado</Badge>}
                        {p.stock > 0 && p.stock <= 5 && <Badge variant="warning" size="sm">Stock bajo</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">{formatCurrency(p.price)}</span>
                        <span>Stock: {p.stock}</span>
                        <span>⭐ {p.rating?.toFixed(1) ?? '0.0'} ({p.review_count ?? 0})</span>
                        <span>{formatRelativeTime(p.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Editar">
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar este producto?')) deleteProduct.mutate(p.id); }}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Eliminar">
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
