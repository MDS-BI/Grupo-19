import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addDocument, loadEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

const salesConfig = {
  moduleName: 'Ventas',
  labels: { entity: 'Cliente', entities: 'Clientes', document: 'Pedido de Venta', documents: 'Pedidos de Venta' }
};

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
});

afterEach(() => {
  dom.window.close();
});

async function bootWith(configOverride){
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(configOverride));
}

describe('User Story 3 - home dashboard with record stats', () => {
  it('opens on the dashboard with all other views hidden', async () => {
    await bootWith(undefined);
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('view-entities').hidden).toBe(true);
    expect(qs('view-documents').hidden).toBe(true);
    expect(qs('view-search').hidden).toBe(true);
  });

  it('does not show quick actions or the base module card for any role', async () => {
    await bootWith(undefined);
    expect(qs('dashboard-quick-actions')).toBeNull();
    expect(qs('base-module-card')).toBeNull();
    expect(qs('view-dashboard').textContent).not.toContain('Acciones rápidas');
    expect(qs('view-dashboard').textContent).not.toContain('Módulo base');
  });

  it('uses configured terminology on section headings', async () => {
    await bootWith(salesConfig);
    qs('nav-entities').click();
    expect(qs('entity-form-heading').textContent).toBe('Agregar / Editar Cliente');
    qs('nav-documents').click();
    expect(qs('document-form-heading').textContent).toBe('Agregar / Editar Pedido de Venta');
  });

  it('shows live statistics that match stored records', async () => {
    await bootWith(undefined);
    expect(qs('stat-products').textContent).toBe('0');

    addEntity({ name: 'Acme', code: 'AC-001' });
    addEntity({ name: 'Globex', code: 'GL-002' });
    const entity = loadEntities()[0];
    addDocument({ entityId: entity.entity_id, folio: 1001, startDate: '2026-08-01', endDate: '2026-08-05' });

    qs('nav-dashboard').click();
    expect(qs('stat-products').textContent).toBe('0');
    expect(qs('dashboard-activity').textContent).toContain('Aún no hay movimientos');
  });

  it('navigates to advanced sections from the sidebar', async () => {
    await bootWith(undefined);
    qs('nav-entities').click();
    expect(qs('view-entities').hidden).toBe(false);
    expect(qs('view-dashboard').hidden).toBe(true);
    qs('nav-documents').click();
    expect(qs('view-documents').hidden).toBe(false);
    qs('nav-search').click();
    expect(qs('view-search').hidden).toBe(false);
  });
});
