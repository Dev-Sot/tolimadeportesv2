import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Trophy, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleForgotPassword() {
    if (!email) { toast.error('Ingresa tu correo primero'); return; }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
      toast.success('Revisa tu correo para restablecer la contraseña');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar el correo');
    } finally {
      setResetting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas');
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left hero panel */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent/80 to-primary" />
        <img
          src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200"
          alt=""
          className="w-full h-full object-cover mix-blend-overlay opacity-40"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto mb-6 flex items-center justify-center">
              <img
                src="/DeportesTolima.png"
                alt="Tolima Deportes"
                style={{ height: '120px', width: 'auto' }}
                className="object-contain"
              />
            </div>
            <h2 className="text-4xl font-bold mb-3">Tolima Deportes</h2>
            <p className="text-white/80 text-lg max-w-xs leading-relaxed">
              La plataforma deportiva #1 del Tolima. Marketplace, canchas, torneos y comunidad.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Back link */}
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al marketplace
          </Link>

          {/* Mobile logo */}
          <div className="flex items-center justify-center lg:hidden mb-8">
            <img
              src="/DeportesTolima.png"
              alt="Tolima Deportes"
              style={{ height: '60px', width: 'auto' }}
              className="object-contain"
            />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Bienvenido</h1>
            <p className="text-muted-foreground">Ingresa a tu cuenta para continuar</p>
          </div>

          {error && (
            <motion.div
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm mb-5"
            >
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p>{error}</p>
                  {error.includes('confirmar') && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      Si no recibiste el email, contacta al administrador o intenta con otra cuenta.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="text-sm font-medium mb-1.5 block">
                Correo electrónico
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                value={email}
                placeholder="tu@correo.com"
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" aria-hidden="true" />}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-sm font-medium">
                  Contraseña
                </label>
                <button
                  type="button"
                  disabled={resetting}
                  aria-busy={resetting || undefined}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                  onClick={handleForgotPassword}
                >
                  {resetting ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" aria-hidden="true" />}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-controls="login-password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                    : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isLoading}
              disabled={isLoading || !email || !password}
            >
              Iniciar Sesión
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}