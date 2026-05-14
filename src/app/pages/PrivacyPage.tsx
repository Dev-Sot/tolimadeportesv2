import { motion } from 'motion/react';
import { Badge } from '../components/ui/Badge';

const SECTIONS = [
  { title: '1. Información que recopilamos', body: 'Recopilamos información que usted nos proporciona directamente: nombre, email, teléfono, dirección, rol en la plataforma y datos de perfil. También recopilamos automáticamente datos de uso, dirección IP, tipo de dispositivo y cookies de sesión.' },
  { title: '2. Uso de la información', body: 'Usamos sus datos para: proveer y mejorar el servicio, procesar transacciones, enviar notificaciones relacionadas con su cuenta, personalizar su experiencia y cumplir obligaciones legales. Nunca vendemos sus datos a terceros.' },
  { title: '3. Almacenamiento y seguridad', body: 'Sus datos se almacenan en servidores de Supabase (PostgreSQL cifrado) en la región us-east-1. Aplicamos cifrado AES-256 en reposo y TLS 1.3 en tránsito. Los datos de pago son manejados exclusivamente por Wompi/Bancolombia y no los almacenamos.' },
  { title: '4. Cookies', body: 'Usamos cookies esenciales para sesión de usuario y cookies analíticas anónimas para mejorar el servicio. Puede desactivar las cookies en su navegador, aunque esto puede afectar la funcionalidad de la plataforma.' },
  { title: '5. Compartición de datos', body: 'Compartimos datos únicamente con: procesadores de pago (Wompi/Bancolombia), servicios de infraestructura (Supabase, Vercel) y cuando sea requerido por ley. Todos los terceros están sujetos a acuerdos de confidencialidad.' },
  { title: '6. Sus derechos', body: 'Tiene derecho a acceder, corregir o eliminar sus datos personales. Para ejercer estos derechos, contáctenos en sotelo.dev1@gmail.com. Procesaremos su solicitud en un plazo de 15 días hábiles.' },
  { title: '7. Contacto', body: 'Responsable del tratamiento: Equipo Tolima Deportes, Universidad de Ibagué, Carrera 22 Calle 67, Ibagué, Tolima, Colombia. Email: sotelo.dev1@gmail.com. Teléfono: +57 320 818 4980.' },
];

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="primary" className="mb-4">Legal</Badge>
            <h1 className="text-4xl font-bold mb-3">Política de Privacidad</h1>
            <p className="text-muted-foreground">Última actualización: 13 de mayo de 2026</p>
          </motion.div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {SECTIONS.map(({ title, body }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <h2 className="text-lg font-semibold mb-3">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
