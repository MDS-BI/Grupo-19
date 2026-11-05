import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadProducts } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function submit(form){ form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }

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
  qs('nav-products').click();
});

afterEach(() => {
  dom.window.close();
});

function fillProductForm({ sku = 'SKU-100', name = 'Mouse inalámbrico', salePrice = '9990', costPrice = '', userId = '1' } = {}){
  qs('product-sku').value = sku;
  qs('product-name').value = name;
  qs('product-category').value = '1';
  qs('product-sale-price').value = salePrice;
  if(costPrice !== '') qs('product-cost-price').value = costPrice;
  qs('product-user').value = userId;
}

describe('User Story 1 - register and modify products', () => {
  it('creates a product with required fields, status activo by default, and lists it (FR-040, FR-091)', () => {
    fillProductForm();
    submit(qs('product-form'));
    const all = loadProducts();
    expect(all.length).toBe(1);
    expect(all[0].sku).toBe('SKU-100');
    expect(all[0].status).toBe('activo');
    expect(qs('product-list-body').textContent).toContain('SKU-100');
  });

  it('rejects a duplicate SKU with a clear message and keeps form data (FR-042)', () => {
    fillProductForm();
    submit(qs('product-form'));
    fillProductForm({ name: 'Otro producto' });
    submit(qs('product-form'));
    expect(loadProducts().length).toBe(1);
    expect(qs('error-product-sku').textContent).toContain('ya existe');
    expect(qs('product-sku').value).toBe('SKU-100');
  });

  it('blocks submission when required fields are missing (FR-040)', () => {
    submit(qs('product-form'));
    expect(loadProducts().length).toBe(0);
    expect(qs('error-product-sku').textContent).toContain('obligatorio');
    expect(qs('error-product-userId').textContent).not.toBe('');
  });

  it('shows a non-blocking warning when cost price exceeds sale price (FR-089)', () => {
    fillProductForm({ salePrice: '100', costPrice: '150' });
    submit(qs('product-form'));
    expect(loadProducts().length).toBe(1);
    expect(qs('warning-product-costPrice').textContent).toContain('supera');
  });

  it('edits an existing product and reflects changes immediately in the list (FR-040 scenario 3)', () => {
    fillProductForm();
    submit(qs('product-form'));
    const editButtons = qs('product-list-body').querySelectorAll('button');
    [...editButtons].find(b => b.textContent === 'Editar').click();
    expect(qs('product-sku').value).toBe('SKU-100');
    qs('product-sale-price').value = '15000';
    qs('product-user').value = '1';
    submit(qs('product-form'));
    expect(loadProducts()[0].sale_price).toBe(15000);
  });

  it('toggles product status to inactivo and back (FR-045, FR-090)', () => {
    fillProductForm();
    submit(qs('product-form'));
    qs('product-user').value = '1';
    const toggleBtn = [...qs('product-list-body').querySelectorAll('button')].find(b => b.textContent === 'Desactivar');
    toggleBtn.click();
    expect(loadProducts()[0].status).toBe('inactivo');
  });
});
