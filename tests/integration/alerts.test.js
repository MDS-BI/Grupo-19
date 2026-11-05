import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function submit(form){ form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }
function change(el){ el.dispatchEvent(new dom.window.Event('change', { bubbles: true })); }

function setupLowStock(){
  qs('nav-products').click();
  qs('product-sku').value = 'SKU-1';
  qs('product-name').value = 'Producto 1';
  qs('product-category').value = '1';
  qs('product-sale-price').value = '1000';
  qs('product-user').value = '1';
  submit(qs('product-form'));
  qs('product-sku').value = 'SKU-2';
  qs('product-name').value = 'Producto 2';
  qs('product-category').value = '1';
  qs('product-sale-price').value = '500';
  qs('product-user').value = '1';
  submit(qs('product-form'));

  qs('nav-warehouses').click();
  qs('warehouse-name').value = 'Bodega A';
  qs('warehouse-location').value = 'Santiago';
  submit(qs('warehouse-form'));

  qs('nav-movements').click();
  qs('movement-type').value = 'entrada';
  qs('movement-product').value = '1';
  qs('movement-warehouse').value = '1';
  qs('movement-quantity').value = '2';
  qs('movement-user').value = '1';
  submit(qs('movement-form'));

  qs('nav-stock').click();
  const input = qs('stock-list-body').querySelector('.min-stock-editor input');
  const saveBtn = qs('stock-list-body').querySelector('.min-stock-editor button');
  input.value = '5';
  saveBtn.click();
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
  setupLowStock();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 6 - minimum stock alerts', () => {
  it('shows an alert on the dedicated screen when quantity is at or below the minimum (FR-077, FR-078)', () => {
    qs('nav-alerts').click();
    expect(qs('alert-list-empty').hidden).toBe(true);
    const row = qs('alert-list-body').querySelector('tr');
    expect(row.textContent).toContain('Producto 1');
    expect(row.textContent).toContain('2');
    expect(row.textContent).toContain('5');
    expect(row.textContent).toContain('3');
  });

  it('visually flags the stock row on the Control de Stock screen (FR-079)', () => {
    qs('nav-stock').click();
    const row = qs('stock-list-body').querySelector('tr');
    expect(row.classList.contains('stock-alert-row')).toBe(true);
    expect(row.textContent).toContain('Alerta');
  });

  it('clears automatically once stock is replenished above the minimum (FR-081)', () => {
    qs('nav-movements').click();
    qs('movement-type').value = 'entrada';
    qs('movement-product').value = '1';
    qs('movement-warehouse').value = '1';
    qs('movement-quantity').value = '10';
    qs('movement-user').value = '1';
    qs('movement-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));

    qs('nav-alerts').click();
    expect(qs('alert-list-empty').hidden).toBe(false);
  });

  it('filters alerts by product and shows an empty state with no matches (FR-082)', () => {
    qs('nav-alerts').click();
    change(Object.assign(qs('alert-filter-product'), { value: '1' }));
    expect(qs('alert-list-empty').hidden).toBe(true);
    change(Object.assign(qs('alert-filter-product'), { value: '2' }));
    expect(qs('alert-list-empty').hidden).toBe(false);
  });
});
