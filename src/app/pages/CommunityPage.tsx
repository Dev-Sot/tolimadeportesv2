import { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, Send, Users, TrendingUp, Hash } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { usePosts, useCreatePost, useToggleLike } from '../hooks/useSupabase';
import { mockPosts } from '../lib/mockData';
import { useAuthStore } from '../stores/authStore';
import { formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const TOPICS = ['Fútbol', 'Tenis', 'Baloncesto', 'Ciclismo', 'Natación', 'Gym', 'Running', 'General'];
const TRENDING = [
  { tag: 'CopaTolima2026', posts: 48 },
  { tag: 'FútbolIbagué', posts: 34 },
  { tag: 'CanchasSintéticas', posts: 27 },
  { tag: 'EntrenadoresTolima', posts: 19 },
  { tag: 'MarketplaceDeportivo', posts: 15 },
];

export function CommunityPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: rawPosts = [], isLoading } = usePosts();
  const posts = rawPosts.length > 0 ? rawPosts : mockPosts.map((p: any) => ({ ...p, profiles: { name: p.user?.name ?? 'Usuario', avatar: p.user?.avatar, role: p.user?.role }, created_at: p.created_at ?? p.createdAt ?? new Date().toISOString() }));
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();

  const [content, setContent] = useState('');
  const [sport, setSport] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  async function handlePost() {
    if (!content.trim()) return;
    await createPost.mutateAsync({ content, sport: sport || undefined });
    setContent('');
    setSport('');
  }

  async function handleLike(postId: string) {
    if (!isAuthenticated) { toast.error('Inicia sesión para dar like'); return; }
    const isLiked = likedIds.has(postId);
    setLikedIds(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    await toggleLike.mutateAsync({ postId, liked: isLiked });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b border-border py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Comunidad Deportiva</h1>
                <p className="text-muted-foreground text-sm">Tolima · Colombia</p>
              </div>
            </div>
            <p className="text-muted-foreground">Comparte experiencias, resultados y conecta con atletas de los 47 municipios del Tolima</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create post */}
            {isAuthenticated ? (
              <Card className="p-5">
                <div className="flex gap-3">
                  <img src={user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                    alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <textarea value={content} rows={3}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="¿Qué está pasando en el deporte del Tolima?"
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3" />
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {TOPICS.map((t) => (
                          <button key={t} onClick={() => setSport(sport === t ? '' : t)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                              ${sport === t ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
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
                <h3 className="font-semibold mb-2">Únete a la comunidad deportiva del Tolima</h3>
                <p className="text-sm text-muted-foreground mb-4">Inicia sesión para publicar, comentar y conectar con otros atletas</p>
                <div className="flex justify-center gap-3">
                  <Link to="/login"><Button>Iniciar sesión</Button></Link>
                  <Link to="/register"><Button variant="outline">Registrarse</Button></Link>
                </div>
              </Card>
            )}

            {/* Posts */}
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-40 bg-secondary animate-pulse rounded-2xl" />)}
              </div>
            ) : posts.length === 0 ? (
              <Card className="text-center py-16">
                <p className="text-muted-foreground">Sé el primero en publicar algo</p>
              </Card>
            ) : (
              posts.map((post: any, i: number) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <img src={post.profiles?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                        alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{post.profiles?.name}</p>
                          {post.profiles?.role && post.profiles.role !== 'customer' && (
                            <Badge variant="primary" size="sm">
                              {post.profiles.role === 'coach' ? 'Entrenador' :
                               post.profiles.role === 'vendor' ? 'Vendedor' :
                               post.profiles.role === 'organizer' ? 'Organizador' : post.profiles.role}
                            </Badge>
                          )}
                          {post.sport && <Badge variant="outline" size="sm">{post.sport}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</p>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed whitespace-pre-line mb-4">{post.content}</p>

                    {post.images?.length > 0 && (
                      <div className="mb-4 rounded-xl overflow-hidden">
                        <img src={post.images[0]} alt="" className="w-full max-h-96 object-cover" />
                      </div>
                    )}

                    <div className="flex items-center gap-5 pt-3 border-t border-border">
                      <button onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${likedIds.has(post.id) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
                        <Heart className={`w-4 h-4 ${likedIds.has(post.id) ? 'fill-current' : ''}`} />
                        <span>{post.likes + (likedIds.has(post.id) ? 1 : 0)}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                      <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Enlace copiado'); }}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Compartir</span>
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="w-4 h-4 text-primary" /> Tendencias</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {TRENDING.map(({ tag, posts: count }, i) => (
                  <div key={tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i+1}</span>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-0.5">
                          <Hash className="w-3 h-3 text-primary" />{tag}
                        </p>
                        <p className="text-xs text-muted-foreground">{count} publicaciones</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Categorías deportivas</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <Badge key={t} variant="outline" size="sm" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 p-4">
              <p className="text-sm font-semibold mb-2">¿Eres entrenador o organizador?</p>
              <p className="text-xs text-muted-foreground mb-3">Registra tu perfil profesional y llega a más deportistas del Tolima.</p>
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
