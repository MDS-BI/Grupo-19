import { loadProducts } from '../storage.js';
import { listActiveWarehouses } from '../domain/warehouses.js';

function qs(id){ return document.getElementById(id); }

function populateSelect(select, items, blankLabel){
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

export function populateReplenishmentProductSelect(){
  populateSelect(qs('replenishment-product'), loadProducts().map(p => [String(p.product_id), `${p.product_name} (${p.sku})`]), '-- Selecciona un producto --');
}

export function populateReplenishmentWarehouseSelect(){
  populateSelect(qs('replenishment-warehouse'), listActiveWarehouses().map(w => [String(w.warehouse_id), w.name]), '-- Selecciona una bodega activa --');
}

const ERROR_FIELDS = ['productId', 'warehouseId', 'quantity', 'observation', 'createdBy'];

export function clearReplenishmentForm(){
  const product = qs('replenishment-product');
  const warehouse = qs('replenishment-warehouse');
  const quantity = qs('replenishment-quantity');
  const observation = qs('replenishment-observation');
  const source = qs('replenishment-source');
  if(product) product.value = '';
  if(warehouse) warehouse.value = '';
  if(quantity) quantity.value = '';
  if(observation) observation.value = '';
  if(source) source.value = 'manual';
  clearReplenishmentErrors();
}

export function clearReplenishmentErrors(){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-replenishment-${f}`); if(el) el.textContent = ''; });
}

export function collectReplenishmentPayload(){
  return {
    productId: qs('replenishment-product').value,
    warehouseId: qs('replenishment-warehouse').value,
    quantity: qs('replenishment-quantity').value,
    observation: qs('replenishment-observation').value,
    source: qs('replenishment-source')?.value || 'manual'
  };
}

export function showReplenishmentErrors(errors = {}){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-replenishment-${f}`); if(el) el.textContent = errors[f] || ''; });
}

/** Preselecciona producto/bodega desde una alerta HU-06 y sugiere el déficit calculado. */
export function prefillReplenishmentFromAlert({ productId, warehouseId, quantity }){
  const product = qs('replenishment-product');
  const warehouse = qs('replenishment-warehouse');
  const quantityInput = qs('replenishment-quantity');
  const source = qs('replenishment-source');
  if(product) product.value = String(productId);
  if(warehouse) warehouse.value = String(warehouseId);
  if(quantityInput && quantity !== undefined && quantity !== null) quantityInput.value = String(quantity);
  if(source) source.value = 'alert';
  clearReplenishmentErrors();
  if(quantityInput) quantityInput.focus();
}
