import {
  loadReplenishments, saveReplenishments, loadProducts, loadUsers, loadWarehouses,
  nextReplenishmentId, isPositiveInteger
} from '../storage.js';
import { listActiveWarehouses } from './warehouses.js';
import { registerMovement } from './movements.js';

export const REQUEST_STATUSES = ['pendiente', 'aprobada', 'recibida', 'cancelada'];
const CANCELLABLE_STATUSES = new Set(['pendiente', 'aprobada']);
const INVALID_ACTIVE_USER_MSG = 'No existe un usuario activo válido para realizar esta operación';

function userExists(userId){
  return loadUsers().some(u => u.user_id === Number(userId));
}

function findRequest(requestId){
  return loadReplenishments().find(r => r.request_id === Number(requestId));
}

function saveUpdatedRequest(requestId, updates){
  const list = loadReplenishments();
  const idx = list.findIndex(r => r.request_id === Number(requestId));
  if(idx === -1) return { success: false, error: 'Solicitud de reposición no encontrada' };
  list[idx] = { ...list[idx], ...updates };
  saveReplenishments(list);
  return { success: true, request: list[idx] };
}

/** Crea una solicitud pendiente. No modifica STOCK ni genera movimientos (HU-07). */
export function requestReplenishment({ productId, warehouseId, quantity, observation, createdBy, source = 'manual' }){
  const errors = {};
  if(!productId || !loadProducts().some(p => p.product_id === Number(productId))) errors.productId = 'Selecciona un producto existente';
  if(!warehouseId || !listActiveWarehouses().some(w => w.warehouse_id === Number(warehouseId))) errors.warehouseId = 'Selecciona una bodega activa';
  if(!isPositiveInteger(quantity)) errors.quantity = 'La cantidad debe ser un entero mayor que cero';
  if(!createdBy || !userExists(createdBy)) errors.createdBy = INVALID_ACTIVE_USER_MSG;
  if(observation !== undefined && observation !== null && typeof observation !== 'string') errors.observation = 'La observación debe ser texto';
  if(Object.keys(errors).length > 0) return { success: false, errors };

  const request = {
    request_id: nextReplenishmentId(),
    product_id: Number(productId),
    warehouse_id: Number(warehouseId),
    quantity: Number(quantity),
    observation: typeof observation === 'string' ? observation.trim() : '',
    status: 'pendiente',
    request_date: new Date().toISOString(),
    created_by: Number(createdBy),
    approved_by: undefined,
    approved_at: undefined,
    received_by: undefined,
    received_at: undefined,
    cancelled_by: undefined,
    cancelled_at: undefined,
    movement_id: undefined,
    source: source === 'alert' ? 'alert' : 'manual'
  };
  const list = loadReplenishments();
  list.push(request);
  saveReplenishments(list);
  return { success: true, request };
}

/** Autoriza una solicitud pendiente. No modifica STOCK (HU-07). */
export function approveRequest(requestId, approvedBy){
  const request = findRequest(requestId);
  if(!request) return { success: false, error: 'Solicitud de reposición no encontrada' };
  if(request.status !== 'pendiente') return { success: false, error: 'Solo las solicitudes pendientes pueden aprobarse' };
  if(!approvedBy || !userExists(approvedBy)) return { success: false, error: INVALID_ACTIVE_USER_MSG };
  return saveUpdatedRequest(requestId, { status: 'aprobada', approved_by: Number(approvedBy), approved_at: new Date().toISOString() });
}

/** Anula una solicitud pendiente o aprobada. No modifica STOCK (HU-07). */
export function cancelRequest(requestId, cancelledBy){
  const request = findRequest(requestId);
  if(!request) return { success: false, error: 'Solicitud de reposición no encontrada' };
  if(!CANCELLABLE_STATUSES.has(request.status)) return { success: false, error: 'Solo las solicitudes pendientes o aprobadas pueden cancelarse' };
  if(!cancelledBy || !userExists(cancelledBy)) return { success: false, error: INVALID_ACTIVE_USER_MSG };
  return saveUpdatedRequest(requestId, { status: 'cancelada', cancelled_by: Number(cancelledBy), cancelled_at: new Date().toISOString() });
}

/**
 * Registra la recepción usando la lógica de entradas de HU-03.
 * El stock aumenta una sola vez porque el movimiento se crea antes de marcar la solicitud como recibida.
 */
export function receiveRequest(requestId, receivedBy){
  const request = findRequest(requestId);
  if(!request) return { success: false, error: 'Solicitud de reposición no encontrada' };
  if(request.status !== 'aprobada') return { success: false, error: 'Solo las solicitudes aprobadas pueden recibirse' };
  if(!receivedBy || !userExists(receivedBy)) return { success: false, error: INVALID_ACTIVE_USER_MSG };

  const movementResult = registerMovement({
    type: 'entrada',
    productId: request.product_id,
    warehouseId: request.warehouse_id,
    quantity: request.quantity,
    userId: receivedBy
  });
  if(!movementResult.success){
    const firstError = movementResult.errors ? Object.values(movementResult.errors)[0] : undefined;
    return { success: false, error: firstError || 'No fue posible registrar la entrada de la reposición' };
  }

  return saveUpdatedRequest(requestId, {
    status: 'recibida',
    received_by: Number(receivedBy),
    received_at: new Date().toISOString(),
    movement_id: movementResult.movement.transaction_id
  });
}

export function getReplenishmentRequest(requestId){
  return findRequest(requestId);
}

export function listReplenishments({ status, warehouseId, productId } = {}){
  const products = loadProducts();
  const warehouses = loadWarehouses();
  const users = loadUsers();
  const userName = (id) => users.find(u => u.user_id === id)?.user_name || '—';
  return loadReplenishments()
    .filter(r => (status ? r.status === status : true))
    .filter(r => (productId ? r.product_id === Number(productId) : true))
    .filter(r => (warehouseId ? r.warehouse_id === Number(warehouseId) : true))
    .map(r => ({
      ...r,
      product_name: products.find(p => p.product_id === r.product_id)?.product_name || 'Producto desconocido',
      product_sku: products.find(p => p.product_id === r.product_id)?.sku || '',
      warehouse_name: warehouses.find(w => w.warehouse_id === r.warehouse_id)?.name || 'Bodega desconocida',
      created_by_name: userName(r.created_by),
      approved_by_name: r.approved_by ? userName(r.approved_by) : undefined,
      received_by_name: r.received_by ? userName(r.received_by) : undefined,
      cancelled_by_name: r.cancelled_by ? userName(r.cancelled_by) : undefined
    }))
    .sort((a, b) => b.request_id - a.request_id);
}

/** Indicadores calculados únicamente a partir de las solicitudes almacenadas. */
export function replenishmentCounts(){
  const counts = { pendiente: 0, aprobada: 0, recibida: 0, cancelada: 0, total: 0 };
  for(const request of loadReplenishments()){
    counts.total += 1;
    if(Object.prototype.hasOwnProperty.call(counts, request.status)) counts[request.status] += 1;
  }
  return counts;
}

export function canCancelRequest(request){
  return Boolean(request && CANCELLABLE_STATUSES.has(request.status));
}
