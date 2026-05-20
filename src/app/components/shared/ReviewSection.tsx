import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useReviews, useCreateReview } from '../../hooks/useSupabase';
import { useAuthStore } from '../../stores/authStore';
import { formatRelativeTime } from '../../lib/utils';

interface Props {
  targetId: string;
  targetType: 'product' | 'court' | 'coach' | 'tournament';
}

export function ReviewSection({ targetId, targetType }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { data: reviews = [], isLoading } = useReviews(targetId, targetType);
  const create = useCreateReview();
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const RATING_LABELS: Record<number, string> = {
    1: 'Muy malo', 2: 'Malo', 3: 'Regular', 4: 'Bueno', 5: 'Excelente',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    await create.mutateAsync({ target_id: targetId, target_type: targetType, rating, comment });
    setComment('');
    setRating(3);
    setShowForm(false);
  }

  const avg = reviews.length
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Reseñas
            {avg && (
              <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <Star className="w-4 h-4 fill-accent text-accent" />{avg} ({reviews.length})
              </span>
            )}
          </CardTitle>
          {isAuthenticated && !showForm && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              Dejar reseña
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <fieldset>
              <div className="flex items-center justify-between mb-2">
                <legend className="text-sm font-medium">Calificación</legend>
                <span className="text-sm text-accent font-medium" aria-live="polite">{RATING_LABELS[rating]}</span>
              </div>
              <div className="flex gap-1.5" role="group">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'} — ${RATING_LABELS[star]}`}
                    aria-pressed={rating >= star}
                    className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    <Star
                      aria-hidden="true"
                      className={`w-8 h-8 transition-colors ${
                        rating >= star ? 'fill-accent text-accent' : 'text-muted-foreground/40 hover:text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="review-comment" className="text-sm font-medium mb-1 block">Comentario</label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Cuéntanos tu experiencia..."
                className="w-full px-3 py-2 border border-input rounded-lg bg-input-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm" loading={create.isPending} disabled={!comment.trim()}>
                Publicar reseña
              </Button>
            </div>
          </motion.form>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1,2].map((i) => <div key={i} className="h-16 bg-secondary animate-pulse rounded-lg" />)}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aún no hay reseñas. ¡Sé el primero!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  <img
                    src={review.profiles?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`}
                    alt={`Avatar de ${review.profiles?.name ?? 'usuario'}`}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{review.profiles?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(review.created_at)}</p>
                    </div>
                    <div
                      className="flex mb-2"
                      role="img"
                      aria-label={`Calificación: ${review.rating} de 5 estrellas`}
                    >
                      {[1,2,3,4,5].map((s) => (
                        <Star aria-hidden="true" key={s} className={`w-3 h-3 ${review.rating >= s ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
