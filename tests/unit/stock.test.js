import { describe, it, expect, beforeEach } from 'vitest';
import { saveProducts, saveWarehouses, loadStock } from '../../src/storage.js';
import { getStockRecord, upsertStockForEntry, deductStockForExit, listStock, getProductTotal, setMinStockLevel } from '../../src/domain/stock.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const PRODUCT = { product_id: 1, sku: 'SKU-1', product_name: 'Producto 1', status: 'activo' };
const WAREHOUSE_A = { warehouse_id: 1, name: 'Bodega A', status: 'activo' };
const WAREHOUSE_B = { warehouse_id: 2, name: 'Bodega B', status: 'activo' };

beforeEach(() => {
  store.clear();
  saveProducts([PRODUCT]);
  saveWarehouses([WAREHOUSE_A, WAREHOUSE_B]);
});

describe('stock domain', () => {
  it('creates a stock record on first entry (FR-054)', () => {
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 10);
    const record = getStockRecord(PRODUCT.product_id, WAREHOUSE_A.warehouse_id);
    expect(record.quantity_available).toBe(10);
  });

  it('increments an existing stock record on further entries', () => {
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 10);
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 5);
    expect(getStockRecord(PRODUCT.product_id, WAREHOUSE_A.warehouse_id).quantity_available).toBe(15);
  });

  it('rejects an exit with no stock record for the combination (FR-054)', () => {
    const result = deductStockForExit(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 1);
    expect(result.ok).toBe(false);
    expect(loadStock().length).toBe(0);
  });

  it('rejects an exit exceeding available quantity without modifying stock (FR-055)', () => {
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 5);
    const result = deductStockForExit(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 10);
    expect(result.ok).toBe(false);
    expect(getStockRecord(PRODUCT.product_id, WAREHOUSE_A.warehouse_id).quantity_available).toBe(5);
  });

  it('deducts stock when quantity is sufficient', () => {
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 10);
    const result = deductStockForExit(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 4);
    expect(result.ok).toBe(true);
    expect(result.record.quantity_available).toBe(6);
  });

  it('lists stock read-only with product/warehouse filters and status (FR-047, FR-049, FR-052)', () => {
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 10);
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_B.warehouse_id, 3);
    const all = listStock();
    expect(all.length).toBe(2);
    expect(all[0].product_status).toBe('activo');
    expect(listStock({ warehouseId: WAREHOUSE_A.warehouse_id }).length).toBe(1);
  });

  it('computes the total across warehouses for a product (FR-048)', () => {
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 10);
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_B.warehouse_id, 3);
    expect(getProductTotal(PRODUCT.product_id)).toBe(13);
  });

  it('distinguishes an absent stock record from a quantity of zero', () => {
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 1);
    deductStockForExit(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 1);
    const stockA = listStock({ warehouseId: WAREHOUSE_A.warehouse_id });
    const stockB = listStock({ warehouseId: WAREHOUSE_B.warehouse_id });
    expect(stockA.length).toBe(1);
    expect(stockA[0].quantity_available).toBe(0);
    expect(stockB.length).toBe(0);
  });

  it('sets a non-negative min stock level on an existing record (FR-076)', () => {
    const record = upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 10);
    const result = setMinStockLevel(record.stock_id, 5);
    expect(result.success).toBe(true);
    expect(getStockRecord(PRODUCT.product_id, WAREHOUSE_A.warehouse_id).min_stock_level).toBe(5);
  });

  it('rejects a negative min stock level', () => {
    const record = upsertStockForEntry(PRODUCT.product_id, WAREHOUSE_A.warehouse_id, 10);
    const result = setMinStockLevel(record.stock_id, -1);
    expect(result.success).toBe(false);
  });
});
