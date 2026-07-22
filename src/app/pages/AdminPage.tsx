import { useState } from 'react';
import { Wallet, BadgeCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import {
  useVendorsWithBalance, useGeneratePayout,
  useAdminPendingPayouts, useMarkPayoutPaid,
  useAdminCoaches, useVerifyCoach,
} from '../hooks/useSupabase';
import { formatCurrency, formatDate } from '../lib/utils';

type Tab = 'payouts' | 'coaches';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('payouts');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Panel de administración</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Liquidaciones a vendedores y verificación de entrenadores.
        </p>

        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-6 w-fit">
          {([['payouts', 'Liquidaciones'], ['coaches', 'Entrenadores']] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'payouts' && <PayoutsTab />}
        {tab === 'coaches' && <CoachesTab />}
      </div>
    </div>
  );
}

function PayoutsTab() {
  const { data: vendors = [], isLoading } = useVendorsWithBalance();
  const { data: pendingPayouts = [], isLoading: loadingPending } = useAdminPendingPayouts();
  const generatePayout = useGeneratePayout();
  const markPaid = useMarkPayoutPaid();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-semibold mb-3">Saldos por vendedor</h2>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded-xl" />)}</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay vendedores registrados todavía</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map((v: any) => {
              const hasBalance = (v.balance?.net_amount ?? 0) > 0;
              return (
                <Card key={v.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatCurrency(v.balance?.net_amount ?? 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.balance?.order_count ?? 0} pedido{v.balance?.order_count === 1 ? '' : 's'} sin liquidar
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={!hasBalance || generatePayout.isPending}
                      loading={generatePayout.isPending}
                      onClick={() => generatePayout.mutate(v.id)}
                    >
                      Generar liquidación
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Liquidaciones pendientes de pago</h2>
        {loadingPending ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded-xl" />)}</div>
        ) : pendingPayouts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No hay liquidaciones esperando transferencia.</p>
        ) : (
          <div className="space-y-3">
            {pendingPayouts.map((p: any) => (
              <Card key={p.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">{p.profiles?.name ?? 'Vendedor'}</p>
                  <p className="text-xs text-muted-foreground">
                    Generada el {formatDate(p.created_at)} · Bruto {formatCurrency(p.gross_amount)} · Comisión {formatCurrency(p.commission_amount)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-primary">{formatCurrency(p.net_amount)}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={markPaid.isPending}
                    onClick={() => markPaid.mutate(p.id)}
                  >
                    Marcar como pagada
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CoachesTab() {
  const { data: coaches = [], isLoading } = useAdminCoaches();
  const verifyCoach = useVerifyCoach();

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded-xl" />)}</div>;
  }

  if (coaches.length === 0) {
    return (
      <div className="text-center py-16">
        <BadgeCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No hay entrenadores registrados todavía</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {coaches.map((c: any) => (
        <Card key={c.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img
              src={c.profiles?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profiles?.email}`}
              alt=""
              className="w-10 h-10 rounded-full object-cover bg-secondary"
            />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                {c.profiles?.name ?? 'Entrenador'}
                {c.verified && <Badge variant="success" size="sm"><BadgeCheck className="w-3 h-3 mr-1" />Verificado</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">{(c.specialties ?? []).join(', ') || 'Sin especialidades'}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant={c.verified ? 'outline' : 'primary'}
            loading={verifyCoach.isPending}
            onClick={() => verifyCoach.mutate({ coachId: c.id, verified: !c.verified })}
          >
            {c.verified ? 'Quitar verificación' : 'Verificar'}
          </Button>
        </Card>
      ))}
    </div>
  );
}
