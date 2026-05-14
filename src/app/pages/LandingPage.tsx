import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  Calendar,
  Trophy,
  Users,
  MapPin,
  Star,
  ArrowRight,
  Check,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { mockProducts } from '../lib/mockData';

export function LandingPage() {
  const features = [
    {
      icon: ShoppingBag,
      title: 'Marketplace Deportivo',
      description: 'Compra y vende equipamiento deportivo de calidad con vendedores verificados de Tolima.',
      color: 'from-primary to-emerald-600',
    },
    {
      icon: MapPin,
      title: 'Reserva de Canchas',
      description: 'Encuentra y reserva las mejores canchas deportivas de la región en minutos.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Trophy,
      title: 'Torneos',
      description: 'Participa en torneos organizados o crea los tuyos propios para tu comunidad.',
      color: 'from-accent to-yellow-500',
    },
    {
      icon: Users,
      title: 'Comunidad Activa',
      description: 'Conecta con otros deportistas, comparte experiencias y forma parte de la comunidad.',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const stats = [
    { value: '500+', label: 'Usuarios Activos' },
    { value: '200+', label: 'Productos' },
    { value: '50+', label: 'Canchas' },
    { value: '47', label: 'Municipios Tolima' },
  ];

  const benefits = [
    'Compra segura con garantía',
    'Vendedores verificados',
    'Reservas instantáneas',
    'Soporte 24/7',
    'Pagos seguros',
    'Comunidad activa',
  ];

  return (
    <div className="min-h-screen">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="primary" className="mb-4">
                Plataforma #1 en Tolima
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Tu Comunidad Deportiva en Tolima
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Compra equipamiento, reserva canchas, participa en torneos y conecta con la
                comunidad deportiva más activa de la región. Todo en un solo lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/register">
                  <Button size="lg" className="group">
                    Comenzar Ahora
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline">
                    Explorar Marketplace
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <img
                      key={i}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                      alt="Usuario"
                      className="w-10 h-10 rounded-full border-2 border-background"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Más de <span className="font-semibold text-foreground">5000 usuarios</span>{' '}
                    satisfechos
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card className="overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400"
                      alt="Cancha"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium">Canchas Premium</p>
                      <p className="text-xs text-muted-foreground">50+ disponibles</p>
                    </div>
                  </Card>
                  <Card className="overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400"
                      alt="Producto"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium">Equipamiento</p>
                      <p className="text-xs text-muted-foreground">1200+ productos</p>
                    </div>
                  </Card>
                </div>
                <div className="space-y-4 mt-8">
                  <Card className="overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400"
                      alt="Torneo"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium">Torneos</p>
                      <p className="text-xs text-muted-foreground">100+ activos</p>
                    </div>
                  </Card>
                  <Card className="overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"
                      alt="Comunidad"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium">Comunidad</p>
                      <p className="text-xs text-muted-foreground">5000+ miembros</p>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="primary" className="mb-4">
              Características
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Todo lo que necesitas en un solo lugar</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una plataforma completa diseñada para conectar la comunidad deportiva de Tolima
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <CardHeader>
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Productos Destacados</h2>
            <Link to="/marketplace">
              <Button variant="ghost">
                Ver todos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProducts.slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/marketplace/product/${product.id}`}>
                  <Card hover className="h-full overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <Badge variant="outline" size="sm" className="mb-2">
                        {product.category}
                      </Badge>
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span className="text-sm ml-1">{product.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({(((product as any).review_count ?? product.reviewCount ?? 0))})
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="success" className="mb-4">
                <TrendingUp className="w-3 h-3 mr-1" />
                Beneficios
              </Badge>
              <h2 className="text-4xl font-bold mb-6">
                Por qué elegir Tolima Deportes
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                Somos la plataforma más confiable y completa para la comunidad deportiva de Tolima.
                Conectamos atletas, vendedores, organizadores y entrenadores en un ecosistema
                diseñado para impulsar el deporte local.
              </p>
              <Link to="/register">
                <Button size="lg">
                  Únete Ahora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800"
                alt="Deporte"
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Listo para comenzar tu viaje deportivo?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Únete a miles de deportistas que ya están disfrutando de la mejor plataforma deportiva de Tolima
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" variant="primary">
                  Crear Cuenta Gratis
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline">
                  Conocer Más
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
