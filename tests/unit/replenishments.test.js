import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveProducts, saveWarehouses, saveUsers, saveStock, loadStock, loadMovements,
  loadReplenishments, loadProducts, loadWarehouses
} from '../../src/storage.js';
import {
  REQUEST_STATUSES, requestReplenishment, approveRequest, cancelRequest, receiveRequest,
  listReplenishments, replenishmentCounts, getReplenishmentRequest, canCancelRequest
} from '../../src/domain/replenishments.js';
import { listAlerts } from '../../src/domain/alerts.js';
import { canAccessModule, canPerform } from '../../src/domain/permissions.js';

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
const SUPERVISOR = { user_id: 1, user_name: 'Supervisora', role: 'supervisor_inventario' };
const ADMIN = { user_id: 2, user_name: 'Administrador', role: 'administrador' };
const WAREHOUSE_MANAGER = { user_id: 3, user_name: 'Encargado', role: 'encargado_bodega' };

function payload(overrides = {}){
  return {
    productId: PRODUCT.product_id,
    warehouseId: WAREHOUSE.warehouse_id,
    quantity: 4,
    observation: 'Reposición por alerta',
    createdBy: SUPERVISOR.user_id,
    ...overrides
  };
}

function approvedRequest(){
  const created = requestReplenishment(payload());
  return approveRequest(created.request.request_id, ADMIN.user_id).request;
}

function setAlertStock(){
  saveStock([{
    stock_id: 1,
    product_id: PRODUCT.product_id,
    warehouse_id: WAREHOUSE.warehouse_id,
    quantity_available: 2,
    min_stock_level: 5,
    update_date: '2026-11-17'
  }]);
}

beforeEach(() => {
  store.clear();
  saveProducts([PRODUCT]);
  saveWarehouses([WAREHOUSE, INACTIVE_WAREHOUSE]);
  saveUsers([SUPERVISOR, ADMIN, WAREHOUSE_MANAGER]);
});

describe('HU-07 replenishment requests domain', () => {
  it('creates a pending request with automatic user and date without touching stock (FR-093, FR-096)', () => {
    const result = requestReplenishment(payload());
    expect(result.success).toBe(true);
    const request = result.request;
    expect(request.request_id).toBe(1);
    expect(request.status).toBe('pendiente');
    expect(request.created_by).toBe(SUPERVISOR.user_id);
    expect(new Date(request.request_date).toString()).not.toBe('Invalid Date');
    expect(request.observation).toBe('Reposición por alerta');
    expect(loadStock().length).toBe(0);
    expect(loadMovements().length).toBe(0);
  });

  it('records the alert origin when the request comes from HU-06', () => {
    const result = requestReplenishment(payload({ source: 'alert', quantity: 3 }));
    expect(result.request.source).toBe('alert');
    expect(result.request.quantity).toBe(3);
  });

  it('validates product, active warehouse, quantity and active user (FR-094)', () => {
    expect(requestReplenishment(payload({ productId: 999 })).errors.productId).toBeDefined();
    expect(requestReplenishment(payload({ warehouseId: INACTIVE_WAREHOUSE.warehouse_id })).errors.warehouseId).toBeDefined();
    expect(requestReplenishment(payload({ quantity: 0 })).errors.quantity).toBeDefined();
    expect(requestReplenishment(payload({ quantity: 2.5 })).errors.quantity).toBeDefined();
    expect(requestReplenishment(payload({ createdBy: 999 })).errors.createdBy).toBeDefined();
    expect(loadReplenishments().length).toBe(0);
  });

  it('keeps an empty optional observation and stores all four statuses', () => {
    expect(requestReplenishment(payload({ observation: '' })).request.observation).toBe('');
    expect(REQUEST_STATUSES).toEqual(['pendiente', 'aprobada', 'recibida', 'cancelada']);
  });

  it('approves only pending requests without modifying stock (FR-097)', () => {
    const created = requestReplenishment(payload());
    const result = approveRequest(created.request.request_id, ADMIN.user_id);
    expect(result.success).toBe(true);
    expect(result.request.status).toBe('aprobada');
    expect(result.request.approved_by).toBe(ADMIN.user_id);
    expect(loadStock().length).toBe(0);
    expect(approveRequest(created.request.request_id, ADMIN.user_id).success).toBe(false);
    expect(requestReplenishment(payload({ createdBy: 999 })).success).toBe(false);
  });

  it('cancels pending and approved requests, but not received ones (FR-099)', () => {
    const pending = requestReplenishment(payload());
    expect(canCancelRequest(pending.request)).toBe(true);
    expect(cancelRequest(pending.request.request_id, ADMIN.user_id).request.status).toBe('cancelada');

    const request = approvedRequest();
    expect(canCancelRequest(request)).toBe(true);
    expect(cancelRequest(request.request_id, ADMIN.user_id).request.status).toBe('cancelada');
    expect(cancelRequest(request.request_id, ADMIN.user_id).success).toBe(false);
    expect(loadStock().length).toBe(0);
    expect(loadMovements().length).toBe(0);
  });

  it('receives using the HU-03 movement logic, increasing stock once (FR-098, FR-100)', () => {
    const request = approvedRequest();
    expect(receiveRequest(request.request_id, WAREHOUSE_MANAGER.user_id).success).toBe(true);

    const stored = getReplenishmentRequest(request.request_id);
    expect(stored.status).toBe('recibida');
    expect(stored.movement_id).toBe(loadMovements()[0].transaction_id);
    expect(stored.received_by).toBe(WAREHOUSE_MANAGER.user_id);
    expect(loadMovements()[0].transaction_type).toBe('entrada');
    expect(loadMovements()[0].user_id).toBe(WAREHOUSE_MANAGER.user_id);
    expect(loadStock()[0].quantity_available).toBe(request.quantity);
    expect(loadMovements().length).toBe(1);
  });

  it('rejects duplicate receptions and leaves stock unchanged (FR-100)', () => {
    const request = approvedRequest();
    receiveRequest(request.request_id, WAREHOUSE_MANAGER.user_id);
    const stockAfterFirst = loadStock()[0].quantity_available;
    const result = receiveRequest(request.request_id, WAREHOUSE_MANAGER.user_id);
    expect(result.success).toBe(false);
    expect(loadStock()[0].quantity_available).toBe(stockAfterFirst);
    expect(loadMovements().length).toBe(1);
  });

  it('does not receive a request that is not approved', () => {
    const created = requestReplenishment(payload());
    expect(receiveRequest(created.request.request_id, WAREHOUSE_MANAGER.user_id).success).toBe(false);
    expect(loadStock().length).toBe(0);
    expect(loadMovements().length).toBe(0);
  });

  it('blocks reception when the warehouse is inactive at delivery time', () => {
    const request = approvedRequest();
    saveWarehouses([WAREHOUSE, INACTIVE_WAREHOUSE].map(w => w.warehouse_id === 1 ? { ...w, status: 'inactivo' } : w));
    const result = receiveRequest(request.request_id, WAREHOUSE_MANAGER.user_id);
    expect(result.success).toBe(false);
    expect(getReplenishmentRequest(request.request_id).status).toBe('aprobada');
    expect(loadStock().length).toBe(0);
  });

  it('recalculates HU-06 alerts after a received replenishment (FR-101)', () => {
    setAlertStock();
    expect(listAlerts().length).toBe(1);
    const created = requestReplenishment(payload({ quantity: 4 }));
    approveRequest(created.request.request_id, ADMIN.user_id);
    expect(listAlerts().length).toBe(1);
    receiveRequest(created.request.request_id, WAREHOUSE_MANAGER.user_id);
    expect(loadStock()[0].quantity_available).toBe(6);
    expect(listAlerts().length).toBe(0);
  });

  it('filters by status, warehouse and product and computes indicators from stored data (FR-102)', () => {
    const first = requestReplenishment(payload());
    requestReplenishment(payload({ quantity: 2 }));
    approveRequest(first.request.request_id, ADMIN.user_id);
    receiveRequest(first.request.request_id, WAREHOUSE_MANAGER.user_id);

    expect(listReplenishments().length).toBe(2);
    expect(listReplenishments({ status: 'pendiente' }).length).toBe(1);
    expect(listReplenishments({ status: 'recibida' }).length).toBe(1);
    expect(listReplenishments({ warehouseId: WAREHOUSE.warehouse_id }).length).toBe(2);
    expect(listReplenishments({ warehouseId: INACTIVE_WAREHOUSE.warehouse_id }).length).toBe(0);
    expect(listReplenishments({ productId: PRODUCT.product_id }).length).toBe(2);
    expect(listReplenishments({ productId: 999 }).length).toBe(0);
    expect(replenishmentCounts()).toEqual({ pendiente: 1, aprobada: 0, recibida: 1, cancelada: 0, total: 2 });
  });

  it('enforces the proposed role permissions through the simulated permission layer', () => {
    expect(canAccessModule(SUPERVISOR.role, 'replenishments')).toBe(true);
    expect(canPerform(SUPERVISOR.role, 'replenishments.create')).toBe(true);
    expect(canPerform(SUPERVISOR.role, 'replenishments.approve')).toBe(false);
    expect(canPerform(ADMIN.role, 'replenishments.create')).toBe(true);
    expect(canPerform(ADMIN.role, 'replenishments.approve')).toBe(true);
    expect(canPerform(ADMIN.role, 'replenishments.cancel')).toBe(true);
    expect(canPerform(WAREHOUSE_MANAGER.role, 'replenishments.create')).toBe(false);
    expect(canPerform(WAREHOUSE_MANAGER.role, 'replenishments.receive')).toBe(true);
  });

  it('preserves unrelated product and warehouse catalogs', () => {
    requestReplenishment(payload());
    expect(loadProducts().length).toBe(1);
    expect(loadWarehouses().length).toBe(2);
  });
});
