import { Trophy } from 'lucide-react';

interface RawMatch {
  round: number;
  match_index: number;
  participant_a_id: string | null;
  participant_b_id: string | null;
  winner_id: string | null;
}

interface Participant {
  id: string;
  name: string;
}

interface Props {
  matches: RawMatch[];
  participants: Participant[];
  /** Si se pasa, los partidos con ambos rivales definidos y sin ganador
   *  muestran un botón para elegir ganador (vista de organizador). Si se
   *  omite, el bracket es de solo lectura (vista pública). */
  onRecordResult?: (round: number, matchIndex: number, winnerId: string) => void;
  loading?: boolean;
}

export function Bracket({ matches, participants, onRecordResult, loading }: Props) {
  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Aún no se ha generado el bracket.</p>;
  }

  const nameOf = (id: string | null) => {
    if (!id) return null;
    return participants.find((p) => p.id === id)?.name ?? 'Participante';
  };

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <div className="flex gap-6 overflow-x-auto pb-2">
      {rounds.map((round) => {
        const roundMatches = matches
          .filter((m) => m.round === round)
          .sort((a, b) => a.match_index - b.match_index);
        const isFinal = round === rounds[rounds.length - 1];

        return (
          <div key={round} className="flex flex-col gap-4 min-w-[220px] shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              {isFinal && <Trophy className="w-3.5 h-3.5 text-accent" />}
              {isFinal ? 'Final' : `Ronda ${round}`}
            </p>
            <div className="flex flex-col gap-3 flex-1 justify-around">
              {roundMatches.map((m) => {
                const nameA = nameOf(m.participant_a_id);
                const nameB = nameOf(m.participant_b_id);
                const canDecide = !!onRecordResult && !m.winner_id && !!m.participant_a_id && !!m.participant_b_id;

                return (
                  <div key={m.match_index} className="border border-border rounded-xl overflow-hidden bg-card">
                    {([['A', m.participant_a_id, nameA], ['B', m.participant_b_id, nameB]] as const).map(
                      ([side, pid, name]) => {
                        const isWinner = !!pid && pid === m.winner_id;
                        return (
                          <div
                            key={side}
                            className={`flex items-center justify-between gap-2 px-3 py-2 text-sm border-b border-border last:border-b-0 ${
                              isWinner ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground'
                            }`}
                          >
                            <span className="truncate">{name ?? (pid ? 'Cargando…' : 'Por definir')}</span>
                            {canDecide && pid && (
                              <button
                                onClick={() => onRecordResult?.(m.round, m.match_index, pid)}
                                disabled={loading}
                                className="text-xs shrink-0 px-2 py-0.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                              >
                                Ganó
                              </button>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
