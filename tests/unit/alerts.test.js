import { describe, it, expect, beforeEach } from 'vitest';
import { saveProducts, saveWarehouses } from '../../src/storage.js';
import { upsertStockForEntry, setMinStockLevel, getStockRecord } from '../../src/domain/stock.js';
import { listAlerts, isInAlert } from '../../src/domain/alerts.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const PRODUCT = { product_id: 1, sku: 'SKU-1', product_name: 'Producto 1', status: 'activo' };
const WAREHOUSE = { warehouse_id: 1, name: 'Bodega A', status: 'activo' };

beforeEach(() => {
  store.clear();
  saveProducts([PRODUCT]);
  saveWarehouses([WAREHOUSE]);
});

describe('alerts domain', () => {
  it('treats the threshold as inclusive: quantity == min triggers an alert (FR-077)', () => {
    const record = upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 5);
    setMinStockLevel(record.stock_id, 5);
    const alerts = listAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].deficit).toBe(0);
  });

  it('does not alert when min_stock_level is zero or unset (FR-084)', () => {
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 0);
    expect(listAlerts().length).toBe(0);
  });

  it('does not alert when there is no stock record for the combination', () => {
    expect(listAlerts().length).toBe(0);
  });

  it('computes the deficit as min_stock_level - quantity_available', () => {
    const record = upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 2);
    setMinStockLevel(record.stock_id, 10);
    expect(listAlerts()[0].deficit).toBe(8);
  });

  it('filters alerts by product and warehouse (FR-082)', () => {
    const record = upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 1);
    setMinStockLevel(record.stock_id, 5);
    expect(listAlerts({ productId: PRODUCT.product_id }).length).toBe(1);
    expect(listAlerts({ warehouseId: 999 }).length).toBe(0);
  });

  it('clears automatically once stock rises above the minimum (FR-081)', () => {
    const record = upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 1);
    setMinStockLevel(record.stock_id, 5);
    expect(listAlerts().length).toBe(1);
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 10);
    expect(listAlerts().length).toBe(0);
  });

  it('never mutates STOCK, products or warehouses when querying (FR-083)', () => {
    const record = upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 1);
    setMinStockLevel(record.stock_id, 5);
    listAlerts();
    listAlerts();
    expect(getStockRecord(PRODUCT.product_id, WAREHOUSE.warehouse_id).quantity_available).toBe(1);
  });

  it('isInAlert reflects the same inclusive rule used by listAlerts', () => {
    const record = upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 3);
    setMinStockLevel(record.stock_id, 3);
    expect(isInAlert(getStockRecord(PRODUCT.product_id, WAREHOUSE.warehouse_id))).toBe(true);
    upsertStockForEntry(PRODUCT.product_id, WAREHOUSE.warehouse_id, 1);
    expect(isInAlert(getStockRecord(PRODUCT.product_id, WAREHOUSE.warehouse_id))).toBe(false);
  });
});
