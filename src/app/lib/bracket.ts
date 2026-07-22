export interface BracketParticipant {
  id: string;
  name: string;
}

export interface BracketMatch {
  round: number;
  matchIndex: number;
  participantA: BracketParticipant | null;
  participantB: BracketParticipant | null;
  winnerId: string | null;
}

/** Orden de siembra estándar (1v8, 4v5, 2v7, 3v6 para tamaño 8) — garantiza
 *  que ningún "bye" (posición vacía por relleno) quede enfrentado contra otro
 *  bye en la primera ronda, sin importar cuántos participantes reales haya. */
function seedOrder(size: number): number[] {
  if (size === 1) return [1];
  const prev = seedOrder(size / 2);
  const result: number[] = [];
  for (const s of prev) result.push(s, size + 1 - s);
  return result;
}

function winnerOf(match: BracketMatch): BracketParticipant | null {
  if (!match.winnerId) return null;
  return match.participantA?.id === match.winnerId ? match.participantA : match.participantB;
}

/**
 * Genera un bracket de eliminación simple a partir de una lista de
 * participantes (el orden de la lista = orden de siembra; no hay ranking).
 *
 * Reglas:
 * - Se rellena hasta la siguiente potencia de 2 con posiciones vacías ("bye").
 * - Un bye en primera ronda avanza a su participante de inmediato.
 * - A partir de la segunda ronda NUNCA se avanza automáticamente: un jugador
 *   que pasó por bye debe esperar a que se decida su próximo rival real,
 *   aunque ese rival tarde en definirse. Avanzar de más ahí sería el bug
 *   clásico de estos motores.
 */
export function generateBracket(participants: BracketParticipant[]): BracketMatch[] {
  const n = participants.length;
  if (n < 2) return [];

  const size = 2 ** Math.ceil(Math.log2(n));
  const order = seedOrder(size);
  const bySeed = (seed: number): BracketParticipant | null => participants[seed - 1] ?? null;

  const round1: BracketMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    const a = bySeed(order[i * 2]);
    const b = bySeed(order[i * 2 + 1]);
    const winnerId = a && !b ? a.id : !a && b ? b.id : null;
    round1.push({ round: 1, matchIndex: i, participantA: a, participantB: b, winnerId });
  }

  const matches: BracketMatch[] = [...round1];
  let matchesInRound = round1.length;
  let round = 2;
  while (matchesInRound > 1) {
    matchesInRound = matchesInRound / 2;
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({ round, matchIndex: i, participantA: null, participantB: null, winnerId: null });
    }
    round++;
  }

  // Único avance automático permitido: los byes de la ronda 1 hacia la ronda 2.
  for (const m of round1) {
    if (m.winnerId) propagateWinner(matches, m);
  }

  return matches;
}

function propagateWinner(matches: BracketMatch[], decided: BracketMatch): void {
  const winner = winnerOf(decided);
  if (!winner) return;

  const nextMatch = matches.find(
    (m) => m.round === decided.round + 1 && m.matchIndex === Math.floor(decided.matchIndex / 2)
  );
  if (!nextMatch) return; // decided era la final

  if (decided.matchIndex % 2 === 0) nextMatch.participantA = winner;
  else nextMatch.participantB = winner;
}

/**
 * Registra el ganador de un partido y lo hace avanzar a la siguiente ronda,
 * sin mutar el arreglo original.
 */
export function recordMatchResult(
  matches: BracketMatch[],
  round: number,
  matchIndex: number,
  winnerId: string
): BracketMatch[] {
  const updated = matches.map((m) => ({ ...m }));
  const match = updated.find((m) => m.round === round && m.matchIndex === matchIndex);
  if (!match) throw new Error('Partido no encontrado en el bracket.');
  if (match.participantA?.id !== winnerId && match.participantB?.id !== winnerId) {
    throw new Error('El ganador debe ser uno de los dos participantes del partido.');
  }
  if (!match.participantA || !match.participantB) {
    throw new Error('El partido todavía no tiene sus dos participantes definidos.');
  }

  match.winnerId = winnerId;
  propagateWinner(updated, match);
  return updated;
}

export function totalRounds(matches: BracketMatch[]): number {
  return matches.reduce((max, m) => Math.max(max, m.round), 0);
}

/** El campeón, si la final ya se jugó. */
export function getChampion(matches: BracketMatch[]): BracketParticipant | null {
  const rounds = totalRounds(matches);
  if (rounds === 0) return null;
  const final = matches.find((m) => m.round === rounds);
  return final ? winnerOf(final) : null;
}
