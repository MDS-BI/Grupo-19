import { loadUsers } from '../storage.js';

function qs(id){ return document.getElementById(id); }

export function populateWarehouseResponsableSelect(){
  const select = qs('warehouse-responsable');
  const prev = select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Sin responsable asignado --';
  select.appendChild(blank);
  loadUsers().forEach(u => {
    const opt = document.createElement('option');
    opt.value = String(u.user_id);
    opt.textContent = u.user_name;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

const ERROR_FIELDS = ['name', 'location', 'capacity', 'responsableId'];

export function clearWarehouseForm(){
  qs('warehouse-id').value = '';
  qs('warehouse-name').value = '';
  qs('warehouse-location').value = '';
  qs('warehouse-description').value = '';
  qs('warehouse-capacity').value = '';
  qs('warehouse-responsable').value = '';
  clearWarehouseErrors();
  qs('warehouse-cancel-edit').hidden = true;
  qs('warehouse-submit-button').textContent = 'Guardar';
}

export function clearWarehouseErrors(){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-warehouse-${f}`); if(el) el.textContent = ''; });
}

export function startWarehouseEdit(warehouse){
  qs('warehouse-id').value = warehouse.warehouse_id;
  qs('warehouse-name').value = warehouse.name || '';
  qs('warehouse-location').value = warehouse.location || '';
  qs('warehouse-description').value = warehouse.description || '';
  qs('warehouse-capacity').value = warehouse.capacity ?? '';
  qs('warehouse-responsable').value = warehouse.responsable_id ? String(warehouse.responsable_id) : '';
  clearWarehouseErrors();
  qs('warehouse-cancel-edit').hidden = false;
  qs('warehouse-submit-button').textContent = 'Actualizar';
}

export function collectWarehousePayload(){
  return {
    name: qs('warehouse-name').value,
    location: qs('warehouse-location').value,
    description: qs('warehouse-description').value,
    capacity: qs('warehouse-capacity').value,
    responsableId: qs('warehouse-responsable').value
  };
}

export function showWarehouseErrors(errors = {}){
  ERROR_FIELDS.forEach(f => { const el = qs(`error-warehouse-${f}`); if(el) el.textContent = errors[f] || ''; });
}
