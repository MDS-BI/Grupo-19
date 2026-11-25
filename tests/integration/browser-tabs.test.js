import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

function createDom(url = 'http://localhost/'){
  dom = new JSDOM(html, { url });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.open = vi.fn(() => ({}));
  w.localStorage.clear();
  return w;
}

async function bootApp({ url, storage } = {}){
  const w = createDom(url);
  if(storage){
    Object.entries(storage).forEach(([key, value]) => w.localStorage.setItem(key, value));
  }
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot(normalizeConfig());
  return w;
}

afterEach(() => {
  dom?.window.close();
});

describe('pestañas del navegador para los módulos de la barra lateral', () => {
  it('no muestra una barra de pestañas dentro de la página', async () => {
    await bootApp();
    expect(document.getElementById('workspace-tabs')).toBeNull();
    expect(document.querySelector('[role="tablist"]')).toBeNull();
    expect(document.querySelector('[role="tab"]')).toBeNull();
  });

  it('abre cada módulo de la izquierda en una pestaña nueva con su hash', async () => {
    const w = await bootApp();
    expect(qs('view-dashboard').hidden).toBe(false);

    qs('nav-products').click();
    qs('nav-alerts').click();
    qs('nav-admin').click();

    expect(w.open).toHaveBeenCalledTimes(3);
    expect(w.open.mock.calls[0]).toEqual([w.location.origin + '/#/products', '_blank']);
    expect(w.open.mock.calls[1]).toEqual([w.location.origin + '/#/alerts', '_blank']);
    expect(w.open.mock.calls[2]).toEqual([w.location.origin + '/#/admin', '_blank']);
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('view-products').hidden).toBe(true);
  });

  it('mantiene los flujos internos en la misma pestaña', async () => {
    const w = await bootApp();

    document.querySelector('[data-goto="movements"]').click();

    expect(w.open).not.toHaveBeenCalled();
    expect(qs('view-movements').hidden).toBe(false);
    expect(w.location.hash).toBe('#/movements');
  });

  it('no abre pestañas de módulos no autorizados y muestra el aviso de acceso', async () => {
    const w = await bootApp();
    const select = qs('active-user-select');
    select.value = '3';
    select.dispatchEvent(new w.Event('change', { bubbles: true }));

    w.open.mockClear();
    qs('nav-admin').click();
    qs('nav-entities').click();

    expect(w.open).not.toHaveBeenCalled();
    expect(qs('access-notice').hidden).toBe(false);
  });

  it('muestra directamente el módulo indicado por el hash al cargar una pestaña', async () => {
    await bootApp({ url: 'http://localhost/#/stock' });
    expect(qs('view-stock').hidden).toBe(false);
    expect(document.querySelector('.nav-module[aria-current="page"]').dataset.module).toBe('stock');
  });

  it('redirige a la landing del rol cuando el hash de la pestaña no está autorizado', async () => {
    await bootApp({
      url: 'http://localhost/#/entities',
      storage: { 'logistics:active_user_id': '3' }
    });
    expect(qs('view-alerts').hidden).toBe(false);
    expect(qs('access-notice').hidden).toBe(false);
  });

  it('navega en la misma pestaña si el navegador bloquea window.open', async () => {
    const w = await bootApp();
    w.open.mockReturnValue(null);

    qs('nav-warehouses').click();

    expect(w.open).toHaveBeenCalledTimes(1);
    expect(qs('view-warehouses').hidden).toBe(false);
    expect(w.location.hash).toBe('#/warehouses');
  });
});
