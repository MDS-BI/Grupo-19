import { escapeHtml } from '../storage.js';

export function renderAlertList(tbody, emptyEl, alerts){
  tbody.innerHTML = '';
  if(!alerts || alerts.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const a of alerts){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(a.product_name)} <span class="muted">(${escapeHtml(a.product_sku)})</span></td>
      <td>${escapeHtml(a.warehouse_name)}</td>
      <td>${a.quantity_available}</td>
      <td>${a.min_stock_level}</td>
      <td>${a.deficit}</td>
    `;
    tbody.appendChild(tr);
  }
}
