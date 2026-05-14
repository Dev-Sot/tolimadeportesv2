import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell, BellOff, Check, Package, Calendar, Trophy, Star, MessageCircle, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useSupabase';
import { formatRelativeTime } from '../lib/utils';

const TYPE_ICONS: Record<string, any> = {
  order: Package, reservation: Calendar, tournament: Trophy,
  review: Star, comment: MessageCircle, like: Heart, system: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  order:       'bg-green-100 text-green-600 dark:bg-green-950',
  reservation: 'bg-blue-100  text-blue-600  dark:bg-blue-950',
  tournament:  'bg-yellow-100 text-yellow-600 dark:bg-yellow-950',
  review:      'bg-purple-100 text-purple-600 dark:bg-purple-950',
  comment:     'bg-pink-100  text-pink-600  dark:bg-pink-950',
  like:        'bg-red-100   text-red-600   dark:bg-red-950',
  system:      'bg-gray-100  text-gray-600  dark:bg-gray-800',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll  = useMarkAllNotificationsRead();

  const unread = notifications.filter((n: any) => !n.read).length;

  function handleClick(n: any) {
    if (!n.read) markRead.mutate(n.id);
    if (n.link)  navigate(n.link);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Notificaciones
            {unread > 0 && <Badge variant="destructive">{unread} nuevas</Badge>}
          </h1>
          {unread > 0 && (
            <Button
              variant="outline" size="sm"
              onClick={() => markAll.mutate()}
              loading={markAll.isPending}
            >
              <Check className="w-4 h-4" /> Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-secondary animate-pulse rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && notifications.length === 0 && (
          <div className="text-center py-20">
            <BellOff className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin notificaciones</h3>
            <p className="text-muted-foreground">
              Aquí aparecerán tus pedidos, reservas, torneos y más
            </p>
          </div>
        )}

        {/* List */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((n: any, i: number) => {
              const Icon       = TYPE_ICONS[n.type]  ?? Bell;
              const colorClass = TYPE_COLORS[n.type] ?? TYPE_COLORS.system;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      n.read
                        ? 'border-border bg-card opacity-70 hover:opacity-100'
                        : 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(n.created_at)}
                          </span>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
