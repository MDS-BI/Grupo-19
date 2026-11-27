import { describe, it, expect, beforeEach } from 'vitest';
import {
  seedLogisticsCatalogs, loadProducts, loadWarehouses, loadStock, loadMovements,
  loadTransfers, loadOrders, loadShipments, saveProducts, loadProductCategories,
  loadUsers, LOGISTICS_KEYS
} from '../../src/storage.js';
import { loadDemoData, getDemoDataSummary, validateDemoSeed, isDemoDataLoaded } from '../../src/domain/demo-data.js';
import { DEMO_SEED } from '../../src/domain/demo-data.fixture.js';
import { listAlerts } from '../../src/domain/alerts.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

beforeEach(() => {
  store.clear();
  seedLogisticsCatalogs();
});

describe('demo fixture', () => {
  it('provides varied products and warehouses', () => {
    const skus = DEMO_SEED.products.map(product => product.sku);
    expect(skus.length).toBeGreaterThanOrEqual(20);
    expect(new Set(skus.map(sku => sku.toLowerCase())).size).toBe(skus.length);
    expect(new Set(DEMO_SEED.products.map(product => product.category))).toEqual(new Set([
      'Electrónica', 'Alimentos y Bebidas', 'Ferretería', 'Insumos de Oficina', 'Limpieza y Aseo'
    ]));
    expect(new Set(DEMO_SEED.products.map(product => product.salePrice)).size).toBe(skus.length);
    expect(new Set(DEMO_SEED.products.map(product => product.costPrice)).size).toBe(skus.length);
    expect(DEMO_SEED.warehouses).toHaveLength(4);
    expect(DEMO_SEED.warehouses.filter(warehouse => warehouse.status === 'activo')).toHaveLength(3);
    expect(new Set(DEMO_SEED.warehouses.map(warehouse => warehouse.location)).size).toBe(4);
    expect(DEMO_SEED.warehouses.some(warehouse => warehouse.status === 'inactivo')).toBe(true);
  });

  it('provides movements, transfers, orders and shipments in canonical states', () => {
    expect(DEMO_SEED.movements.length).toBeGreaterThanOrEqual(20);
    expect(new Set(DEMO_SEED.movements.map(movement => movement.type))).toEqual(new Set([
      'entrada', 'salida', 'ajuste_entrada', 'ajuste_salida'
    ]));
    expect(DEMO_SEED.transfers).toHaveLength(6);
    expect(new Set(DEMO_SEED.transfers.map(transfer => transfer.status))).toEqual(new Set([
      'recibida', 'pendiente', 'en_transito', 'cancelada', 'confirmada'
    ]));
    expect(DEMO_SEED.orderSpecs).toHaveLength(7);
    expect(new Set(DEMO_SEED.orderSpecs.map(order => order.status))).toEqual(new Set([
      'borrador', 'aprobada', 'en_proceso', 'completada', 'cancelada'
    ]));
    expect(DEMO_SEED.shipmentSpecs).toHaveLength(5);
    expect(new Set(DEMO_SEED.shipmentSpecs.map(shipment => shipment.status))).toEqual(new Set([
      'preparando', 'despachado', 'en_transito', 'entregado', 'con_incidencia'
    ]));
    const movementTypes = new Map(DEMO_SEED.movements.map(movement => [movement.key, movement.type]));
    expect(DEMO_SEED.orderSpecs.every(order => movementTypes.get(order.movementKey) === 'salida')).toBe(true);
  });
});

describe('demo data loader', () => {
  it('reuses the existing categories and users from the seed', () => {
    expect(loadProductCategories().map(category => category.category_name)).toEqual([
      'Electrónica', 'Alimentos y Bebidas', 'Ferretería', 'Insumos de Oficina', 'Limpieza y Aseo'
    ]);
    expect(loadUsers().map(user => user.user_name)).toContain('Tomás Wiegand');
    expect(loadUsers().map(user => user.user_name)).toContain('Sebastián Quispe');
  });

  it('assigns demo warehouses by role and catalogue order, not by name (FR-151)', () => {
    localStorage.setItem(LOGISTICS_KEYS.users, JSON.stringify([
      { user_id: 1, user_name: 'Millaray Antileo', role: 'administrador', email: 'millaray.antileo@empresa.cl' },
      { user_id: 2, user_name: 'Tomás Wiegand', role: 'encargado_bodega', email: 'tomas.wiegand@empresa.cl' },
      { user_id: 3, user_name: 'Yasmina Haddad', role: 'supervisor_inventario', email: 'yasmina.haddad@empresa.cl' },
      { user_id: 4, user_name: 'Sebastián Quispe', role: 'encargado_bodega', email: 'sebastian.quispe@empresa.cl' }
    ]));

    expect(loadDemoData().success).toBe(true);
    const warehouses = loadWarehouses();
    expect(warehouses.find(warehouse => warehouse.name === 'Bodega Central Santiago').responsable_id).toBe(2);
    expect(warehouses.find(warehouse => warehouse.name === 'Bodega Valparaíso').responsable_id).toBe(4);
  });

  it('seeds coherent products, warehouses, stock, movements, transfers, orders and shipments', () => {
    const result = loadDemoData();
    expect(result.success).toBe(true);
    expect(result.alreadyLoaded).toBe(false);
    expect(isDemoDataLoaded()).toBe(true);
    expect(result.added).toMatchObject({ warehouses: 4, transfers: 6, orders: 7, shipments: 5 });
    expect(result.summary).toMatchObject({ loaded: true, warehouses: 4, transfers: 6, orders: 7, shipments: 5 });
    expect(result.summary.products).toBeGreaterThanOrEqual(20);
    expect(result.summary.movements).toBeGreaterThanOrEqual(20);
    expect(getDemoDataSummary()).toEqual(result.summary);
    expect(loadProducts().every(product => product.demo_batch === 'logistics-demo-v1')).toBe(true);
    expect(loadStock().every(record => record.quantity_available >= 0)).toBe(true);
    expect(loadOrders().every(order => order.transaction_id)).toBe(true);
    expect(loadShipments().every(shipment => shipment.history.length === 1)).toBe(true);
  });

  it('derives stock from movements and effective transfers, including a zero balance', () => {
    expect(loadDemoData().success).toBe(true);
    const products = loadProducts();
    const warehouses = loadWarehouses();
    const stock = loadStock();
    const sku = (id) => products.find(product => product.product_id === id)?.sku;
    const warehouseName = (id) => warehouses.find(warehouse => warehouse.warehouse_id === id)?.name;
    const balance = (productSku, name) => stock.find(record =>
      sku(record.product_id) === productSku && warehouseName(record.warehouse_id) === name
    )?.quantity_available;

    expect(balance('DEMO-CAB-009', 'Bodega Central Santiago')).toBe(0);
    expect(balance('DEMO-CAF-003', 'Bodega Central Santiago')).toBe(40);
    expect(balance('DEMO-CAF-003', 'Bodega Valparaíso')).toBe(30);
    expect(balance('DEMO-GUA-006', 'Bodega Concepción')).toBe(29);
    expect(balance('DEMO-GUA-006', 'Bodega Central Santiago')).toBe(20);
    expect(listAlerts().length).toBeGreaterThanOrEqual(1);
  });

  it('keeps cancelled transfers without stock effects or movements', () => {
    expect(loadDemoData().success).toBe(true);
    const transfers = loadTransfers();
    const cancelled = transfers.find(transfer => transfer.status === 'cancelada');
    expect(cancelled).toBeTruthy();
    expect(cancelled.confirmed_by).toBeUndefined();
    expect(cancelled.cancelled_by).toBeTruthy();
    expect(loadMovements().some(movement => movement.demo_key === cancelled.demo_key)).toBe(false);
    expect(loadTransfers().filter(transfer => transfer.status === 'confirmada')[0].confirmed_by).toBeTruthy();

    const products = loadProducts();
    const warehouses = loadWarehouses();
    const stock = loadStock();
    const productId = products.find(product => product.sku === 'DEMO-MOU-002').product_id;
    const quantityAt = (name) => stock.find(record =>
      record.product_id === productId
      && warehouses.find(warehouse => warehouse.warehouse_id === record.warehouse_id)?.name === name
    ).quantity_available;
    expect(quantityAt('Bodega Central Santiago')).toBe(35);
    expect(quantityAt('Bodega Valparaíso')).toBe(15);
  });

  it('keeps shipments compatible with their orders and leaves non-shippable orders empty', () => {
    expect(loadDemoData().success).toBe(true);
    const orders = loadOrders();
    const shipments = loadShipments();
    const byId = new Map(orders.map(order => [order.order_id, order]));
    const shipped = new Set(shipments.map(shipment => shipment.order_id));

    expect(new Set(orders.map(order => order.status))).toEqual(new Set([
      'borrador', 'aprobada', 'en_proceso', 'completada', 'cancelada'
    ]));
    expect(new Set(shipments.map(shipment => shipment.status))).toEqual(new Set([
      'preparando', 'despachado', 'en_transito', 'entregado', 'con_incidencia'
    ]));
    expect(shipped.size).toBe(shipments.length);
    expect(shipped.size).toBeLessThan(orders.length);
    for(const order of orders.filter(item => ['borrador', 'cancelada'].includes(item.status))){
      expect(shipped.has(order.order_id)).toBe(false);
    }
    for(const shipment of shipments){
      const order = byId.get(shipment.order_id);
      expect(order).toBeTruthy();
      expect(['borrador', 'cancelada']).not.toContain(order.status);
      expect(order.order_type).toBe('venta');
      if(shipment.status === 'entregado'){
        expect(['aprobada', 'en_proceso', 'completada']).toContain(order.status);
      }
      if(shipment.status === 'con_incidencia'){
        expect(['aprobada', 'en_proceso']).toContain(order.status);
      }
    }
  });

  it('validates the seeded batch', () => {
    expect(validateDemoSeed()).toEqual(['No hay datos de demostración cargados']);
    expect(loadDemoData().success).toBe(true);
    expect(validateDemoSeed()).toEqual([]);
  });

  it('does not duplicate records when executed again', () => {
    loadDemoData();
    const first = getDemoDataSummary();
    const second = loadDemoData();
    expect(second.success).toBe(true);
    expect(second.alreadyLoaded).toBe(true);
    expect(getDemoDataSummary()).toEqual(first);
    expect(loadProducts().length).toBe(first.products);
    expect(loadWarehouses().length).toBe(4);
    expect(loadMovements().length).toBe(first.movements);
    expect(loadTransfers().length).toBe(6);
    expect(loadOrders().length).toBe(7);
    expect(loadShipments().length).toBe(5);
  });

  it('preserves records that were not created by the demo loader', () => {
    saveProducts([{ product_id: 1, sku: 'OWN-1', product_name: 'Producto propio', status: 'activo' }]);
    expect(loadDemoData().success).toBe(true);
    const own = loadProducts().find(product => product.sku === 'OWN-1');
    expect(own).toBeTruthy();
    expect(own.demo_batch).toBeUndefined();
    expect(loadProducts().length).toBe(DEMO_SEED.products.length + 1);
    expect(validateDemoSeed()).toEqual([]);
  });
});
