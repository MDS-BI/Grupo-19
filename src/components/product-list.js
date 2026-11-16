import { escapeHtml } from '../storage.js';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

function setCount(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

export function renderProductList(tbody, emptyEl, products, { onEdit, onToggleStatus, canManage = true }){
  tbody.innerHTML = '';
  setCount('product-count', products ? products.length : 0);
  if(!products || products.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const p of products){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${escapeHtml(p.sku)}</td>
      <td><strong>${escapeHtml(p.product_name)}</strong></td>
      <td>${escapeHtml(p.category_name || '—')}</td>
      <td class="num">${escapeHtml(CLP.format(Number(p.sale_price) || 0))}</td>
      <td>${escapeHtml(p.unit_of_measure || '—')}</td>
      <td>${escapeHtml(p.supplier || '—')}</td>
      <td><span class="status-badge ${p.status === 'activo' ? 'status-active' : 'status-inactive'}">${escapeHtml(p.status)}</span></td>
    `;
    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell';
    if(canManage){
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'secondary';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => onEdit(p));
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = p.status === 'activo' ? 'danger subtle' : 'secondary';
      toggleBtn.textContent = p.status === 'activo' ? 'Desactivar' : 'Activar';
      toggleBtn.addEventListener('click', () => onToggleStatus(p));
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
