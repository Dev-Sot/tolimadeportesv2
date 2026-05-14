import { motion } from 'motion/react';
import { Badge } from '../components/ui/Badge';

const SECTIONS = [
  { title: '1. Aceptación de los términos', body: 'Al acceder y usar la plataforma Tolima Deportes (en adelante "la Plataforma"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte, no podrá acceder al servicio.' },
  { title: '2. Descripción del servicio', body: 'Tolima Deportes es una plataforma SaaS que facilita la compra y venta de equipamiento deportivo, la reserva de canchas deportivas, la inscripción a torneos y la conexión entre usuarios en el departamento del Tolima, Colombia.' },
  { title: '3. Registro y cuentas', body: 'Para acceder a ciertas funciones, debe registrarse con información veraz. Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta. Notifíquenos inmediatamente cualquier uso no autorizado.' },
  { title: '4. Uso aceptable', body: 'Está prohibido usar la Plataforma para actividades ilegales, publicar contenido falso o engañoso, realizar pagos fraudulentos, acosar a otros usuarios o infringir derechos de propiedad intelectual.' },
  { title: '5. Transacciones y pagos', body: 'Los pagos se procesan a través de Wompi (Bancolombia). Tolima Deportes actúa como intermediario y no almacena datos de tarjetas. Los precios están en pesos colombianos (COP) e incluyen IVA del 19% cuando aplique.' },
  { title: '6. Política de devoluciones', body: 'Los compradores tienen hasta 5 días hábiles tras recibir el pedido para solicitar devoluciones por productos defectuosos o que no correspondan a la descripción. Las devoluciones deben gestionarse directamente con el vendedor a través de la plataforma.' },
  { title: '7. Reservas de canchas', body: 'Las cancelaciones de reservas deben realizarse con al menos 24 horas de anticipación. Cancelaciones tardías pueden estar sujetas a penalidades según la política de cada instalación.' },
  { title: '8. Limitación de responsabilidad', body: 'Tolima Deportes no garantiza la disponibilidad ininterrumpida del servicio. No nos hacemos responsables por daños indirectos derivados del uso de la plataforma o de transacciones entre usuarios.' },
  { title: '9. Modificaciones', body: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones serán notificadas por email y serán efectivas 15 días después de su publicación.' },
  { title: '10. Contacto', body: 'Para preguntas sobre estos términos, contáctenos en sotelo.dev1@gmail.com o al +57 320 818 4980. Universidad de Ibagué, Carrera 22 Calle 67, Ibagué, Tolima, Colombia.' },
];

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="primary" className="mb-4">Legal</Badge>
            <h1 className="text-4xl font-bold mb-3">Términos y Condiciones</h1>
            <p className="text-muted-foreground">Última actualización: 13 de mayo de 2026</p>
          </motion.div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8">
          {SECTIONS.map(({ title, body }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <h2 className="text-lg font-semibold mb-3">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
