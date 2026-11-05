import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadWarehouses } from '../../src/storage.js';

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
  qs('nav-warehouses').click();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 4 - register and administer warehouses', () => {
  it('registers a warehouse with status activo by default (FR-060)', () => {
    qs('warehouse-name').value = 'Bodega Central';
    qs('warehouse-location').value = 'Santiago';
    submit(qs('warehouse-form'));
    const all = loadWarehouses();
    expect(all.length).toBe(1);
    expect(all[0].status).toBe('activo');
    expect(qs('warehouse-list-body').textContent).toContain('Bodega Central');
  });

  it('blocks duplicate warehouse names (FR-064)', () => {
    qs('warehouse-name').value = 'Bodega Central';
    qs('warehouse-location').value = 'Santiago';
    submit(qs('warehouse-form'));
    qs('warehouse-name').value = 'Bodega Central';
    qs('warehouse-location').value = 'Valparaíso';
    submit(qs('warehouse-form'));
    expect(loadWarehouses().length).toBe(1);
    expect(qs('error-warehouse-name').textContent).toContain('Ya existe');
  });

  it('blocks submission when name or location is missing (FR-060)', () => {
    submit(qs('warehouse-form'));
    expect(loadWarehouses().length).toBe(0);
    expect(qs('error-warehouse-name').textContent).toContain('obligatorio');
    expect(qs('error-warehouse-location').textContent).toContain('obligatoria');
  });

  it('edits an existing warehouse (FR-061)', () => {
    qs('warehouse-name').value = 'Bodega A';
    qs('warehouse-location').value = 'A';
    submit(qs('warehouse-form'));
    [...qs('warehouse-list-body').querySelectorAll('button')].find(b => b.textContent === 'Editar').click();
    qs('warehouse-location').value = 'A2';
    submit(qs('warehouse-form'));
    expect(loadWarehouses()[0].location).toBe('A2');
  });

  it('toggles warehouse status and excludes inactive warehouses from movement/transfer selectors (FR-062, FR-063)', () => {
    qs('warehouse-name').value = 'Bodega A';
    qs('warehouse-location').value = 'A';
    submit(qs('warehouse-form'));
    [...qs('warehouse-list-body').querySelectorAll('button')].find(b => b.textContent === 'Desactivar').click();
    expect(loadWarehouses()[0].status).toBe('inactivo');
    qs('nav-movements').click();
    expect([...qs('movement-warehouse').options].some(o => o.textContent === 'Bodega A')).toBe(false);
  });
});
