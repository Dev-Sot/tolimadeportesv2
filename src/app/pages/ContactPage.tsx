import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Github, Send, CheckCircle2, MessageCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { toast } from 'sonner';

const TEAM = [
  { name: 'Nelson Garzón', role: 'Tech Lead', github: 'https://github.com/Dev-Sot', seed: 'nelson' },
  { name: 'Misael Gallo', role: 'UI/Frontend', github: 'https://github.com/Milan32555', seed: 'misael' },
  { name: 'Alejandro Marín', role: 'Backend/DevOps', github: 'https://github.com/AlejoM09', seed: 'alejandro' },
];

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    setLoading(true);
    // Simulate send — in production connect to EmailJS or Supabase Edge Function
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
    toast.success('Mensaje enviado. Te responderemos pronto.');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b border-border py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="primary" className="mb-4">Contacto</Badge>
            <h1 className="text-4xl font-bold mb-4">Hablemos</h1>
            <p className="text-xl text-muted-foreground">¿Tienes preguntas, sugerencias o quieres unir tu negocio a la plataforma?</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">¡Mensaje enviado!</h2>
                <p className="text-muted-foreground mb-6">Nos comunicaremos contigo en menos de 24 horas.</p>
                <Button onClick={() => { setSent(false); setForm({ name:'',email:'',subject:'',message:'' }); }} variant="outline">Enviar otro mensaje</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-6">Envíanos un mensaje</h2>
                {[
                  { label: 'Nombre completo *', key: 'name', type: 'text', placeholder: 'Tu nombre' },
                  { label: 'Email *', key: 'email', type: 'email', placeholder: 'tu@email.com' },
                  { label: 'Asunto', key: 'subject', type: 'text', placeholder: 'Ej: Quiero registrar mi negocio' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-sm font-medium mb-1 block">{label}</label>
                    <input type={type} value={(form as any)[key]} placeholder={placeholder}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium mb-1 block">Mensaje *</label>
                  <textarea value={form.message} rows={5} placeholder="Cuéntanos cómo podemos ayudarte..."
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <Button type="submit" fullWidth size="lg" loading={loading} disabled={loading}>
                  <Send className="w-4 h-4" /> Enviar mensaje
                </Button>
              </form>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-5">Información de contacto</h2>
              <div className="space-y-4">
                {[
                  { icon: MapPin, label: 'Ubicación', value: 'Universidad de Ibagué, Carrera 22 Calle 67, Ibagué, Tolima' },
                  { icon: Phone, label: 'Teléfono', value: '+57 320 818 4980' },
                  { icon: Mail, label: 'Email', value: 'sotelo.dev1@gmail.com' },
                  { icon: Clock, label: 'Horario', value: 'Lunes a Viernes, 8:00 am – 6:00 pm' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium mb-4">Equipo de desarrollo</p>
              <div className="space-y-3">
                {TEAM.map(({ name, role, github, seed }) => (
                  <div key={name} className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={name} className="w-10 h-10 rounded-full border-2 border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                    <a href={github} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground">
                      <Github className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-primary/5 border-primary/20 p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <CardContent className="p-0">
                  <p className="text-sm font-medium text-foreground mb-1">¿Tienes un negocio deportivo?</p>
                  <p className="text-xs text-muted-foreground">Regístrate como vendedor, dueño de cancha u organizador de torneos. El registro es completamente gratuito.</p>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
