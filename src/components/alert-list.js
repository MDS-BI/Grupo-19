import { escapeHtml } from '../storage.js';

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

function formatNumber(value){
  return Number(value || 0).toLocaleString('es-CL');
}

export function renderAlertList(tbody, emptyEl, alerts){
  tbody.innerHTML = '';
  const total = alerts ? alerts.length : 0;
  setText('alert-count', `${total} ${total === 1 ? 'alerta' : 'alertas'}`);
  setText('alert-row-count', total);
  if(!alerts || alerts.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const a of alerts){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(a.product_name)}</strong> <span class="muted">(${escapeHtml(a.product_sku)})</span></td>
      <td>${escapeHtml(a.warehouse_name)}</td>
      <td class="num">${formatNumber(a.quantity_available)}</td>
      <td class="num">${formatNumber(a.min_stock_level)}</td>
      <td class="num"><span class="alert-badge">${formatNumber(a.deficit)}</span></td>
    `;
    tbody.appendChild(tr);
  }
}
