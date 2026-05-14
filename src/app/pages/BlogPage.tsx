import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const POSTS = [
  { slug: '1', title: 'Cómo digitalizar tu negocio deportivo en el Tolima', excerpt: 'Guía práctica para MIPYMES deportivas que quieren aprovechar la tecnología para crecer en 2026. Desde la gestión de inventario hasta la venta en línea.', category: 'Negocios', author: 'Nelson Garzón', date: '2026-05-10', img: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600', readTime: '5 min' },
  { slug: '2', title: 'Los 47 municipios del Tolima y el deporte comunitario', excerpt: 'Un recorrido por la riqueza deportiva del Tolima: desde el fútbol en Planadas hasta el ciclismo en Honda y los torneos de baloncesto en El Espinal.', category: 'Región', author: 'Misael Gallo', date: '2026-05-05', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600', readTime: '7 min' },
  { slug: '3', title: 'Wompi: la pasarela de pagos colombiana que impulsa el comercio digital', excerpt: 'Todo lo que necesitas saber sobre Wompi, la solución de Bancolombia que permite aceptar pagos con tarjeta, PSE y Nequi sin costos de configuración.', category: 'Tecnología', author: 'Alejandro Marín', date: '2026-04-28', img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600', readTime: '4 min' },
  { slug: '4', title: 'Asociación de Productores de Planadas: del campo al marketplace', excerpt: 'Caso de éxito de cómo productores cafeteros de Planadas diversificaron su oferta con equipamiento agrícola deportivo a través de Tolima Deportes.', category: 'Casos de éxito', author: 'Nelson Garzón', date: '2026-04-20', img: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=600', readTime: '6 min' },
  { slug: '5', title: 'Cómo organizar tu primer torneo deportivo comunitario', excerpt: 'Desde la logística hasta la inscripción digital: todo lo que necesitas para organizar un torneo exitoso en tu municipio del Tolima.', category: 'Torneos', author: 'Misael Gallo', date: '2026-04-15', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600', readTime: '8 min' },
  { slug: '6', title: 'Reserva inteligente de canchas: reduciendo el tiempo muerto deportivo', excerpt: 'Cómo la digitalización de reservas en Ibagué aumentó la ocupación de canchas sintéticas en un 40% en el primer trimestre de 2026.', category: 'Tecnología', author: 'Alejandro Marín', date: '2026-04-08', img: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600', readTime: '5 min' },
];

const CATS = ['Todos', 'Negocios', 'Región', 'Tecnología', 'Torneos', 'Casos de éxito'];

export function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="primary" className="mb-4">Blog</Badge>
            <h1 className="text-4xl font-bold mb-4">Noticias y recursos deportivos</h1>
            <p className="text-xl text-muted-foreground">Artículos sobre deporte, tecnología y negocios en el Tolima</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {CATS.map(c => (
            <button key={c} className="px-4 py-1.5 rounded-full text-sm font-medium bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">{c}</button>
          ))}
        </div>

        {/* Featured */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="overflow-hidden p-0 group" hover>
            <div className="grid md:grid-cols-2">
              <img src={POSTS[0].img} alt={POSTS[0].title} className="w-full h-56 md:h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="p-8 flex flex-col justify-center">
                <Badge variant="primary" size="sm" className="mb-3 w-fit">{POSTS[0].category}</Badge>
                <h2 className="text-2xl font-bold mb-3">{POSTS[0].title}</h2>
                <CardContent className="p-0 mb-4"><p className="text-sm leading-relaxed">{POSTS[0].excerpt}</p></CardContent>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{POSTS[0].author}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(POSTS[0].date).toLocaleDateString('es-CO',{day:'numeric',month:'long'})}</span>
                  <span>{POSTS[0].readTime} de lectura</span>
                </div>
                <Button size="sm" variant="outline" className="w-fit">Leer artículo <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.slice(1).map((post, i) => (
            <motion.div key={post.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="overflow-hidden p-0 group h-full flex flex-col" hover>
                <img src={post.img} alt={post.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="p-5 flex flex-col flex-1">
                  <Badge variant="outline" size="sm" className="mb-2 w-fit">{post.category}</Badge>
                  <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors leading-snug">{post.title}</h3>
                  <CardContent className="p-0 mb-3 flex-1"><p className="text-xs leading-relaxed line-clamp-3">{post.excerpt}</p></CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.author}</span>·
                    <span>{new Date(post.date).toLocaleDateString('es-CO',{day:'numeric',month:'short'})}</span>·
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
