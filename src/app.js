import { loadModuleConfig, normalizeConfig, setActiveConfig, labelFor } from './module-config.js';
import { loadEntities, addEntity, updateEntity, deleteEntity, validateEntity, searchEntities, loadDocuments, addDocument, updateDocument, deleteDocument, validateDocument, loadProducts, loadWarehouses, loadUsers, seedLogisticsCatalogs } from './storage.js';
import { clearEntityForm, startEntityEdit, collectEntityPayload, showEntityErrors } from './components/entity-form.js';
import { createEntityItem } from './components/entity-list.js';
import { clearDocumentForm, startDocumentEdit, collectDocumentPayload, showDocumentErrors } from './components/document-form.js';
import { folioLabel } from './components/document-list.js';
import { renderLogo, applyShellLabels, setActiveModule, applyNavigationPermissions } from './components/shell.js';
import { renderDashboard } from './components/dashboard.js';
import { setupSearchBar, renderSearchResults } from './components/search-bar.js';
import { canAccessModule, canPerform, resolveActiveUser, setActiveUserId, roleLabel } from './domain/permissions.js';

import { createProduct, updateProduct, setProductStatus, searchProducts } from './domain/products.js';
import { createWarehouse, updateWarehouse, setWarehouseStatus, listActiveWarehouses, searchWarehouses } from './domain/warehouses.js';
import { listStock, getProductTotal, setMinStockLevel } from './domain/stock.js';
import { registerMovement, listMovements } from './domain/movements.js';
import { requestTransfer, confirmTransfer, cancelTransfer, listTransfers } from './domain/transfers.js';
import { listAlerts } from './domain/alerts.js';

import { populateProductCategorySelect, populateProductUserSelect, clearProductForm, startProductEdit, collectProductPayload, showProductErrors } from './components/product-form.js';
import { renderProductList } from './components/product-list.js';
import { populateWarehouseResponsableSelect, clearWarehouseForm, startWarehouseEdit, collectWarehousePayload, showWarehouseErrors } from './components/warehouse-form.js';
import { renderWarehouseList } from './components/warehouse-list.js';
import { renderStockList, renderStockTotal } from './components/stock-list.js';
import { populateMovementProductSelect, populateMovementWarehouseSelect, clearMovementForm, prefillAdjustment, collectMovementPayload, showMovementErrors } from './components/movement-form.js';
import { renderMovementList } from './components/movement-list.js';
import { populateTransferProductSelect, populateTransferWarehouseSelects, clearTransferForm, collectTransferPayload, showTransferErrors } from './components/transfer-form.js';
import { renderTransferList } from './components/transfer-list.js';
import { renderAlertList } from './components/alert-list.js';

function qs(id){ return document.getElementById(id); }

// Ayudantes de género gramatical para etiquetas configurables en español.
const palabraClave = (word) => String(word).trim().split(/\s+/)[0] || '';
const esFemenina = (word) => /(a|dad|tad|ción|sión|tud|umbre|ie)$/i.test(palabraClave(word));
const articulo = (word) => esFemenina(word) ? 'la' : 'el';
const demostrativo = (word) => esFemenina(word) ? 'esta' : 'este';
const seleccionada = (word) => esFemenina(word) ? 'seleccionada' : 'seleccionado';

const MODULES = ['dashboard', 'entities', 'documents', 'search', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'alerts'];
const VIEWS = {
  dashboard: 'view-dashboard',
  entities: 'view-entities',
  documents: 'view-documents',
  search: 'view-search',
  products: 'view-products',
  warehouses: 'view-warehouses',
  stock: 'view-stock',
  movements: 'view-movements',
  transfers: 'view-transfers',
  alerts: 'view-alerts'
};

let wired = false;
let activeUser = null;

function getActiveRole(){ return activeUser ? activeUser.role : ''; }

function setAccessNotice(message = ''){
  const el = qs('access-notice');
  if(!el) return;
  if(message){
    el.textContent = message;
    el.hidden = false;
  } else {
    el.textContent = '';
    el.hidden = true;
  }
}

function deny(message = 'No tienes permisos para realizar esta acción con el perfil activo (simulación).'){
  setAccessNotice(message);
  alert(message);
  return false;
}

function guardModuleAccess(moduleName, { silent = false } = {}){
  if(canAccessModule(getActiveRole(), moduleName)) return true;
  if(!silent){
    setAccessNotice('Acceso no disponible para el perfil activo. Sección restringida (simulación, sin seguridad real).');
  }
  return false;
}

function guardAction(action, message){
  if(canPerform(getActiveRole(), action)) return true;
  return deny(message || 'Acción no permitida para el perfil activo (simulación).');
}

function showModule(name, opts = {}){
  if(!MODULES.includes(name)) name = 'dashboard';
  if(!guardModuleAccess(name)){
    name = 'dashboard';
  } else {
    setAccessNotice('');
  }
  MODULES.forEach(m => { const el = qs(VIEWS[m]); if(el) el.hidden = m !== name; });
  setActiveModule(name);

  if(name === 'dashboard') renderDashboard();
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
    populateProductUserSelect();
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
  }
  if(name === 'transfers'){
    populateTransferProductSelect();
    populateTransferWarehouseSelects();
    refreshTransfers();
  }
  if(name === 'alerts'){
    populateAlertFilterSelects();
    refreshAlerts();
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

function refreshProducts(){
  if(!guardModuleAccess('products', { silent: true })) return;
  renderProductList(qs('product-list-body'), qs('product-list-empty'), searchProducts(qs('product-search').value), {
    canManage: canPerform(getActiveRole(), 'products.manage'),
    onEdit: (p) => {
      if(!guardAction('products.manage', 'Solo el administrador puede editar productos.')) return;
      startProductEdit(p);
      qs('product-sku').focus();
    },
    onToggleStatus: (p) => {
      if(!guardAction('products.manage', 'Solo el administrador puede activar o inactivar productos.')) return;
      const userId = qs('product-user').value;
      if(!userId){ alert('Selecciona un usuario en el formulario para registrar el cambio de estado.'); return; }
      const next = p.status === 'activo' ? 'inactivo' : 'activo';
      const result = setProductStatus(p.product_id, next, userId);
      if(!result.success) alert(result.error);
      refreshProducts();
    }
  });
}

function handleProductSubmit(ev){
  ev.preventDefault();
  if(!guardAction('products.manage', 'Solo el administrador puede crear o modificar productos.')) return;
  if(!guardModuleAccess('products', { silent: true })) return;
  const id = qs('product-id').value;
  const payload = collectProductPayload();
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
    canManage: canPerform(getActiveRole(), 'warehouses.manage'),
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
  const canConfigureMin = canPerform(getActiveRole(), 'stock.configure_min');
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
    canAdjust: canPerform(getActiveRole(), 'movements.adjust'),
    onAdjust: (movement, adjustmentType) => {
      if(!guardAction('movements.adjust', 'No tienes permisos para registrar ajustes de inventario con el perfil activo.')) return;
      prefillAdjustment(movement, adjustmentType);
    }
  });
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
  qs('movement-type').value = 'entrada';
  refreshMovements();
  refreshStock();
}

function refreshTransfers(){
  if(!guardModuleAccess('transfers', { silent: true })) return;
  renderTransferList(qs('transfer-list-body'), qs('transfer-list-empty'), listTransfers(), {
    canConfirm: canPerform(getActiveRole(), 'transfers.confirm'),
    canCancel: canPerform(getActiveRole(), 'transfers.cancel'),
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

function refreshAlerts(){
  if(!guardModuleAccess('alerts', { silent: true })) return;
  const productId = qs('alert-filter-product').value;
  const warehouseId = qs('alert-filter-warehouse').value;
  renderAlertList(qs('alert-list-body'), qs('alert-list-empty'), listAlerts({ productId, warehouseId }));
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
  const femEntity = esFemenina(entity);
  const femDocument = esFemenina(document_);

  document.title = config.moduleName;
  qs('brand-name').textContent = config.moduleName;
  applyShellLabels();

  qs('dashboard-heading').textContent = config.moduleName;
  qs('dashboard-subtitle').textContent = `Gestiona inventario, bodegas y operaciones logísticas. (Módulo base disponible en sección avanzada para administrador)`;
  qs('action-new-entity-title').textContent = `${femEntity ? 'Nueva' : 'Nuevo'} ${entity}`;
  qs('action-new-entity-sub').textContent = `Crear un registro de ${entity.toLowerCase()}`;
  qs('action-new-document-title').textContent = `${femDocument ? 'Nueva' : 'Nuevo'} ${document_}`;
  qs('action-new-document-sub').textContent = `Registrar un registro de ${document_.toLowerCase()}`;
  qs('action-open-entities-title').textContent = entities;
  qs('action-open-entities-sub').textContent = `Abrir la gestión de ${entities.toLowerCase()}`;
  qs('action-find-title').textContent = 'Buscar registros';
  qs('action-find-sub').textContent = `Buscar ${entities.toLowerCase()}`;

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

function applyTheme(config){
  document.documentElement.style.setProperty('--accent', config.theme.accentColor);
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
  const canBase = canPerform(role, 'base.manage');
  const canProducts = canPerform(role, 'products.manage');
  const canWarehouses = canPerform(role, 'warehouses.manage');
  const canMove = canPerform(role, 'movements.register');
  const canAdjust = canPerform(role, 'movements.adjust');
  const canTransferCreate = canPerform(role, 'transfers.create');

  // Dashboard quick actions: base advanced only for admin
  [['action-new-entity', 'entities', 'base.manage'], ['action-new-document', 'documents', 'base.manage'], ['action-open-entities', 'entities', 'base.manage'], ['action-find', 'search', 'base.manage']]
    .forEach(([id, mod, action]) => {
      const el = qs(id);
      if(!el) return;
      const allowed = canAccessModule(role, mod) && canPerform(role, action);
      el.hidden = !allowed;
      el.disabled = !allowed;
    });

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

  // Active user selector always available in topbar
  applyNavigationPermissions(role);
  refreshActiveUserBadge();
}

function refreshActiveUserBadge(){
  const badge = qs('active-user-role');
  if(!badge) return;
  if(!activeUser){ badge.textContent = 'Sin usuario'; return; }
  badge.textContent = `${activeUser.user_name} — ${roleLabel(activeUser.role)}`;
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
    setAccessNotice(`Perfil activo (simulación): ${user.user_name} — ${roleLabel(user.role)}. Sin autenticación real ni seguridad.`);
  }
  const currentActive = document.querySelector('.nav-module.active')?.dataset.module || 'dashboard';
  if(!guardModuleAccess(currentActive, { silent: true })){
    showModule('dashboard');
  } else {
    showModule(currentActive);
  }
}

function wireEvents(){
  if(wired) return;
  wired = true;
  document.querySelectorAll('.nav-module').forEach(btn => {
    btn.addEventListener('click', () => showModule(btn.dataset.module));
  });
  qs('action-new-entity').addEventListener('click', () => { if(guardAction('base.manage')) showModule('entities', { newRecord: true, focusForm: true }); });
  qs('action-new-document').addEventListener('click', () => { if(guardAction('base.manage')) showModule('documents', { newRecord: true, focusForm: true }); });
  qs('action-open-entities').addEventListener('click', () => { if(guardAction('base.manage')) showModule('entities'); });
  qs('action-find').addEventListener('click', () => { if(guardAction('base.manage')) showModule('search', { focusSearch: true }); });
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
  qs('product-cancel-edit').addEventListener('click', () => { if(canPerform(getActiveRole(), 'products.manage')) clearProductForm(); });
  qs('product-search').addEventListener('input', refreshProducts);

  qs('warehouse-form').addEventListener('submit', handleWarehouseSubmit);
  qs('warehouse-cancel-edit').addEventListener('click', () => { if(canPerform(getActiveRole(), 'warehouses.manage')) clearWarehouseForm(); });
  qs('warehouse-search').addEventListener('input', refreshWarehouses);

  qs('stock-filter-product').addEventListener('change', refreshStock);
  qs('stock-filter-warehouse').addEventListener('change', refreshStock);

  qs('movement-form').addEventListener('submit', handleMovementSubmit);
  qs('movement-filter-product').addEventListener('change', refreshMovements);
  qs('movement-filter-warehouse').addEventListener('change', refreshMovements);

  qs('transfer-form').addEventListener('submit', handleTransferSubmit);

  qs('alert-filter-product').addEventListener('change', refreshAlerts);
  qs('alert-filter-warehouse').addEventListener('change', refreshAlerts);

  const activeUserSelect = qs('active-user-select');
  if(activeUserSelect) activeUserSelect.addEventListener('change', onActiveUserChange);
}

export function initApp(resolved){
  showConfigErrors(resolved.errors);
  setActiveConfig(resolved.config);
  applyTheme(resolved.config);
  renderLogo(qs('logo-mark'));
  applyLabels(resolved.config);
  seedLogisticsCatalogs();
  populateActiveUserSelect();
  wireEvents();
  clearEntityForm();
  clearDocumentForm();
  clearProductForm();
  clearWarehouseForm();
  clearMovementForm();
  clearTransferForm();
  showModule('dashboard');
  if(activeUser){
    setAccessNotice(`Perfil activo (simulación): ${activeUser.user_name} — ${roleLabel(activeUser.role)}. Sin autenticación real ni seguridad.`);
  }
}

export async function boot(overrideConfig){
  const resolved = overrideConfig !== undefined ? normalizeConfig(overrideConfig) : await loadModuleConfig();
  initApp(resolved);
}
