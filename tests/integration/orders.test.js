import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { LOGISTICS_KEYS, loadMovements, loadOrders } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');
let dom;

function qs(id){ return document.getElementById(id); }
function submit(form){ form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }

function setupProductAndWarehouse(){
  qs('nav-products').click();
  qs('product-sku').value = 'SKU-1';
  qs('product-name').value = 'Producto 1';
  qs('product-category').value = '1';
  qs('product-sale-price').value = '1000';
  submit(qs('product-form'));
  qs('nav-warehouses').click();
  qs('warehouse-name').value = 'Bodega A';
  qs('warehouse-location').value = 'Santiago';
  submit(qs('warehouse-form'));
}

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot();
  setupProductAndWarehouse();
  qs('nav-movements').click();
});

afterEach(() => {
  dom.window.close();
});

function fillMovement({ type = 'entrada', quantity = '10' } = {}){
  qs('movement-type').value = type;
  qs('movement-product').value = '1';
  qs('movement-warehouse').value = '1';
  qs('movement-quantity').value = quantity;
}

describe('Órdenes generadas desde movimientos', () => {
  it('crea OC-0001 con entrada, la muestra en el historial y en el panel', () => {
    fillMovement({ type: 'entrada', quantity: '10' });
    submit(qs('movement-form'));
    expect(loadOrders().map(o => o.order_id)).toEqual(['OC-0001']);
    expect(loadMovements()[0].order_id).toBe('OC-0001');
    expect(qs('movement-list-body').textContent).toContain('OC-0001');
    expect(qs('order-list-body').textContent).toContain('OC-0001');
    expect(qs('order-list-body').textContent).toContain('Adquisición');
    expect(qs('order-count').textContent).toBe('1');
  });

  it('crea OV-0001 con salida y mantiene numeraciones independientes', () => {
    fillMovement({ type: 'entrada', quantity: '10' });
    submit(qs('movement-form'));
    fillMovement({ type: 'salida', quantity: '4' });
    submit(qs('movement-form'));
    expect(loadOrders().map(o => o.order_id)).toEqual(['OC-0001', 'OV-0001']);
    expect(qs('movement-list-body').textContent).toContain('OC-0001');
    expect(qs('movement-list-body').textContent).toContain('OV-0001');
    expect(qs('order-list-body').textContent).toContain('OV-0001');
    expect(qs('order-count').textContent).toBe('2');
  });

  it('no genera órdenes para ajustes de inventario', () => {
    fillMovement({ type: 'entrada', quantity: '10' });
    submit(qs('movement-form'));
    fillMovement({ type: 'ajuste_entrada', quantity: '2' });
    submit(qs('movement-form'));
    expect(loadOrders().map(o => o.order_id)).toEqual(['OC-0001']);
    expect(qs('order-count').textContent).toBe('1');
  });

  it('integra el panel dentro de Movimientos sin añadir opción al menú lateral', () => {
    const modules = [...document.querySelectorAll('.nav-module')].map(btn => btn.dataset.module);
    expect(modules).not.toContain('orders');
    expect(qs('view-movements').contains(qs('order-list-heading'))).toBe(true);
  });

  it('conserva movimientos previos sin orden y no les asigna identificador', () => {
    localStorage.setItem(LOGISTICS_KEYS.movements, JSON.stringify([{
      transaction_id: 40,
      product_id: 1,
      warehouse_id: 1,
      transaction_type: 'entrada',
      quantity: 7,
      user_id: 1,
      transaction_date: new Date().toISOString()
    }]));
    qs('nav-movements').click();
    expect(qs('movement-list-body').textContent).toContain('—');
    expect(qs('order-list-empty').hidden).toBe(false);
    expect(qs('order-count').textContent).toBe('0');
    expect(loadOrders()).toEqual([]);
  });

  it('muestra el error de almacenamiento y revierte movimiento, stock y orden', () => {
    const originalSetItem = dom.window.Storage.prototype.setItem;
    const spy = vi.spyOn(dom.window.Storage.prototype, 'setItem').mockImplementation(function(key, value){
      if(key === LOGISTICS_KEYS.orders) throw new Error('fallo de escritura de órdenes');
      return originalSetItem.call(this, key, value);
    });
    fillMovement({ type: 'entrada', quantity: '10' });
    submit(qs('movement-form'));
    spy.mockRestore();
    expect(qs('error-movement-storage')).not.toBeNull();
    expect(loadOrders()).toEqual([]);
    expect(loadMovements()).toEqual([]);
    expect(qs('error-movement-storage').textContent).toContain('fallo de escritura de órdenes');
    expect(qs('order-count').textContent).toBe('0');
  });
});
