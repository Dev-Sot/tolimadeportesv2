import { Link } from 'react-router-dom';
import { Mail, MapPin, Github, Instagram, Linkedin } from 'lucide-react';

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
        { name: 'Precios', href: '/pricing' },
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

  return (
    <footer role="contentinfo" className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/marketplace" className="inline-flex items-center gap-3 mb-4" aria-label="Canchazo — Ir al inicio">
              <img
                src="/DeportesTolima.png"
                alt="Canchazo"
                className="object-contain"
                style={{ height: '180px', width: '180px' }}
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-xs">
              El sistema operativo del deporte local. Conectamos atletas, vendedores, dueños de cancha, organizadores y entrenadores en un solo ecosistema digital.
            </p>

            {/* Social links */}
            <nav aria-label="Redes sociales" className="flex items-center gap-2 mb-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Canchazo (abre en nueva pestaña)"
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn de Canchazo (abre en nueva pestaña)"
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground"
              >
                <Linkedin className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/Dev-Sot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub del proyecto (abre en nueva pestaña)"
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors text-muted-foreground"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
              </a>
            </nav>
          </div>

          {/* Nav columns */}
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-semibold mb-3">{col.title}</h2>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.name}>
                    <Link
                      to={l.href}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <address className="not-italic flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Ibagué, Tolima, Colombia
            </span>
            <Link
              to="/contact"
              aria-label="Ir a la página de contacto"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Contáctanos
            </Link>
          </address>
          <p className="text-xs text-muted-foreground text-center">
            &copy; {year} Canchazo · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
