import { escapeHtml } from '../storage.js';

export function renderProductList(tbody, emptyEl, products, { onEdit, onToggleStatus }){
  tbody.innerHTML = '';
  if(!products || products.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const p of products){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.sku)}</td>
      <td>${escapeHtml(p.product_name)}</td>
      <td>${escapeHtml(p.category_name || '')}</td>
      <td>${p.sale_price.toFixed(2)}</td>
      <td><span class="status-badge ${p.status === 'activo' ? 'status-active' : 'status-inactive'}">${escapeHtml(p.status)}</span></td>
    `;
    const actionsTd = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'secondary';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => onEdit(p));
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'secondary';
    toggleBtn.textContent = p.status === 'activo' ? 'Desactivar' : 'Activar';
    toggleBtn.addEventListener('click', () => onToggleStatus(p));
    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(toggleBtn);
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
