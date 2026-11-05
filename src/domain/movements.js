import { loadMovements, saveMovements, loadProducts, loadUsers, loadWarehouses, nextMovementId, isPositiveInteger } from '../storage.js';
import { listActiveWarehouses } from './warehouses.js';
import { upsertStockForEntry, deductStockForExit } from './stock.js';

export const MOVEMENT_TYPES = ['entrada', 'salida', 'ajuste_entrada', 'ajuste_salida'];
const ENTRY_TYPES = new Set(['entrada', 'ajuste_entrada']);

/** Registra una entrada, salida o ajuste (FR-053 a FR-059, FR-072). Inmutable: no hay update/delete. */
export function registerMovement({ type, productId, warehouseId, quantity, userId }){
  const errors = {};
  if(!MOVEMENT_TYPES.includes(type)) errors.type = 'Tipo de movimiento inválido';
  if(!productId || !loadProducts().some(p => p.product_id === Number(productId))) errors.productId = 'Selecciona un producto existente';
  if(!warehouseId || !listActiveWarehouses().some(w => w.warehouse_id === Number(warehouseId))){
    errors.warehouseId = 'Selecciona una bodega activa';
  }
  if(!isPositiveInteger(quantity)) errors.quantity = 'La cantidad debe ser un entero mayor que cero';
  if(!userId || !loadUsers().some(u => u.user_id === Number(userId))) errors.userId = 'Selecciona un usuario existente';
  if(Object.keys(errors).length > 0) return { success: false, errors };

  const pId = Number(productId);
  const wId = Number(warehouseId);
  const qty = Number(quantity);

  if(ENTRY_TYPES.has(type)){
    upsertStockForEntry(pId, wId, qty);
  } else {
    const result = deductStockForExit(pId, wId, qty);
    if(!result.ok) return { success: false, errors: { quantity: result.reason } };
  }

  const movement = {
    transaction_id: nextMovementId(),
    product_id: pId,
    warehouse_id: wId,
    transaction_type: type,
    quantity: qty,
    user_id: Number(userId),
    transaction_date: new Date().toISOString()
  };
  const list = loadMovements();
  list.push(movement);
  saveMovements(list);
  return { success: true, movement };
}

export function listMovements({ productId, warehouseId } = {}){
  const products = loadProducts();
  const users = loadUsers();
  const warehouses = loadWarehouses();
  return loadMovements()
    .filter(m => (productId ? m.product_id === Number(productId) : true))
    .filter(m => (warehouseId ? m.warehouse_id === Number(warehouseId) : true))
    .map(m => ({
      ...m,
      product_name: products.find(p => p.product_id === m.product_id)?.product_name || 'Producto desconocido',
      warehouse_name: warehouses.find(w => w.warehouse_id === m.warehouse_id)?.name || 'Bodega desconocida',
      user_name: users.find(u => u.user_id === m.user_id)?.user_name || 'Usuario desconocido'
    }))
    .sort((a, b) => b.transaction_id - a.transaction_id);
}
