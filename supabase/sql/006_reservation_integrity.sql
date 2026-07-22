-- Canchazo — cierre de huecos: blindaje de precio y anti-sobreventa en reservas
-- Ejecutar en el SQL Editor de Supabase después de 002-005.
--
-- Mismo problema que tenía el checkout antes del fix de v1.0: total_price se
-- calculaba en el navegador (horas × court.price_per_hour) y se enviaba tal
-- cual. Además, la validación de horario ocupado era solo visual (slots en
-- rojo) — nada en el servidor impedía que dos personas reservaran la misma
-- franja al mismo tiempo. Esta función arregla ambas cosas en una sola
-- transacción.
--
-- NO agrega comisión ni liquidación para dueños de cancha: a diferencia del
-- marketplace, las reservas no cobran nada a través de Canchazo hoy (el pago
-- se hace en persona en la cancha). Cobrar una "comisión" sobre dinero que la
-- plataforma nunca recibe sería un número de mentira. Ver AUDIT.md.

create or replace function create_reservation(
  p_court_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_notes text default null
)
returns reservations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid         uuid := auth.uid();
  v_court       courts;
  v_hours       numeric;
  v_total       numeric;
  v_conflicts   int;
  v_reservation reservations;
begin
  if v_uid is null then
    raise exception 'No hay sesión activa. Inicia sesión de nuevo e intenta otra vez.';
  end if;

  if p_end_time <= p_start_time then
    raise exception 'La hora de fin debe ser posterior a la hora de inicio.';
  end if;

  -- Bloquea la cancha durante la transacción: si dos personas intentan
  -- reservar el mismo horario a la vez, la segunda espera a que la primera
  -- termine y entonces sí ve el conflicto real.
  select * into v_court from courts where id = p_court_id and is_active = true for update;
  if v_court.id is null then
    raise exception 'Esta cancha ya no está disponible.';
  end if;

  select count(*) into v_conflicts
  from reservations
  where court_id = p_court_id
    and date = p_date
    and status <> 'cancelled'
    and start_time < p_end_time
    and end_time > p_start_time;

  if v_conflicts > 0 then
    raise exception 'Ese horario ya no está disponible. Elige otra franja.';
  end if;

  v_hours := extract(epoch from (p_end_time - p_start_time)) / 3600;
  v_total := round(v_hours * v_court.price_per_hour);

  insert into reservations (customer_id, court_id, date, start_time, end_time, total_price, notes, status)
  values (v_uid, p_court_id, p_date, p_start_time, p_end_time, v_total, p_notes, 'pending')
  returning * into v_reservation;

  return v_reservation;
end;
$$;

revoke all on function create_reservation(uuid, date, time, time, text) from public;
grant execute on function create_reservation(uuid, date, time, time, text) to authenticated;
