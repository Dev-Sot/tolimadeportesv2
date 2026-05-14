import { Link } from 'react-router-dom';
import { Trophy, Mail, Phone, MapPin, Github, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  const cols = [
    {
      title: 'Marketplace',
      links: [
        { name: 'Todos los productos', href: '/marketplace' },
        { name: 'Fútbol', href: '/marketplace?category=Fútbol' },
        { name: 'Tenis', href: '/marketplace?category=Tenis' },
        { name: 'Gimnasio', href: '/marketplace?category=Gimnasio' },
      ],
    },
    {
      title: 'Servicios',
      links: [
        { name: 'Reserva de Canchas', href: '/courts' },
        { name: 'Torneos', href: '/tournaments' },
        { name: 'Entrenadores', href: '/coaches' },
        { name: 'Comunidad', href: '/community' },
      ],
    },
    {
      title: 'Empresa',
      links: [
        { name: 'Sobre Nosotros', href: '/about' },
        { name: 'Contacto', href: '/contact' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Blog', href: '/blog' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Términos y Condiciones', href: '/terms' },
        { name: 'Política de Privacidad', href: '/privacy' },
        { name: 'Política de Devoluciones', href: '/returns' },
      ],
    },
  ];

  const team = [
    { name: 'Nelson Garzón', github: 'https://github.com/Dev-Sot' },
    { name: 'Misael Gallo', github: 'https://github.com/Milan32555' },
    { name: 'Alejandro Marín', github: 'https://github.com/AlejoM09' },
  ];

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/marketplace" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Tolima Deportes</p>
                <p className="text-xs text-muted-foreground">Ibagué · Colombia</p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-xs">
              La plataforma deportiva SaaS #1 del Tolima. Conectamos atletas, vendedores, organizadores y entrenadores en un solo ecosistema digital.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://github.com/Dev-Sot" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground">
                <Github className="w-4 h-4" />
              </a>
            </div>
            {/* Team */}
            <p className="text-xs font-medium text-muted-foreground mb-2">Desarrollado por:</p>
            <div className="space-y-1">
              {team.map((m) => (
                <a key={m.name} href={m.github} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group">
                  <Github className="w-3 h-3 group-hover:text-primary" />
                  {m.name}
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Universidad de Ibagué · Ing. de Sistemas · 2026</p>
          </div>

          {/* Nav columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.name}>
                    <Link to={l.href}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Ibagué, Tolima, Colombia</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> +57 320 818 4980</span>
            <a href="mailto:sotelo.dev1@gmail.com" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail className="w-3.5 h-3.5 text-primary" /> sotelo.dev1@gmail.com
            </a>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            &copy; {year} Tolima Deportes · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
