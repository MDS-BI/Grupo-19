import { escapeHtml, loadUsers } from '../storage.js';

function setCount(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

function formatCapacity(value){
  if(value === undefined || value === null || value === '') return '—';
  return Number(value).toLocaleString('es-CL');
}

export function renderWarehouseList(tbody, emptyEl, warehouses, { onEdit, onToggleStatus, canManage = true }){
  tbody.innerHTML = '';
  setCount('warehouse-count', warehouses ? warehouses.length : 0);
  if(!warehouses || warehouses.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  const users = loadUsers();
  for(const w of warehouses){
    const responsable = users.find(user => Number(user.user_id) === Number(w.responsable_id));
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(w.name)}</strong></td>
      <td>${escapeHtml(w.location)}</td>
      <td class="num">${escapeHtml(formatCapacity(w.capacity))}</td>
      <td>${escapeHtml(responsable ? responsable.user_name : '—')}</td>
      <td><span class="status-badge ${w.status === 'activo' ? 'status-active' : 'status-inactive'}">${escapeHtml(w.status)}</span></td>
    `;
    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell';
    if(canManage){
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'secondary';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => onEdit(w));
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = w.status === 'activo' ? 'danger subtle' : 'secondary';
      toggleBtn.textContent = w.status === 'activo' ? 'Desactivar' : 'Activar';
      toggleBtn.addEventListener('click', () => onToggleStatus(w));
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(toggleBtn);
    } else {
      actionsTd.textContent = 'Solo lectura';
      actionsTd.classList.add('muted');
    }
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
