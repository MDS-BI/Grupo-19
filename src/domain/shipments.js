import {
  loadOrders,
  loadShipments,
  saveShipments,
  loadUsers,
  nextShipmentId,
  validateRecord,
  isNonEmptyText
} from '../storage.js';

export const SHIPMENT_STATUSES = ['preparando', 'despachado', 'en_transito', 'entregado', 'con_incidencia', 'en_bodega', 'en_reparto'];

export const SHIPMENT_NEXT_STATUS = {
  preparando: 'despachado',
  en_bodega: 'en_transito',
  despachado: 'en_transito',
  en_transito: 'en_reparto',
  en_reparto: 'entregado',
  entregado: null,
  con_incidencia: null
};

const SHIPMENT_ALLOWED_TARGETS = {
  preparando: ['despachado'],
  en_bodega: ['en_transito'],
  despachado: ['en_transito'],
  en_transito: ['en_reparto', 'entregado', 'con_incidencia'],
  en_reparto: ['entregado'],
  entregado: [],
  con_incidencia: []
};

const SHIPMENT_STATUS_GROUPS = {
  preparando: 'preparando',
  en_bodega: 'preparando',
  despachado: 'despachado',
  en_reparto: 'despachado'
};

function hasFilter(value){
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function userExists(userId){
  return loadUsers().some(user => Number(user.user_id) === Number(userId));
}

function isSalesOrder(orderId){
  const normalized = String(orderId ?? '').trim();
  return loadOrders().some(order => String(order.order_id) === normalized && order.order_type === 'venta');
}

function historyEvent(status, userId, changedAt){
  return { status, changed_at: changedAt, changed_by: Number(userId) };
}

export function createShipment({ orderId, carrier, trackingCode, createdBy } = {}){
  const errors = {};
  const normalizedOrderId = String(orderId ?? '').trim();
  const shipments = loadShipments();

  if(!normalizedOrderId){
    errors.orderId = 'Selecciona una orden de venta';
  } else if(!isSalesOrder(normalizedOrderId)){
    errors.orderId = 'La orden debe ser una OV existente';
  } else if(shipments.some(shipment => String(shipment.order_id) === normalizedOrderId)){
    errors.orderId = 'Esta orden ya tiene un envío registrado';
  }
  if(!isNonEmptyText(carrier)) errors.carrier = 'La empresa transportista es obligatoria';
  if(!isNonEmptyText(trackingCode)) errors.trackingCode = 'El código de seguimiento es obligatorio';
  if(!createdBy || !userExists(createdBy)){
    errors.createdBy = 'No existe un usuario activo válido para registrar el envío';
  }
  if(Object.keys(errors).length > 0) return { success: false, errors };

  const now = new Date().toISOString();
  const shipment = {
    shipment_id: nextShipmentId(),
    order_id: normalizedOrderId,
    carrier: String(carrier).trim(),
    tracking_code: String(trackingCode).trim(),
    status: 'en_bodega',
    created_by: Number(createdBy),
    created_at: now,
    history: [historyEvent('en_bodega', createdBy, now)]
  };
  const validation = validateRecord('shipments', shipment, { list: shipments });
  if(!validation.valid) return { success: false, errors: validation.errors };

  saveShipments([...shipments, shipment]);
  return { success: true, shipment };
}

export function advanceShipmentStatus(shipmentId, actorUserId, targetStatus){
  const shipments = loadShipments();
  const index = shipments.findIndex(shipment => Number(shipment.shipment_id) === Number(shipmentId));
  if(index === -1) return { success: false, error: 'Envío no encontrado' };

  const current = shipments[index];
  const status = String(current.status);
  const nextStatus = SHIPMENT_NEXT_STATUS[status] ?? null;
  const requestedStatus = hasFilter(targetStatus) ? String(targetStatus) : null;
  const advancedStatus = requestedStatus || nextStatus;
  const allowedTargets = SHIPMENT_ALLOWED_TARGETS[status] || [];
  const errors = {};
  if(!nextStatus && !requestedStatus){
    errors.status = 'El envío está entregado o tiene un estado no válido; no se puede avanzar';
  }
  if(requestedStatus && !allowedTargets.includes(requestedStatus)){
    errors.status = 'Solo se permite avanzar al siguiente estado del envío';
  }
  if(!actorUserId || !userExists(actorUserId)){
    errors.actorUserId = 'No existe un usuario activo válido para avanzar el envío';
  }
  if(Object.keys(errors).length > 0) return { success: false, errors, error: Object.values(errors)[0] };

  const updated = {
    ...current,
    status: advancedStatus,
    history: [...(Array.isArray(current.history) ? current.history : []), historyEvent(advancedStatus, actorUserId, new Date().toISOString())]
  };
  const validation = validateRecord('shipments', updated, { list: shipments.filter((_, i) => i !== index) });
  if(!validation.valid){
    return { success: false, errors: validation.errors, error: Object.values(validation.errors)[0] };
  }

  shipments[index] = updated;
  saveShipments(shipments);
  return { success: true, shipment: updated };
}

export function listShipments(filters = {}){
  const matchesText = (value, term) => String(value ?? '').toLowerCase().includes(String(term).trim().toLowerCase());
  return loadShipments()
    .filter(shipment => {
      if(hasFilter(filters.term)
        && ![shipment.order_id, shipment.tracking_code].some(value => matchesText(value, filters.term))) return false;
      if(hasFilter(filters.orderId) && !matchesText(shipment.order_id, filters.orderId)) return false;
      if(hasFilter(filters.trackingCode) && !matchesText(shipment.tracking_code, filters.trackingCode)) return false;
      if(hasFilter(filters.status)){
        const statusGroup = value => SHIPMENT_STATUS_GROUPS[String(value)] || String(value);
        if(statusGroup(shipment.status) !== statusGroup(filters.status)) return false;
      }
      return true;
    })
    .sort((a, b) => Number(b.shipment_id) - Number(a.shipment_id));
}
