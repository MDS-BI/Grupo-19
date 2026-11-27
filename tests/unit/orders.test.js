import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LOGISTICS_KEYS, loadMovements, loadOrders, loadStock,
  saveOrders, saveProducts, saveUsers, saveWarehouses
} from '../../src/storage.js';
import { registerMovement } from '../../src/domain/movements.js';
import { createOrderForMovement, listOrders, nextOrderId } from '../../src/domain/orders.js';
import { approveRequest, receiveRequest, requestReplenishment } from '../../src/domain/replenishments.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const PRODUCT = { product_id: 1, sku: 'SKU-1', product_name: 'Producto 1', status: 'activo' };
const WAREHOUSE = { warehouse_id: 1, name: 'Bodega A', status: 'activo' };
const USER = { user_id: 1, user_name: 'Carlos', role: 'encargado_bodega' };

function payload(overrides = {}){
  return { type: 'entrada', productId: 1, warehouseId: 1, quantity: 5, userId: 1, ...overrides };
}

beforeEach(() => {
  store.clear();
  saveProducts([PRODUCT]);
  saveWarehouses([WAREHOUSE]);
  saveUsers([USER]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('orders domain', () => {
  it('creates OC-0001 for a normal entrada and links it to the movement', () => {
    const result = registerMovement(payload());
    expect(result.success).toBe(true);
    expect(result.movement.order_id).toBe('OC-0001');
    expect(loadMovements()[0].order_id).toBe('OC-0001');
    expect(loadOrders()).toEqual([{
      order_id: 'OC-0001',
      order_type: 'adquisicion',
      transaction_id: result.movement.transaction_id,
      product_id: 1,
      warehouse_id: 1,
      quantity: 5,
      user_id: 1,
      order_date: result.movement.transaction_date,
      status: 'aprobada'
    }]);
    expect(loadStock()[0].quantity_available).toBe(5);
  });

  it('creates OV-0001 for a normal salida with independent numbering', () => {
    registerMovement(payload());
    const sale = registerMovement(payload({ type: 'salida', quantity: 2 }));
    expect(sale.movement.order_id).toBe('OV-0001');
    expect(loadOrders().map(o => o.order_id)).toEqual(['OC-0001', 'OV-0001']);
    expect(registerMovement(payload()).movement.order_id).toBe('OC-0002');
    expect(registerMovement(payload({ type: 'salida', quantity: 1 })).movement.order_id).toBe('OV-0002');
  });

  it('continues numbering after gaps and never reuses an existing order id', () => {
    saveOrders([
      { order_id: 'OC-0001' },
      { order_id: 'OC-0003' },
      { order_id: 'OV-0002' }
    ]);
    expect(nextOrderId('entrada')).toBe('OC-0004');
    expect(nextOrderId('salida')).toBe('OV-0003');
  });

  it('does not create orders for adjustments or replenishment receipts', () => {
    registerMovement(payload({ type: 'ajuste_entrada' }));
    registerMovement(payload({ type: 'ajuste_salida', quantity: 1 }));
    const request = requestReplenishment({ productId: 1, warehouseId: 1, quantity: 3, createdBy: 1 });
    approveRequest(request.request.request_id, 1);
    const received = receiveRequest(request.request.request_id, 1);
    expect(received.success).toBe(true);
    expect(loadOrders()).toEqual([]);
    expect(loadMovements().every(m => !m.order_id)).toBe(true);
  });

  it('is idempotent when an order is requested twice for the same movement', () => {
    const movement = { transaction_id: 77, product_id: 1, warehouse_id: 1, quantity: 4, user_id: 1, transaction_type: 'entrada', transaction_date: '2026-11-23T00:00:00.000Z' };
    const first = createOrderForMovement(movement);
    const second = createOrderForMovement(movement);
    expect(second).toEqual(first);
    expect(loadOrders()).toHaveLength(1);
  });

  it('rejects an order that does not satisfy the orders schema', () => {
    const movement = { transaction_id: 77, product_id: 1, warehouse_id: 1, quantity: 4, user_id: 1, transaction_type: 'entrada', transaction_date: '2026-11-23T00:00:00.000Z' };
    delete movement.warehouse_id;
    expect(() => createOrderForMovement(movement)).toThrow(/warehouse_id/);
    expect(loadOrders()).toEqual([]);
  });

  it('rolls back stock, movement and order when writing orders fails', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if(key === LOGISTICS_KEYS.orders) throw new Error('fallo de escritura de órdenes');
      return originalSetItem(key, value);
    });
    const result = registerMovement(payload());
    spy.mockRestore();
    expect(result.success).toBe(false);
    expect(loadStock()).toEqual([]);
    expect(loadMovements()).toEqual([]);
    expect(loadOrders()).toEqual([]);
  });

  it('rolls back the order when writing the movement history fails', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if(key === LOGISTICS_KEYS.movements) throw new Error('fallo de escritura de movimientos');
      return originalSetItem(key, value);
    });
    const result = registerMovement(payload());
    spy.mockRestore();
    expect(result.success).toBe(false);
    expect(loadStock()).toEqual([]);
    expect(loadOrders()).toEqual([]);
  });

  it('updates stock exactly once per movement', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const writes = [];
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      writes.push(key);
      return originalSetItem(key, value);
    });
    registerMovement(payload());
    spy.mockRestore();
    expect(writes.filter(key => key === LOGISTICS_KEYS.stock)).toHaveLength(1);
  });

  it('preserves existing localStorage data when generating an order', () => {
    saveOrders([{ order_id: 'OC-0001', transaction_id: 900, legacy: true }]);
    localStorage.setItem(LOGISTICS_KEYS.movements, JSON.stringify([{
      transaction_id: 900,
      product_id: 1,
      warehouse_id: 1,
      transaction_type: 'entrada',
      quantity: 1,
      user_id: 1,
      transaction_date: '2026-01-01T00:00:00.000Z',
      order_id: 'OC-0001'
    }]));
    localStorage.setItem('logistics:legacy-check', 'conservar');
    registerMovement(payload());
    expect(localStorage.getItem('logistics:legacy-check')).toBe('conservar');
    expect(loadOrders().map(o => o.order_id)).toEqual(['OC-0001', 'OC-0002']);
    expect(loadOrders()[0].legacy).toBe(true);
  });

  it('lists orders with product and warehouse names', () => {
    registerMovement(payload());
    expect(listOrders()[0]).toMatchObject({
      order_id: 'OC-0001',
      product_name: 'Producto 1',
      warehouse_name: 'Bodega A'
    });
  });

  it('places legacy transaction ids after numeric ids when listing orders', () => {
    saveOrders([
      { order_id: 'OC-0001', transaction_id: 'legacy', product_id: 1, warehouse_id: 1, quantity: 1, user_id: 1, order_date: '2026-11-23T00:00:00.000Z' },
      { order_id: 'OC-0002', transaction_id: 12, product_id: 1, warehouse_id: 1, quantity: 2, user_id: 1, order_date: '2026-11-23T00:00:01.000Z' },
      { order_id: 'OV-0001', transaction_id: 7, product_id: 1, warehouse_id: 1, quantity: 3, user_id: 1, order_date: '2026-11-23T00:00:02.000Z' }
    ]);
    expect(listOrders().map(order => order.order_id)).toEqual(['OC-0002', 'OV-0001', 'OC-0001']);
  });
});
