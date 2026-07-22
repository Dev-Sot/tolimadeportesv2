-- Canchazo — v2.0: motor de brackets de torneos
-- Ejecutar en el SQL Editor de Supabase después de 002, 003 y 004.
--
-- El algoritmo de emparejamiento (siembra estándar, avance de byes, no
-- avanzar de más en rondas 2+) vive en TypeScript (src/app/lib/bracket.ts,
-- con tests) — esta tabla solo persiste el resultado de esa lógica. No hay
-- generación de bracket en SQL a propósito: es mucho más fácil de probar y
-- mantener como función pura en el cliente que replicada en PL/pgSQL.

create table if not exists tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round int not null,
  match_index int not null,
  participant_a_id uuid references tournament_participants(id) on delete set null,
  participant_b_id uuid references tournament_participants(id) on delete set null,
  winner_id uuid references tournament_participants(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tournament_id, round, match_index)
);

alter table tournament_matches enable row level security;

drop policy if exists "Bracket público" on tournament_matches;
create policy "Bracket público" on tournament_matches for select using (true);

drop policy if exists "Organizador gestiona su bracket" on tournament_matches;
create policy "Organizador gestiona su bracket" on tournament_matches for all
  using (
    exists (select 1 from tournaments t where t.id = tournament_id and t.organizer_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from tournaments t where t.id = tournament_id and t.organizer_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
