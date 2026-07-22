-- Canchazo — checkout atómico y blindado en servidor
-- ─────────────────────────────────────────────────────────────────────────────
-- Reemplaza el flujo anterior (dos inserts separados desde el cliente: orders,
-- luego order_items) que tenía dos problemas:
--   1. Sin transacción: si el insert de order_items fallaba, quedaba una orden
--      vacía huérfana en la base de datos.
--   2. Sin blindaje de precio: el total se calculaba en el navegador y se
--      enviaba tal cual — cualquiera con las herramientas de desarrollador
--      podía editarlo antes de pagar.
--
-- Esta función recalcula el total desde el precio real de `products`, valida
-- stock, bloquea las filas para evitar sobreventa concurrente, y hace todo en
-- una sola transacción de Postgres. Ejecutar una sola vez en el SQL Editor de
-- Supabase antes de desplegar el cliente actualizado.

alter table orders add column if not exists payment_reference text;

create or replace function create_order_with_items(
  p_items jsonb,               -- [{ "product_id": "uuid", "quantity": 2 }, ...]
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
begin
  if v_uid is null then
    raise exception 'No hay sesión activa. Inicia sesión de nuevo e intenta otra vez.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La orden no tiene productos.';
  end if;

  -- Paso 1: recalcular el total desde el precio real en BD y validar stock,
  -- bloqueando cada fila (FOR UPDATE) para que dos compras simultáneas no
  -- sobrevendan el mismo producto.
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

  -- Paso 2: crear la orden con el total calculado en servidor (no el del cliente)
  insert into orders (customer_id, total, shipping_address, payment_method, payment_reference, status)
  values (v_uid, v_total, p_shipping_address, p_payment_method, p_payment_reference, 'pending')
  returning * into v_order;

  -- Paso 3: crear los items al precio real y descontar stock — todo en la misma transacción
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_product from products where id = (v_item->>'product_id')::uuid;

    insert into order_items (order_id, product_id, quantity, unit_price)
    values (v_order.id, v_product.id, v_qty, v_product.price);

    update products set stock = stock - v_qty where id = v_product.id;
  end loop;

  return v_order;
end;
$$;

-- Solo usuarios autenticados pueden ejecutarla; internamente sigue exigiendo
-- auth.uid() y usa SECURITY DEFINER únicamente para poder descontar stock de
-- productos que no le pertenecen al comprador (paso 3).
revoke all on function create_order_with_items(jsonb, jsonb, text, text) from public;
grant execute on function create_order_with_items(jsonb, jsonb, text, text) to authenticated;
