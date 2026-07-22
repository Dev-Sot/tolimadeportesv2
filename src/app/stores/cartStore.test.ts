import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './cartStore';
import type { Product } from '../types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    name: 'Balón de fútbol',
    description: 'Balón oficial talla 5',
    price: 80_000,
    images: [],
    category: 'Fútbol',
    stock: 5,
    rating: 4.5,
    featured: false,
    tags: [],
    ...overrides,
  };
}

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('cartStore', () => {
  it('agrega un producto nuevo con la cantidad pedida', () => {
    useCartStore.getState().addItem(makeProduct(), 2);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('nunca deja que la cantidad supere el stock disponible al agregar de una vez', () => {
    useCartStore.getState().addItem(makeProduct({ stock: 3 }), 10);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('acumula cantidades del mismo producto sin superar el stock', () => {
    const product = makeProduct({ stock: 5 });
    useCartStore.getState().addItem(product, 3);
    useCartStore.getState().addItem(product, 4); // 3 + 4 = 7, pero el stock es 5
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('updateQuantity elimina el item si la cantidad es 0 o negativa', () => {
    useCartStore.getState().addItem(makeProduct());
    useCartStore.getState().updateQuantity('prod-1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('removeItem quita solo el producto indicado', () => {
    useCartStore.getState().addItem(makeProduct({ id: 'a' }));
    useCartStore.getState().addItem(makeProduct({ id: 'b' }));
    useCartStore.getState().removeItem('a');
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe('b');
  });

  it('getTotal suma precio × cantidad de todos los items', () => {
    useCartStore.getState().addItem(makeProduct({ id: 'a', price: 10_000 }), 2);
    useCartStore.getState().addItem(makeProduct({ id: 'b', price: 5_000 }), 3);
    expect(useCartStore.getState().getTotal()).toBe(10_000 * 2 + 5_000 * 3);
  });

  it('getItemCount suma las cantidades, no el número de líneas', () => {
    useCartStore.getState().addItem(makeProduct({ id: 'a' }), 2);
    useCartStore.getState().addItem(makeProduct({ id: 'b' }), 3);
    expect(useCartStore.getState().getItemCount()).toBe(5);
  });

  it('clearCart vacía el carrito por completo', () => {
    useCartStore.getState().addItem(makeProduct());
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
