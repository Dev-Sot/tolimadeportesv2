import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Trophy, Calendar, MapPin, Users, DollarSign, Clock } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useTournaments } from '../hooks/useSupabase';
import { formatCurrency, formatDate } from '../lib/utils';

export function TournamentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const sports = ['Fútbol', 'Tenis', 'Baloncesto', 'Voleibol'];
  const statuses = [
    { value: 'upcoming', label: 'Próximos' },
    { value: 'ongoing', label: 'En Curso' },
    { value: 'completed', label: 'Finalizados' },
  ];

  const { data: filteredTournaments = [], isLoading } = useTournaments({
    sport: selectedSport || undefined,
    status: selectedStatus || undefined,
    search: searchQuery || undefined,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="info">Próximo</Badge>;
      case 'ongoing':
        return <Badge variant="success">En Curso</Badge>;
      case 'completed':
        return <Badge variant="default">Finalizado</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-accent/5 via-primary/5 to-transparent py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4">
              <h1 className="text-4xl font-bold">Torneos Deportivos</h1>
              <p className="text-muted-foreground">Compite y gana en Tolima</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar torneos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                  className="bg-background"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div>
            <p className="text-sm font-medium mb-2">Deporte</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSport('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSport === ''
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                Todos
              </button>
              {sports.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSport === sport
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Estado</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedStatus('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === ''
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                Todos
              </button>
              {statuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === status.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-secondary animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-muted-foreground mb-4">No se encontraron torneos</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedSport('');
                setSelectedStatus('');
              }}
            >
              Limpiar filtros
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card hover className="h-full overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <img
                      src={tournament.image}
                      alt={tournament.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {tournament.featured && (
                      <Badge variant="accent" className="absolute top-3 left-3">
                        Destacado
                      </Badge>
                    )}
                    <div className="absolute top-3 right-3">{getStatusBadge(tournament.status)}</div>
                  </div>

                  <div className="p-4">
                    <Badge variant="primary" size="sm" className="mb-2">
                      {tournament.sport}
                    </Badge>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {tournament.name}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {tournament.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(tournament.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="line-clamp-1">{tournament.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {tournament.current_participants} / {tournament.max_participants}{' '}
                          participantes
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={(tournament.profiles?.avatar ?? tournament.organizer?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=org`)}
                        alt={(tournament.profiles?.name ?? tournament.organizer?.name ?? 'Organizador')}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-muted-foreground">
                        {(tournament.profiles?.name ?? tournament.organizer?.name ?? 'Organizador')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Inscripción</p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(tournament.entry_fee)}
                        </p>
                      </div>
                      <Link to={`/tournaments/${tournament.id}`}>
                        <Button
                          size="sm"
                          disabled={
                            tournament.status === 'completed' ||
                            tournament.current_participants >= tournament.max_participants
                          }
                        >
                          Ver Detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}