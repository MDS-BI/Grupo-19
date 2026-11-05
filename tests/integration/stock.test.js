import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadStock } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function submit(form){ form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }

function setupData(){
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
  qs('warehouse-name').value = 'Bodega B';
  qs('warehouse-location').value = 'Valparaíso';
  submit(qs('warehouse-form'));
  qs('warehouse-name').value = 'Bodega C';
  qs('warehouse-location').value = 'Concepción';
  submit(qs('warehouse-form'));

  qs('nav-movements').click();
  qs('movement-type').value = 'entrada';
  qs('movement-product').value = '1';
  qs('movement-warehouse').value = '1';
  qs('movement-quantity').value = '10';
  qs('movement-user').value = '1';
  submit(qs('movement-form'));
  qs('movement-product').value = '1';
  qs('movement-warehouse').value = '2';
  qs('movement-quantity').value = '3';
  qs('movement-user').value = '1';
  submit(qs('movement-form'));
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
  setupData();
  qs('nav-stock').click();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 2 - check stock levels', () => {
  it('shows available quantity per warehouse for a product (FR-047)', () => {
    const rows = qs('stock-list-body').querySelectorAll('tr');
    expect(rows.length).toBe(2);
    expect(qs('stock-list-body').textContent).toContain('Bodega A');
    expect(qs('stock-list-body').textContent).toContain('Bodega B');
  });

  it('shows the total across all warehouses when filtered by product (FR-048)', () => {
    qs('stock-filter-product').value = '1';
    qs('stock-filter-product').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('stock-product-total').textContent).toBe('13');
  });

  it('filters by warehouse and shows an empty state with no matches (FR-049, FR-050)', () => {
    qs('stock-filter-warehouse').value = '3';
    qs('stock-filter-warehouse').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('stock-list-empty').hidden).toBe(false);
  });

  it('is read-only: querying never changes STOCK (FR-051)', () => {
    const before = JSON.stringify(loadStock());
    qs('stock-filter-product').value = '1';
    qs('stock-filter-product').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(JSON.stringify(loadStock())).toBe(before);
  });

  it('allows configuring a minimum stock level per product+warehouse (FR-076)', () => {
    const input = qs('stock-list-body').querySelector('.min-stock-editor input');
    const saveBtn = qs('stock-list-body').querySelector('.min-stock-editor button');
    input.value = '5';
    saveBtn.click();
    expect(loadStock().find(s => s.warehouse_id === 1).min_stock_level).toBe(5);
  });
});
