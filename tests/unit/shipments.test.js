import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadOrders,
  saveOrders,
  loadShipments,
  saveMovements,
  saveStock,
  saveUsers,
  LOGISTICS_KEYS
} from '../../src/storage.js';
import { createShipment, advanceShipmentStatus, listShipments } from '../../src/domain/shipments.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

const USERS = [
  { user_id: 1, user_name: 'Ana', role: 'administrador' },
  { user_id: 2, user_name: 'Carlos', role: 'encargado_bodega' }
];

const ORDERS = [
  { order_id: 'OV-0001', order_type: 'venta', transaction_id: 10, product_id: 1, warehouse_id: 1, quantity: 2, user_id: 1, order_date: '2026-11-23T09:00:00.000Z' },
  { order_id: 'OV-0002', order_type: 'venta', transaction_id: 11, product_id: 1, warehouse_id: 1, quantity: 3, user_id: 1, order_date: '2026-11-23T09:30:00.000Z' },
  { order_id: 'OC-0001', order_type: 'adquisicion', transaction_id: 12, product_id: 1, warehouse_id: 1, quantity: 5, user_id: 1, order_date: '2026-11-23T08:00:00.000Z' }
];

function payload(overrides = {}){
  return { orderId: 'OV-0001', carrier: 'Fast Courier', trackingCode: 'TRACK-ALPHA', createdBy: 1, ...overrides };
}

function snapshot(){
  return JSON.stringify({
    shipments: loadShipments(),
    orders: loadOrders(),
    movements: localStorage.getItem(LOGISTICS_KEYS.movements),
    stock: localStorage.getItem(LOGISTICS_KEYS.stock)
  });
}

beforeEach(() => {
  store.clear();
  saveUsers(USERS);
  saveOrders(ORDERS);
  saveMovements([]);
  saveStock([]);
});

describe('shipments domain', () => {
  it('creates a shipment for an existing OV with an initial en_bodega history event (T120, FR-130, FR-131)', () => {
    const result = createShipment(payload());
    expect(result.success).toBe(true);
    expect(result.shipment).toMatchObject({
      shipment_id: 1,
      order_id: 'OV-0001',
      carrier: 'Fast Courier',
      tracking_code: 'TRACK-ALPHA',
      status: 'en_bodega',
      created_by: 1
    });
    expect(result.shipment.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.shipment.history).toHaveLength(1);
    expect(result.shipment.history[0]).toMatchObject({ status: 'en_bodega', changed_by: 1 });
    expect(result.shipment.history[0].changed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(loadShipments()).toEqual([result.shipment]);
  });

  it('rejects OC orders, duplicate OVs, invalid users and empty text without writing (T120, FR-131, FR-132)', () => {
    const before = snapshot();
    expect(createShipment(payload({ orderId: 'OC-0001' })).success).toBe(false);
    expect(createShipment(payload({ orderId: 'OV-9999' })).success).toBe(false);
    expect(createShipment(payload({ createdBy: 999 })).success).toBe(false);
    expect(createShipment(payload({ carrier: '  ' })).success).toBe(false);
    expect(createShipment(payload({ trackingCode: '  ' })).success).toBe(false);
    expect(snapshot()).toBe(before);

    const created = createShipment(payload());
    expect(created.success).toBe(true);
    const afterCreate = snapshot();
    expect(createShipment(payload()).success).toBe(false);
    expect(loadShipments()).toHaveLength(1);
    expect(snapshot()).toBe(afterCreate);
  });

  it('advances only to the immediate next status and records actor and ISO history (T120, FR-132)', () => {
    const created = createShipment(payload()).shipment;
    const first = advanceShipmentStatus(created.shipment_id, 2);
    expect(first.success).toBe(true);
    expect(first.shipment.status).toBe('en_transito');
    expect(first.shipment.history).toHaveLength(2);
    expect(first.shipment.history[1]).toMatchObject({ status: 'en_transito', changed_by: 2 });

    const second = advanceShipmentStatus(created.shipment_id, 1);
    const third = advanceShipmentStatus(created.shipment_id, 2);
    expect(second.shipment.status).toBe('en_reparto');
    expect(third.shipment.status).toBe('entregado');
    expect(third.shipment.history.map(event => event.status)).toEqual([
      'en_bodega', 'en_transito', 'en_reparto', 'entregado'
    ]);
    expect(third.shipment.history.every(event => /^\d{4}-\d{2}-\d{2}T/.test(event.changed_at))).toBe(true);
  });

  it('rejects skipped, repeated, backward and terminal transitions without partial writes (T120, FR-132)', () => {
    const created = createShipment(payload()).shipment;
    let before = snapshot();
    expect(advanceShipmentStatus(created.shipment_id, 1, 'en_reparto').success).toBe(false);
    expect(advanceShipmentStatus(created.shipment_id, 1, 'en_bodega').success).toBe(false);
    expect(advanceShipmentStatus(created.shipment_id, 999).success).toBe(false);
    expect(snapshot()).toBe(before);

    expect(advanceShipmentStatus(created.shipment_id, 1).success).toBe(true);
    before = snapshot();
    expect(advanceShipmentStatus(created.shipment_id, 1, 'en_transito').success).toBe(false);
    expect(snapshot()).toBe(before);

    advanceShipmentStatus(created.shipment_id, 1);
    advanceShipmentStatus(created.shipment_id, 1);
    before = snapshot();
    expect(advanceShipmentStatus(created.shipment_id, 1).success).toBe(false);
    expect(advanceShipmentStatus(created.shipment_id, 2, 'entregado').success).toBe(false);
    expect(snapshot()).toBe(before);
  });

  it('lists shipments by partial order id, partial tracking code and exact status (T120, FR-130)', () => {
    createShipment(payload());
    createShipment(payload({ orderId: 'OV-0002', trackingCode: 'OTRO-BETA' }));
    advanceShipmentStatus(1, 2);

    expect(listShipments().map(s => s.shipment_id)).toEqual([2, 1]);
    expect(listShipments({ orderId: 'ov-000' }).map(s => s.shipment_id)).toEqual([2, 1]);
    expect(listShipments({ orderId: '0001' }).map(s => s.shipment_id)).toEqual([1]);
    expect(listShipments({ trackingCode: 'beta' }).map(s => s.shipment_id)).toEqual([2]);
    expect(listShipments({ term: 'ALPHA' }).map(s => s.shipment_id)).toEqual([1]);
    expect(listShipments({ status: 'en_transito' }).map(s => s.shipment_id)).toEqual([1]);
    expect(listShipments({ status: 'en_bodega', trackingCode: 'beta' }).map(s => s.shipment_id)).toEqual([2]);
  });

  it('does not modify orders, movements or stock when creating and advancing shipments (T120, FR-130, FR-132)', () => {
    const before = snapshot();
    const created = createShipment(payload());
    advanceShipmentStatus(created.shipment.shipment_id, 2);
    const after = JSON.parse(snapshot());
    const beforeParsed = JSON.parse(before);
    expect(after.orders).toEqual(beforeParsed.orders);
    expect(after.movements).toBe(beforeParsed.movements);
    expect(after.stock).toBe(beforeParsed.stock);
  });
});
