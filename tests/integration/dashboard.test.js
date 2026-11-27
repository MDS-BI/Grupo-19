import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

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

  it('shows only the four required indicators as visible dashboard content', async () => {
    await bootWith(undefined);
    const visibleStatIds = [...qs('view-dashboard').querySelectorAll('.stat-card')]
      .filter(card => !card.closest('[hidden]'))
      .map(card => card.querySelector('.stat-value')?.id);
    expect(visibleStatIds).toEqual(['stat-products', 'stat-warehouses', 'stat-units', 'stat-alerts']);
    expect(qs('dashboard-quick-actions')).toBeNull();
    expect([...qs('view-dashboard').querySelectorAll('[data-goto]')].some(el => !el.closest('[hidden]'))).toBe(false);
  });

  it('does not render quick actions', async () => {
    await bootWith(undefined);
    expect(qs('dashboard-quick-actions')).toBeNull();
  });

});
