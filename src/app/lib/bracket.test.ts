import { describe, expect, it } from 'vitest';
import { generateBracket, recordMatchResult, getChampion, totalRounds, type BracketParticipant } from './bracket';

function players(n: number): BracketParticipant[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Equipo ${i + 1}` }));
}

describe('generateBracket', () => {
  it('devuelve vacío con menos de 2 participantes', () => {
    expect(generateBracket([])).toEqual([]);
    expect(generateBracket(players(1))).toEqual([]);
  });

  it('con potencia de 2 exacta no genera ningún bye', () => {
    const matches = generateBracket(players(4));
    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(2);
    expect(round1.every((m) => m.participantA && m.participantB)).toBe(true);
    expect(round1.every((m) => m.winnerId === null)).toBe(true);
  });

  it('nunca empareja dos posiciones vacías entre sí en primera ronda, para cualquier n de 2 a 20', () => {
    for (let n = 2; n <= 20; n++) {
      const matches = generateBracket(players(n));
      const round1 = matches.filter((m) => m.round === 1);
      for (const m of round1) {
        expect(m.participantA || m.participantB).toBeTruthy();
      }
    }
  });

  it('un bye en primera ronda avanza de inmediato a su participante', () => {
    // 3 participantes -> tamaño 4 -> 1 bye
    const matches = generateBracket(players(3));
    const round1 = matches.filter((m) => m.round === 1);
    const byeMatch = round1.find((m) => !m.participantA || !m.participantB);
    expect(byeMatch).toBeDefined();
    expect(byeMatch!.winnerId).not.toBeNull();
  });

  it('un bye de primera ronda NO avanza de más en la segunda ronda — debe esperar a su rival real', () => {
    // 5 participantes -> tamaño 8 -> 3 byes. p1 (seed 1) recibe bye.
    const matches = generateBracket(players(5));
    const round2 = matches.filter((m) => m.round === 2);
    // Debe existir un partido de ronda 2 con exactamente un participante conocido
    // (el ganador del bye) y el otro todavía pendiente del partido real.
    const waiting = round2.find(
      (m) => (m.participantA && !m.participantB) || (!m.participantA && m.participantB)
    );
    expect(waiting).toBeDefined();
    expect(waiting!.winnerId).toBeNull(); // ¡el bug que NO debe pasar es que esto tenga winnerId ya!
  });

  it('genera log2(size) rondas, terminando en una sola final', () => {
    const matches = generateBracket(players(5)); // tamaño 8 -> 3 rondas
    expect(totalRounds(matches)).toBe(3);
    const final = matches.filter((m) => m.round === 3);
    expect(final).toHaveLength(1);
  });
});

describe('recordMatchResult', () => {
  it('avanza al ganador a la siguiente ronda', () => {
    let matches = generateBracket(players(4)); // 1v4, 2v3 -> final
    matches = recordMatchResult(matches, 1, 0, 'p1');
    const round2 = matches.filter((m) => m.round === 2)[0];
    expect(round2.participantA?.id === 'p1' || round2.participantB?.id === 'p1').toBe(true);
  });

  it('completa un torneo de 4 equipos de punta a punta y corona al campeón correcto', () => {
    let matches = generateBracket(players(4));
    const round1 = matches.filter((m) => m.round === 1);

    // p1 y p4 juegan el primer partido de ronda 1, p2 y p3 el segundo (siembra 1v4, 2v3)
    const m0 = round1[0];
    const winner0 = m0.participantA!.id;
    matches = recordMatchResult(matches, 1, m0.matchIndex, winner0);

    const m1 = round1[1];
    const winner1 = m1.participantA!.id;
    matches = recordMatchResult(matches, 1, m1.matchIndex, winner1);

    expect(getChampion(matches)).toBeNull(); // final aún no jugada

    matches = recordMatchResult(matches, 2, 0, winner0);
    expect(getChampion(matches)?.id).toBe(winner0);
  });

  it('rechaza declarar ganador a alguien que no está en ese partido', () => {
    const matches = generateBracket(players(4));
    expect(() => recordMatchResult(matches, 1, 0, 'alguien-que-no-juega')).toThrow();
  });

  it('rechaza registrar un partido que todavía no tiene los dos rivales definidos', () => {
    const matches = generateBracket(players(5)); // ronda 2 tiene un slot en espera
    const round2 = matches.filter((m) => m.round === 2);
    const pending = round2.find((m) => !m.participantA || !m.participantB)!;
    expect(() => recordMatchResult(matches, 2, pending.matchIndex, 'p1')).toThrow();
  });

  it('no muta el arreglo original (inmutable)', () => {
    const matches = generateBracket(players(4));
    const snapshot = JSON.parse(JSON.stringify(matches));
    recordMatchResult(matches, 1, 0, matches[0].participantA!.id);
    expect(matches).toEqual(snapshot);
  });
});
