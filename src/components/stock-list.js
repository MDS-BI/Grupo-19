import { escapeHtml } from '../storage.js';
import { isInAlert } from '../domain/alerts.js';
import { renderMinStockEditor } from './stock-config.js';

/** Distingue ausencia de registro de stock de una cantidad 0 (Casos Límite) y muestra el estado del producto/bodega. */
export function renderStockList(tbody, emptyEl, stockEntries, { onSaveMinLevel }){
  tbody.innerHTML = '';
  if(!stockEntries || stockEntries.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const s of stockEntries){
    const tr = document.createElement('tr');
    if(isInAlert(s)) tr.classList.add('stock-alert-row');
    tr.innerHTML = `
      <td>${escapeHtml(s.product_name)} <span class="muted">(${escapeHtml(s.product_sku)})</span></td>
      <td>${escapeHtml(s.warehouse_name)}</td>
      <td>${s.quantity_available}${isInAlert(s) ? ' <span class="alert-badge" title="Stock en o por debajo del mínimo">⚠ Alerta</span>' : ''}</td>
      <td><span class="status-badge ${s.product_status === 'activo' ? 'status-active' : 'status-inactive'}">${escapeHtml(s.product_status)}</span></td>
      <td><span class="status-badge ${s.warehouse_status === 'activo' ? 'status-active' : 'status-inactive'}">${escapeHtml(s.warehouse_status)}</span></td>
    `;
    const minTd = document.createElement('td');
    minTd.appendChild(renderMinStockEditor(s, onSaveMinLevel));
    tr.appendChild(minTd);
    tbody.appendChild(tr);
  }
}

export function renderStockTotal(container, total){
  container.textContent = String(total);
}
