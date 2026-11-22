import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  loadProducts,
  loadReplenishments,
  loadStock,
  loadTransfers,
  loadUserPermissionOverrides,
  loadUsers
} from '../../src/storage.js';
import {
  ADMIN_RESOURCE,
  setUserPermissionOverride,
  setUserRole
} from '../../src/domain/permissions.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function change(el){ el.dispatchEvent(new dom.window.Event('change', { bubbles: true })); }
function click(el){ el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }

function switchUser(userId){
  const select = qs('active-user-select');
  select.value = String(userId);
  change(select);
}

function snapshotOperationalData(){
  return JSON.stringify({
    products: loadProducts(),
    stock: loadStock(),
    transfers: loadTransfers(),
    replenishments: loadReplenishments()
  });
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
});

afterEach(() => {
  dom.window.close();
});

describe('HU-08 roles, landing pages and visibility', () => {
  it('opens each role landing on load and when the active user changes (FR-107, SC-040)', () => {
    expect(qs('view-dashboard').hidden).toBe(false);

    switchUser(3);
    expect(qs('view-alerts').hidden).toBe(false);

    switchUser(2);
    expect(qs('view-movements').hidden).toBe(false);
  });

  it('recalculates permissions immediately when the active user role changes (FR-116, FR-117, SC-042)', () => {
    qs('nav-admin').click();
    expect(qs('view-admin-permissions').hidden).toBe(false);

    qs('permission-user-select').value = '1';
    qs('permission-user-role-select').value = 'supervisor_inventario';
    click(qs('permission-apply-role'));

    expect(loadUsers().find((u) => u.user_id === 1).role).toBe('supervisor_inventario');
    expect(qs('nav-admin').hidden).toBe(true);
    expect(qs('view-alerts').hidden).toBe(false);
  });

  it('hides unauthorized navigation and blocks a direct hash route (FR-113, FR-115, SC-043)', () => {
    switchUser(3);
    expect(qs('nav-admin').hidden).toBe(true);
    expect(qs('nav-entities').hidden).toBe(true);

    window.location.hash = '#/entities';
    window.dispatchEvent(new dom.window.Event('hashchange'));

    expect(qs('access-notice').hidden).toBe(false);
    expect(qs('view-alerts').hidden).toBe(false);
    expect(qs('view-entities').hidden).toBe(true);
  });

  it('applies an individual override without changing operational data or the active user (FR-111, FR-120, FR-121)', () => {
    const before = snapshotOperationalData();
    setUserPermissionOverride(3, 'accion', 'action:products.manage', true);

    switchUser(3);
    qs('nav-products').click();

    const formCard = qs('view-products .card[aria-labelledby="product-form-heading"]');
    expect(formCard.hidden).toBe(false);
    expect(qs('active-user-select').value).toBe('3');
    expect(snapshotOperationalData()).toBe(before);
    expect(loadUserPermissionOverrides()).toHaveLength(1);
  });

  it('keeps the admin panel available when its permission is toggled off (FR-118, SC-048)', () => {
    qs('nav-admin').click();
    const adminToggle = qs('permission-matrix-body').querySelector(`input[data-resource="${ADMIN_RESOURCE}"]`);
    expect(adminToggle).not.toBeNull();
    expect(adminToggle.disabled).toBe(true);

    adminToggle.checked = false;
    change(adminToggle);

    expect(qs('permission-feedback').textContent).toContain('administrador');
    expect(qs('nav-admin').hidden).toBe(false);
    expect(qs('view-admin-permissions').hidden).toBe(false);
  });

  it('rejects an unknown role and keeps the previous value (FR-105)', () => {
    const result = setUserRole(1, 'inexistente');
    expect(result.success).toBe(false);
    expect(loadUsers().find((u) => u.user_id === 1).role).toBe('administrador');
  });
});
