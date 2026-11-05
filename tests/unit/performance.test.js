import { describe, it, expect, beforeEach } from 'vitest';
import { saveProductCategories, saveUsers, saveProducts, saveWarehouses, saveStock } from '../../src/storage.js';
import { searchProducts } from '../../src/domain/products.js';
import { searchWarehouses } from '../../src/domain/warehouses.js';
import { listStock } from '../../src/domain/stock.js';
import { registerMovement } from '../../src/domain/movements.js';
import { listTransfers } from '../../src/domain/transfers.js';
import { listAlerts } from '../../src/domain/alerts.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const RECORD_COUNT = 500;
const BUDGET_MS = 200;

beforeEach(() => {
  store.clear();
  saveProductCategories([{ category_id: 1, category_name: 'General' }]);
  saveUsers([{ user_id: 1, user_name: 'Ana', role: 'administrador' }]);

  const products = Array.from({ length: RECORD_COUNT }, (_, i) => ({
    product_id: i + 1, sku: `SKU-${i}`, product_name: `Producto ${i}`, category_id: 1,
    sale_price: 10, status: 'activo', unit_price: 10
  }));
  saveProducts(products);

  const warehouses = Array.from({ length: RECORD_COUNT }, (_, i) => ({
    warehouse_id: i + 1, name: `Bodega ${i}`, location: 'Santiago', status: 'activo'
  }));
  saveWarehouses(warehouses);

  const stock = Array.from({ length: RECORD_COUNT }, (_, i) => ({
    stock_id: i + 1, product_id: (i % RECORD_COUNT) + 1, warehouse_id: (i % RECORD_COUNT) + 1,
    quantity_available: i, min_stock_level: i % 7 === 0 ? 50 : 0, update_date: '2026-11-05'
  }));
  saveStock(stock);
});

/** Mantiene el renderizado de listas y la búsqueda ágiles para 500 registros (FR-032, SC-017). */
describe('performance with 500 records', () => {
  it('searches products within budget', () => {
    const start = performance.now();
    const results = searchProducts('Producto 1');
    expect(performance.now() - start).toBeLessThan(BUDGET_MS);
    expect(results.length).toBeGreaterThan(0);
  });

  it('searches warehouses within budget', () => {
    const start = performance.now();
    searchWarehouses('Bodega 1');
    expect(performance.now() - start).toBeLessThan(BUDGET_MS);
  });

  it('lists and filters stock within budget', () => {
    const start = performance.now();
    const results = listStock({ warehouseId: 5 });
    expect(performance.now() - start).toBeLessThan(BUDGET_MS);
    expect(results.length).toBe(1);
  });

  it('derives alerts within budget', () => {
    const start = performance.now();
    listAlerts();
    expect(performance.now() - start).toBeLessThan(BUDGET_MS);
  });

  it('registers a movement and lists transfers within budget even with 500 existing records', () => {
    const start = performance.now();
    registerMovement({ type: 'entrada', productId: 1, warehouseId: 1, quantity: 1, userId: 1 });
    listTransfers();
    expect(performance.now() - start).toBeLessThan(BUDGET_MS);
  });
});
