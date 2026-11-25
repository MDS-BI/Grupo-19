import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { loadReplenishments, loadStock, loadMovements } from '../../src/storage.js';
import { receiveRequest } from '../../src/domain/replenishments.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function submit(form){ form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }
function change(select){ select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); }

function switchUser(userId){
  const select = qs('active-user-select');
  select.value = String(userId);
  change(select);
}

function rowButton(label, row = qs('replenishment-list-body').querySelector('tr')){
  return [...row.querySelectorAll('button')].find(b => b.textContent === label);
}

function createRequest({ quantity = '5', observation = 'Reposición de prueba' } = {}){
  qs('nav-replenishments').click();
  qs('replenishment-product').value = '1';
  qs('replenishment-warehouse').value = '1';
  qs('replenishment-quantity').value = quantity;
  qs('replenishment-observation').value = observation;
  submit(qs('replenishment-form'));
}

async function setupData(){
  qs('nav-products').click();
  qs('product-sku').value = 'SKU-REP-1';
  qs('product-name').value = 'Producto Reposición';
  qs('product-category').value = '1';
  qs('product-sale-price').value = '1000';
  qs('product-user').value = '1';
  submit(qs('product-form'));

  qs('nav-warehouses').click();
  qs('warehouse-name').value = 'Bodega Central';
  qs('warehouse-location').value = 'Santiago';
  submit(qs('warehouse-form'));

  qs('nav-movements').click();
  qs('movement-type').value = 'entrada';
  qs('movement-product').value = '1';
  qs('movement-warehouse').value = '1';
  qs('movement-quantity').value = '10';
  submit(qs('movement-form'));

  qs('nav-stock').click();
  const minInput = qs('stock-list-body').querySelector('.min-stock-editor input');
  minInput.value = '12';
  qs('stock-list-body').querySelector('.min-stock-editor button').click();
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
  const { initApp } = await import('../../src/app.js');
  initApp(normalizeConfig(undefined));
  await setupData();
  qs('nav-replenishments').click();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 7 - solicitudes de reposición con trazabilidad', () => {
  it('crea una solicitud pendiente sin modificar stock ni generar movimientos (FR-088)', () => {
    createRequest();
    const requests = loadReplenishments();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ status: 'pendiente', source: 'manual', created_by: 1, quantity: 5 });
    expect(loadStock().find(s => s.warehouse_id === 1).quantity_available).toBe(10);
    expect(loadMovements()).toHaveLength(1);
    expect(qs('replenishment-list-body').textContent).toContain('Pendiente');
  });

  it('rechaza cantidades inválidas y muestra el error en el formulario (FR-089)', () => {
    createRequest({ quantity: '0' });
    expect(loadReplenishments()).toHaveLength(0);
    expect(qs('error-replenishment-quantity').textContent).toContain('entero mayor que cero');
  });

  it('preselecciona producto, bodega y déficit desde una alerta HU-06 (FR-091)', () => {
    qs('nav-alerts').click();
    const requestButton = qs('alert-list-body').querySelector('.btn-replenish');
    expect(requestButton).not.toBeNull();
    requestButton.click();

    expect(qs('view-replenishments').hidden).toBe(false);
    expect(qs('replenishment-product').value).toBe('1');
    expect(qs('replenishment-warehouse').value).toBe('1');
    expect(qs('replenishment-quantity').value).toBe('2');
    expect(qs('replenishment-source').value).toBe('alert');
    expect(qs('replenishment-form-origin').textContent).toContain('alerta');

    submit(qs('replenishment-form'));
    expect(loadReplenishments()[0]).toMatchObject({ quantity: 2, source: 'alert', status: 'pendiente' });
  });

  it('el supervisor puede crear pero no aprobar ni cancelar; el administrador aprueba (FR-092, FR-094)', () => {
    createRequest();
    switchUser(3);
    qs('nav-replenishments').click();
    expect(qs('replenishment-form-heading').closest('.card').hidden).toBe(false);
    const supervisorRow = qs('replenishment-list-body').querySelector('tr');
    expect(rowButton('Aprobar', supervisorRow)).toBeUndefined();
    expect(rowButton('Cancelar', supervisorRow)).toBeUndefined();

    switchUser(1);
    qs('nav-replenishments').click();
    rowButton('Aprobar').click();
    expect(loadReplenishments()[0]).toMatchObject({ status: 'aprobada', approved_by: 1 });
    expect(loadStock().find(s => s.warehouse_id === 1).quantity_available).toBe(10);
  });

  it('el encargado solo consulta aprobadas y registra la recepción con una sola entrada de stock (FR-093, FR-095)', () => {
    createRequest();
    rowButton('Aprobar').click();

    switchUser(2);
    qs('nav-replenishments').click();
    expect(qs('replenishment-form-heading').closest('.card').hidden).toBe(true);
    expect(qs('replenishment-filter-status').disabled).toBe(true);
    expect(qs('replenishment-filter-status').value).toBe('aprobada');
    expect(qs('replenishment-list-body').textContent).toContain('Aprobada');
    expect(qs('replenishment-list-body').textContent).not.toContain('Pendiente');

    rowButton('Recibir').click();
    const received = loadReplenishments()[0];
    expect(received.status).toBe('recibida');
    expect(received.received_by).toBe(2);
    expect(received.movement_id).toBeDefined();
    expect(loadStock().find(s => s.warehouse_id === 1).quantity_available).toBe(15);
    expect(loadMovements()).toHaveLength(2);
    expect(qs('replenishment-list-body').textContent).not.toContain('Aprobada');
  });

  it('no permite recibir dos veces la misma solicitud ni duplicar el stock', () => {
    createRequest();
    rowButton('Aprobar').click();
    const requestId = loadReplenishments()[0].request_id;

    switchUser(2);
    qs('nav-replenishments').click();
    rowButton('Recibir').click();
    const secondAttempt = receiveRequest(requestId, 2);
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.error).toContain('aprobadas');
    expect(loadStock().find(s => s.warehouse_id === 1).quantity_available).toBe(15);
    expect(loadMovements()).toHaveLength(2);
  });

  it('cancela solicitudes aprobadas sin modificar stock (FR-096)', () => {
    createRequest();
    rowButton('Aprobar').click();
    rowButton('Cancelar').click();
    expect(loadReplenishments()[0]).toMatchObject({ status: 'cancelada', cancelled_by: 1 });
    expect(loadStock().find(s => s.warehouse_id === 1).quantity_available).toBe(10);
    expect(loadMovements()).toHaveLength(1);
  });

  it('actualiza el panel y los indicadores del dashboard con las solicitudes pendientes (FR-090)', () => {
    createRequest();
    qs('nav-dashboard').click();
    expect(qs('stat-replenishment-pending').textContent).toBe('1');
    expect(qs('dashboard-replenishments').textContent).toContain('Producto Reposición');

    switchUser(2);
    qs('nav-dashboard').click();
    expect(qs('dashboard-replenishments').textContent).toContain('Producto Reposición');
  });

  it('filtra solicitudes por estado sin alterar los indicadores globales', () => {
    createRequest({ quantity: '5' });
    createRequest({ quantity: '7' });
    rowButton('Aprobar').click();
    qs('replenishment-filter-status').value = 'aprobada';
    change(qs('replenishment-filter-status'));

    expect(qs('replenishment-list-body').querySelectorAll('tr')).toHaveLength(1);
    expect(qs('replenishment-count-pending').textContent).toBe('1');
    expect(qs('replenishment-count-approved').textContent).toBe('1');
    expect(qs('replenishment-row-count').textContent).toBe('1');
  });
});
