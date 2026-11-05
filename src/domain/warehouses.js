import { loadWarehouses, saveWarehouses, loadUsers, nextWarehouseId, isNonEmptyText, isNonNegativeNumber } from '../storage.js';

export function validateWarehouse(payload, { excludeId } = {}){
  const { name, location, capacity, responsableId } = payload;
  const errors = {};
  if(!isNonEmptyText(name)) errors.name = 'El nombre de la bodega es obligatorio';
  else if(loadWarehouses().some(w => w.name.trim().toLowerCase() === name.trim().toLowerCase() && w.warehouse_id !== excludeId)){
    errors.name = 'Ya existe una bodega con ese nombre';
  }
  if(!isNonEmptyText(location)) errors.location = 'La ubicación es obligatoria';
  if(capacity !== undefined && capacity !== '' && !isNonNegativeNumber(capacity)){
    errors.capacity = 'La capacidad debe ser un número mayor o igual a 0';
  }
  if(responsableId !== undefined && responsableId !== '' && !loadUsers().some(u => u.user_id === Number(responsableId))){
    errors.responsableId = 'Selecciona un usuario responsable existente';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function createWarehouse(payload){
  const check = validateWarehouse(payload);
  if(!check.valid) return { success: false, errors: check.errors };
  const warehouse = {
    warehouse_id: nextWarehouseId(),
    name: payload.name.trim(),
    location: payload.location.trim(),
    description: (payload.description || '').trim() || undefined,
    capacity: payload.capacity !== undefined && payload.capacity !== '' ? Number(payload.capacity) : undefined,
    status: 'activo',
    responsable_id: payload.responsableId ? Number(payload.responsableId) : undefined
  };
  const list = loadWarehouses();
  list.push(warehouse);
  saveWarehouses(list);
  return { success: true, warehouse };
}

export function updateWarehouse(warehouseId, payload){
  const list = loadWarehouses();
  const idx = list.findIndex(w => w.warehouse_id === Number(warehouseId));
  if(idx === -1) return { success: false, errors: { general: 'Bodega no encontrada' } };
  const check = validateWarehouse(payload, { excludeId: Number(warehouseId) });
  if(!check.valid) return { success: false, errors: check.errors };
  list[idx] = {
    ...list[idx],
    name: payload.name.trim(),
    location: payload.location.trim(),
    description: (payload.description || '').trim() || undefined,
    capacity: payload.capacity !== undefined && payload.capacity !== '' ? Number(payload.capacity) : undefined,
    responsable_id: payload.responsableId ? Number(payload.responsableId) : undefined
  };
  saveWarehouses(list);
  return { success: true, warehouse: list[idx] };
}

/** Cambia el estado de la bodega (FR-062); no hay restricción por stock existente. */
export function setWarehouseStatus(warehouseId, status){
  if(status !== 'activo' && status !== 'inactivo') return { success: false, error: 'Estado inválido' };
  const list = loadWarehouses();
  const idx = list.findIndex(w => w.warehouse_id === Number(warehouseId));
  if(idx === -1) return { success: false, error: 'Bodega no encontrada' };
  list[idx] = { ...list[idx], status };
  saveWarehouses(list);
  return { success: true, warehouse: list[idx] };
}

/** Excluye las bodegas inactivas de los selectores operativos (FR-063). */
export function listActiveWarehouses(){
  return loadWarehouses().filter(w => w.status === 'activo');
}

export function searchWarehouses(term){
  const q = (term || '').trim().toLowerCase();
  const list = loadWarehouses();
  if(!q) return list;
  return list.filter(w => w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q));
}
