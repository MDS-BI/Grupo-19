import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadMovements, loadStock } from '../../src/storage.js';

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
  qs('product-user').value = '1';
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

function fillMovement({ type = 'entrada', quantity = '10', userId = '1' } = {}){
  qs('movement-type').value = type;
  qs('movement-product').value = '1';
  qs('movement-warehouse').value = '1';
  qs('movement-quantity').value = quantity;
  qs('movement-user').value = userId;
}

describe('User Story 3 - register inventory entries and exits', () => {
  it('registers an entrada that creates stock and appears in the history (FR-053)', () => {
    fillMovement({ type: 'entrada', quantity: '10' });
    submit(qs('movement-form'));
    expect(loadMovements().length).toBe(1);
    expect(loadStock()[0].quantity_available).toBe(10);
    expect(qs('movement-list-body').textContent).toContain('Producto 1');
  });

  it('registers a salida that discounts available stock (FR-053)', () => {
    fillMovement({ type: 'entrada', quantity: '10' });
    submit(qs('movement-form'));
    fillMovement({ type: 'salida', quantity: '4' });
    submit(qs('movement-form'));
    expect(loadStock()[0].quantity_available).toBe(6);
  });

  it('rejects a salida without sufficient stock and does not alter inventory (FR-055)', () => {
    fillMovement({ type: 'salida', quantity: '1' });
    submit(qs('movement-form'));
    expect(loadMovements().length).toBe(0);
    expect(loadStock().length).toBe(0);
    expect(qs('error-movement-quantity').textContent).not.toBe('');
  });

  it('offers no edit/delete actions, only adjustment shortcuts (FR-056, FR-057)', () => {
    fillMovement({ type: 'entrada', quantity: '10' });
    submit(qs('movement-form'));
    const row = qs('movement-list-body').querySelector('tr');
    const buttonLabels = [...row.querySelectorAll('button')].map(b => b.textContent);
    expect(buttonLabels).toEqual(['Ajuste +', 'Ajuste -']);
  });

  it('prefills the form for an adjustment on the same product/warehouse when "Ajuste +" is used', () => {
    fillMovement({ type: 'entrada', quantity: '10' });
    submit(qs('movement-form'));
    const adjustBtn = [...qs('movement-list-body').querySelectorAll('button')].find(b => b.textContent === 'Ajuste +');
    adjustBtn.click();
    expect(qs('movement-type').value).toBe('ajuste_entrada');
    expect(qs('movement-product').value).toBe('1');
    expect(qs('movement-warehouse').value).toBe('1');
  });
});
