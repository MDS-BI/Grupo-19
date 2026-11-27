import { loadModuleConfig, normalizeConfig, setActiveConfig, labelFor } from './module-config.js';
import { loadEntities, addEntity, updateEntity, deleteEntity, validateEntity, searchEntities, loadDocuments, addDocument, updateDocument, deleteDocument, validateDocument, loadProducts, loadWarehouses, loadUsers, seedLogisticsCatalogs } from './storage.js';
import { clearEntityForm, startEntityEdit, collectEntityPayload, showEntityErrors } from './components/entity-form.js';
import { createEntityItem } from './components/entity-list.js';
import { clearDocumentForm, startDocumentEdit, collectDocumentPayload, showDocumentErrors } from './components/document-form.js';
import { folioLabel } from './components/document-list.js';
import { renderLogo, applyShellLabels, setActiveModule, applyNavigationPermissions } from './components/shell.js';
import { renderDashboard } from './components/dashboard.js';
import { setupSearchBar, renderSearchResults } from './components/search-bar.js';
import {
  ADMIN_RESOURCE,
  canAccessModule,
  canPerform,
  getEffectivePermission,
  resolveActiveUser,
  resolveLandingModule,
  roleLabel,
  setActiveUserId
} from './domain/permissions.js';
import { loadDemoData } from './domain/demo-data.js';

import { createProduct, updateProduct, setProductStatus, searchProducts } from './domain/products.js';
import { createWarehouse, updateWarehouse, setWarehouseStatus, listActiveWarehouses, searchWarehouses } from './domain/warehouses.js';
import { listStock, getProductTotal, setMinStockLevel } from './domain/stock.js';
import { registerMovement, listMovements } from './domain/movements.js';
import { listOrders } from './domain/orders.js';
import { requestTransfer, confirmTransfer, cancelTransfer, listTransfers } from './domain/transfers.js';
import { createShipment, advanceShipmentStatus, listShipments } from './domain/shipments.js';
import { listAlerts } from './domain/alerts.js';
import {
  requestReplenishment, approveRequest, cancelRequest, receiveRequest,
  listReplenishments, replenishmentCounts
} from './domain/replenishments.js';

import { populateProductCategorySelect, clearProductForm, startProductEdit, collectProductPayload, showProductErrors } from './components/product-form.js';
import { renderProductList } from './components/product-list.js';
import { populateWarehouseResponsableSelect, clearWarehouseForm, startWarehouseEdit, collectWarehousePayload, showWarehouseErrors } from './components/warehouse-form.js';
import { renderWarehouseList } from './components/warehouse-list.js';
import { renderStockList, renderStockTotal } from './components/stock-list.js';
import { populateMovementProductSelect, populateMovementWarehouseSelect, clearMovementForm, prefillAdjustment, collectMovementPayload, showMovementErrors } from './components/movement-form.js';
import { renderMovementList } from './components/movement-list.js';
import { renderOrderList } from './components/order-list.js';
import { populateTransferProductSelect, populateTransferWarehouseSelects, clearTransferForm, collectTransferPayload, showTransferErrors } from './components/transfer-form.js';
import { renderTransferList } from './components/transfer-list.js';
import { populateShipmentOrderSelect, clearShipmentForm, collectShipmentPayload, showShipmentErrors } from './components/shipment-form.js';
import { renderShipmentList } from './components/shipment-list.js';
import { renderAlertList } from './components/alert-list.js';
import { populateReplenishmentProductSelect, populateReplenishmentWarehouseSelect, clearReplenishmentForm, collectReplenishmentPayload, showReplenishmentErrors, prefillReplenishmentFromAlert } from './components/replenishment-form.js';
import { renderReplenishmentList, renderReplenishmentCounts } from './components/replenishment-list.js';
import { renderPermissionsPanel, wirePermissionsPanel } from './components/permissions-panel.js';

function qs(id){ return document.getElementById(id); }

// Ayudantes de género gramatical para etiquetas configurables en español.
const palabraClave = (word) => String(word).trim().split(/\s+/)[0] || '';
const esFemenina = (word) => /(a|dad|tad|ción|sión|tud|umbre|ie)$/i.test(palabraClave(word));
const articulo = (word) => esFemenina(word) ? 'la' : 'el';
const demostrativo = (word) => esFemenina(word) ? 'esta' : 'este';
const seleccionada = (word) => esFemenina(word) ? 'seleccionada' : 'seleccionado';

const MODULES = ['dashboard', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'shipments', 'alerts', 'replenishments', 'admin'];
const VIEWS = {
  dashboard: 'view-dashboard',
  products: 'view-products',
  warehouses: 'view-warehouses',
  stock: 'view-stock',
  movements: 'view-movements',
  transfers: 'view-transfers',
  shipments: 'view-shipments',
  alerts: 'view-alerts',
  replenishments: 'view-replenishments',
  admin: 'view-admin-permissions'
};

const ALIAS_TO_PARENT = { shipments: 'movements', replenishments: 'alerts' };
const HIDDEN_LEGACY_MODULES = ['entities', 'documents', 'search'];
const INTERNAL_MODULES = ['entities', 'documents', 'search'];
const INTERNAL_VIEWS = {
  entities: 'view-entities',
  documents: 'view-documents',
  search: 'view-search'
};
const ROUTABLE_MODULES = [...MODULES, ...INTERNAL_MODULES];
const VIEW_IDS = { ...VIEWS, ...INTERNAL_VIEWS };
const TAB_DEFAULTS = { movements: 'entries', alerts: 'alerts' };
const TOP_LEVEL_MODULES = ROUTABLE_MODULES.filter(moduleName => !ALIAS_TO_PARENT[moduleName]);

let wired = false;
let activeUser = null;
let lastHash = '';

function getActiveRole(){ return activeUser ? activeUser.role : ''; }
function getActiveUserId(){ return activeUser ? Number(activeUser.user_id) : undefined; }
function currentCan(action){ return canPerform(getActiveRole(), action, getActiveUserId()); }
function currentCanModule(moduleName){ return canAccessModule(getActiveRole(), moduleName, getActiveUserId()); }
function currentCanAdminPanel(){ return getEffectivePermission(getActiveRole(), 'panel', ADMIN_RESOURCE, getActiveUserId()); }
function currentLanding(){ return resolveLandingModule(getActiveRole(), getActiveUserId()).module; }
function isModuleAllowed(moduleName){
  if(!ROUTABLE_MODULES.includes(moduleName)) return false;
  const parent = ALIAS_TO_PARENT[moduleName] ? ALIAS_TO_PARENT[moduleName] : moduleName;
  return ALIAS_TO_PARENT[moduleName]
    ? guardModuleAccess(parent, { silent: true }) && guardModuleAccess(moduleName, { silent: true })
    : guardModuleAccess(moduleName, { silent: true });
}
function isHashModuleAllowed(moduleName){
  return !HIDDEN_LEGACY_MODULES.includes(moduleName) && isModuleAllowed(moduleName);
}
function moduleFromHash(hash){
  const raw = String(hash || '').replace(/^#\/?/, '').split(/[?/]/)[0];
  return ROUTABLE_MODULES.includes(raw) ? raw : null;
}
function browserTabUrl(module){
  const url = new URL(window.location.href);
  url.hash = `#/${module}`;
  return url.href;
}

function setAccessNotice(message = '', severity = 'info'){
  const el = qs('access-notice');
  if(!el) return;
  if(message){
    el.classList.remove('notice--info', 'notice--warning', 'notice--error');
    el.classList.add(`notice--${severity}`);
    el.textContent = message;
    el.hidden = false;
  } else {
    el.textContent = '';
    el.hidden = true;
  }
}

function deny(message = 'No tienes permisos para realizar esta acción con el perfil activo (simulación).'){
  setAccessNotice(message, 'warning');
  alert(message);
  return false;
}

function guardModuleAccess(moduleName, { silent = false } = {}){
  if(moduleName === 'admin'){
    if(currentCanAdminPanel()) return true;
  } else if(currentCanModule(moduleName)){
    return true;
  }
  if(!silent){
    setAccessNotice('Acceso no disponible para el perfil activo. Sección restringida (simulación, sin seguridad real).', 'warning');
  }
  return false;
}

function guardAction(action, message){
  if(currentCan(action)) return true;
  return deny(message || 'Acción no permitida para el perfil activo (simulación).');
}

function syncHash(module, tab){
  const hash = `#/${module}${tab && !ALIAS_TO_PARENT[module] ? `/${tab}` : ''}`;
  lastHash = hash;
  if(window.location.hash !== hash) window.location.hash = hash;
}

function navigateToModule(name, opts = {}){
  if(!isModuleAllowed(name)){
    const message = 'Acceso no disponible para el perfil activo. Sección restringida (simulación, sin seguridad real).';
    if(!opts.silentDeny) setAccessNotice(message, 'warning');
    const landing = currentLanding();
    if(landing !== name && isModuleAllowed(landing)){
      const result = navigateToModule(landing, { ...opts, silentDeny: true });
      if(!opts.silentDeny) setAccessNotice(message, 'warning');
      return result;
    }
    showModule(landing);
    syncHash(landing);
    return landing;
  }
  const tab = opts.tab || null;
  showModule(name, { ...opts, tab });
  syncHash(name, tab);
  return name;
}

function openModuleInBrowserTab(module){
  if(!ROUTABLE_MODULES.includes(module)) return;
  if(!isModuleAllowed(module)){
    setAccessNotice('Acceso no disponible para el perfil activo. Sección restringida (simulación, sin seguridad real).', 'warning');
    return;
  }
  if(HIDDEN_LEGACY_MODULES.includes(module)){
    navigateToModule(module);
    return;
  }
  let opened = null;
  try{ opened = window.open(browserTabUrl(module), '_blank'); }catch(e){ opened = null; }
  if(!opened){
    navigateToModule(module);
    return;
  }
  if(opened.opener){
    try{ opened.opener = null; }catch(e){}
  }
}

function tabButtons(parent){
  return [...document.querySelectorAll(`.tab-button[data-parent="${parent}"]`)];
}

function tabAllowed(parent, tab){
  if(parent === 'movements'){
    return tab === 'shipments' ? currentCanModule('shipments') : currentCanModule('movements');
  }
  if(parent === 'alerts'){
    return tab === 'replenishments' ? currentCanModule('replenishments') : currentCanModule('alerts');
  }
  return true;
}

function defaultTab(parent){
  const preferred = TAB_DEFAULTS[parent];
  if(preferred && tabAllowed(parent, preferred)) return preferred;
  return tabButtons(parent).find(btn => tabAllowed(parent, btn.dataset.tab))?.dataset.tab || null;
}

function placeMovementForm(tab){
  const card = document.querySelector('#view-movements .card[aria-labelledby="movement-form-heading"]');
  const mount = qs(tab === 'exits' ? 'movements-exit-form-mount' : 'movements-entry-form-mount');
  if(!card || !mount || card.parentElement === mount) return;
  mount.appendChild(card);
  const type = qs('movement-type');
  const value = tab === 'exits' ? 'salida' : 'entrada';
  if(type && [...type.options].some(option => option.value === value)) type.value = value;
}

function setParentTabsHidden(parent){
  document.querySelectorAll(`.tab-panel[aria-labelledby^="tab-${parent}-"]`).forEach(panel => { panel.hidden = true; });
  tabButtons(parent).forEach(btn => btn.setAttribute('aria-selected', 'false'));
  if(parent === 'movements'){
    const view = qs(VIEWS.shipments);
    if(view) view.hidden = true;
  }
  if(parent === 'alerts'){
    const view = qs(VIEWS.replenishments);
    if(view) view.hidden = true;
  }
}

function activateTab(parent, tab){
  const buttons = tabButtons(parent);
  if(!buttons.length) return;
  if(!tab || !tabAllowed(parent, tab)) tab = defaultTab(parent);
  if(!tab) return;
  buttons.forEach(btn => {
    const allowed = tabAllowed(parent, btn.dataset.tab);
    btn.hidden = !allowed;
    btn.disabled = !allowed;
    btn.setAttribute('aria-hidden', allowed ? 'false' : 'true');
    btn.setAttribute('aria-selected', String(allowed && btn.dataset.tab === tab));
  });
  document.querySelectorAll(`.tab-panel[aria-labelledby^="tab-${parent}-"]`).forEach(panel => {
    panel.hidden = panel.id !== `${parent}-panel-${tab}`;
  });
  if(parent === 'movements'){
    const view = qs(VIEWS.shipments);
    if(view) view.hidden = tab !== 'shipments';
    placeMovementForm(tab);
  }
  if(parent === 'alerts'){
    const view = qs(VIEWS.replenishments);
    if(view) view.hidden = tab !== 'replenishments';
  }
}

function applyTabPermissions(){
  ['movements', 'alerts'].forEach(parent => {
    const buttons = tabButtons(parent);
    const selected = buttons.find(btn => btn.getAttribute('aria-selected') === 'true');
    if(selected && !tabAllowed(parent, selected.dataset.tab)) activateTab(parent, defaultTab(parent));
    else if(!selected && buttons.length) activateTab(parent, defaultTab(parent));
  });
}

function showModule(name, opts = {}){
  if(!ROUTABLE_MODULES.includes(name)) name = 'dashboard';
  const requestedModule = name;
  const alias = ALIAS_TO_PARENT[requestedModule] ? requestedModule : null;
  const parent = alias ? ALIAS_TO_PARENT[alias] : requestedModule;
  const allowed = alias
    ? guardModuleAccess(parent, { silent: true }) && guardModuleAccess(alias, { silent: true })
    : guardModuleAccess(parent, { silent: true });
  if(!allowed){
    setAccessNotice('Acceso no disponible para el perfil activo. Sección restringida (simulación, sin seguridad real).', 'warning');
    name = 'dashboard';
  } else {
    setAccessNotice('');
    name = parent;
  }
  const tab = opts.tab || alias || null;
  TOP_LEVEL_MODULES.forEach(m => { const el = qs(VIEW_IDS[m]); if(el) el.hidden = m !== name; });
  if(name !== 'movements') setParentTabsHidden('movements');
  if(name !== 'alerts') setParentTabsHidden('alerts');
  setActiveModule(name);

  if(name === 'dashboard') renderDashboard(getActiveRole(), getActiveUserId());
  if(name === 'admin'){
    const panel = qs('view-admin-permissions');
    renderPermissionsPanel(panel);
    wirePermissionsPanel(panel, refreshAfterPermissionChange);
  }
  if(name === 'entities'){
    populateDocumentEntitySelect();
    populateEditEntitySelect();
    if(opts.newRecord) clearEntityForm();
    if(opts.focusForm) qs('name').focus();
  }
  if(name === 'documents'){
    populateDocumentEntitySelect();
    populateEditDocumentSelect();
    if(opts.newRecord) clearDocumentForm();
    if(opts.focusForm) qs('document-entity').focus();
  }
  if(name === 'search'){
    refreshSearch();
    if(opts.focusSearch) qs('search-input').focus();
  }
  if(name === 'products'){
    populateProductCategorySelect();
    if(opts.newRecord) clearProductForm();
    refreshProducts();
  }
  if(name === 'warehouses'){
    populateWarehouseResponsableSelect();
    if(opts.newRecord) clearWarehouseForm();
    refreshWarehouses();
  }
  if(name === 'stock'){
    populateStockFilterSelects();
    refreshStock();
  }
  if(name === 'movements'){
    populateMovementProductSelect();
    populateMovementWarehouseSelect();
    populateMovementFilterSelects();
    refreshMovements();
    activateTab('movements', tab);
    if(alias === 'shipments') refreshShipments();
  }
  if(name === 'transfers'){
    populateTransferProductSelect();
    populateTransferWarehouseSelects();
    populateTransferFilterSelects();
    refreshTransfers();
  }
  if(name === 'alerts'){
    populateAlertFilterSelects();
    refreshAlerts();
    activateTab('alerts', tab);
    if(alias === 'replenishments'){
      populateReplenishmentProductSelect();
      populateReplenishmentWarehouseSelect();
      populateReplenishmentFilterSelects();
      if(opts.newRecord) clearReplenishmentForm();
      if(opts.newRecord || opts.focusForm){
        const quantity = qs('replenishment-quantity');
        if(quantity) quantity.focus();
      }
      refreshReplenishments();
    }
  }
  applyPermissionUiState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateDocumentEntitySelect(){
  const select = qs('document-entity');
  if(!select) return;
  const prev = select.value;
  select.innerHTML = '';
  loadEntities().forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.entity_id;
    opt.textContent = e.name;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function populateEditEntitySelect(){
  const select = qs('edit-entity');
  if(!select) return;
  const prev = select.value;
  select.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = `-- Selecciona ${articulo(labelFor('entity'))} ${labelFor('entity').toLowerCase()} --`;
  select.appendChild(none);
  loadEntities().forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.name} — ${e.code}`;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function populateEditDocumentSelect(){
  const select = qs('edit-document');
  if(!select) return;
  const prev = select.value;
  select.innerHTML = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = `-- Selecciona ${articulo(labelFor('document'))} ${labelFor('document').toLowerCase()} --`;
  select.appendChild(none);
  const entities = loadEntities();
  loadDocuments().forEach(d => {
    const entity = entities.find(e => e.entity_id === d.entity_id);
    const label = `${entity ? entity.name : 'Entidad desconocida'} · ${folioLabel(d)} · ${d.startDate} → ${d.endDate}`;
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = label;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function refreshSearch(){
  if(!guardModuleAccess('search', { silent: true })) return;
  renderSearchResults(qs('search-results-list'), qs('search-empty'), searchEntities(qs('search-input').value), (e) => createEntityItem(e));
}

function populateFilterSelect(select, items, blankLabel){
  if(!select) return;
  const prev = select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = blankLabel;
  select.appendChild(blank);
  items.forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

function productOptions(){ return loadProducts().map(p => [String(p.product_id), `${p.product_name} (${p.sku})`]); }
function warehouseOptions(){ return loadWarehouses().map(w => [String(w.warehouse_id), w.name]); }

function populateStockFilterSelects(){
  populateFilterSelect(qs('stock-filter-product'), productOptions(), 'Todos los productos');
  populateFilterSelect(qs('stock-filter-warehouse'), warehouseOptions(), 'Todas las bodegas');
}
function populateMovementFilterSelects(){
  populateFilterSelect(qs('movement-filter-product'), productOptions(), 'Todos los productos');
  populateFilterSelect(qs('movement-filter-warehouse'), warehouseOptions(), 'Todas las bodegas');
}
function populateAlertFilterSelects(){
  populateFilterSelect(qs('alert-filter-product'), productOptions(), 'Todos los productos');
  populateFilterSelect(qs('alert-filter-warehouse'), warehouseOptions(), 'Todas las bodegas');
}
function populateReplenishmentFilterSelects(){
  populateFilterSelect(qs('replenishment-filter-product'), productOptions(), 'Todos los productos');
  populateFilterSelect(qs('replenishment-filter-warehouse'), warehouseOptions(), 'Todas las bodegas');
}
function populateTransferFilterSelects(){
  populateFilterSelect(qs('transfer-filter-status'), [
    ['pendiente', 'Pendiente'],
    ['confirmada', 'Confirmada'],
    ['cancelada', 'Cancelada']
  ], 'Todos los estados');
  populateFilterSelect(qs('transfer-filter-product'), productOptions(), 'Todos los productos');
  populateFilterSelect(qs('transfer-filter-source'), warehouseOptions(), 'Todas las bodegas');
  populateFilterSelect(qs('transfer-filter-target'), warehouseOptions(), 'Todas las bodegas');
}

function refreshProducts(){
  if(!guardModuleAccess('products', { silent: true })) return;
  renderProductList(qs('product-list-body'), qs('product-list-empty'), searchProducts(qs('product-search').value), {
    canManage: currentCan('products.manage'),
    onEdit: (p) => {
      if(!guardAction('products.manage', 'Solo el administrador puede editar productos.')) return;
      startProductEdit(p);
      qs('product-sku').focus();
    },
    onToggleStatus: (p) => {
      if(!guardAction('products.manage', 'Solo el administrador puede activar o inactivar productos.')) return;
      if(!isValidActiveUser()){ alert('No existe un usuario activo válido para registrar el cambio de estado.'); return; }
      const next = p.status === 'activo' ? 'inactivo' : 'activo';
      const result = setProductStatus(p.product_id, next, activeUser.user_id);
      if(!result.success) alert(result.error);
      refreshProducts();
    }
  });
}

function handleProductSubmit(ev){
  ev.preventDefault();
  if(!guardAction('products.manage', 'Solo el administrador puede crear o modificar productos.')) return;
  if(!guardModuleAccess('products', { silent: true })) return;
  if(!isValidActiveUser()){
    showProductErrors({ userId: 'No existe un usuario activo válido para registrar el producto' });
    return;
  }
  const id = qs('product-id').value;
  const payload = { ...collectProductPayload(), userId: activeUser.user_id };
  const result = id ? updateProduct(id, payload) : createProduct(payload);
  showProductErrors(result.errors || {}, result.warnings || {});
  if(!result.success) return;
  clearProductForm();
  populateProductCategorySelect();
  refreshProducts();
}

function refreshWarehouses(){
  if(!guardModuleAccess('warehouses', { silent: true })) return;
  renderWarehouseList(qs('warehouse-list-body'), qs('warehouse-list-empty'), searchWarehouses(qs('warehouse-search').value), {
    canManage: currentCan('warehouses.manage'),
    onEdit: (w) => {
      if(!guardAction('warehouses.manage', 'Solo el administrador puede editar bodegas.')) return;
      startWarehouseEdit(w);
      qs('warehouse-name').focus();
    },
    onToggleStatus: (w) => {
      if(!guardAction('warehouses.manage', 'Solo el administrador puede cambiar el estado de bodegas.')) return;
      const next = w.status === 'activo' ? 'inactivo' : 'activo';
      const result = setWarehouseStatus(w.warehouse_id, next);
      if(!result.success) alert(result.error);
      refreshWarehouses();
    }
  });
}

function handleWarehouseSubmit(ev){
  ev.preventDefault();
  if(!guardAction('warehouses.manage', 'Solo el administrador puede crear o modificar bodegas.')) return;
  if(!guardModuleAccess('warehouses', { silent: true })) return;
  const id = qs('warehouse-id').value;
  const payload = collectWarehousePayload();
  const result = id ? updateWarehouse(id, payload) : createWarehouse(payload);
  showWarehouseErrors(result.errors || {});
  if(!result.success) return;
  clearWarehouseForm();
  refreshWarehouses();
}

function refreshStock(){
  if(!guardModuleAccess('stock', { silent: true })) return;
  const productId = qs('stock-filter-product').value;
  const warehouseId = qs('stock-filter-warehouse').value;
  const canConfigureMin = currentCan('stock.configure_min');
  renderStockList(qs('stock-list-body'), qs('stock-list-empty'), listStock({ productId, warehouseId }), {
    canConfigureMin,
    onSaveMinLevel: (stockId, value) => {
      if(!guardAction('stock.configure_min', 'Solo el administrador puede configurar el nivel mínimo de stock.')) {
        return { success: false, error: 'Acción no permitida para el perfil activo.' };
      }
      const result = setMinStockLevel(stockId, value);
      refreshStock();
      return result;
    }
  });
  renderStockTotal(qs('stock-product-total'), productId ? getProductTotal(productId) : '—');
}

function refreshMovements(){
  if(!guardModuleAccess('movements', { silent: true })) return;
  const productId = qs('movement-filter-product').value;
  const warehouseId = qs('movement-filter-warehouse').value;
  renderMovementList(qs('movement-list-body'), qs('movement-list-empty'), listMovements({ productId, warehouseId }), {
    canAdjust: currentCan('movements.adjust'),
    onAdjust: (movement, adjustmentType) => {
      if(!guardAction('movements.adjust', 'No tienes permisos para registrar ajustes de inventario con el perfil activo.')) return;
      prefillAdjustment(movement, adjustmentType);
    }
  });
  renderOrderList(qs('order-list-body'), qs('order-list-empty'), listOrders());
}

function isValidActiveUser(){
  return Boolean(activeUser && loadUsers().some(u => Number(u.user_id) === Number(activeUser.user_id)));
}

function handleMovementSubmit(ev){
  ev.preventDefault();
  if(!guardAction('movements.register', 'No tienes permisos para registrar movimientos con el perfil activo.')) return;
  if(!guardModuleAccess('movements', { silent: true })) return;
  const payload = collectMovementPayload();
  if(!isValidActiveUser()){
    showMovementErrors({ userId: 'No existe un usuario activo válido para registrar el movimiento' });
    return;
  }
  const result = registerMovement({ ...payload, userId: activeUser.user_id });
  showMovementErrors(result.errors || {});
  if(!result.success) return;
  clearMovementForm();
  const activeMovementTab = tabButtons('movements').find(btn => btn.getAttribute('aria-selected') === 'true')?.dataset.tab;
  qs('movement-type').value = activeMovementTab === 'exits' ? 'salida' : 'entrada';
  refreshMovements();
  refreshStock();
}

function clearTransferFilters(){
  ['transfer-search', 'transfer-filter-status', 'transfer-filter-product', 'transfer-filter-source', 'transfer-filter-target']
    .forEach(id => { const el = qs(id); if(el) el.value = ''; });
  refreshTransfers();
}

function refreshTransfers(){
  if(!guardModuleAccess('transfers', { silent: true })) return;
  const filters = {
    term: qs('transfer-search')?.value,
    status: qs('transfer-filter-status')?.value,
    productId: qs('transfer-filter-product')?.value,
    sourceWarehouseId: qs('transfer-filter-source')?.value,
    targetWarehouseId: qs('transfer-filter-target')?.value
  };
  renderTransferList(qs('transfer-list-body'), qs('transfer-list-empty'), listTransfers(filters), {
    canConfirm: currentCan('transfers.confirm'),
    canCancel: currentCan('transfers.cancel'),
    onConfirm: (t) => {
      if(!guardAction('transfers.confirm', 'No tienes permisos para confirmar transferencias con el perfil activo.')) return;
      if(!isValidActiveUser()){ alert('No existe un usuario activo válido para confirmar la transferencia.'); return; }
      const result = confirmTransfer(t.transfer_id, activeUser.user_id);
      if(!result.success) alert(result.error);
      refreshTransfers();
      refreshStock();
    },
    onCancel: (t) => {
      if(!guardAction('transfers.cancel', 'No tienes permisos para cancelar transferencias con el perfil activo.')) return;
      if(!isValidActiveUser()){ alert('No existe un usuario activo válido para cancelar la transferencia.'); return; }
      const result = cancelTransfer(t.transfer_id, activeUser.user_id);
      if(!result.success) alert(result.error);
      refreshTransfers();
    }
  });
}

function handleTransferSubmit(ev){
  ev.preventDefault();
  if(!guardAction('transfers.create', 'No tienes permisos para crear transferencias con el perfil activo.')) return;
  if(!guardModuleAccess('transfers', { silent: true })) return;
  const payload = collectTransferPayload();
  if(!isValidActiveUser()){
    showTransferErrors({ createdBy: 'No existe un usuario activo válido para registrar la transferencia' });
    return;
  }
  const result = requestTransfer({ ...payload, createdBy: activeUser.user_id });
  showTransferErrors(result.errors || {});
  if(!result.success) return;
  clearTransferForm();
  refreshTransfers();
}

function refreshShipments(){
  if(!guardModuleAccess('shipments', { silent: true })) return;
  populateShipmentOrderSelect();
  const filters = {
    term: qs('shipment-search')?.value,
    status: qs('shipment-filter-status')?.value
  };
  renderShipmentList(qs('shipment-list-body'), qs('shipment-list-empty'), listShipments(filters), {
    canUpdateStatus: currentCan('shipments.update_status'),
    onAdvance: (shipment) => {
      if(!guardAction('shipments.update_status', 'No tienes permisos para actualizar el estado del envío con el perfil activo.')) return;
      if(!isValidActiveUser()){
        alert('No existe un usuario activo válido para actualizar el envío.');
        return;
      }
      const result = advanceShipmentStatus(shipment.shipment_id, activeUser.user_id);
      if(!result.success){
        alert(result.error || Object.values(result.errors || {})[0] || 'No fue posible avanzar el envío.');
      }
      refreshShipments();
    }
  });
}

function handleShipmentSubmit(ev){
  ev.preventDefault();
  if(!guardAction('shipments.create', 'No tienes permisos para registrar envíos con el perfil activo.')) return;
  if(!guardModuleAccess('shipments', { silent: true })) return;
  const payload = collectShipmentPayload();
  if(!isValidActiveUser()){
    showShipmentErrors({ createdBy: 'No existe un usuario activo válido para registrar el envío' });
    return;
  }
  const result = createShipment({ ...payload, createdBy: activeUser.user_id });
  showShipmentErrors(result.errors || {});
  if(!result.success) return;
  clearShipmentForm();
  refreshShipments();
}

function refreshAlerts(){
  if(!guardModuleAccess('alerts', { silent: true })) return;
  const productId = qs('alert-filter-product').value;
  const warehouseId = qs('alert-filter-warehouse').value;
  const canCreateRequest = currentCan('replenishments.create');
  renderAlertList(qs('alert-list-body'), qs('alert-list-empty'), listAlerts({ productId, warehouseId }), {
    canCreate: canCreateRequest,
    onCreateRequest: (alert) => {
      if(!guardAction('replenishments.create', 'No tienes permisos para crear solicitudes de reposición con el perfil activo.')) return;
      populateReplenishmentProductSelect();
      populateReplenishmentWarehouseSelect();
      prefillReplenishmentFromAlert({ productId: alert.product_id, warehouseId: alert.warehouse_id, quantity: alert.deficit });
      const origin = qs('replenishment-form-origin');
      if(origin) origin.textContent = 'Origen: alerta HU-06';
      navigateToModule('replenishments', { focusForm: true });
    }
  });
}

function isWarehouseManagerOnly(){
  return currentCan('replenishments.receive')
    && !currentCan('replenishments.create')
    && !currentCan('replenishments.approve');
}

function refreshReplenishments(){
  if(!guardModuleAccess('replenishments', { silent: true })) return;
  const role = getActiveRole();
  const managerOnly = isWarehouseManagerOnly();
  const statusSelect = qs('replenishment-filter-status');
  if(statusSelect){
    statusSelect.disabled = managerOnly;
    if(managerOnly) statusSelect.value = 'aprobada';
  }
  const status = managerOnly ? 'aprobada' : statusSelect?.value;
  const productId = qs('replenishment-filter-product').value;
  const warehouseId = qs('replenishment-filter-warehouse').value;
  renderReplenishmentCounts(replenishmentCounts());
  renderReplenishmentList(qs('replenishment-list-body'), qs('replenishment-list-empty'), listReplenishments({ status, productId, warehouseId }), {
    canApprove: currentCan('replenishments.approve'),
    canCancel: currentCan('replenishments.cancel'),
    canReceive: currentCan('replenishments.receive'),
    onApprove: (request) => {
      if(!guardAction('replenishments.approve', 'No tienes permisos para aprobar reposiciones con el perfil activo.')) return;
      if(!isValidActiveUser()){ alert('No existe un usuario activo válido para aprobar la reposición.'); return; }
      const result = approveRequest(request.request_id, activeUser.user_id);
      if(!result.success) alert(result.error);
      refreshReplenishments();
      renderDashboard(role, getActiveUserId());
    },
    onCancel: (request) => {
      if(!guardAction('replenishments.cancel', 'No tienes permisos para cancelar reposiciones con el perfil activo.')) return;
      if(!isValidActiveUser()){ alert('No existe un usuario activo válido para cancelar la reposición.'); return; }
      const result = cancelRequest(request.request_id, activeUser.user_id);
      if(!result.success) alert(result.error);
      refreshReplenishments();
      renderDashboard(role, getActiveUserId());
    },
    onReceive: (request) => {
      if(!guardAction('replenishments.receive', 'Solo el encargado de bodega puede registrar la recepción con el perfil activo.')) return;
      if(!isValidActiveUser()){ alert('No existe un usuario activo válido para recibir la reposición.'); return; }
      const result = receiveRequest(request.request_id, activeUser.user_id);
      if(!result.success) alert(result.error);
      refreshReplenishments();
      refreshStock();
      refreshMovements();
      refreshAlerts();
      renderDashboard(role, getActiveUserId());
    }
  });
}

function handleReplenishmentSubmit(ev){
  ev.preventDefault();
  if(!guardAction('replenishments.create', 'No tienes permisos para crear solicitudes de reposición con el perfil activo.')) return;
  if(!guardModuleAccess('replenishments', { silent: true })) return;
  if(!isValidActiveUser()){
    showReplenishmentErrors({ createdBy: 'No existe un usuario activo válido para registrar la solicitud' });
    return;
  }
  const payload = collectReplenishmentPayload();
  const result = requestReplenishment({ ...payload, createdBy: activeUser.user_id });
  showReplenishmentErrors(result.errors || {});
  if(!result.success) return;
  clearReplenishmentForm();
  const origin = qs('replenishment-form-origin');
  if(origin) origin.textContent = 'Origen: manual';
  refreshReplenishments();
  renderDashboard(getActiveRole(), getActiveUserId());
}

function onEditEntityChange(){
  const id = qs('edit-entity').value;
  if(!id){ clearEntityForm(); return; }
  const entity = loadEntities().find(e => e.id === id);
  if(entity) startEntityEdit(entity);
}

function handleDeleteSelectedEntity(){
  if(!guardAction('base.manage', 'Solo el administrador puede gestionar la sección avanzada del módulo base.')) return;
  const id = qs('edit-entity').value;
  if(!id){ qs('error-edit-entity').textContent = `Selecciona ${articulo(labelFor('entity'))} ${labelFor('entity').toLowerCase()} para eliminar.`; return; }
  if(!confirm(`¿Eliminar ${demostrativo(labelFor('entity'))} ${labelFor('entity').toLowerCase()}? Sus ${labelFor('documents').toLowerCase()} también se eliminarán.`)) return;
  deleteEntity(id);
  qs('error-edit-entity').textContent = '';
  clearEntityForm();
  populateDocumentEntitySelect();
  populateEditEntitySelect();
  populateEditDocumentSelect();
}

function onEditDocumentChange(){
  const id = qs('edit-document').value;
  if(!id){ clearDocumentForm(); return; }
  const doc = loadDocuments().find(d => d.id === id);
  if(doc) startDocumentEdit(doc);
}

function handleDeleteSelectedDocument(){
  if(!guardAction('base.manage', 'Solo el administrador puede gestionar la sección avanzada del módulo base.')) return;
  const id = qs('edit-document').value;
  const documentLabel = labelFor('document');
  if(!id){ qs('error-edit-document').textContent = `Selecciona ${articulo(documentLabel)} ${documentLabel.toLowerCase()} para eliminar.`; return; }
  if(!confirm(`¿Eliminar ${demostrativo(documentLabel)} ${documentLabel.toLowerCase()}?`)) return;
  deleteDocument(id);
  qs('error-edit-document').textContent = '';
  clearDocumentForm();
  populateEditDocumentSelect();
}

function afterSaveRefresh(){
  populateDocumentEntitySelect();
  populateEditEntitySelect();
  populateEditDocumentSelect();
}

function handleEntitySubmit(ev){
  ev.preventDefault();
  if(!guardAction('base.manage', 'Solo el administrador puede gestionar la sección avanzada del módulo base.')) return;
  if(!guardModuleAccess('entities', { silent: true })) return;
  const id = qs('entity-id').value;
  const payload = collectEntityPayload();
  const { valid, errors } = validateEntity(payload);
  showEntityErrors(errors);
  if(!valid) return;
  if(id){
    try{ updateEntity(id, payload); clearEntityForm(); }catch(e){ alert(e.message); }
  }else{
    addEntity(payload);
    clearEntityForm();
  }
  afterSaveRefresh();
}

function handleDocumentSubmit(ev){
  ev.preventDefault();
  if(!guardAction('base.manage', 'Solo el administrador puede gestionar la sección avanzada del módulo base.')) return;
  if(!guardModuleAccess('documents', { silent: true })) return;
  const id = qs('document-id').value;
  const payload = collectDocumentPayload();
  const existing = id ? loadDocuments().find(d => d.id === id) : undefined;
  const { valid, errors } = validateDocument(payload, existing ? existing.status : undefined);
  showDocumentErrors(errors);
  if(!valid) return;
  try{
    if(id){ updateDocument(id, payload); } else { addDocument(payload); }
    clearDocumentForm();
  }catch(e){
    alert(e.message);
    showDocumentErrors({ status: e.message });
  }
  afterSaveRefresh();
}

function applyLabels(config){
  const entity = config.labels.entity;
  const entities = config.labels.entities;
  const document_ = config.labels.document;
  const documents = config.labels.documents;
  document.title = config.moduleName;
  const brandParts = config.moduleName.split('|');
  qs('brand-name').textContent = brandParts[0].trim();
  qs('brand-tagline').textContent = brandParts.length > 1 ? brandParts.slice(1).join('|').trim() : 'Grupo 19';
  applyShellLabels();

  qs('dashboard-heading').textContent = config.moduleName;
  qs('dashboard-subtitle').textContent = `Gestiona inventario, bodegas y operaciones logísticas.`;

  qs('entities-view-heading').textContent = entities;
  qs('documents-view-heading').textContent = documents;
  qs('entity-form-heading').textContent = `Agregar / Editar ${entity}`;
  qs('edit-entity-heading').textContent = `Editar o eliminar ${articulo(entity)} ${entity.toLowerCase()}`;
  qs('document-form-heading').textContent = `Agregar / Editar ${document_}`;
  qs('edit-document-heading').textContent = `Editar o eliminar ${articulo(document_)} ${document_.toLowerCase()}`;
  qs('search-view-heading').textContent = `Buscar ${entities}`;
  qs('search-heading').textContent = `Buscar ${articulo(entity)} ${entity.toLowerCase()}`;
  qs('search-input').placeholder = 'Buscar por nombre, código, categoría...';
  qs('search-input').setAttribute('aria-label', `Buscar ${entities.toLowerCase()}`);
  qs('search-empty').textContent = 'Sin coincidencias para tu búsqueda.';
  qs('delete-entity').textContent = `Eliminar ${articulo(entity)} ${entity.toLowerCase()} ${seleccionada(entity)}`;
  qs('delete-document').textContent = `Eliminar ${articulo(document_)} ${document_.toLowerCase()} ${seleccionada(document_)}`;
}

function accentRgb(value){
  const raw = String(value || '').replace('#', '');
  const hex = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw;
  if(!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}`;
}

function applyTheme(config){
  const root = document.documentElement;
  const accent = config.theme.accentColor;
  const rgb = accentRgb(accent);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-deep', accent);
  if(rgb) root.style.setProperty('--accent-rgb', rgb);
}

function showConfigErrors(errors){
  const banner = qs('config-errors');
  if(errors && errors.length > 0){
    banner.textContent = `Problema de configuración del módulo: ${errors.join(' ')}`;
    banner.hidden = false;
  } else {
    banner.hidden = true;
    banner.textContent = '';
  }
}

function setSectionDisabled(sectionSelector, disabled){
  const section = document.querySelector(sectionSelector);
  if(!section) return;
  section.hidden = disabled;
  section.querySelectorAll('input, select, textarea, button').forEach(el => { el.disabled = disabled; });
}

function applyPermissionUiState(){
  const role = getActiveRole();
  const canBase = currentCan('base.manage');
  const canProducts = currentCan('products.manage');
  const canWarehouses = currentCan('warehouses.manage');
  const canMove = currentCan('movements.register');
  const canAdjust = currentCan('movements.adjust');
  const canTransferCreate = currentCan('transfers.create');
  const canShipmentCreate = currentCan('shipments.create');
  const canReplenishmentCreate = currentCan('replenishments.create');

  const demoCard = qs('demo-data-card');
  if(demoCard) demoCard.hidden = true;

  // Base advanced forms
  setSectionDisabled('#view-entities .card[aria-labelledby="entity-form-heading"]', !canBase);
  setSectionDisabled('#view-entities .card[aria-labelledby="edit-entity-heading"]', !canBase);
  setSectionDisabled('#view-documents .card[aria-labelledby="document-form-heading"]', !canBase);
  setSectionDisabled('#view-documents .card[aria-labelledby="edit-document-heading"]', !canBase);

  // Logistics forms/actions (read-only access handled in lists/renders)
  setSectionDisabled('#view-products .card[aria-labelledby="product-form-heading"]', !canProducts);
  setSectionDisabled('#view-warehouses .card[aria-labelledby="warehouse-form-heading"]', !canWarehouses);
  setSectionDisabled('#view-movements .card[aria-labelledby="movement-form-heading"]', !(canMove || canAdjust));
  setSectionDisabled('#view-transfers .card[aria-labelledby="transfer-form-heading"]', !canTransferCreate);
  setSectionDisabled('#view-shipments .card[aria-labelledby="shipment-form-heading"]', !canShipmentCreate);
  setSectionDisabled('#view-replenishments .card[aria-labelledby="replenishment-form-heading"]', !canReplenishmentCreate);

  // Active user selector always available in topbar
  applyNavigationPermissions(role, getActiveUserId());
  applyTabPermissions();
  refreshActiveUserBadge();
}

function refreshActiveUserBadge(){
  const badge = qs('active-user-role');
  if(!badge) return;
  const avatar = qs('active-user-avatar');
  if(!activeUser){
    badge.textContent = 'Sin usuario';
    if(avatar) avatar.textContent = '--';
    return;
  }
  badge.textContent = `${activeUser.user_name} — ${roleLabel(activeUser.role)}`;
  if(avatar){
    const initials = String(activeUser.user_name || '')
      .trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map(part => part[0].toUpperCase()).join('');
    avatar.textContent = initials || '--';
  }
}

function populateActiveUserSelect(){
  const select = qs('active-user-select');
  if(!select) return;
  const users = loadUsers();
  const prev = activeUser ? String(activeUser.user_id) : '';
  select.innerHTML = '';
  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = String(u.user_id);
    opt.textContent = `${u.user_name} (${roleLabel(u.role)})`;
    select.appendChild(opt);
  });
  const resolved = resolveActiveUser(users);
  activeUser = resolved;
  if(activeUser){
    select.value = String(activeUser.user_id);
  } else if(prev) {
    select.value = prev;
  }
}

function onActiveUserChange(){
  const select = qs('active-user-select');
  const userId = select ? Number(select.value) : null;
  const user = loadUsers().find(u => Number(u.user_id) === Number(userId));
  if(user){
    activeUser = user;
    setActiveUserId(user.user_id);
    navigateToModule(resolveLandingModule(user.role, user.user_id).module);
    setAccessNotice(`Perfil activo (simulación): ${user.user_name} — ${roleLabel(user.role)}. Sin autenticación real ni seguridad.`, 'info');
    return;
  }
  navigateToModule('dashboard');
}

function refreshAfterPermissionChange(changedUserId){
  populateActiveUserSelect();
  if(changedUserId !== undefined){
    const updated = loadUsers().find(u => Number(u.user_id) === Number(changedUserId));
    if(updated) activeUser = updated;
  }
  applyPermissionUiState();
  navigateToModule(currentCanAdminPanel() ? 'admin' : currentLanding());
}

function handleHashChange(){
  const parts = window.location.hash.replace(/^#\/?/, '').split(/[?/]/);
  const raw = parts[0];
  const hash = `#/${raw}${parts[1] ? `/${parts[1]}` : ''}`;
  if(hash === lastHash) return;
  if(!raw){
    navigateToModule(currentLanding());
    return;
  }
  if(isHashModuleAllowed(raw)){
    navigateToModule(raw, parts[1] ? { tab: parts[1] } : {});
    return;
  }
  navigateToModule(currentLanding(), { silentDeny: true });
  setAccessNotice('Acceso no disponible para el perfil activo. Sección restringida (simulación, sin seguridad real).', 'warning');
}

function wireEvents(){
  if(wired) return;
  wired = true;
  document.querySelectorAll('.nav-module').forEach(btn => {
    btn.addEventListener('click', () => openModuleInBrowserTab(btn.dataset.module));
  });
  const adminNav = qs('nav-admin');
  if(adminNav) adminNav.addEventListener('click', () => openModuleInBrowserTab('admin'));

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.dataset.parent;
      const tab = btn.dataset.tab;
      if(!tabAllowed(parent, tab)) return;
      activateTab(parent, tab);
      if(parent === 'movements' && tab === 'shipments') refreshShipments();
      if(parent === 'alerts' && tab === 'replenishments'){
        populateReplenishmentProductSelect();
        populateReplenishmentWarehouseSelect();
        refreshReplenishments();
      }
    });
  });

  const dashboardView = qs('view-dashboard');
  if(dashboardView){
    dashboardView.addEventListener('click', (ev) => {
      const trigger = ev.target.closest('[data-goto]');
      if(!trigger || trigger.disabled) return;
      const opts = trigger.dataset.newRecord === 'true' ? { newRecord: true, focusForm: true } : {};
      navigateToModule(trigger.dataset.goto, opts);
    });
  }

  const demoButton = qs('load-demo-data');
  if(demoButton){
    demoButton.addEventListener('click', () => {
      if(!guardAction('base.manage', 'Solo el administrador puede cargar datos de demostración.')) return;
      const result = loadDemoData();
      if(!result.success){
        const status = qs('demo-data-status');
        if(status){
          status.textContent = result.error || 'No fue posible cargar los datos de demostración.';
          status.classList.add('is-error');
        }
        return;
      }
      renderDashboard(getActiveRole(), getActiveUserId());
      if(result.message){
        const status = qs('demo-data-status');
        const summary = result.summary;
        if(status && summary){
          status.textContent = `${result.message} Productos: ${summary.products} · Bodegas: ${summary.warehouses} · Movimientos: ${summary.movements} · Transferencias: ${summary.transfers}.`;
        } else if(status){
          status.textContent = result.message;
        }
      }
    });
  }

  qs('entity-form').addEventListener('submit', handleEntitySubmit);
  qs('cancel-edit').addEventListener('click', clearEntityForm);
  qs('document-form').addEventListener('submit', handleDocumentSubmit);
  qs('document-cancel-edit').addEventListener('click', clearDocumentForm);
  setupSearchBar(qs('search-input'), () => refreshSearch());
  qs('edit-entity').addEventListener('change', onEditEntityChange);
  qs('edit-document').addEventListener('change', onEditDocumentChange);
  qs('delete-entity').addEventListener('click', handleDeleteSelectedEntity);
  qs('delete-document').addEventListener('click', handleDeleteSelectedDocument);

  qs('product-form').addEventListener('submit', handleProductSubmit);
  qs('product-cancel-edit').addEventListener('click', () => { if(currentCan('products.manage')) clearProductForm(); });
  qs('product-search').addEventListener('input', refreshProducts);

  qs('warehouse-form').addEventListener('submit', handleWarehouseSubmit);
  qs('warehouse-cancel-edit').addEventListener('click', () => { if(currentCan('warehouses.manage')) clearWarehouseForm(); });
  qs('warehouse-search').addEventListener('input', refreshWarehouses);

  qs('stock-filter-product').addEventListener('change', refreshStock);
  qs('stock-filter-warehouse').addEventListener('change', refreshStock);

  qs('movement-form').addEventListener('submit', handleMovementSubmit);
  qs('movement-filter-product').addEventListener('change', refreshMovements);
  qs('movement-filter-warehouse').addEventListener('change', refreshMovements);

  qs('transfer-form').addEventListener('submit', handleTransferSubmit);
  qs('transfer-search').addEventListener('input', refreshTransfers);
  qs('transfer-filter-status').addEventListener('change', refreshTransfers);
  qs('transfer-filter-product').addEventListener('change', refreshTransfers);
  qs('transfer-filter-source').addEventListener('change', refreshTransfers);
  qs('transfer-filter-target').addEventListener('change', refreshTransfers);
  qs('transfer-filters-clear').addEventListener('click', clearTransferFilters);

  qs('shipment-form').addEventListener('submit', handleShipmentSubmit);
  qs('shipment-search').addEventListener('input', refreshShipments);
  qs('shipment-filter-status').addEventListener('change', refreshShipments);

  qs('alert-filter-product').addEventListener('change', refreshAlerts);
  qs('alert-filter-warehouse').addEventListener('change', refreshAlerts);

  qs('replenishment-form').addEventListener('submit', handleReplenishmentSubmit);
  qs('replenishment-filter-status').addEventListener('change', refreshReplenishments);
  qs('replenishment-filter-product').addEventListener('change', refreshReplenishments);
  qs('replenishment-filter-warehouse').addEventListener('change', refreshReplenishments);

  const activeUserSelect = qs('active-user-select');
  if(activeUserSelect) activeUserSelect.addEventListener('change', onActiveUserChange);
  window.addEventListener('hashchange', handleHashChange);
}

export function initApp(resolved){
  showConfigErrors(resolved.errors);
  setActiveConfig(resolved.config);
  applyTheme(resolved.config);
  renderLogo(qs('logo-mark'));
  applyLabels(resolved.config);
  const productCard = document.querySelector('#view-products .card[aria-labelledby="product-form-heading"]');
  if(productCard) productCard.id = 'view-products .card[aria-labelledby="product-form-heading"]';
  seedLogisticsCatalogs();
  populateActiveUserSelect();
  wireEvents();
  clearEntityForm();
  clearDocumentForm();
  clearProductForm();
  clearWarehouseForm();
  clearMovementForm();
  clearTransferForm();
  clearShipmentForm();
  clearReplenishmentForm();

  const parts = window.location.hash.replace(/^#\/?/, '').split(/[?/]/);
  const raw = parts[0];
  const hashAllowed = raw ? isHashModuleAllowed(raw) : false;
  const bootModule = raw && hashAllowed ? raw : currentLanding();
  const bootOpts = hashAllowed && parts[1] ? { tab: parts[1] } : {};
  showModule(bootModule, bootOpts);
  const bootHash = `#/${bootModule}${bootOpts.tab && !ALIAS_TO_PARENT[bootModule] ? `/${bootOpts.tab}` : ''}`;
  lastHash = bootHash;
  if(window.location.hash !== bootHash) window.location.hash = bootHash;

  if(activeUser){
    setAccessNotice(raw && !hashAllowed
      ? 'Acceso no disponible para el perfil activo. Sección restringida (simulación, sin seguridad real).'
      : `Perfil activo (simulación): ${activeUser.user_name} — ${roleLabel(activeUser.role)}. Sin autenticación real ni seguridad.`,
      raw && !hashAllowed ? 'warning' : 'info');
  }
}

export async function boot(overrideConfig){
  const resolved = overrideConfig !== undefined ? normalizeConfig(overrideConfig) : await loadModuleConfig();
  initApp(resolved);
}
