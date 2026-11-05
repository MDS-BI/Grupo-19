import { describe, it, expect, beforeEach } from 'vitest';
import { saveUsers, loadWarehouses } from '../../src/storage.js';
import { createWarehouse, updateWarehouse, setWarehouseStatus, listActiveWarehouses, searchWarehouses } from '../../src/domain/warehouses.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const USER = { user_id: 1, user_name: 'Carlos', role: 'encargado_bodega', email: 'carlos@empresa.cl' };

beforeEach(() => {
  store.clear();
  saveUsers([USER]);
});

describe('warehouses domain', () => {
  it('requires name and location (FR-060)', () => {
    const result = createWarehouse({ name: '', location: '' });
    expect(result.success).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.location).toBeDefined();
  });

  it('rejects a duplicate warehouse name (FR-064)', () => {
    createWarehouse({ name: 'Bodega Central', location: 'Santiago' });
    const result = createWarehouse({ name: 'bodega central', location: 'Valparaíso' });
    expect(result.success).toBe(false);
    expect(result.errors.name).toContain('Ya existe');
  });

  it('rejects a negative capacity', () => {
    const result = createWarehouse({ name: 'Bodega Norte', location: 'Antofagasta', capacity: '-5' });
    expect(result.success).toBe(false);
    expect(result.errors.capacity).toBeDefined();
  });

  it('defaults status to "activo" on creation', () => {
    const result = createWarehouse({ name: 'Bodega Sur', location: 'Concepción' });
    expect(result.warehouse.status).toBe('activo');
  });

  it('allows editing name, location and responsable (FR-061)', () => {
    const created = createWarehouse({ name: 'Bodega A', location: 'A' }).warehouse;
    const result = updateWarehouse(created.warehouse_id, { name: 'Bodega A2', location: 'A2', responsableId: String(USER.user_id) });
    expect(result.success).toBe(true);
    expect(result.warehouse.name).toBe('Bodega A2');
    expect(result.warehouse.responsable_id).toBe(USER.user_id);
  });

  it('toggles status between activo/inactivo (FR-062)', () => {
    const created = createWarehouse({ name: 'Bodega B', location: 'B' }).warehouse;
    setWarehouseStatus(created.warehouse_id, 'inactivo');
    expect(loadWarehouses()[0].status).toBe('inactivo');
  });

  it('excludes inactive warehouses from operational selectors (FR-063)', () => {
    const a = createWarehouse({ name: 'Activa', location: 'X' }).warehouse;
    const b = createWarehouse({ name: 'Inactiva', location: 'Y' }).warehouse;
    setWarehouseStatus(b.warehouse_id, 'inactivo');
    const active = listActiveWarehouses();
    expect(active.map(w => w.warehouse_id)).toEqual([a.warehouse_id]);
  });

  it('searches by name and location', () => {
    createWarehouse({ name: 'Bodega Central', location: 'Santiago' });
    createWarehouse({ name: 'Bodega Norte', location: 'Antofagasta' });
    expect(searchWarehouses('central').length).toBe(1);
    expect(searchWarehouses('antofagasta').length).toBe(1);
    expect(searchWarehouses('').length).toBe(2);
  });
});
