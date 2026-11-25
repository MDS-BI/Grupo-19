import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadTransfers, loadStock, loadOrders, loadMovements, loadProducts } from '../../src/storage.js';

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

function fillTransfer({ product = '1', source = '1', target = '2', quantity = '4' } = {}){
  qs('transfer-product').value = product;
  qs('transfer-source').value = source;
  qs('transfer-target').value = target;
  qs('transfer-quantity').value = quantity;
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
    const cancelBtn = [...qs('transfer-list-body').querySelectorAll('button')].find(b => b.textContent === 'Cancelar');
    cancelBtn.click();
    expect(loadTransfers()[0].status).toBe('cancelada');
    expect(loadStock().find(s => s.warehouse_id === 1).quantity_available).toBe(10);
    expect(loadStock().find(s => s.warehouse_id === 2)).toBeUndefined();
  });

  it('offers no confirm/cancel actions once a transfer is no longer pending', () => {
    fillTransfer({ quantity: '4' });
    submit(qs('transfer-form'));
    [...qs('transfer-list-body').querySelectorAll('button')].find(b => b.textContent === 'Confirmar').click();
    const actionsCell = qs('transfer-list-body').querySelector('tr').lastElementChild;
    expect(actionsCell.textContent).toBe('—');
  });
});

function setControl(id, value, eventName){
  const el = qs(id);
  el.value = value;
  el.dispatchEvent(new dom.window.Event(eventName, { bubbles: true }));
}

function createProductWithStock(sku, name, warehouseId, quantity){
  qs('nav-products').click();
  qs('product-sku').value = sku;
  qs('product-name').value = name;
  qs('product-category').value = '1';
  qs('product-sale-price').value = '1000';
  submit(qs('product-form'));
  const productId = loadProducts().find(p => p.sku === sku).product_id;

  qs('nav-movements').click();
  qs('movement-type').value = 'entrada';
  qs('movement-product').value = String(productId);
  qs('movement-warehouse').value = String(warehouseId);
  qs('movement-quantity').value = String(quantity);
  submit(qs('movement-form'));
  qs('nav-transfers').click();
  return String(productId);
}

function createTransfer({ product = '1', source = '1', target = '2', quantity = '1', action } = {}){
  qs('nav-transfers').click();
  fillTransfer({ product, source, target, quantity });
  submit(qs('transfer-form'));
  if(action){
    const button = [...qs('transfer-list-body').querySelector('tr').querySelectorAll('button')]
      .find(b => b.textContent === action);
    button.click();
  }
}

function seedFilterScenario(){
  const secondProduct = createProductWithStock('SKU-2', 'Producto Segundo', 1, 10);
  qs('nav-movements').click();
  qs('movement-type').value = 'entrada';
  qs('movement-product').value = secondProduct;
  qs('movement-warehouse').value = '2';
  qs('movement-quantity').value = '10';
  submit(qs('movement-form'));

  createTransfer({ product: '1', quantity: '1', action: 'Confirmar' });
  createTransfer({ product: secondProduct, quantity: '2', action: 'Cancelar' });
  createTransfer({ product: secondProduct, source: '2', target: '1', quantity: '3' });
  return secondProduct;
}

function rowIds(){
  return [...qs('transfer-list-body').querySelectorAll('tr')]
    .map(tr => tr.cells[0].textContent.trim());
}

function operationalSnapshot(){
  return JSON.stringify({
    transfers: loadTransfers(),
    stock: loadStock(),
    movements: loadMovements(),
    orders: loadOrders()
  });
}

describe('User Story 10 - search and filter transfers', () => {
  it('shows the transfer id column and keeps the complete list by default (T112, SC-052)', () => {
    seedFilterScenario();
    expect(qs('view-transfers').querySelector('#transfer-search')).not.toBeNull();
    expect([...qs('view-transfers').querySelectorAll('th')].map(th => th.textContent)).toContain('#ID');
    expect(rowIds()).toEqual(['3', '2', '1']);
    expect(qs('transfer-count').textContent).toBe('3');
  });

  it('filters by term, individual fields, combinations and clears back to the full list without mutating data (T112, SC-053-SC-055)', () => {
    const secondProduct = seedFilterScenario();
    const before = operationalSnapshot();

    setControl('transfer-search', 'segundo', 'input');
    expect(rowIds()).toEqual(['3', '2']);
    expect(qs('transfer-count').textContent).toBe('2');

    setControl('transfer-search', 'SEGUNDO', 'input');
    expect(rowIds()).toEqual(['3', '2']);

    setControl('transfer-search', '3', 'input');
    expect(rowIds()).toEqual(['3']);

    setControl('transfer-search', '', 'input');
    setControl('transfer-filter-status', 'confirmada', 'change');
    expect(rowIds()).toEqual(['1']);

    setControl('transfer-filter-status', '', 'change');
    setControl('transfer-filter-product', secondProduct, 'change');
    expect(rowIds()).toEqual(['3', '2']);

    setControl('transfer-filter-product', '', 'change');
    setControl('transfer-filter-source', '2', 'change');
    expect(rowIds()).toEqual(['3']);

    setControl('transfer-filter-source', '', 'change');
    setControl('transfer-filter-target', '2', 'change');
    expect(rowIds()).toEqual(['2', '1']);

    setControl('transfer-filter-target', '', 'change');
    setControl('transfer-search', 'segundo', 'input');
    setControl('transfer-filter-status', 'pendiente', 'change');
    setControl('transfer-filter-source', '2', 'change');
    expect(rowIds()).toEqual(['3']);

    setControl('transfer-search', 'sin coincidencias', 'input');
    expect(rowIds()).toEqual([]);
    expect(qs('transfer-list-empty').hidden).toBe(false);
    expect(qs('transfer-count').textContent).toBe('0');

    qs('transfer-filters-clear').click();
    expect(rowIds()).toEqual(['3', '2', '1']);
    expect(qs('transfer-list-empty').hidden).toBe(true);
    expect(qs('transfer-search').value).toBe('');
    expect(qs('transfer-filter-status').value).toBe('');
    expect(qs('transfer-filter-product').value).toBe('');
    expect(qs('transfer-filter-source').value).toBe('');
    expect(qs('transfer-filter-target').value).toBe('');
    expect(qs('transfer-count').textContent).toBe('3');
    expect(operationalSnapshot()).toBe(before);
  });
});
