import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useIsPro } from '../../hooks/useSupabase';

interface Props {
  /** Solo el marketplace cobra comisión hoy — canchas, torneos y sesiones de
   *  entrenador se pagan en persona, así que mostrar "Comisión 8%" ahí sería
   *  un dato falso. Ver AUDIT.md. */
  showCommission?: boolean;
}

/** Muestra el plan activo de la cuenta y un CTA de upgrade si está en el plan
 *  gratuito. Se usa en el header de cada dashboard de negocio (vendedor,
 *  cancha, organizador, entrenador). */
export function PlanStatus({ showCommission = false }: Props) {
  const isPro = useIsPro();

  if (isPro) {
    return (
      <Badge variant="primary" size="sm" className="gap-1">
        <Sparkles className="w-3 h-3" aria-hidden="true" /> Plan Pro
      </Badge>
    );
  }

  return (
    <Link
      to="/pricing"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
    >
      {showCommission ? 'Plan gratuito · Comisión 8%' : 'Plan gratuito'}
      <span className="font-semibold text-primary">Mejorar a Pro →</span>
    </Link>
  );
}
