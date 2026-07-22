-- Canchazo — v2.0: liquidaciones a vendedores + verificación de entrenadores
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de 002 y 003.
--
-- Alcance de esta liquidación: solo vendedores del marketplace (order_items),
-- porque es lo único que hoy registra comisión por línea (desde 003). Dueños
-- de cancha quedan fuera hasta que las reservas tengan el mismo tracking de
-- comisión — extender esto sin esa base habría sido construir sobre un dato
-- que no existe todavía.

-- 1. Verificación de entrenadores --------------------------------------------
alter table coaches add column if not exists verified boolean not null default false;
alter table coaches add column if not exists verified_at timestamptz;

drop policy if exists "Admin verifica entrenadores" on coaches;
create policy "Admin verifica entrenadores" on coaches for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 2. Libro de liquidaciones ----------------------------------------------------
create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references profiles(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  gross_amount numeric not null default 0,
  commission_amount numeric not null default 0,
  net_amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table order_items add column if not exists payout_id uuid references payouts(id);

alter table payouts enable row level security;

drop policy if exists "Vendedor ve sus liquidaciones" on payouts;
create policy "Vendedor ve sus liquidaciones" on payouts for select using (auth.uid() = vendor_id);

drop policy if exists "Admin ve todas las liquidaciones" on payouts;
create policy "Admin ve todas las liquidaciones" on payouts for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admin gestiona liquidaciones" on payouts;
create policy "Admin gestiona liquidaciones" on payouts for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Saldo pendiente: ventas entregadas y aún no incluidas en ninguna liquidación.
create or replace function get_vendor_balance(p_vendor_id uuid)
returns table (gross_amount numeric, commission_amount numeric, net_amount numeric, order_count bigint)
language sql
stable
as $$
  select
    coalesce(sum(oi.unit_price * oi.quantity), 0) as gross_amount,
    coalesce(sum(oi.commission_amount), 0) as commission_amount,
    coalesce(sum(oi.unit_price * oi.quantity - coalesce(oi.commission_amount, 0)), 0) as net_amount,
    count(distinct oi.order_id) as order_count
  from order_items oi
  join orders o on o.id = oi.order_id
  join products p on p.id = oi.product_id
  where p.vendor_id = p_vendor_id
    and o.status = 'delivered'
    and oi.payout_id is null;
$$;

grant execute on function get_vendor_balance(uuid) to authenticated;

-- Genera una liquidación: toma todas las líneas entregadas y aún no
-- liquidadas de un vendedor, crea el payout y las marca. Solo admin.
create or replace function generate_payout(p_vendor_id uuid)
returns payouts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_is_admin     boolean;
  v_payout       payouts;
  v_gross        numeric;
  v_commission   numeric;
  v_period_start timestamptz;
begin
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin') into v_is_admin;
  if not v_is_admin then
    raise exception 'Solo un administrador puede generar liquidaciones.';
  end if;

  select
    coalesce(sum(oi.unit_price * oi.quantity), 0),
    coalesce(sum(oi.commission_amount), 0),
    coalesce(min(o.created_at), now())
  into v_gross, v_commission, v_period_start
  from order_items oi
  join orders o on o.id = oi.order_id
  join products p on p.id = oi.product_id
  where p.vendor_id = p_vendor_id
    and o.status = 'delivered'
    and oi.payout_id is null;

  if v_gross = 0 then
    raise exception 'No hay ventas pendientes de liquidar para este vendedor.';
  end if;

  insert into payouts (vendor_id, period_start, period_end, gross_amount, commission_amount, net_amount, status)
  values (p_vendor_id, v_period_start, now(), v_gross, v_commission, v_gross - v_commission, 'pending')
  returning * into v_payout;

  update order_items oi
  set payout_id = v_payout.id
  from orders o, products p
  where oi.order_id = o.id
    and oi.product_id = p.id
    and p.vendor_id = p_vendor_id
    and o.status = 'delivered'
    and oi.payout_id is null;

  return v_payout;
end;
$$;

grant execute on function generate_payout(uuid) to authenticated;

create or replace function mark_payout_paid(p_payout_id uuid)
returns payouts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_is_admin boolean;
  v_payout   payouts;
begin
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin') into v_is_admin;
  if not v_is_admin then
    raise exception 'Solo un administrador puede marcar liquidaciones como pagadas.';
  end if;

  update payouts set status = 'paid', paid_at = now()
  where id = p_payout_id
  returning * into v_payout;

  if v_payout.id is null then
    raise exception 'Liquidación no encontrada.';
  end if;

  return v_payout;
end;
$$;

grant execute on function mark_payout_paid(uuid) to authenticated;
