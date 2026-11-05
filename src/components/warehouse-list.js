import { escapeHtml } from '../storage.js';

export function renderWarehouseList(tbody, emptyEl, warehouses, { onEdit, onToggleStatus }){
  tbody.innerHTML = '';
  if(!warehouses || warehouses.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const w of warehouses){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(w.name)}</td>
      <td>${escapeHtml(w.location)}</td>
      <td>${w.capacity ?? '—'}</td>
      <td><span class="status-badge ${w.status === 'activo' ? 'status-active' : 'status-inactive'}">${escapeHtml(w.status)}</span></td>
    `;
    const actionsTd = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'secondary';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => onEdit(w));
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'secondary';
    toggleBtn.textContent = w.status === 'activo' ? 'Desactivar' : 'Activar';
    toggleBtn.addEventListener('click', () => onToggleStatus(w));
    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(toggleBtn);
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
