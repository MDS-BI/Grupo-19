import { describe, it, expect, beforeEach } from 'vitest';
import { saveProducts, saveWarehouses, saveUsers, loadTransfers } from '../../src/storage.js';
import { upsertStockForEntry, getStockRecord } from '../../src/domain/stock.js';
import { requestTransfer, confirmTransfer, cancelTransfer, listTransfers } from '../../src/domain/transfers.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const PRODUCT = { product_id: 1, sku: 'SKU-1', product_name: 'Producto 1', status: 'activo' };
const SOURCE = { warehouse_id: 1, name: 'Origen', status: 'activo' };
const TARGET = { warehouse_id: 2, name: 'Destino', status: 'activo' };
const INACTIVE = { warehouse_id: 3, name: 'Inactiva', status: 'inactivo' };
const CREATOR = { user_id: 1, user_name: 'Carlos' };
const CONFIRMER = { user_id: 2, user_name: 'María' };

function payload(overrides = {}){
  return { productId: PRODUCT.product_id, sourceWarehouseId: SOURCE.warehouse_id, targetWarehouseId: TARGET.warehouse_id, quantity: 5, createdBy: CREATOR.user_id, ...overrides };
}

beforeEach(() => {
  store.clear();
  saveProducts([PRODUCT]);
  saveWarehouses([SOURCE, TARGET, INACTIVE]);
  saveUsers([CREATOR, CONFIRMER]);
  upsertStockForEntry(PRODUCT.product_id, SOURCE.warehouse_id, 10);
});

describe('transfers domain', () => {
  it('creates a pending transfer with created_by and transfer_date (FR-065, FR-074)', () => {
    const result = requestTransfer(payload());
    expect(result.success).toBe(true);
    expect(result.transfer.status).toBe('pendiente');
    expect(result.transfer.created_by).toBe(CREATOR.user_id);
    expect(result.transfer.transfer_date).toBeDefined();
  });

  it('rejects identical source and target warehouses (FR-066)', () => {
    const result = requestTransfer(payload({ targetWarehouseId: SOURCE.warehouse_id }));
    expect(result.success).toBe(false);
    expect(result.errors.targetWarehouseId).toContain('diferente');
  });

  it('rejects a transfer exceeding available stock in the source warehouse (FR-067)', () => {
    const result = requestTransfer(payload({ quantity: 999 }));
    expect(result.success).toBe(false);
    expect(result.errors.quantity).toBeDefined();
  });

  it('does not touch STOCK until the transfer is confirmed (FR-069)', () => {
    requestTransfer(payload());
    expect(getStockRecord(PRODUCT.product_id, SOURCE.warehouse_id).quantity_available).toBe(10);
    expect(getStockRecord(PRODUCT.product_id, TARGET.warehouse_id)).toBeUndefined();
  });

  it('confirms a pending transfer, moving stock and creating the target record if missing (FR-068, FR-069, FR-075)', () => {
    const created = requestTransfer(payload()).transfer;
    const result = confirmTransfer(created.transfer_id, CONFIRMER.user_id);
    expect(result.success).toBe(true);
    expect(result.transfer.status).toBe('confirmada');
    expect(result.transfer.confirmed_by).toBe(CONFIRMER.user_id);
    expect(getStockRecord(PRODUCT.product_id, SOURCE.warehouse_id).quantity_available).toBe(5);
    expect(getStockRecord(PRODUCT.product_id, TARGET.warehouse_id).quantity_available).toBe(5);
  });

  it('rejects confirming when source or target warehouse is inactive (FR-087)', () => {
    const created = requestTransfer(payload()).transfer;
    saveWarehouses([{ ...SOURCE, status: 'inactivo' }, TARGET, INACTIVE]);
    const result = confirmTransfer(created.transfer_id, CONFIRMER.user_id);
    expect(result.success).toBe(false);
    expect(getStockRecord(PRODUCT.product_id, SOURCE.warehouse_id).quantity_available).toBe(10);
  });

  it('rejects confirming a transfer that is not pending', () => {
    const created = requestTransfer(payload()).transfer;
    confirmTransfer(created.transfer_id, CONFIRMER.user_id);
    const result = confirmTransfer(created.transfer_id, CONFIRMER.user_id);
    expect(result.success).toBe(false);
  });

  it('cancels a pending transfer without modifying STOCK, recording cancelled_by (FR-085)', () => {
    const created = requestTransfer(payload()).transfer;
    const result = cancelTransfer(created.transfer_id, CONFIRMER.user_id);
    expect(result.success).toBe(true);
    expect(result.transfer.status).toBe('cancelada');
    expect(result.transfer.cancelled_by).toBe(CONFIRMER.user_id);
    expect(getStockRecord(PRODUCT.product_id, SOURCE.warehouse_id).quantity_available).toBe(10);
  });

  it('rejects cancelling a transfer that is not pending (FR-086)', () => {
    const created = requestTransfer(payload()).transfer;
    confirmTransfer(created.transfer_id, CONFIRMER.user_id);
    const result = cancelTransfer(created.transfer_id, CONFIRMER.user_id);
    expect(result.success).toBe(false);
    expect(loadTransfers()[0].status).toBe('confirmada');
  });

  it('lists transfers with resolved product/warehouse/user names, most recent first', () => {
    requestTransfer(payload());
    requestTransfer(payload({ quantity: 1 }));
    const all = listTransfers();
    expect(all.length).toBe(2);
    expect(all[0].product_name).toBe(PRODUCT.product_name);
    expect(all[0].source_warehouse_name).toBe(SOURCE.name);
    expect(all[0].transfer_id).toBeGreaterThan(all[1].transfer_id);
  });
});
