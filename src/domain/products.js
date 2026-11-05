import {
  loadProducts, saveProducts, loadProductCategories, loadUsers, nextProductId,
  isNonEmptyText, isNonNegativeNumber
} from '../storage.js';

/** Valida los campos de un producto. `excludeId` permite editar sin chocar con el propio SKU. */
export function validateProduct(payload, { excludeId } = {}){
  const { sku, productName, categoryId, salePrice, costPrice, userId } = payload;
  const errors = {};
  const warnings = {};

  if(!isNonEmptyText(sku)) errors.sku = 'El SKU es obligatorio';
  else if(loadProducts().some(p => p.sku.toLowerCase() === sku.trim().toLowerCase() && p.product_id !== excludeId)){
    errors.sku = 'El SKU ingresado ya existe';
  }

  if(!isNonEmptyText(productName)) errors.productName = 'El nombre es obligatorio';

  if(!categoryId || !loadProductCategories().some(c => c.category_id === Number(categoryId))){
    errors.categoryId = 'Selecciona una categoría existente';
  }

  if(!isNonNegativeNumber(salePrice)) errors.salePrice = 'El Precio de Venta debe ser un número mayor o igual a 0';
  if(costPrice !== undefined && costPrice !== '' && !isNonNegativeNumber(costPrice)){
    errors.costPrice = 'El Precio de Costo debe ser un número mayor o igual a 0';
  }
  if(!errors.salePrice && !errors.costPrice && costPrice !== undefined && costPrice !== ''
    && Number(costPrice) > Number(salePrice)){
    warnings.costPrice = 'El Precio de Costo supera al Precio de Venta';
  }

  if(!userId || !loadUsers().some(u => u.user_id === Number(userId))){
    errors.userId = 'Selecciona un usuario existente para registrar el cambio';
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
}

export function createProduct(payload){
  const check = validateProduct(payload);
  if(!check.valid) return { success: false, errors: check.errors, warnings: check.warnings };
  const now = new Date().toISOString();
  const product = {
    product_id: nextProductId(),
    sku: payload.sku.trim(),
    product_name: payload.productName.trim(),
    description: (payload.description || '').trim() || undefined,
    category_id: Number(payload.categoryId),
    sale_price: Number(payload.salePrice),
    cost_price: payload.costPrice !== undefined && payload.costPrice !== '' ? Number(payload.costPrice) : undefined,
    unit_of_measure: (payload.unitOfMeasure || '').trim() || undefined,
    status: 'activo',
    supplier: (payload.supplier || '').trim() || undefined,
    unit_price: Number(payload.salePrice),
    weight: payload.weight !== undefined && payload.weight !== '' ? Number(payload.weight) : undefined,
    created_at: now,
    updated_at: now,
    created_by: Number(payload.userId),
    updated_by: Number(payload.userId)
  };
  const list = loadProducts();
  list.push(product);
  saveProducts(list);
  return { success: true, product, warnings: check.warnings };
}

export function updateProduct(productId, payload){
  const list = loadProducts();
  const idx = list.findIndex(p => p.product_id === Number(productId));
  if(idx === -1) return { success: false, errors: { general: 'Producto no encontrado' } };
  const check = validateProduct(payload, { excludeId: Number(productId) });
  if(!check.valid) return { success: false, errors: check.errors, warnings: check.warnings };
  list[idx] = {
    ...list[idx],
    sku: payload.sku.trim(),
    product_name: payload.productName.trim(),
    description: (payload.description || '').trim() || undefined,
    category_id: Number(payload.categoryId),
    sale_price: Number(payload.salePrice),
    cost_price: payload.costPrice !== undefined && payload.costPrice !== '' ? Number(payload.costPrice) : undefined,
    unit_of_measure: (payload.unitOfMeasure || '').trim() || undefined,
    supplier: (payload.supplier || '').trim() || undefined,
    unit_price: Number(payload.salePrice),
    weight: payload.weight !== undefined && payload.weight !== '' ? Number(payload.weight) : undefined,
    updated_at: new Date().toISOString(),
    updated_by: Number(payload.userId)
  };
  saveProducts(list);
  return { success: true, product: list[idx], warnings: check.warnings };
}

/** Alterna el estado del producto (FR-045); se permite aunque tenga stock existente (FR-090). */
export function setProductStatus(productId, status, userId){
  if(status !== 'activo' && status !== 'inactivo'){
    return { success: false, error: 'Estado inválido' };
  }
  if(!userId || !loadUsers().some(u => u.user_id === Number(userId))){
    return { success: false, error: 'Selecciona un usuario existente' };
  }
  const list = loadProducts();
  const idx = list.findIndex(p => p.product_id === Number(productId));
  if(idx === -1) return { success: false, error: 'Producto no encontrado' };
  list[idx] = { ...list[idx], status, updated_at: new Date().toISOString(), updated_by: Number(userId) };
  saveProducts(list);
  return { success: true, product: list[idx] };
}

export function searchProducts(term){
  const q = (term || '').trim().toLowerCase();
  const categories = loadProductCategories();
  const withCategory = loadProducts().map(p => ({
    ...p,
    category_name: categories.find(c => c.category_id === p.category_id)?.category_name || ''
  }));
  if(!q) return withCategory;
  return withCategory.filter(p =>
    p.product_name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.category_name.toLowerCase().includes(q)
  );
}
