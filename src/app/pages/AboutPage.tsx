import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Trophy, Target, Users, Rocket, MapPin, Mail, Phone, Github, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const TEAM = [
  {
    name: 'Nelson Garzón',
    role: 'Full Stack Developer & Tech Lead',
    github: 'https://github.com/Dev-Sot',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nelson',
    bio: 'Arquitectura de sistemas, base de datos Supabase, integración de APIs y liderazgo técnico del proyecto.',
  },
  {
    name: 'Misael Gallo',
    role: 'Frontend Developer & UI Designer',
    github: 'https://github.com/Milan32555',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=misael',
    bio: 'Diseño de interfaces, componentes React, experiencia de usuario y prototipado en Figma.',
  },
  {
    name: 'Alejandro Marín',
    role: 'Backend Developer & DevOps',
    github: 'https://github.com/AlejoM09',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alejandro',
    bio: 'Lógica de negocio, políticas de seguridad RLS, deploy en Vercel e integración de pagos con Wompi.',
  },
];

const VALUES = [
  { icon: Target, title: 'Misión', text: 'Digitalizar el ecosistema deportivo del Tolima, conectando atletas, negocios y organizadores en una sola plataforma accesible y confiable.' },
  { icon: Rocket, title: 'Visión 2026', text: 'Ser la plataforma SaaS deportiva de referencia en Colombia, con presencia en los 47 municipios del Tolima y 10,000 usuarios activos.' },
  { icon: Users, title: 'Impacto', text: 'Reducir la brecha digital de las MIPYMES deportivas regionales, generando crecimiento económico local y empleos en la economía naranja.' },
];

const MILESTONES = [
  { year: 'Ene 2026', text: 'Inicio del proyecto en la Universidad de Ibagué' },
  { year: 'Feb 2026', text: 'Investigación con vendedores de El Espinal y Planadas' },
  { year: 'Mar 2026', text: 'Diseño UX/UI y prototipo en Figma aprobado' },
  { year: 'Abr 2026', text: 'Desarrollo de la plataforma: marketplace, canchas, torneos' },
  { year: 'May 2026', text: 'Lanzamiento beta y presentación a la Cámara de Comercio de Ibagué' },
  { year: 'Jun 2026', text: 'Meta: 50 negocios registrados y 500 usuarios activos' },
];

const STATS = [
  { value: '47', label: 'Municipios del Tolima' },
  { value: '5', label: 'Verticales conectadas' },
  { value: '2', label: 'Lados del mercado' },
  { value: '2026', label: 'Beta en el Tolima' },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="primary" className="mb-4">Fundado en Ibagué, Tolima · 2026</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Digitalizando el deporte del Tolima
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Somos un equipo de ingenieros que decidimos resolver un problema real:
              las MIPYMES deportivas del Tolima no tienen acceso a tecnología para vender, reservar y conectar con su comunidad.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-card border border-border rounded-2xl">
                <p className="text-4xl font-bold text-primary mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Propósito del proyecto</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {VALUES.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
                <Card className="h-full p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{title}</h3>
                  <CardContent><p className="text-sm leading-relaxed">{text}</p></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">El Equipo</h2>
            <p className="text-muted-foreground">Ingeniería de Sistemas · Universidad de Ibagué</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TEAM.map(({ name, role, github, avatar, bio }, i) => (
              <motion.div key={name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
                <Card className="text-center p-6 h-full">
                  <img src={avatar} alt={name} className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-primary/10" />
                  <h3 className="font-bold text-lg mb-1">{name}</h3>
                  <p className="text-sm text-primary font-medium mb-3">{role}</p>
                  <CardContent>
                    <p className="text-sm leading-relaxed mb-4">{bio}</p>
                    <a href={github} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-lg px-3 py-1.5">
                      <Github className="w-3.5 h-3.5" /> Ver en GitHub
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-16 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Línea de tiempo del proyecto</h2>
          <div className="space-y-4">
            {MILESTONES.map(({ year, text }, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4">
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">{year}</span>
                </div>
                <div className="flex items-start gap-3 flex-1">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border border-border rounded-2xl p-10">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">¿Tienes un negocio deportivo en Tolima?</h2>
            <p className="text-muted-foreground mb-6">
              Únete a la plataforma y lleva tu negocio al siguiente nivel. Registro gratuito, sin permanencia.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link to="/register"><Button size="lg">Registrar mi negocio <ArrowRight className="w-4 h-4" /></Button></Link>
              <Link to="/contact"><Button size="lg" variant="outline">Hablar con el equipo</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
