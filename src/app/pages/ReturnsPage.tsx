import { motion } from 'motion/react';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, XCircle, Clock, Phone } from 'lucide-react';

export function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="primary" className="mb-4">Legal</Badge>
            <h1 className="text-4xl font-bold mb-3">Política de Devoluciones</h1>
            <p className="text-muted-foreground">Última actualización: 13 de mayo de 2026</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Plazos</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Producto defectuoso', days: '5 días hábiles', color: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Producto diferente al pedido', days: '5 días hábiles', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Cambio de opinión', days: '3 días hábiles', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            ].map(({ label, days, color }) => (
              <div key={label} className={`rounded-xl border p-4 ${color}`}>
                <p className="text-sm font-semibold mb-1">{label}</p>
                <p className="text-xs">{days} desde recepción</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Condiciones para devolución</h2>
          <ul className="space-y-2">
            {[
              'El producto debe estar sin usar y en su empaque original',
              'Debe incluir todos los accesorios y documentos originales',
              'El pedido debe haber sido realizado a través de Tolima Deportes',
              'La solicitud debe realizarse dentro del plazo establecido',
              'Los artículos de higiene personal no son elegibles para devolución',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><XCircle className="w-5 h-5 text-destructive" /> No aplica devolución</h2>
          <ul className="space-y-2">
            {[
              'Productos personalizados o bajo pedido',
              'Artículos de nutrición deportiva ya abiertos',
              'Ropa interior y accesorios de contacto directo con la piel',
              'Productos digitales o suscripciones',
              'Torneos: las cuotas de inscripción no son reembolsables una vez iniciado el evento',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> ¿Cómo iniciar una devolución?</h2>
          <ol className="space-y-3">
            {[
              'Inicia sesión en tu cuenta y ve a "Mis Pedidos"',
              'Selecciona el pedido y haz clic en "Solicitar devolución"',
              'Describe el motivo y adjunta fotos si el producto está defectuoso',
              'El vendedor tiene 48 horas hábiles para aprobar o rechazar la solicitud',
              'Si es aprobada, recibirás instrucciones para el envío de devolución',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            ¿Necesitas ayuda? Contáctanos: sotelo.dev1@gmail.com · +57 320 818 4980
          </p>
        </section>
      </div>
    </div>
  );
}
