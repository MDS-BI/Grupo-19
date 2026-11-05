import { loadProductCategories, loadUsers } from '../storage.js';

function qs(id){ return document.getElementById(id); }

export function populateProductCategorySelect(){
  const select = qs('product-category');
  const prev = select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Selecciona una categoría --';
  select.appendChild(blank);
  loadProductCategories().forEach(c => {
    const opt = document.createElement('option');
    opt.value = String(c.category_id);
    opt.textContent = c.category_name;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

export function populateProductUserSelect(){
  const select = qs('product-user');
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

const ERROR_FIELDS = ['sku', 'productName', 'categoryId', 'salePrice', 'costPrice', 'userId'];

export function clearProductForm(){
  qs('product-id').value = '';
  qs('product-sku').value = '';
  qs('product-name').value = '';
  qs('product-description').value = '';
  qs('product-category').value = '';
  qs('product-sale-price').value = '';
  qs('product-cost-price').value = '';
  qs('product-unit').value = '';
  qs('product-supplier').value = '';
  qs('product-weight').value = '';
  qs('product-user').value = '';
  clearProductErrors();
  qs('product-cancel-edit').hidden = true;
  qs('product-submit-button').textContent = 'Guardar';
}

export function clearProductErrors(){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-product-${f}`); if(el) el.textContent = ''; });
}

export function startProductEdit(product){
  qs('product-id').value = product.product_id;
  qs('product-sku').value = product.sku || '';
  qs('product-name').value = product.product_name || '';
  qs('product-description').value = product.description || '';
  qs('product-category').value = String(product.category_id || '');
  qs('product-sale-price').value = product.sale_price ?? '';
  qs('product-cost-price').value = product.cost_price ?? '';
  qs('product-unit').value = product.unit_of_measure || '';
  qs('product-supplier').value = product.supplier || '';
  qs('product-weight').value = product.weight ?? '';
  qs('product-user').value = '';
  clearProductErrors();
  qs('product-cancel-edit').hidden = false;
  qs('product-submit-button').textContent = 'Actualizar';
}

export function collectProductPayload(){
  return {
    sku: qs('product-sku').value,
    productName: qs('product-name').value,
    description: qs('product-description').value,
    categoryId: qs('product-category').value,
    salePrice: qs('product-sale-price').value,
    costPrice: qs('product-cost-price').value,
    unitOfMeasure: qs('product-unit').value,
    supplier: qs('product-supplier').value,
    weight: qs('product-weight').value,
    userId: qs('product-user').value
  };
}

export function showProductErrors(errors = {}, warnings = {}){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-product-${f}`); if(el) el.textContent = errors[f] || ''; });
  const warn = qs('warning-product-costPrice');
  if(warn) warn.textContent = warnings.costPrice || '';
}
