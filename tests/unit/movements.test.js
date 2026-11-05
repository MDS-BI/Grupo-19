import { describe, it, expect, beforeEach } from 'vitest';
import { saveProducts, saveWarehouses, saveUsers, loadMovements, loadStock } from '../../src/storage.js';
import { registerMovement, listMovements } from '../../src/domain/movements.js';
import * as movementsModule from '../../src/domain/movements.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const PRODUCT = { product_id: 1, sku: 'SKU-1', product_name: 'Producto 1', status: 'activo' };
const WAREHOUSE = { warehouse_id: 1, name: 'Bodega A', status: 'activo' };
const INACTIVE_WAREHOUSE = { warehouse_id: 2, name: 'Bodega B', status: 'inactivo' };
const USER = { user_id: 1, user_name: 'Carlos', role: 'encargado_bodega' };

function payload(overrides = {}){
  return { type: 'entrada', productId: PRODUCT.product_id, warehouseId: WAREHOUSE.warehouse_id, quantity: 5, userId: USER.user_id, ...overrides };
}

beforeEach(() => {
  store.clear();
  saveProducts([PRODUCT]);
  saveWarehouses([WAREHOUSE, INACTIVE_WAREHOUSE]);
  saveUsers([USER]);
});

describe('movements domain', () => {
  it('registers an entrada that creates stock and the movement record (FR-053, FR-054)', () => {
    const result = registerMovement(payload());
    expect(result.success).toBe(true);
    expect(loadStock()[0].quantity_available).toBe(5);
    expect(loadMovements()[0].transaction_type).toBe('entrada');
  });

  it('registers a salida that decrements stock when sufficient (FR-053)', () => {
    registerMovement(payload());
    const result = registerMovement(payload({ type: 'salida', quantity: 3 }));
    expect(result.success).toBe(true);
    expect(loadStock()[0].quantity_available).toBe(2);
  });

  it('rejects a salida without sufficient stock and leaves STOCK untouched (FR-055)', () => {
    const result = registerMovement(payload({ type: 'salida', quantity: 1 }));
    expect(result.success).toBe(false);
    expect(loadStock().length).toBe(0);
    expect(loadMovements().length).toBe(0);
  });

  it('registers ajuste_entrada and ajuste_salida with the same stock effects as entrada/salida (FR-072)', () => {
    registerMovement(payload({ type: 'ajuste_entrada', quantity: 10 }));
    expect(loadStock()[0].quantity_available).toBe(10);
    registerMovement(payload({ type: 'ajuste_salida', quantity: 4 }));
    expect(loadStock()[0].quantity_available).toBe(6);
    expect(loadMovements().map(m => m.transaction_type)).toEqual(['ajuste_entrada', 'ajuste_salida']);
  });

  it('rejects movements against an inactive warehouse (FR-063)', () => {
    const result = registerMovement(payload({ warehouseId: INACTIVE_WAREHOUSE.warehouse_id }));
    expect(result.success).toBe(false);
    expect(result.errors.warehouseId).toBeDefined();
  });

  it('requires an existing user (FR-058)', () => {
    const result = registerMovement(payload({ userId: 999 }));
    expect(result.success).toBe(false);
    expect(result.errors.userId).toBeDefined();
  });

  it('requires a positive integer quantity', () => {
    expect(registerMovement(payload({ quantity: 0 })).success).toBe(false);
    expect(registerMovement(payload({ quantity: -1 })).success).toBe(false);
    expect(registerMovement(payload({ quantity: 2.5 })).success).toBe(false);
  });

  it('stamps the movement date automatically and never offers edit/delete (FR-056, FR-059)', () => {
    const result = registerMovement(payload());
    expect(result.movement.transaction_date).toBeDefined();
    expect(new Date(result.movement.transaction_date).toString()).not.toBe('Invalid Date');
    // No update/delete exports exist for movements — immutability by API design.
    expect(Object.keys(movementsModule)).not.toContain('updateMovement');
    expect(Object.keys(movementsModule)).not.toContain('deleteMovement');
  });

  it('lists movements most recent first with product/warehouse filters', () => {
    registerMovement(payload());
    registerMovement(payload({ type: 'salida', quantity: 1 }));
    const all = listMovements();
    expect(all.length).toBe(2);
    expect(all[0].transaction_id).toBeGreaterThan(all[1].transaction_id);
    expect(listMovements({ warehouseId: INACTIVE_WAREHOUSE.warehouse_id }).length).toBe(0);
  });
});
