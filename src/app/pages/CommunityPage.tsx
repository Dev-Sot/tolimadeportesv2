import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, Send, Users, TrendingUp, Hash, ChevronDown, ChevronUp, Trash2, ImageIcon } from 'lucide-react';
import { ImageUpload } from '../components/shared/ImageUpload';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { usePosts, useCreatePost, useToggleLike } from '../hooks/useSupabase';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';

const TOPICS = ['Fútbol','Tenis','Baloncesto','Ciclismo','Natación','Gym','Running','General'];
const TRENDING = [
  { tag: 'CopaTolima2026', posts: 0 },
  { tag: 'FútbolIbagué', posts: 0 },
  { tag: 'CanchasSintéticas', posts: 0 },
  { tag: 'EntrenadoresTolima', posts: 0 },
  { tag: 'MarketplaceDeportivo', posts: 0 },
];

// ─── Comment Section ─────────────────────────────────────────────────────────
function CommentSection({ postId, commentsCount }: { postId: string; commentsCount: number }) {
  const { user, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [open, setOpen]       = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loaded, setLoaded]   = useState(false);
  const [text, setText]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadComments() {
    if (!open) {
      const { data } = await supabase
        .from('post_comments')
        .select('*, profiles:user_id (id, name, avatar)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      setComments(data ?? []);
      setLoaded(true);
    }
    setOpen(p => !p);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !text.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: user.id, content: text.trim() })
        .select('*, profiles:user_id (id, name, avatar)')
        .single();
      if (error) throw new Error(error.message);
      setComments(p => [...p, data]);
      setText('');
      qc.invalidateQueries({ queryKey: ['posts'] });
    } catch (err: any) {
      toast.error(err.message ?? 'Error al comentar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button onClick={loadComments}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <MessageCircle className="w-4 h-4" />
        <span>{commentsCount} comentarios</span>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {!loaded && <p className="text-xs text-muted-foreground">Cargando...</p>}
          {loaded && comments.length === 0 && (
            <p className="text-xs text-muted-foreground">Sé el primero en comentar</p>
          )}
          {comments.map((c: any) => (
            <div key={c.id} className="flex items-start gap-2">
              <img src={c.profiles?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`}
                alt="" className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
              <div className={`bg-secondary/50 rounded-xl px-3 py-2 min-w-0 ${user?.id === c.user_id ? 'flex-1' : 'flex-1'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">{c.profiles?.name ?? 'Usuario'}</p>
                  {user?.id === c.user_id && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from('post_comments').delete().eq('id', c.id);
                        if (error) { toast.error('No se pudo eliminar'); return; }
                        setComments(p => p.filter(x => x.id !== c.id));
                        qc.invalidateQueries({ queryKey: ['posts'] });
                      }}
                      className="p-0.5 rounded hover:bg-destructive/20 text-destructive/60 hover:text-destructive transition-colors shrink-0"
                      title="Eliminar comentario"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
              <img src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt="" className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
              <input value={text} onChange={e => setText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 px-3 py-1.5 text-xs border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button type="submit" disabled={!text.trim() || submitting}
                className="p-1.5 rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <Link to="/login" className="text-xs text-primary hover:underline">Inicia sesión para comentar</Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: any }) {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const toggleLike = useToggleLike();
  const [liked, setLiked]   = useState(false);
  const [count, setCount]   = useState<number>(post.likes ?? 0);

  async function handleLike() {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para dar like');
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(p => newLiked ? p + 1 : p - 1);
    try {
      await toggleLike.mutateAsync({ postId: post.id, liked });
      qc.invalidateQueries({ queryKey: ['posts'] });
    } catch {
      setLiked(liked);
      setCount(p => newLiked ? p - 1 : p + 1);
    }
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/community`);
      toast.success('Enlace copiado');
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-secondary">
          <img src={post.profiles?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
            alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{post.profiles?.name ?? 'Usuario'}</p>
            {post.profiles?.role && post.profiles.role !== 'customer' && (
              <Badge variant="primary" size="sm">
                {post.profiles.role === 'coach' ? 'Entrenador' :
                 post.profiles.role === 'vendor' ? 'Vendedor' :
                 post.profiles.role === 'organizer' ? 'Organizador' :
                 post.profiles.role === 'court_owner' ? 'Dueño de cancha' : post.profiles.role}
              </Badge>
            )}
            {post.sport && <Badge variant="outline" size="sm">{post.sport}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(post.created_at)}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-line mb-4">{post.content}</p>
      {post.images?.length > 0 && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <img src={post.images[0]} alt="" className="w-full max-h-80 object-cover" />
        </div>
      )}

      <div className="flex items-center gap-5 pt-3 border-t border-border">
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{count}</span>
        </button>
        <CommentSection postId={post.id} commentsCount={post.comments ?? 0} />
        <button onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Compartir</span>
        </button>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CommunityPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: posts = [], isLoading } = usePosts();
  const createPost = useCreatePost();
  const [content, setContent]   = useState('');
  const [sport, setSport]       = useState('');
  const [images, setImages]     = useState<string[]>([]);
  const [showImages, setShowImages] = useState(false);

  async function handlePost() {
    if (!content.trim()) return;
    await createPost.mutateAsync({ content, sport: sport || undefined, images: images.length ? images : undefined });
    setContent('');
    setSport('');
    setImages([]);
    setShowImages(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b border-border py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3">
              <h1 className="text-3xl font-bold">Comunidad Deportiva</h1>
              <p className="text-muted-foreground text-sm">Tolima · Colombia</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-5">
            {isAuthenticated ? (
              <Card className="p-5">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-secondary">
                    <img src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                      alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <textarea value={content} rows={3}
                      onChange={e => setContent(e.target.value)}
                      placeholder="¿Qué está pasando en el deporte del Tolima?"
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3" />
                    {showImages && (
                      <div className="mb-3">
                        <ImageUpload value={images} onChange={setImages} max={4} />
                      </div>
                    )}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setShowImages(p => !p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${showImages ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
                          <ImageIcon className="w-3 h-3" /> Foto
                        </button>
                        {TOPICS.map(t => (
                          <button key={t} onClick={() => setSport(sport === t ? '' : t)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${sport === t ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <Button size="sm" disabled={!content.trim() || createPost.isPending}
                        loading={createPost.isPending} onClick={handlePost}>
                        <Send className="w-4 h-4" /> Publicar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center border-dashed">
                <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-2">Únete a la comunidad del Tolima</h3>
                <p className="text-sm text-muted-foreground mb-4">Inicia sesión para publicar, comentar y conectar</p>
                <div className="flex justify-center gap-3">
                  <Link to="/login"><Button>Iniciar sesión</Button></Link>
                  <Link to="/register"><Button variant="outline">Registrarse</Button></Link>
                </div>
              </Card>
            )}

            {isLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-secondary animate-pulse rounded-2xl" />)}</div>
            ) : posts.length === 0 ? (
              <Card className="text-center py-16">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-1">Aún no hay publicaciones</p>
                <p className="text-sm text-muted-foreground">¡Sé el primero en compartir algo con la comunidad!</p>
              </Card>
            ) : (
              posts.map((post: any, i: number) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <PostCard post={post} />
                </motion.div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="w-4 h-4 text-primary" /> Tendencias</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {TRENDING.map(({ tag }, i) => (
                  <div key={tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i+1}</span>
                      <p className="text-sm font-medium flex items-center gap-0.5">
                        <Hash className="w-3 h-3 text-primary" />{tag}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Categorías</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(t => (
                    <Badge key={t} variant="outline" size="sm" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 p-4">
              <p className="text-sm font-semibold mb-2">¿Eres entrenador o vendedor?</p>
              <p className="text-xs text-muted-foreground mb-3">Registra tu perfil profesional y llega a más deportistas.</p>
              <Link to="/register">
                <Button size="sm" fullWidth variant="outline">Crear perfil profesional</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}