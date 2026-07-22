-- Canchazo — v1.5: plan Pro + comisión por transacción
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de 002_create_order_with_items.sql

-- 1. Suscripciones ------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  wompi_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

drop policy if exists "Ver propia suscripción" on subscriptions;
create policy "Ver propia suscripción" on subscriptions for select using (auth.uid() = user_id);

drop policy if exists "Crear propia suscripción" on subscriptions;
create policy "Crear propia suscripción" on subscriptions for insert with check (auth.uid() = user_id);

drop policy if exists "Actualizar propia suscripción" on subscriptions;
create policy "Actualizar propia suscripción" on subscriptions for update using (auth.uid() = user_id);

-- NOTA sobre confianza: igual que el resto del checkout con Wompi en esta app,
-- la activación del plan Pro se dispara desde el callback del widget en el
-- navegador cuando Wompi reporta el pago como aprobado — el mismo modelo de
-- confianza que ya usa create_order_with_items para pagos con tarjeta/PSE.
-- Esto NO es una verificación server-side real (requeriría un webhook de Wompi
-- + Supabase Edge Function con la llave privada). Documentado como pendiente
-- en AUDIT.md — no bloquea el lanzamiento porque el monto en riesgo por fraude
-- es una mensualidad, no el monto completo de una orden del marketplace.

create or replace function has_pro_plan(p_uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from subscriptions
    where user_id = p_uid
      and plan = 'pro'
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$$;

grant execute on function has_pro_plan(uuid) to authenticated, anon;

-- 2. Comisión por línea de pedido --------------------------------------------
-- Se calcula sobre el precio del VENDEDOR del producto, no del comprador:
-- 8% en el plan gratuito, 3% con Pro activo. Queda registrada por línea para
-- poder construir el libro de liquidaciones (payouts) en v2.0.
alter table order_items add column if not exists commission_rate numeric;
alter table order_items add column if not exists commission_amount numeric;

-- 3. create_order_with_items ahora también calcula la comisión ---------------
create or replace function create_order_with_items(
  p_items jsonb,
  p_shipping_address jsonb,
  p_payment_method text,
  p_payment_reference text default null
)
returns orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := auth.uid();
  v_total   numeric := 0;
  v_order   orders;
  v_item    jsonb;
  v_product products;
  v_qty     int;
  v_rate    numeric;
begin
  if v_uid is null then
    raise exception 'No hay sesión activa. Inicia sesión de nuevo e intenta otra vez.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La orden no tiene productos.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida.';
    end if;

    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and is_active = true
      for update;

    if v_product.id is null then
      raise exception 'Uno de los productos ya no está disponible.';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuficiente para "%": quedan % unidades.', v_product.name, v_product.stock;
    end if;

    v_total := v_total + (v_product.price * v_qty);
  end loop;

  insert into orders (customer_id, total, shipping_address, payment_method, payment_reference, status)
  values (v_uid, v_total, p_shipping_address, p_payment_method, p_payment_reference, 'pending')
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_product from products where id = (v_item->>'product_id')::uuid;

    v_rate := case when has_pro_plan(v_product.vendor_id) then 0.03 else 0.08 end;

    insert into order_items (order_id, product_id, quantity, unit_price, commission_rate, commission_amount)
    values (
      v_order.id, v_product.id, v_qty, v_product.price,
      v_rate, round(v_product.price * v_qty * v_rate, 2)
    );

    update products set stock = stock - v_qty where id = v_product.id;
  end loop;

  return v_order;
end;
$$;

revoke all on function create_order_with_items(jsonb, jsonb, text, text) from public;
grant execute on function create_order_with_items(jsonb, jsonb, text, text) to authenticated;
