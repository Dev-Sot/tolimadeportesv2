import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Star, Award, Clock, DollarSign } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useCoaches } from '../hooks/useSupabase';
import { mockCoaches } from '../lib/mockData';
import { formatCurrency } from '../lib/utils';

export function CoachesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  const specialties = ['Fútbol', 'Tenis', 'Gimnasio', 'Baloncesto', 'Natación'];

  const { data: rawCoaches = [], isLoading } = useCoaches({
    specialty: selectedSpecialty || undefined,
    search: searchQuery || undefined,
  });

  const filteredCoaches = rawCoaches.length > 0 ? rawCoaches : mockCoaches;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-4">Entrenadores Profesionales</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Encuentra el entrenador perfecto para alcanzar tus metas deportivas
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar entrenadores o especialidades..."
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
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedSpecialty('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSpecialty === ''
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            Todas las Especialidades
          </button>
          {specialties.map((specialty: string) => (
            <button
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSpecialty === specialty
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>

        {filteredCoaches.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-muted-foreground mb-4">No se encontraron entrenadores</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('');
              }}
            >
              Limpiar filtros
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoaches.map((coach, index) => (
              <motion.div
                key={coach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={(coach.profiles?.avatar ?? coach.user?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=coach`)}
                        alt={(coach.profiles?.name ?? coach.user?.name ?? "Entrenador")}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                          {(coach.profiles?.name ?? coach.user?.name ?? "Entrenador")}
                        </h3>
                        {coach.featured && (
                          <Badge variant="accent" size="sm" className="mb-2">
                            <Award className="w-3 h-3 mr-1" />
                            Destacado
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span className="text-sm font-medium">{coach.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({coach.review_count})
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {coach.bio}
                    </p>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Especialidades</p>
                      <div className="flex flex-wrap gap-1">
                        {(coach.specialties ?? []).map((specialty: string) => (
                          <Badge key={specialty} variant="outline" size="sm">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Certificaciones</p>
                      <div className="space-y-1">
                        {(coach.certifications ?? []).slice(0, 2).map((cert: string) => (
                          <div key={cert} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Award className="w-3 h-3" />
                            <span className="line-clamp-1">{cert}</span>
                          </div>
                        ))}
                        {(coach.certifications ?? []).length > 2 && (
                          <p className="text-xs text-muted-foreground ml-5">
                            +{(coach.certifications ?? []).length - 2} más
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 pb-4 border-t border-border pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>Tarifa por hora</span>
                        </div>
                        <span className="font-semibold text-primary">
                          {formatCurrency(coach.hourly_rate)}
                        </span>
                      </div>
                    </div>

                    <Link to={`/coaches/${coach.id}`}>
                      <Button fullWidth>Ver Perfil Completo</Button>
                    </Link>
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
