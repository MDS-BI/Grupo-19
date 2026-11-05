import { loadProducts, loadUsers } from '../storage.js';
import { listActiveWarehouses } from '../domain/warehouses.js';

function qs(id){ return document.getElementById(id); }

export function populateMovementProductSelect(){
  const select = qs('movement-product');
  const prev = select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Selecciona un producto --';
  select.appendChild(blank);
  loadProducts().forEach(p => {
    const opt = document.createElement('option');
    opt.value = String(p.product_id);
    opt.textContent = `${p.product_name} (${p.sku})`;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

export function populateMovementWarehouseSelect(){
  const select = qs('movement-warehouse');
  const prev = select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Selecciona una bodega activa --';
  select.appendChild(blank);
  listActiveWarehouses().forEach(w => {
    const opt = document.createElement('option');
    opt.value = String(w.warehouse_id);
    opt.textContent = w.name;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

export function populateMovementUserSelect(){
  const select = qs('movement-user');
  const prev = select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Selecciona un usuario --';
  select.appendChild(blank);
  loadUsers().forEach(u => {
    const opt = document.createElement('option');
    opt.value = String(u.user_id);
    opt.textContent = u.user_name;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

const ERROR_FIELDS = ['type', 'productId', 'warehouseId', 'quantity', 'userId'];

export function clearMovementForm(){
  qs('movement-type').value = 'entrada';
  qs('movement-product').value = '';
  qs('movement-warehouse').value = '';
  qs('movement-quantity').value = '';
  qs('movement-user').value = '';
  clearMovementErrors();
}

export function clearMovementErrors(){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-movement-${f}`); if(el) el.textContent = ''; });
}

/** Prepara el formulario para registrar un ajuste sobre el mismo producto/bodega de `movement`. */
export function prefillAdjustment(movement, adjustmentType){
  qs('movement-type').value = adjustmentType;
  qs('movement-product').value = String(movement.product_id);
  qs('movement-warehouse').value = String(movement.warehouse_id);
  qs('movement-quantity').value = '';
  qs('movement-user').value = '';
  clearMovementErrors();
  qs('movement-quantity').focus();
}

export function collectMovementPayload(){
  return {
    type: qs('movement-type').value,
    productId: qs('movement-product').value,
    warehouseId: qs('movement-warehouse').value,
    quantity: qs('movement-quantity').value,
    userId: qs('movement-user').value
  };
}

export function showMovementErrors(errors = {}){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-movement-${f}`); if(el) el.textContent = errors[f] || ''; });
}
