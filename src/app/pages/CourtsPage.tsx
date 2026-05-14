import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, MapPin, Star, Calendar, Clock, DollarSign, Filter } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useCourts } from '../hooks/useSupabase';
import { formatCurrency } from '../lib/utils';

export function CourtsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('');

  const sports = ['Fútbol', 'Tenis', 'Baloncesto', 'Voleibol', 'Paddle'];

  const { data: filteredCourts = [], isLoading } = useCourts({
    sport: selectedSport || undefined,
    search: searchQuery || undefined,
  });


  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-blue-500/5 via-primary/5 to-transparent py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-4">Reserva de Canchas</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Encuentra y reserva las mejores canchas deportivas de Tolima
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar por nombre o ubicación..."
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

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-80 bg-secondary animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredCourts.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-muted-foreground mb-4">No se encontraron canchas</p>
            <Button onClick={() => { setSearchQuery(''); setSelectedSport(''); }}>
              Limpiar filtros
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourts.map((court, index) => (
              <motion.div
                key={court.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card hover className="h-full overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <img
                      src={court.images[0]}
                      alt={court.name}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {court.featured && (
                      <Badge variant="accent" className="absolute top-3 left-3">
                        Destacada
                      </Badge>
                    )}
                    <Badge variant="primary" className="absolute top-3 right-3">
                      {court.sport}
                    </Badge>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {court.name}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{court.city}</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {court.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="text-sm ml-1 font-medium">{court.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({court.review_count} reseñas)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {(court.amenities ?? []).slice(0, 3).map((amenity: string) => (
                        <Badge key={amenity} variant="outline" size="sm">
                          {amenity}
                        </Badge>
                      ))}
                      {(court.amenities ?? []).length > 3 && (
                        <Badge variant="outline" size="sm">
                          +{(court.amenities ?? []).length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Desde</p>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(court.price_per_hour)}/h
                        </p>
                      </div>
                      <Link to={`/courts/${court.id}`}>
                        <Button size="sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          Reservar
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
