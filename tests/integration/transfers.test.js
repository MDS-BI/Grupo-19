import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadTransfers, loadStock } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function submit(form){ form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }

function setupProductAndWarehouses(){
  qs('nav-products').click();
  qs('product-sku').value = 'SKU-1';
  qs('product-name').value = 'Producto 1';
  qs('product-category').value = '1';
  qs('product-sale-price').value = '1000';
  qs('product-user').value = '1';
  submit(qs('product-form'));

  qs('nav-warehouses').click();
  qs('warehouse-name').value = 'Origen';
  qs('warehouse-location').value = 'Santiago';
  submit(qs('warehouse-form'));
  qs('warehouse-name').value = 'Destino';
  qs('warehouse-location').value = 'Valparaíso';
  submit(qs('warehouse-form'));

  qs('nav-movements').click();
  qs('movement-type').value = 'entrada';
  qs('movement-product').value = '1';
  qs('movement-warehouse').value = '1';
  qs('movement-quantity').value = '10';
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
  setupProductAndWarehouses();
  qs('nav-transfers').click();
});

afterEach(() => {
  dom.window.close();
});

function fillTransfer({ quantity = '4' } = {}){
  qs('transfer-product').value = '1';
  qs('transfer-source').value = '1';
  qs('transfer-target').value = '2';
  qs('transfer-quantity').value = quantity;
  qs('transfer-created-by').value = '1';
}

describe('User Story 5 - transfer products between warehouses', () => {
  it('creates a pending transfer request (FR-065)', () => {
    fillTransfer();
    submit(qs('transfer-form'));
    const all = loadTransfers();
    expect(all.length).toBe(1);
    expect(all[0].status).toBe('pendiente');
    expect(qs('transfer-list-body').textContent).toContain('Pendiente');
  });

  it('blocks identical source and target warehouses (FR-066)', () => {
    qs('transfer-product').value = '1';
    qs('transfer-source').value = '1';
    qs('transfer-target').value = '1';
    qs('transfer-quantity').value = '1';
    qs('transfer-created-by').value = '1';
    submit(qs('transfer-form'));
    expect(loadTransfers().length).toBe(0);
    expect(qs('error-transfer-targetWarehouseId').textContent).toContain('diferente');
  });

  it('blocks a transfer exceeding available stock (FR-067)', () => {
    fillTransfer({ quantity: '999' });
    submit(qs('transfer-form'));
    expect(loadTransfers().length).toBe(0);
  });

  it('confirms a pending transfer and moves stock between warehouses simultaneously (FR-068, FR-069)', () => {
    fillTransfer({ quantity: '4' });
    submit(qs('transfer-form'));
    const select = qs('transfer-list-body').querySelector('select.transfer-user-select');
    select.value = '1';
    const confirmBtn = [...qs('transfer-list-body').querySelectorAll('button')].find(b => b.textContent === 'Confirmar');
    confirmBtn.click();
    expect(loadTransfers()[0].status).toBe('confirmada');
    const stock = loadStock();
    const source = stock.find(s => s.warehouse_id === 1);
    const target = stock.find(s => s.warehouse_id === 2);
    expect(source.quantity_available).toBe(6);
    expect(target.quantity_available).toBe(4);
  });

  it('cancels a pending transfer without touching STOCK (FR-085)', () => {
    fillTransfer({ quantity: '4' });
    submit(qs('transfer-form'));
    const select = qs('transfer-list-body').querySelector('select.transfer-user-select');
    select.value = '1';
    const cancelBtn = [...qs('transfer-list-body').querySelectorAll('button')].find(b => b.textContent === 'Cancelar');
    cancelBtn.click();
    expect(loadTransfers()[0].status).toBe('cancelada');
    expect(loadStock().find(s => s.warehouse_id === 1).quantity_available).toBe(10);
    expect(loadStock().find(s => s.warehouse_id === 2)).toBeUndefined();
  });

  it('offers no confirm/cancel actions once a transfer is no longer pending', () => {
    fillTransfer({ quantity: '4' });
    submit(qs('transfer-form'));
    const select = qs('transfer-list-body').querySelector('select.transfer-user-select');
    select.value = '1';
    [...qs('transfer-list-body').querySelectorAll('button')].find(b => b.textContent === 'Confirmar').click();
    const actionsCell = qs('transfer-list-body').querySelector('tr').lastElementChild;
    expect(actionsCell.textContent).toBe('—');
  });
});
