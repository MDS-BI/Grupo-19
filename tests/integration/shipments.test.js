import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  loadShipments,
  loadOrders,
  loadStock,
  loadMovements,
  LOGISTICS_KEYS
} from '../../src/storage.js';
import { setRolePermission } from '../../src/domain/permissions.js';
import { loadDemoData } from '../../src/domain/demo-data.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function submit(form){ form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }
function change(el){ el.dispatchEvent(new dom.window.Event('change', { bubbles: true })); }
function input(el){ el.dispatchEvent(new dom.window.Event('input', { bubbles: true })); }

function setControl(id, value, eventName){
  const el = qs(id);
  el.value = value;
  if(eventName === 'change') change(el);
  else input(el);
}

function attachGlobals(window){
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  window.scrollTo = vi.fn();
}

async function bootApp(){
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot();
}

function createProductAndWarehouses(){
  qs('nav-products').click();
  qs('product-sku').value = 'SKU-1';
  qs('product-name').value = 'Producto 1';
  qs('product-category').value = '1';
  qs('product-sale-price').value = '1000';
  submit(qs('product-form'));

  qs('nav-warehouses').click();
  qs('warehouse-name').value = 'Origen';
  qs('warehouse-location').value = 'Santiago';
  submit(qs('warehouse-form'));
  qs('warehouse-name').value = 'Destino';
  qs('warehouse-location').value = 'Valparaíso';
  submit(qs('warehouse-form'));
}

function registerMovement(type, quantity){
  qs('nav-movements').click();
  qs('movement-type').value = type;
  qs('movement-product').value = '1';
  qs('movement-warehouse').value = '1';
  qs('movement-quantity').value = String(quantity);
  submit(qs('movement-form'));
}

function setupSaleOrders(){
  createProductAndWarehouses();
  registerMovement('entrada', 10);
  registerMovement('salida', 2);
  registerMovement('salida', 1);
}

function openShipments(){
  window.location.hash = '#/shipments';
  window.dispatchEvent(new dom.window.Event('hashchange'));
}

function registerShipment({ orderId = 'OV-0001', carrier = 'Fast Courier', trackingCode = 'TRK-001' } = {}){
  openShipments();
  qs('shipment-order').value = orderId;
  qs('shipment-carrier').value = carrier;
  qs('shipment-tracking-code').value = trackingCode;
  submit(qs('shipment-form'));
}

function advanceButton(){
  return [...qs('shipment-list-body').querySelectorAll('button')]
    .find(button => /Avanzar/i.test(button.textContent));
}

function advanceAsWarehouseManager(){
  const select = qs('active-user-select');
  select.value = '2';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  openShipments();
  advanceButton().click();
}

function operationalSnapshot(){
  return JSON.stringify({
    orders: loadOrders(),
    stock: loadStock(),
    movements: loadMovements()
  });
}

function shippingSnapshot(){
  return JSON.stringify({
    shipments: loadShipments(),
    orders: loadOrders(),
    stock: loadStock(),
    movements: loadMovements()
  });
}

async function rebootPreservingStorage(){
  const saved = {};
  for(let i = 0; i < localStorage.length; i += 1){
    const key = localStorage.key(i);
    saved[key] = localStorage.getItem(key);
  }
  dom.window.close();
  dom = new JSDOM(html, { url: 'http://localhost/' });
  attachGlobals(dom.window);
  Object.entries(saved).forEach(([key, value]) => localStorage.setItem(key, value));
  await bootApp();
}

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  attachGlobals(dom.window);
  dom.window.localStorage.clear();
  await bootApp();
  setupSaleOrders();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 11 - buyer shipment tracking', () => {
  it('opens #/shipments, offers only eligible OVs and renders the new shipment with history (T121, FR-133)', () => {
    openShipments();
    expect(qs('view-shipments').hidden).toBe(false);
    const values = [...qs('shipment-order').options].map(option => option.value).filter(Boolean);
    expect(values).toContain('OV-0001');
    expect(values).toContain('OV-0002');
    expect(values).not.toContain('OC-0001');

    registerShipment({ carrier: '<Courier>', trackingCode: 'TRK-001' });
    expect(loadShipments()).toHaveLength(1);
    expect(qs('shipment-count').textContent).toBe('1');
    const listText = qs('shipment-list-body').textContent;
    expect(listText).toContain('OV-0001');
    expect(listText).toContain('<Courier>');
    expect(listText).toContain('TRK-001');
    expect(listText).toContain('En bodega');
    expect(listText).toContain('Millaray Antileo');
    expect(qs('shipment-list-body').querySelector('img')).toBeNull();
  });

  it('rejects a second shipment for the same OV and removes shipped OVs from the selector (T121, FR-131)', () => {
    registerShipment();
    const afterFirst = shippingSnapshot();
    openShipments();
    const values = [...qs('shipment-order').options].map(option => option.value).filter(Boolean);
    expect(values).not.toContain('OV-0001');
    expect(values).toContain('OV-0002');

    qs('shipment-order').value = 'OV-0001';
    qs('shipment-carrier').value = 'Otro Courier';
    qs('shipment-tracking-code').value = 'TRK-002';
    submit(qs('shipment-form'));
    expect(qs('error-shipment-orderId').textContent).not.toBe('');
    expect(loadShipments()).toHaveLength(1);
    expect(shippingSnapshot()).toBe(afterFirst);
  });

  it('advances sequentially with visible labels and history, filters by OV/code/status and makes no HTTP calls (T121, FR-132)', () => {
    const before = operationalSnapshot();
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    globalThis.fetch = fetchSpy;
    globalThis.XMLHttpRequest = xhrSpy;
    dom.window.fetch = fetchSpy;
    dom.window.XMLHttpRequest = xhrSpy;

    registerShipment();
    expect(advanceButton()).not.toBeNull();
    expect(qs('shipment-list-body').textContent).toContain('En bodega');

    advanceAsWarehouseManager();
    expect(qs('shipment-list-body').textContent).toContain('En tránsito');
    advanceAsWarehouseManager();
    expect(qs('shipment-list-body').textContent).toContain('En reparto');
    advanceAsWarehouseManager();
    expect(qs('shipment-list-body').textContent).toContain('Entregado');
    expect(advanceButton()).toBeUndefined();
    expect(qs('shipment-list-body').textContent).toContain('Tomás Wiegand');

    setControl('shipment-search', 'trk-001', 'input');
    expect(qs('shipment-count').textContent).toBe('1');
    setControl('shipment-search', 'ov-000', 'input');
    expect(qs('shipment-count').textContent).toBe('1');
    setControl('shipment-search', '', 'input');
    setControl('shipment-filter-status', 'en_bodega', 'change');
    expect(qs('shipment-count').textContent).toBe('0');
    expect(qs('shipment-list-empty').hidden).toBe(false);
    setControl('shipment-filter-status', 'entregado', 'change');
    expect(qs('shipment-count').textContent).toBe('1');
    expect(qs('shipment-list-empty').hidden).toBe(true);

    expect(operationalSnapshot()).toBe(before);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(LOGISTICS_KEYS.shipments)).not.toBeNull();
  });

  it('hides the update action when action:shipments.update_status is denied (T121, FR-130)', () => {
    registerShipment();
    expect(advanceButton()).not.toBeNull();
    expect(setRolePermission('administrador', 'accion', 'action:shipments.update_status', false).success).toBe(true);
    window.location.hash = '#/movements';
    window.dispatchEvent(new dom.window.Event('hashchange'));
    openShipments();
    expect(advanceButton()).toBeUndefined();
  });

  it('denies module:shipments and redirects a direct hash route to the role landing (T121, FR-133)', () => {
    expect(setRolePermission('administrador', 'modulo', 'module:shipments', false).success).toBe(true);
    openShipments();
    expect(qs('access-notice').hidden).toBe(false);
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('view-shipments').hidden).toBe(true);
    expect(qs('nav-shipments')).toBeNull();
  });

  it('persists shipments and history after reload without changing operational data (T121, FR-133)', async () => {
    registerShipment();
    advanceAsWarehouseManager();
    const before = operationalSnapshot();

    await rebootPreservingStorage();
    openShipments();
    expect(qs('shipment-count').textContent).toBe('1');
    expect(qs('shipment-list-body').textContent).toContain('OV-0001');
    expect(qs('shipment-list-body').textContent).toContain('En tránsito');
    expect(qs('shipment-list-body').textContent).toContain('Millaray Antileo');
    expect(qs('shipment-list-body').textContent).toContain('Tomás Wiegand');
    expect(operationalSnapshot()).toBe(before);
  });
});

describe('Estados canónicos de envíos sembrados', () => {
  beforeEach(() => {
    localStorage.clear();
    loadDemoData();
    openShipments();
  });

  it('muestra los cinco estados canónicos y mantiene los aliases legacy en el filtro', () => {
    const statuses = loadShipments().map(shipment => shipment.status);
    expect(statuses).toEqual(expect.arrayContaining(['preparando', 'despachado', 'en_transito', 'entregado', 'con_incidencia']));
    const listText = qs('shipment-list-body').textContent;
    ['Preparando', 'Despachado', 'En tránsito', 'Entregado', 'Con incidencia'].forEach(label => {
      expect(listText).toContain(label);
    });
    const options = [...qs('shipment-filter-status').options].map(option => option.value);
    ['preparando', 'despachado', 'en_transito', 'entregado', 'con_incidencia', 'en_bodega', 'en_reparto'].forEach(status => {
      expect(options).toContain(status);
    });
  });

  it('conserva historial y solo asocia envíos a órdenes de venta compatibles', () => {
    const shipments = loadShipments();
    expect(shipments.length).toBeGreaterThan(0);
    expect(shipments.every(shipment => Array.isArray(shipment.history) && shipment.history.length > 0)).toBe(true);
    const orders = new Map(loadOrders().map(order => [String(order.order_id), order]));
    for(const shipment of shipments){
      const order = orders.get(String(shipment.order_id));
      expect(order).toBeDefined();
      expect(order.order_type).toBe('venta');
      expect(['borrador', 'cancelada']).not.toContain(order.status);
    }
  });
});
