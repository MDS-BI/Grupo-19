import { describe, it, expect, beforeEach } from 'vitest';
import {
  seedLogisticsCatalogs, loadProducts, loadWarehouses, loadStock, loadMovements,
  loadTransfers, saveProducts, loadProductCategories, loadUsers, LOGISTICS_KEYS
} from '../../src/storage.js';
import { loadDemoData, getDemoDataSummary } from '../../src/domain/demo-data.js';
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

  it('seeds coherent products, warehouses, stock, movements and transfers', () => {
    const result = loadDemoData();
    expect(result.success).toBe(true);
    expect(getDemoDataSummary()).toMatchObject({
      products: 10, warehouses: 4, stock: 28, movements: 51, transfers: 8
    });
    expect(loadStock().every(record => record.quantity_available >= 0)).toBe(true);
    expect(loadTransfers().filter(transfer => transfer.status === 'pendiente').length).toBe(3);
    expect(listAlerts().length).toBe(10);
  });

  it('does not duplicate records when executed again', () => {
    loadDemoData();
    const first = getDemoDataSummary();
    const second = loadDemoData();
    expect(second.alreadyLoaded).toBe(true);
    expect(getDemoDataSummary()).toEqual(first);
    expect(loadProducts().length).toBe(10);
    expect(loadWarehouses().length).toBe(4);
    expect(loadMovements().length).toBe(51);
    expect(loadTransfers().length).toBe(8);
  });

  it('preserves records that were not created by the demo loader', () => {
    saveProducts([{ product_id: 1, sku: 'OWN-1', product_name: 'Producto propio', status: 'activo' }]);
    loadDemoData();
    const own = loadProducts().find(product => product.sku === 'OWN-1');
    expect(own).toBeTruthy();
    expect(own.demo_batch).toBeUndefined();
    expect(loadProducts().length).toBe(11);
  });
});
