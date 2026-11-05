import { loadModuleConfig, normalizeConfig, setActiveConfig, labelFor } from './module-config.js';
import { loadEntities, addEntity, updateEntity, deleteEntity, validateEntity, searchEntities, loadDocuments, addDocument, updateDocument, deleteDocument, validateDocument, loadProducts, loadWarehouses, loadUsers, seedLogisticsCatalogs } from './storage.js';
import { clearEntityForm, startEntityEdit, collectEntityPayload, showEntityErrors } from './components/entity-form.js';
import { createEntityItem } from './components/entity-list.js';
import { clearDocumentForm, startDocumentEdit, collectDocumentPayload, showDocumentErrors } from './components/document-form.js';
import { folioLabel } from './components/document-list.js';
import { renderLogo, applyShellLabels, setActiveModule } from './components/shell.js';
import { renderDashboard } from './components/dashboard.js';
import { setupSearchBar, renderSearchResults } from './components/search-bar.js';

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
import { populateMovementProductSelect, populateMovementWarehouseSelect, populateMovementUserSelect, clearMovementForm, prefillAdjustment, collectMovementPayload, showMovementErrors } from './components/movement-form.js';
import { renderMovementList } from './components/movement-list.js';
import { populateTransferProductSelect, populateTransferWarehouseSelects, populateTransferUserSelect, clearTransferForm, collectTransferPayload, showTransferErrors } from './components/transfer-form.js';
import { renderTransferList } from './components/transfer-list.js';
import { renderAlertList } from './components/alert-list.js';

function qs(id){ return document.getElementById(id); }

// Ayudantes de género gramatical para etiquetas configurables en español.
// El género se deduce de la primera palabra (p. ej., "Pedido de Venta" → masculino)
// usando terminaciones femeninas comunes (-a, -dad, -ción, ...).
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

function showModule(name, opts = {}){
  if(!MODULES.includes(name)) name = 'dashboard';
  MODULES.forEach(m => { qs(VIEWS[m]).hidden = m !== name; });
  setActiveModule(name);
  if(name === 'dashboard'){
    renderDashboard();
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
    populateMovementUserSelect();
    populateMovementFilterSelects();
    refreshMovements();
  }
  if(name === 'transfers'){
    populateTransferProductSelect();
    populateTransferWarehouseSelects();
    populateTransferUserSelect();
    refreshTransfers();
  }
  if(name === 'alerts'){
    populateAlertFilterSelects();
    refreshAlerts();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateDocumentEntitySelect(){
  const select = qs('document-entity');
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
  renderSearchResults(qs('search-results-list'), qs('search-empty'), searchEntities(qs('search-input').value), (e) => createEntityItem(e));
}

// ----------------------------------------------------------------------------
// Logística e Inventario
// ----------------------------------------------------------------------------

function populateFilterSelect(select, items, blankLabel){
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
  renderProductList(qs('product-list-body'), qs('product-list-empty'), searchProducts(qs('product-search').value), {
    onEdit: (p) => { startProductEdit(p); qs('product-sku').focus(); },
    onToggleStatus: (p) => {
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
  renderWarehouseList(qs('warehouse-list-body'), qs('warehouse-list-empty'), searchWarehouses(qs('warehouse-search').value), {
    onEdit: (w) => { startWarehouseEdit(w); qs('warehouse-name').focus(); },
    onToggleStatus: (w) => {
      const next = w.status === 'activo' ? 'inactivo' : 'activo';
      const result = setWarehouseStatus(w.warehouse_id, next);
      if(!result.success) alert(result.error);
      refreshWarehouses();
    }
  });
}

function handleWarehouseSubmit(ev){
  ev.preventDefault();
  const id = qs('warehouse-id').value;
  const payload = collectWarehousePayload();
  const result = id ? updateWarehouse(id, payload) : createWarehouse(payload);
  showWarehouseErrors(result.errors || {});
  if(!result.success) return;
  clearWarehouseForm();
  refreshWarehouses();
}

function refreshStock(){
  const productId = qs('stock-filter-product').value;
  const warehouseId = qs('stock-filter-warehouse').value;
  renderStockList(qs('stock-list-body'), qs('stock-list-empty'), listStock({ productId, warehouseId }), {
    onSaveMinLevel: (stockId, value) => {
      const result = setMinStockLevel(stockId, value);
      refreshStock();
      return result;
    }
  });
  renderStockTotal(qs('stock-product-total'), productId ? getProductTotal(productId) : '—');
}

function refreshMovements(){
  const productId = qs('movement-filter-product').value;
  const warehouseId = qs('movement-filter-warehouse').value;
  renderMovementList(qs('movement-list-body'), qs('movement-list-empty'), listMovements({ productId, warehouseId }), {
    onAdjust: (movement, adjustmentType) => {
      prefillAdjustment(movement, adjustmentType);
    }
  });
}

function handleMovementSubmit(ev){
  ev.preventDefault();
  const payload = collectMovementPayload();
  const result = registerMovement(payload);
  showMovementErrors(result.errors || {});
  if(!result.success) return;
  clearMovementForm();
  qs('movement-type').value = 'entrada';
  refreshMovements();
  refreshStock();
}

function refreshTransfers(){
  renderTransferList(qs('transfer-list-body'), qs('transfer-list-empty'), listTransfers(), {
    onConfirm: (t, userId) => {
      if(!userId){ alert('Selecciona el usuario que confirma la recepción.'); return; }
      const result = confirmTransfer(t.transfer_id, userId);
      if(!result.success) alert(result.error);
      refreshTransfers();
      refreshStock();
    },
    onCancel: (t, userId) => {
      if(!userId){ alert('Selecciona el usuario que cancela la transferencia.'); return; }
      const result = cancelTransfer(t.transfer_id, userId);
      if(!result.success) alert(result.error);
      refreshTransfers();
    }
  });
}

function handleTransferSubmit(ev){
  ev.preventDefault();
  const payload = collectTransferPayload();
  const result = requestTransfer(payload);
  showTransferErrors(result.errors || {});
  if(!result.success) return;
  clearTransferForm();
  refreshTransfers();
}

function refreshAlerts(){
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
  const id = qs('edit-document').value;
  if(!id){ qs('error-edit-document').textContent = `Selecciona ${articulo(labelFor('document'))} ${labelFor('document').toLowerCase()} para eliminar.`; return; }
  if(!confirm(`¿Eliminar ${demostrativo(labelFor('document'))} ${labelFor('document').toLowerCase()}?`)) return;
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
  const id = qs('entity-id').value;
  const payload = collectEntityPayload();
  const { valid, errors } = validateEntity(payload);
  showEntityErrors(errors);
  if(!valid) return;
  if(id){
    try{
      updateEntity(id, payload);
      clearEntityForm();
    }catch(e){ alert(e.message); }
  }else{
    addEntity(payload);
    clearEntityForm();
  }
  afterSaveRefresh();
}

function handleDocumentSubmit(ev){
  ev.preventDefault();
  const id = qs('document-id').value;
  const payload = collectDocumentPayload();
  const existing = id ? loadDocuments().find(d => d.id === id) : undefined;
  const { valid, errors } = validateDocument(payload, existing ? existing.status : undefined);
  showDocumentErrors(errors);
  if(!valid) return;
  try{
    if(id){
      updateDocument(id, payload);
    }else{
      addDocument(payload);
    }
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
  qs('dashboard-subtitle').textContent = `Gestiona tus ${entities.toLowerCase()} y ${documents.toLowerCase()} en un solo lugar.`;
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

function wireEvents(){
  if(wired) return;
  wired = true;
  document.querySelectorAll('.nav-module').forEach(btn => {
    btn.addEventListener('click', () => showModule(btn.dataset.module));
  });
  qs('action-new-entity').addEventListener('click', () => showModule('entities', { newRecord: true, focusForm: true }));
  qs('action-new-document').addEventListener('click', () => showModule('documents', { newRecord: true, focusForm: true }));
  qs('action-open-entities').addEventListener('click', () => showModule('entities'));
  qs('action-find').addEventListener('click', () => showModule('search', { focusSearch: true }));
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
  qs('product-cancel-edit').addEventListener('click', clearProductForm);
  qs('product-search').addEventListener('input', refreshProducts);

  qs('warehouse-form').addEventListener('submit', handleWarehouseSubmit);
  qs('warehouse-cancel-edit').addEventListener('click', clearWarehouseForm);
  qs('warehouse-search').addEventListener('input', refreshWarehouses);

  qs('stock-filter-product').addEventListener('change', refreshStock);
  qs('stock-filter-warehouse').addEventListener('change', refreshStock);

  qs('movement-form').addEventListener('submit', handleMovementSubmit);
  qs('movement-filter-product').addEventListener('change', refreshMovements);
  qs('movement-filter-warehouse').addEventListener('change', refreshMovements);

  qs('transfer-form').addEventListener('submit', handleTransferSubmit);

  qs('alert-filter-product').addEventListener('change', refreshAlerts);
  qs('alert-filter-warehouse').addEventListener('change', refreshAlerts);
}

export function initApp(resolved){
  showConfigErrors(resolved.errors);
  setActiveConfig(resolved.config);
  applyTheme(resolved.config);
  renderLogo(qs('logo-mark'));
  applyLabels(resolved.config);
  seedLogisticsCatalogs();
  wireEvents();
  clearEntityForm();
  clearDocumentForm();
  clearProductForm();
  clearWarehouseForm();
  clearMovementForm();
  clearTransferForm();
  showModule('dashboard');
}

export async function boot(overrideConfig){
  const resolved = overrideConfig !== undefined ? normalizeConfig(overrideConfig) : await loadModuleConfig();
  initApp(resolved);
}
