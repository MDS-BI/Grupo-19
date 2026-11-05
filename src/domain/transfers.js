import { loadTransfers, saveTransfers, loadProducts, loadUsers, loadWarehouses, nextTransferId, isPositiveInteger } from '../storage.js';
import { getStockRecord, upsertStockForEntry, deductStockForExit } from './stock.js';

function isActiveWarehouse(warehouseId){
  const w = loadWarehouses().find(x => x.warehouse_id === Number(warehouseId));
  return Boolean(w && w.status === 'activo');
}

function userExists(userId){
  return loadUsers().some(u => u.user_id === Number(userId));
}

/** Crea una solicitud de transferencia en estado "pendiente" (FR-065 a FR-067, FR-074). */
export function requestTransfer({ productId, sourceWarehouseId, targetWarehouseId, quantity, createdBy }){
  const errors = {};
  if(!productId || !loadProducts().some(p => p.product_id === Number(productId))) errors.productId = 'Selecciona un producto existente';
  if(!sourceWarehouseId || !isActiveWarehouse(sourceWarehouseId)) errors.sourceWarehouseId = 'Selecciona una bodega de origen activa';
  if(!targetWarehouseId || !isActiveWarehouse(targetWarehouseId)) errors.targetWarehouseId = 'Selecciona una bodega de destino activa';
  if(sourceWarehouseId && targetWarehouseId && Number(sourceWarehouseId) === Number(targetWarehouseId)){
    errors.targetWarehouseId = 'La bodega de destino debe ser diferente a la bodega de origen';
  }
  if(!isPositiveInteger(quantity)) errors.quantity = 'La cantidad debe ser un entero mayor que cero';
  if(!createdBy || !userExists(createdBy)) errors.createdBy = 'Selecciona un usuario existente';

  if(Object.keys(errors).length === 0){
    const stock = getStockRecord(Number(productId), Number(sourceWarehouseId));
    if(!stock || stock.quantity_available < Number(quantity)){
      errors.quantity = 'La bodega de origen no tiene existencias suficientes';
    }
  }
  if(Object.keys(errors).length > 0) return { success: false, errors };

  const transfer = {
    transfer_id: nextTransferId(),
    product_id: Number(productId),
    source_warehouse_id: Number(sourceWarehouseId),
    target_warehouse_id: Number(targetWarehouseId),
    quantity: Number(quantity),
    status: 'pendiente',
    transfer_date: new Date().toISOString(),
    created_by: Number(createdBy),
    confirmed_by: undefined,
    cancelled_by: undefined
  };
  const list = loadTransfers();
  list.push(transfer);
  saveTransfers(list);
  return { success: true, transfer };
}

/** Confirma una transferencia pendiente, moviendo el stock de origen a destino (FR-068, FR-069, FR-075, FR-087). */
export function confirmTransfer(transferId, confirmedBy){
  const list = loadTransfers();
  const idx = list.findIndex(t => t.transfer_id === Number(transferId));
  if(idx === -1) return { success: false, error: 'Transferencia no encontrada' };
  const transfer = list[idx];
  if(transfer.status !== 'pendiente') return { success: false, error: 'Solo las transferencias pendientes pueden confirmarse' };
  if(!confirmedBy || !userExists(confirmedBy)) return { success: false, error: 'Selecciona un usuario existente para confirmar' };
  if(!isActiveWarehouse(transfer.source_warehouse_id) || !isActiveWarehouse(transfer.target_warehouse_id)){
    return { success: false, error: 'No es posible confirmar: la bodega de origen o destino está inactiva' };
  }
  const deducted = deductStockForExit(transfer.product_id, transfer.source_warehouse_id, transfer.quantity);
  if(!deducted.ok) return { success: false, error: deducted.reason };
  upsertStockForEntry(transfer.product_id, transfer.target_warehouse_id, transfer.quantity);

  list[idx] = { ...transfer, status: 'confirmada', confirmed_by: Number(confirmedBy) };
  saveTransfers(list);
  return { success: true, transfer: list[idx] };
}

/** Cancela una transferencia pendiente sin tocar STOCK (FR-085, FR-086). */
export function cancelTransfer(transferId, cancelledBy){
  const list = loadTransfers();
  const idx = list.findIndex(t => t.transfer_id === Number(transferId));
  if(idx === -1) return { success: false, error: 'Transferencia no encontrada' };
  const transfer = list[idx];
  if(transfer.status !== 'pendiente') return { success: false, error: 'Solo las transferencias pendientes pueden cancelarse' };
  if(!cancelledBy || !userExists(cancelledBy)) return { success: false, error: 'Selecciona un usuario existente para cancelar' };

  list[idx] = { ...transfer, status: 'cancelada', cancelled_by: Number(cancelledBy) };
  saveTransfers(list);
  return { success: true, transfer: list[idx] };
}

export function listTransfers(){
  const products = loadProducts();
  const warehouses = loadWarehouses();
  const users = loadUsers();
  const warehouseName = (id) => warehouses.find(w => w.warehouse_id === id)?.name || 'Bodega desconocida';
  const userName = (id) => users.find(u => u.user_id === id)?.user_name || '—';
  return loadTransfers()
    .map(t => ({
      ...t,
      product_name: products.find(p => p.product_id === t.product_id)?.product_name || 'Producto desconocido',
      source_warehouse_name: warehouseName(t.source_warehouse_id),
      target_warehouse_name: warehouseName(t.target_warehouse_id),
      created_by_name: userName(t.created_by),
      confirmed_by_name: t.confirmed_by ? userName(t.confirmed_by) : undefined,
      cancelled_by_name: t.cancelled_by ? userName(t.cancelled_by) : undefined
    }))
    .sort((a, b) => b.transfer_id - a.transfer_id);
}
