import { loadProducts, loadUsers } from '../storage.js';
import { listActiveWarehouses } from '../domain/warehouses.js';

function qs(id){ return document.getElementById(id); }

function populateSelect(select, items, blankLabel){
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

export function populateTransferProductSelect(){
  populateSelect(qs('transfer-product'), loadProducts().map(p => [String(p.product_id), `${p.product_name} (${p.sku})`]), '-- Selecciona un producto --');
}

export function populateTransferWarehouseSelects(){
  const warehouses = listActiveWarehouses().map(w => [String(w.warehouse_id), w.name]);
  populateSelect(qs('transfer-source'), warehouses, '-- Bodega de origen --');
  populateSelect(qs('transfer-target'), warehouses, '-- Bodega de destino --');
}

export function populateTransferUserSelect(){
  populateSelect(qs('transfer-created-by'), loadUsers().map(u => [String(u.user_id), u.user_name]), '-- Selecciona un usuario --');
}

const ERROR_FIELDS = ['productId', 'sourceWarehouseId', 'targetWarehouseId', 'quantity', 'createdBy'];

export function clearTransferForm(){
  qs('transfer-product').value = '';
  qs('transfer-source').value = '';
  qs('transfer-target').value = '';
  qs('transfer-quantity').value = '';
  qs('transfer-created-by').value = '';
  clearTransferErrors();
}

export function clearTransferErrors(){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-transfer-${f}`); if(el) el.textContent = ''; });
}

export function collectTransferPayload(){
  return {
    productId: qs('transfer-product').value,
    sourceWarehouseId: qs('transfer-source').value,
    targetWarehouseId: qs('transfer-target').value,
    quantity: qs('transfer-quantity').value,
    createdBy: qs('transfer-created-by').value
  };
}

export function showTransferErrors(errors = {}){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-transfer-${f}`); if(el) el.textContent = errors[f] || ''; });
}
