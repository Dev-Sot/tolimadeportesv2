import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

const FAQS = [
  { cat: 'General', q: '¿Qué es Tolima Deportes?', a: 'Tolima Deportes es una plataforma SaaS deportiva que conecta atletas, vendedores, organizadores de torneos, dueños de canchas y entrenadores en el departamento del Tolima, Colombia. Puedes comprar equipamiento, reservar canchas, inscribirte en torneos y unirte a la comunidad deportiva regional.' },
  { cat: 'General', q: '¿Es gratuito registrarse?', a: 'Sí. El registro para usuarios es completamente gratuito. Los vendedores y dueños de canchas pagan una pequeña comisión por transacción completada, sin costos mensuales fijos.' },
  { cat: 'General', q: '¿En qué municipios del Tolima opera la plataforma?', a: 'La plataforma está disponible para los 47 municipios del Tolima. Actualmente tenemos mayor concentración en Ibagué, El Espinal, Espinal, Honda, Melgar, Planadas y El Líbano. Estamos expandiéndonos activamente.' },
  { cat: 'Marketplace', q: '¿Cómo compro un producto?', a: 'Navega el Marketplace, agrega productos al carrito, procede al checkout ingresando tu dirección de envío y paga con tarjeta crédito/débito vía Wompi, PSE o contra entrega. Recibirás confirmación por email.' },
  { cat: 'Marketplace', q: '¿Cómo vendo mis productos en la plataforma?', a: 'Regístrate seleccionando el rol "Vendedor". Una vez activo, puedes subir tus productos con fotos, precio, descripción y stock. La Asociación de Productores de Café de Planadas y artesanos de La Chamba ya están registrados.' },
  { cat: 'Marketplace', q: '¿Cuánto tarda el envío?', a: 'El tiempo de entrega varía según el vendedor y tu ubicación. En Ibagué, los envíos locales tardan 1-2 días hábiles. Para municipios del Tolima, 2-4 días hábiles. Los envíos mayores a $100.000 COP son gratuitos.' },
  { cat: 'Pagos', q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjeta crédito/débito (Visa, Mastercard, Amex) vía Wompi, PSE (débito bancario directo a cualquier banco colombiano), y pago contra entrega en efectivo.' },
  { cat: 'Pagos', q: '¿Es seguro pagar en Tolima Deportes?', a: 'Sí. Los pagos en línea son procesados por Wompi, la plataforma oficial de Bancolombia, con encriptación SSL de grado bancario. Nunca almacenamos datos de tarjetas.' },
  { cat: 'Canchas', q: '¿Cómo reservo una cancha?', a: 'Ve a la sección Canchas, selecciona el deporte y la cancha de tu interés, elige la fecha y la franja horaria disponible, confirma la reserva y paga en línea. Recibirás un comprobante por email.' },
  { cat: 'Canchas', q: '¿Puedo cancelar una reserva?', a: 'Sí. Puedes cancelar hasta 24 horas antes de la reserva sin cargos. Cancelaciones con menos de 24 horas pueden estar sujetas a una penalidad del 20% según la política del dueño de la cancha.' },
  { cat: 'Torneos', q: '¿Cómo me inscribo en un torneo?', a: 'Ve a Torneos, selecciona el evento de tu interés, revisa los requisitos y haz clic en "Inscribirme". Puedes ingresar el nombre de tu equipo. Si el torneo tiene cuota de inscripción, se paga en línea.' },
  { cat: 'Torneos', q: '¿Puedo organizar mi propio torneo?', a: 'Sí. Regístrate con el rol "Organizador", completa la verificación y podrás crear torneos indicando fechas, cupos, precio de inscripción, sede y premios.' },
  { cat: 'Cuenta', q: '¿Olvidé mi contraseña, qué hago?', a: 'En la pantalla de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?". Ingresa tu email registrado y recibirás un enlace de recuperación en tu correo electrónico.' },
  { cat: 'Cuenta', q: '¿Puedo tener múltiples roles?', a: 'Actualmente cada cuenta tiene un rol principal. Si eres atleta y también tienes una cancha, te recomendamos crear cuentas separadas. Estamos trabajando en soporte multi-rol para próximas versiones.' },
];

const CATS = ['Todos', ...Array.from(new Set(FAQS.map(f => f.cat)))];

export function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Todos');

  const filtered = FAQS.filter(f =>
    (cat === 'Todos' || f.cat === cat) &&
    (f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="primary" className="mb-4">Preguntas frecuentes</Badge>
            <h1 className="text-4xl font-bold mb-4">¿En qué podemos ayudarte?</h1>
            <div className="relative mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar en preguntas frecuentes..."
                className="w-full pl-12 pr-4 py-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No encontramos resultados para tu búsqueda.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" size="sm">{faq.cat}</Badge>
                      <span className="font-medium text-sm">{faq.q}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {open === i && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-border">
                        <p className="p-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
