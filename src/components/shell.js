import { getConfig } from '../module-config.js';
import { ADMIN_RESOURCE, canAccessModule, getEffectivePermission } from '../domain/permissions.js';

function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

export function monogramFor(name){
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 0 ? words.map(w => w[0]).slice(0, 2).join('') : 'E';
  return letters.toUpperCase();
}

export function renderLogo(container){
  if(!container) return;
  const letters = monogramFor(getConfig().moduleName);
  container.innerHTML = `<svg width="38" height="38" viewBox="0 0 40 40" focusable="false" aria-hidden="true"><rect class="logo-bg" x="0.5" y="0.5" width="39" height="39" rx="11"></rect><path class="logo-top" d="M20 6.5 32 12.5 20 18.5 8 12.5 20 6.5Z"></path><path class="logo-left" d="M8 12.5 20 18.5v13L8 25.5v-13Z"></path><path class="logo-right" d="M32 12.5 20 18.5v13l12-6v-13Z"></path><rect class="logo-label-bg" x="12" y="19.5" width="16" height="9" rx="4.5"></rect><text x="20" y="26" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="7" font-weight="800" fill="#ffffff">${escapeHtml(letters)}</text></svg>`;
}

export function applyShellLabels(){
  const labels = {
    'nav-dashboard-label': 'Panel',
    'nav-entities-label': getConfig().labels.entities,
    'nav-documents-label': getConfig().labels.documents,
    'nav-search-label': 'Búsqueda'
  };
  Object.entries(labels).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
    const button = document.getElementById(id.replace('-label', ''));
    if(button){
      button.setAttribute('aria-label', text);
      button.setAttribute('title', text);
    }
  });
}

export function setActiveModule(name){
  document.querySelectorAll('.nav-module').forEach(btn => {
    const active = btn.dataset.module === name;
    btn.classList.toggle('active', active);
    if(active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  const adminNav = document.getElementById('nav-admin');
  if(adminNav){
    const active = adminNav.dataset.module === name;
    adminNav.classList.toggle('active', active);
    if(active) adminNav.setAttribute('aria-current', 'page');
    else adminNav.removeAttribute('aria-current');
  }
}

export function applyNavigationPermissions(role, userId){
  const alwaysHidden = new Set(['entities', 'documents', 'search', 'shipments', 'replenishments']);
  document.querySelectorAll('.nav-module').forEach(btn => {
    const mod = btn.dataset.module;
    if(mod === 'admin' || mod === 'dashboard') return;
    if(alwaysHidden.has(mod)){
      btn.hidden = true;
      btn.disabled = false;
      btn.setAttribute('aria-hidden', 'true');
      return;
    }
    const allowed = canAccessModule(role, mod, userId);
    btn.hidden = !allowed;
    btn.disabled = !allowed;
    btn.setAttribute('aria-hidden', allowed ? 'false' : 'true');
  });
  const dashboardNav = document.getElementById('nav-dashboard');
  if(dashboardNav){
    dashboardNav.hidden = false;
    dashboardNav.disabled = false;
    dashboardNav.setAttribute('aria-hidden', 'false');
  }
  const adminNav = document.getElementById('nav-admin');
  if(adminNav){
    const allowed = getEffectivePermission(role, 'panel', ADMIN_RESOURCE, userId);
    adminNav.hidden = !allowed;
    adminNav.disabled = !allowed;
    adminNav.setAttribute('aria-hidden', allowed ? 'false' : 'true');
  }
  const advanced = document.getElementById('nav-advanced-section');
  if(advanced) advanced.hidden = true;
}
