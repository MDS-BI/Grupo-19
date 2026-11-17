import { escapeHtml } from '../storage.js';

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

function formatNumber(value){
  return Number(value || 0).toLocaleString('es-CL');
}

export function renderAlertList(tbody, emptyEl, alerts, options = {}){
  const { canCreate = false, onCreateRequest = () => {} } = options;
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
    const actionsTd = document.createElement('td');
    if(canCreate){
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary subtle btn-replenish';
      button.textContent = 'Solicitar';
      button.dataset.productId = String(a.product_id);
      button.dataset.warehouseId = String(a.warehouse_id);
      button.addEventListener('click', () => onCreateRequest(a));
      actionsTd.appendChild(button);
    }else{
      actionsTd.textContent = '—';
      actionsTd.classList.add('muted');
    }
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
