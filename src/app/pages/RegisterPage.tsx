import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Trophy,
  ShoppingBag,
  Users,
  MapPin,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState('');

  const roles = [
    {
      value: 'customer' as UserRole,
      label: 'Cliente',
      description: 'Compra productos, reserva canchas y participa en torneos',
      icon: UserIcon,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      value: 'vendor' as UserRole,
      label: 'Vendedor',
      description: 'Vende productos deportivos y gestiona tu tienda',
      icon: ShoppingBag,
      color: 'from-primary to-emerald-600',
    },
    {
      value: 'coach' as UserRole,
      label: 'Entrenador',
      description: 'Ofrece servicios de entrenamiento y coaching',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
    },
    {
      value: 'court_owner' as UserRole,
      label: 'Dueño de Cancha',
      description: 'Administra canchas y recibe reservas',
      icon: MapPin,
      color: 'from-orange-500 to-red-500',
    },
    {
      value: 'organizer' as UserRole,
      label: 'Organizador',
      description: 'Crea y gestiona torneos deportivos',
      icon: Calendar,
      color: 'from-accent to-yellow-500',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await register(email, password, name, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-primary to-accent" />
        <div className="absolute inset-0 bg-black/20" />
        <img
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200"
          alt="Deporte"
          className="w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex items-center justify-center">
              <img
                src="/DeportesTolima.png"
                alt="Tolima Deportes"
                style={{ height: '120px', width: 'auto' }}
                className="object-contain"
              />
            </div>
            <h1 className="text-5xl font-bold mb-4">Únete a nosotros</h1>
            <p className="text-xl text-white/90 max-w-md mb-8">
              Forma parte de la comunidad deportiva más grande de Tolima
            </p>
            <div className="space-y-3 max-w-sm mx-auto text-left">
              {[
                'Acceso a productos exclusivos',
                'Reserva de canchas en tiempo real',
                'Participa en torneos',
                'Conecta con la comunidad',
              ].map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Crear cuenta</h2>
            <p className="text-muted-foreground">
              {step === 1 ? 'Selecciona tu tipo de cuenta' : 'Completa tus datos'}
            </p>
          </div>

          <div
            className="flex items-center gap-2 mb-8"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={2}
            aria-label={`Paso ${step} de 2: ${step === 1 ? 'Selecciona tu tipo de cuenta' : 'Completa tus datos'}`}
          >
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-secondary'}`} aria-hidden="true" />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-secondary'}`} aria-hidden="true" />
          </div>

          {error && (
            <motion.div
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          {step === 1 ? (
            <div>
              <div
                className="grid md:grid-cols-2 gap-4 mb-4"
                role="radiogroup"
                aria-labelledby="role-selection-label"
              >
                <p id="role-selection-label" className="sr-only">Selecciona tu tipo de cuenta</p>
                {roles.map((roleOption) => (
                  <Card
                    key={roleOption.value}
                    onClick={() => setRole(roleOption.value)}
                    role="radio"
                    aria-checked={role === roleOption.value}
                    aria-label={`${roleOption.label}: ${roleOption.description}`}
                    className={`cursor-pointer transition-all p-4 ${
                      role === roleOption.value
                        ? 'border-2 border-primary ring-2 ring-primary/20'
                        : 'border border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${roleOption.color} flex items-center justify-center`} aria-hidden="true">
                        <roleOption.icon className="w-6 h-6 text-white" />
                      </div>
                      {role === roleOption.value && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center" aria-hidden="true">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{roleOption.label}</h3>
                    <p className="text-sm text-muted-foreground">{roleOption.description}</p>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mb-6">
                Puedes agregar más roles desde tu perfil después de registrarte.
              </p>
              <Button onClick={() => setStep(2)} fullWidth size="lg">
                Continuar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="register-name"
                name="name"
                type="text"
                label="Nombre Completo"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<UserIcon className="w-5 h-5" aria-hidden="true" />}
                required
                autoComplete="name"
              />
              <Input
                id="register-email"
                name="email"
                type="email"
                label="Correo Electrónico"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" aria-hidden="true" />}
                required
                autoComplete="email"
              />
              <Input
                id="register-password"
                name="password"
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" aria-hidden="true" />}
                required
                autoComplete="new-password"
              />
              <Input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                label="Confirmar Contraseña"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" aria-hidden="true" />}
                required
                autoComplete="new-password"
              />
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  id="accept-terms"
                  type="checkbox"
                  required
                  aria-required="true"
                  className="mt-1 rounded border-border focus-visible:ring-2 focus-visible:ring-ring"
                />
                <label htmlFor="accept-terms">
                  Acepto los{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    términos y condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    política de privacidad
                  </Link>
                </label>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} fullWidth>
                  Atrás
                </Button>
                <Button type="submit" loading={isLoading} fullWidth size="lg">
                  Crear Cuenta
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}