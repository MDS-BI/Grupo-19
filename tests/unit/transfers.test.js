import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveProducts, saveTransfers, saveWarehouses, saveUsers, loadTransfers } from '../../src/storage.js';
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

  it('rolls back source and target STOCK when writing the transfer fails (T082)', () => {
    const created = requestTransfer(payload()).transfer;
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if(key === 'logistics:stock_transfers') throw new Error('fallo de escritura');
      return originalSetItem(key, value);
    });

    const result = confirmTransfer(created.transfer_id, CONFIRMER.user_id);
    spy.mockRestore();

    expect(result.success).toBe(false);
    expect(getStockRecord(PRODUCT.product_id, SOURCE.warehouse_id).quantity_available).toBe(10);
    expect(getStockRecord(PRODUCT.product_id, TARGET.warehouse_id)).toBeUndefined();
    expect(loadTransfers()[0].status).toBe('pendiente');
  });

  it('rejects a second confirmation without moving stock again', () => {
    const created = requestTransfer(payload()).transfer;
    expect(confirmTransfer(created.transfer_id, CONFIRMER.user_id).success).toBe(true);
    const second = confirmTransfer(created.transfer_id, CONFIRMER.user_id);
    expect(second.success).toBe(false);
    expect(getStockRecord(PRODUCT.product_id, SOURCE.warehouse_id).quantity_available).toBe(5);
    expect(getStockRecord(PRODUCT.product_id, TARGET.warehouse_id).quantity_available).toBe(5);
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

  it('filters by partial case-insensitive term and exact normalized fields without writing storage (T111, FR-134)', () => {
    const secondProduct = { product_id: 2, sku: 'SKU-2', product_name: 'Producto Segundo', status: 'activo' };
    const thirdWarehouse = { warehouse_id: 3, name: 'Tercera', status: 'activo' };
    saveProducts([PRODUCT, secondProduct]);
    saveWarehouses([SOURCE, TARGET, thirdWarehouse]);
    saveTransfers([
      { transfer_id: 1, product_id: 1, source_warehouse_id: 1, target_warehouse_id: 2, quantity: 1, status: 'pendiente', transfer_date: '2026-11-20T10:00:00.000Z', created_by: 1 },
      { transfer_id: 2, product_id: 2, source_warehouse_id: 1, target_warehouse_id: 3, quantity: 2, status: 'confirmada', transfer_date: '2026-11-21T10:00:00.000Z', created_by: 1 },
      { transfer_id: 3, product_id: 2, source_warehouse_id: 2, target_warehouse_id: 1, quantity: 3, status: 'cancelada', transfer_date: '2026-11-22T10:00:00.000Z', created_by: 2 }
    ]);

    expect(listTransfers().map(t => t.transfer_id)).toEqual([3, 2, 1]);
    expect(listTransfers()[2]).toMatchObject({
      product_name: PRODUCT.product_name,
      source_warehouse_name: SOURCE.name,
      target_warehouse_name: TARGET.name,
      created_by_name: CREATOR.user_name
    });
    expect(listTransfers({ term: 'segundo' }).map(t => t.transfer_id)).toEqual([3, 2]);
    expect(listTransfers({ term: 'SEGUNDO' }).map(t => t.transfer_id)).toEqual([3, 2]);
    expect(listTransfers({ term: '2' }).map(t => t.transfer_id)).toEqual([2]);
    expect(listTransfers({ status: 'confirmada' }).map(t => t.transfer_id)).toEqual([2]);
    expect(listTransfers({ productId: '2' }).map(t => t.transfer_id)).toEqual([3, 2]);
    expect(listTransfers({ sourceWarehouseId: '1' }).map(t => t.transfer_id)).toEqual([2, 1]);
    expect(listTransfers({ targetWarehouseId: '3' }).map(t => t.transfer_id)).toEqual([2]);
    expect(listTransfers({
      term: 'segundo',
      status: 'confirmada',
      productId: 2,
      sourceWarehouseId: '1',
      targetWarehouseId: '3'
    }).map(t => t.transfer_id)).toEqual([2]);
    expect(listTransfers({ term: '', status: undefined, productId: '', sourceWarehouseId: null }).map(t => t.transfer_id)).toEqual([3, 2, 1]);

    const before = [...store.entries()];
    listTransfers({ term: 'segundo', status: 'confirmada', productId: '2' });
    expect([...store.entries()]).toEqual(before);
  });
});
