import { getConfig } from './module-config.js';
import { PRODUCT_CATEGORY_SEED, ROLE_PERMISSION_SEED, ROLE_SEED, USER_SEED } from './domain/seed.js';

const ENTITIES_KEY = 'erp_base_module:entities';
const DOCUMENTS_KEY = 'erp_base_module:documents';

// ============================================================================
// Logística e Inventario — claves de almacenamiento y helpers de repositorio
// (ver contracts/logistics-storage.md y data-model.md)
// ============================================================================

export const LOGISTICS_KEYS = {
  productCategories: 'logistics:product_categories',
  products: 'logistics:products',
  warehouses: 'logistics:warehouses',
  users: 'logistics:users',
  stock: 'logistics:stock',
  movements: 'logistics:inventory_transactions',
  orders: 'logistics:orders',
  shipments: 'logistics:shipments',
  transfers: 'logistics:stock_transfers',
  replenishments: 'logistics:replenishment_requests',
  roles: 'logistics:roles',
  rolePermissions: 'logistics:role_permissions',
  userPermissionOverrides: 'logistics:user_permission_overrides'
};

export const LOGISTICS_SCHEMAS = {
  productCategories: { required: ['category_id', 'category_name'], unique: ['category_id', 'category_name'] },
  products: { required: ['product_id', 'sku', 'product_name', 'category_id', 'status'], unique: ['product_id', 'sku'] },
  warehouses: { required: ['warehouse_id', 'name', 'location', 'status'], unique: ['warehouse_id', 'name'] },
  users: { required: ['user_id', 'user_name', 'role'], unique: ['user_id'], references: { role: 'roles' } },
  stock: { required: ['stock_id', 'product_id', 'warehouse_id', 'quantity_available'], unique: ['stock_id', ['product_id', 'warehouse_id']] },
  movements: { required: ['transaction_id', 'product_id', 'warehouse_id', 'transaction_type', 'quantity', 'user_id', 'transaction_date'], optional: ['order_id'], unique: ['transaction_id'] },
  orders: { required: ['order_id', 'order_type', 'transaction_id', 'product_id', 'warehouse_id', 'quantity', 'user_id', 'order_date'], unique: ['order_id', 'transaction_id'] },
  shipments: {
    required: ['shipment_id', 'order_id', 'carrier', 'tracking_code', 'status', 'created_by', 'created_at', 'history'],
    unique: [['shipment_id'], ['order_id']],
    values: { status: ['en_bodega', 'en_transito', 'en_reparto', 'entregado'] }
  },
  transfers: { required: ['transfer_id', 'product_id', 'source_warehouse_id', 'target_warehouse_id', 'quantity', 'status', 'transfer_date', 'created_by'], unique: ['transfer_id'] },
  replenishments: { required: ['request_id', 'product_id', 'warehouse_id', 'quantity', 'status', 'request_date', 'created_by'], unique: ['request_id'] },
  roles: { required: ['role_key', 'role_label', 'default_landing_module', 'is_admin'], unique: ['role_key'] },
  rolePermissions: { required: ['role_key', 'scope', 'resource_key', 'allowed'], unique: [['role_key', 'scope', 'resource_key']], references: { role_key: 'roles' } },
  userPermissionOverrides: { required: ['user_id', 'scope', 'resource_key', 'allowed'], unique: [['user_id', 'scope', 'resource_key']], references: { user_id: 'users' } }
};

let nativeSetItemOwner = null;
let nativeSetItem = null;

function rememberNativeSetItem(){
  if(nativeSetItemOwner !== localStorage){
    nativeSetItemOwner = localStorage;
    nativeSetItem = localStorage.setItem;
  }
}

function restoreItem(key, raw){
  if(raw === null){
    localStorage.removeItem(key);
    return;
  }
  if(nativeSetItemOwner === localStorage && typeof nativeSetItem === 'function'){
    nativeSetItem.call(localStorage, key, raw);
    return;
  }
  localStorage.setItem(key, raw);
}

export function withStorageRollback(keys, operation){
  rememberNativeSetItem();
  const snapshot = keys.map(key => [key, localStorage.getItem(key)]);
  try{
    return { ok: true, value: operation() };
  }catch(error){
    snapshot.forEach(([key, raw]) => restoreItem(key, raw));
    return { ok: false, error };
  }
}

function loadList(key){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error(`Failed to parse ${key} from storage`, e);
    return [];
  }
}

function saveList(key, list){
  rememberNativeSetItem();
  localStorage.setItem(key, JSON.stringify(list));
}

function nextId(list, idField){
  return list.reduce((max, record) => Math.max(max, Number(record[idField]) || 0), 0) + 1;
}

export const loadProductCategories = () => loadList(LOGISTICS_KEYS.productCategories);
export const saveProductCategories = (list) => saveList(LOGISTICS_KEYS.productCategories, list);
export const loadProducts = () => loadList(LOGISTICS_KEYS.products);
export const saveProducts = (list) => saveList(LOGISTICS_KEYS.products, list);
export const loadWarehouses = () => loadList(LOGISTICS_KEYS.warehouses);
export const saveWarehouses = (list) => saveList(LOGISTICS_KEYS.warehouses, list);
export const loadUsers = () => loadList(LOGISTICS_KEYS.users);
export const saveUsers = (list) => saveList(LOGISTICS_KEYS.users, list);
export const loadStock = () => loadList(LOGISTICS_KEYS.stock);
export const saveStock = (list) => saveList(LOGISTICS_KEYS.stock, list);
export const loadMovements = () => loadList(LOGISTICS_KEYS.movements);
export const saveMovements = (list) => saveList(LOGISTICS_KEYS.movements, list);
export const loadOrders = () => loadList(LOGISTICS_KEYS.orders);
export const saveOrders = (list) => saveList(LOGISTICS_KEYS.orders, list);
export const loadShipments = () => loadList(LOGISTICS_KEYS.shipments);
export const saveShipments = (list) => saveList(LOGISTICS_KEYS.shipments, list);
export const loadTransfers = () => loadList(LOGISTICS_KEYS.transfers);
export const saveTransfers = (list) => saveList(LOGISTICS_KEYS.transfers, list);
export const loadReplenishments = () => loadList(LOGISTICS_KEYS.replenishments);
export const saveReplenishments = (list) => saveList(LOGISTICS_KEYS.replenishments, list);
export const loadRoles = () => loadList(LOGISTICS_KEYS.roles);
export const saveRoles = (list) => saveList(LOGISTICS_KEYS.roles, list);
export const loadRolePermissions = () => loadList(LOGISTICS_KEYS.rolePermissions);
export const saveRolePermissions = (list) => saveList(LOGISTICS_KEYS.rolePermissions, list);
export const loadUserPermissionOverrides = () => loadList(LOGISTICS_KEYS.userPermissionOverrides);
export const saveUserPermissionOverrides = (list) => saveList(LOGISTICS_KEYS.userPermissionOverrides, list);

export function getLogisticsSchema(name){
  return LOGISTICS_SCHEMAS[name];
}

export function hasDuplicateCompositeKey(list, keyFields, record){
  const fields = Array.isArray(keyFields[0]) ? keyFields : [keyFields];
  return list.some(item => item !== record && fields.every(field => String(item[field]) === String(record[field])));
}

export function referencesExist(record, references = {}){
  return Object.entries(references).every(([field, values]) => {
    const value = record[field];
    if(value === undefined || value === null || value === '') return true;
    return values.some(candidate => String(candidate) === String(value));
  });
}

export function validateRecord(schemaName, record, context = {}){
  const schema = LOGISTICS_SCHEMAS[schemaName];
  if(!schema) return { valid: false, errors: { schema: `Esquema desconocido: ${schemaName}` } };
  const errors = {};
  for(const field of schema.required){
    const value = record[field];
    if(value === undefined || value === null || (typeof value === 'string' && value.trim() === '')){
      errors[field] = `El campo ${field} es obligatorio`;
    }
  }
  if(schema.values){
    for(const [field, allowed] of Object.entries(schema.values)){
      const value = record[field];
      if(value === undefined || value === null || value === '') continue;
      if(!allowed.some(option => String(option) === String(value))){
        errors[field] = `El campo ${field} no tiene un valor válido`;
      }
    }
  }
  if(schema.unique && context.list){
    for(const key of schema.unique){
      if(hasDuplicateCompositeKey(context.list, key, record)){
        errors[key] = 'La clave ya existe';
      }
    }
  }
  if(schema.references){
    for(const [field, values] of Object.entries(schema.references)){
      if(!referencesExist({ [field]: record[field] }, { [field]: context[values] || values })){
        errors[field] = `Referencia inválida: ${field}`;
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function nextProductId(){ return nextId(loadProducts(), 'product_id'); }
export function nextWarehouseId(){ return nextId(loadWarehouses(), 'warehouse_id'); }
export function nextStockId(){ return nextId(loadStock(), 'stock_id'); }
export function nextMovementId(){ return nextId(loadMovements(), 'transaction_id'); }
export function nextShipmentId(){ return nextId(loadShipments(), 'shipment_id'); }
export function nextTransferId(){ return nextId(loadTransfers(), 'transfer_id'); }
export function nextReplenishmentId(){ return nextId(loadReplenishments(), 'request_id'); }

/** Carga idempotente de los catálogos semilla (FR-071): no duplica si ya existen datos. */
export function seedLogisticsCatalogs(){
  if(loadProductCategories().length === 0){
    saveProductCategories(PRODUCT_CATEGORY_SEED.map((name, i) => ({ category_id: i + 1, category_name: name })));
  }
  if(loadUsers().length === 0){
    saveUsers(USER_SEED.map((u, i) => ({ user_id: i + 1, assigned_warehouse_id: undefined, ...u })));
  }
  if(loadRoles().length === 0){
    saveRoles(ROLE_SEED.map(role => ({ ...role })));
  }
  if(loadRolePermissions().length === 0){
    saveRolePermissions(ROLE_PERMISSION_SEED.map(permission => ({ ...permission })));
  }
}


// ----------------------------------------------------------------------------
// Helpers compartidos de saneamiento y validación para el dominio logístico
// ----------------------------------------------------------------------------

/** Escapa texto antes de insertarlo en HTML, previniendo la ejecución de contenido no deseado (FR-046, FR-092). */
export function escapeHtml(s){
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('`', '&#96;');
}

export function isNonEmptyText(v){
  return typeof v === 'string' && v.trim().length > 0;
}

export function isNonNegativeNumber(v){
  if(v === undefined || v === null || v === '') return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

export function isPositiveInteger(v){
  if(v === undefined || v === null || v === '') return false;
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
}

export function loadEntities(){
  try{
    const raw = localStorage.getItem(ENTITIES_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Failed to parse entities from storage', e);
    return [];
  }
}

export function saveEntities(entities){
  localStorage.setItem(ENTITIES_KEY, JSON.stringify(entities));
}

export function loadDocuments(){
  try{
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Failed to parse documents from storage', e);
    return [];
  }
}

export function saveDocuments(documents){
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
}

function generateId(){
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
}

function declaredFields(target){
  return getConfig().customFields.filter(f => f.target === target);
}

export function isValidDate(value){
  if(!value) return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isEmpty(v){ return v === undefined || v === null || (typeof v === 'string' && !v.trim()); }

function normalizeCustomValue(field, value){
  if(isEmpty(value)) return undefined;
  if(field.type === 'number') return Number(value);
  return String(value).trim();
}

function collectCustomErrors(target, data){
  const errs = {};
  for(const f of declaredFields(target)){
    const v = data ? data[f.key] : undefined;
    if(f.required && isEmpty(v)){ errs[f.key] = `${f.label} es obligatorio`; continue; }
    if(!isEmpty(v)){
      if(f.type === 'number' && !Number.isFinite(Number(v))){ errs[f.key] = `${f.label} debe ser un número`; continue; }
      if(f.type === 'date' && !isValidDate(v)){ errs[f.key] = `${f.label} debe ser una fecha válida (YYYY-MM-DD)`; continue; }
      if(f.type === 'select' && !f.options.includes(String(v).trim())){ errs[f.key] = `${f.label} debe ser uno de: ${f.options.join(', ')}`; }
    }
  }
  return errs;
}

function validateLifecycleStatus(status, currentStatus, errors){
  const lc = getConfig().statusLifecycle;
  if(!lc) return;
  if(currentStatus === undefined || currentStatus === null){
    if(!isEmpty(status) && !lc.statuses.includes(status)){
      errors.status = `El estado debe ser uno de: ${lc.statuses.join(', ')}`;
    }
    return;
  }
  if(status === currentStatus) return;
  const allowed = lc.transitions[currentStatus] || [];
  if(!allowed.includes(status)){
    errors.status = `Transición de estado inválida de "${currentStatus}" a "${status}"`;
  }
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function validateEntity({name, code, email, targetDate, creditLimit, ...rest}){
  const errors = {};
  if(!name || !name.trim()) errors.name = 'El nombre es obligatorio';
  if(!code || !code.trim()) errors.code = 'El código es obligatorio';
  if(!isEmpty(email) && !isValidEmail(email)) errors.email = 'El correo electrónico no es válido';
  if(!isEmpty(targetDate) && !isValidDate(targetDate)) errors.targetDate = 'La fecha objetivo debe ser una fecha válida (YYYY-MM-DD)';
  if(!isEmpty(creditLimit)){
    const c = Number(creditLimit);
    if(Number.isNaN(c) || c < 0) errors.creditLimit = 'El límite de crédito debe ser un número no negativo';
  }
  Object.assign(errors, collectCustomErrors('entity', rest));
  return { valid: Object.keys(errors).length === 0, errors };
}

function pickCustomFields(target, data){
  const out = {};
  for(const f of declaredFields(target)){
    const n = normalizeCustomValue(f, data[f.key]);
    if(n !== undefined) out[f.key] = n;
  }
  return out;
}

export function addEntity(payload){
  const now = new Date().toISOString();
  const entity = {
    id: generateId(),
    entity_id: generateId(),
    name: (payload.name||'').trim(),
    code: (payload.code||'').trim(),
    taxId: (payload.taxId||'').trim() || undefined,
    email: (payload.email||'').trim() || undefined,
    phone: (payload.phone||'').trim() || undefined,
    address: (payload.address||'').trim() || undefined,
    category: (payload.category||'').trim() || undefined,
    description: (payload.description||'').trim() || undefined,
    targetDate: (payload.targetDate||'').trim() || undefined,
    creditLimit: isEmpty(payload.creditLimit) ? undefined : Number(payload.creditLimit),
    paymentTerms: (payload.paymentTerms||'').trim() || undefined,
    ...pickCustomFields('entity', payload),
    createdAt: now,
    updatedAt: now
  };
  const list = loadEntities();
  list.push(entity);
  saveEntities(list);
  return entity;
}

export function updateEntity(id, updates){
  const list = loadEntities();
  const idx = list.findIndex(e => e.id === id);
  if(idx === -1) throw new Error('Entidad no encontrada');
  const merged = { ...list[idx], ...updates };
  list[idx] = {
    ...list[idx],
    name: (merged.name||'').trim(),
    code: (merged.code||'').trim(),
    taxId: (merged.taxId||'').trim() || undefined,
    email: (merged.email||'').trim() || undefined,
    phone: (merged.phone||'').trim() || undefined,
    address: (merged.address||'').trim() || undefined,
    category: (merged.category||'').trim() || undefined,
    description: (merged.description||'').trim() || undefined,
    targetDate: (merged.targetDate||'').trim() || undefined,
    creditLimit: isEmpty(merged.creditLimit) ? undefined : Number(merged.creditLimit),
    paymentTerms: (merged.paymentTerms||'').trim() || undefined,
    ...pickCustomFields('entity', merged),
    updatedAt: new Date().toISOString()
  };
  saveEntities(list);
  return list[idx];
}

export function deleteEntity(id){
  const list = loadEntities();
  const entity = list.find(e => e.id === id);
  const newList = list.filter(e => e.id !== id);
  saveEntities(newList);
  if(entity) deleteDocumentsForEntity(entity.entity_id);
  return newList;
}

export function validateDocument(payload, currentStatus){
  const {entityId, series, folio, startDate, endDate, quantity, subtotal, discount, taxAmount, totalAmount, status} = payload;
  const errors = {};
  const entities = loadEntities();
  if(!entityId || !entities.some(e => e.entity_id === entityId)){
    errors.entityId = 'Selecciona una entidad para el documento';
  }
  if(isEmpty(folio)){ errors.folio = 'El folio es obligatorio'; }
  else {
    const f = Number(folio);
    if(!Number.isInteger(f) || f <= 0) errors.folio = 'El folio debe ser un entero positivo';
  }
  if(!startDate){ errors.startDate = 'La fecha de inicio es obligatoria'; }
  else if(!isValidDate(startDate)) errors.startDate = 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)';
  if(!endDate){ errors.endDate = 'La fecha de fin es obligatoria'; }
  else if(!isValidDate(endDate)) errors.endDate = 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)';
  if(startDate && endDate && isValidDate(startDate) && isValidDate(endDate) && endDate < startDate){
    errors.endDate = 'La fecha de fin debe ser igual o posterior a la fecha de inicio';
  }
  if(quantity !== undefined && quantity !== null && quantity !== ''){
    const n = Number(quantity);
    if(!Number.isInteger(n) || n <= 0) errors.quantity = 'La cantidad debe ser un entero positivo';
  }
  for(const [key, label] of [['subtotal', 'El subtotal'], ['discount', 'El descuento'], ['taxAmount', 'El impuesto'], ['totalAmount', 'El importe total']]){
    const v = payload[key];
    if(v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if(Number.isNaN(n) || n < 0) errors[key] = `${label} debe ser un número no negativo`;
  }
  if(!errors.subtotal && !errors.discount
    && subtotal !== undefined && subtotal !== null && subtotal !== ''
    && discount !== undefined && discount !== null && discount !== ''
    && Number(discount) > Number(subtotal)){
    errors.discount = 'El descuento no puede superar el subtotal';
  }
  validateLifecycleStatus((status||'').trim(), currentStatus, errors);
  Object.assign(errors, collectCustomErrors('document', payload));
  return { valid: Object.keys(errors).length === 0, errors };
}

export function addDocument(payload){
  const now = new Date().toISOString();
  const check = validateDocument(payload);
  if(!check.valid){
    throw new Error(Object.values(check.errors)[0]);
  }
  const document = {
    id: generateId(),
    entity_id: payload.entityId,
    series: (payload.series||'').trim() || undefined,
    folio: Number(payload.folio),
    startDate: payload.startDate,
    endDate: payload.endDate,
    quantity: (isEmpty(payload.quantity)) ? undefined : Number(payload.quantity),
    subtotal: (isEmpty(payload.subtotal)) ? undefined : Number(payload.subtotal),
    discount: (isEmpty(payload.discount)) ? undefined : Number(payload.discount),
    taxAmount: (isEmpty(payload.taxAmount)) ? undefined : Number(payload.taxAmount),
    totalAmount: (isEmpty(payload.totalAmount)) ? undefined : Number(payload.totalAmount),
    currency: (payload.currency||'').trim() || undefined,
    paymentTerms: (payload.paymentTerms||'').trim() || undefined,
    notes: (payload.notes||'').trim() || undefined,
    status: (payload.status||'').trim() || undefined,
    ...pickCustomFields('document', payload),
    createdAt: now,
    updatedAt: now
  };
  const list = loadDocuments();
  list.push(document);
  saveDocuments(list);
  return document;
}

export function updateDocument(id, updates){
  const list = loadDocuments();
  const idx = list.findIndex(d => d.id === id);
  if(idx === -1) throw new Error('Documento no encontrado');
  const prev = list[idx];
  const merged = { ...prev, ...updates };
  const check = validateDocument({
    entityId: merged.entity_id,
    series: merged.series,
    folio: merged.folio,
    startDate: merged.startDate,
    endDate: merged.endDate,
    quantity: merged.quantity,
    subtotal: merged.subtotal,
    discount: merged.discount,
    taxAmount: merged.taxAmount,
    totalAmount: merged.totalAmount,
    status: updates.status !== undefined ? (updates.status||'').trim() : merged.status
  }, prev.status);
  if(!check.valid){
    throw new Error(Object.values(check.errors)[0]);
  }
  list[idx] = {
    ...prev,
    series: (merged.series||'').trim() || undefined,
    folio: Number(merged.folio),
    startDate: merged.startDate,
    endDate: merged.endDate,
    quantity: (isEmpty(merged.quantity)) ? undefined : Number(merged.quantity),
    subtotal: (isEmpty(merged.subtotal)) ? undefined : Number(merged.subtotal),
    discount: (isEmpty(merged.discount)) ? undefined : Number(merged.discount),
    taxAmount: (isEmpty(merged.taxAmount)) ? undefined : Number(merged.taxAmount),
    totalAmount: (isEmpty(merged.totalAmount)) ? undefined : Number(merged.totalAmount),
    currency: (merged.currency||'').trim() || undefined,
    paymentTerms: (merged.paymentTerms||'').trim() || undefined,
    notes: (merged.notes||'').trim() || undefined,
    status: updates.status !== undefined ? (updates.status||'').trim() : merged.status,
    ...pickCustomFields('document', { ...prev, ...updates }),
    updatedAt: new Date().toISOString()
  };
  saveDocuments(list);
  return list[idx];
}

export function deleteDocument(id){
  const list = loadDocuments();
  const newList = list.filter(d => d.id !== id);
  saveDocuments(newList);
  return newList;
}

export function deleteDocumentsForEntity(entityId){
  const list = loadDocuments();
  const newList = list.filter(d => d.entity_id !== entityId);
  saveDocuments(newList);
  return newList;
}

export function clearAll(){
  saveEntities([]);
  saveDocuments([]);
  saveRoles([]);
  saveRolePermissions([]);
  saveUserPermissionOverrides([]);
}

export function searchEntities(term){
  const q = (term||'').trim().toLowerCase();
  if(!q) return loadEntities();
  const fields = ['name', 'code', 'taxId', 'email', 'phone', 'address', 'category', 'description', 'targetDate', 'paymentTerms', ...declaredFields('entity').map(f => f.key)];
  return loadEntities().filter(e => fields.some(f => String(e[f] ?? '').toLowerCase().includes(q)));
}
