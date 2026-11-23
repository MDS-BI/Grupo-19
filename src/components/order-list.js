import { escapeHtml } from '../storage.js';

const TYPE_LABELS = {
  adquisicion: 'Adquisición',
  venta: 'Venta'
};

const TYPE_CLASSES = {
  adquisicion: 'type-in',
  venta: 'type-out'
};

function setCount(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

export function renderOrderList(tbody, emptyEl, orders){
  tbody.innerHTML = '';
  setCount('order-count', orders ? orders.length : 0);
  if(!orders || orders.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const order of orders){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono"><strong>${escapeHtml(order.order_id)}</strong></td>
      <td><span class="type-badge ${TYPE_CLASSES[order.order_type] || ''}">${escapeHtml(TYPE_LABELS[order.order_type] || order.order_type)}</span></td>
      <td class="mono">#${escapeHtml(order.transaction_id)}</td>
      <td><strong>${escapeHtml(order.product_name)}</strong></td>
      <td>${escapeHtml(order.warehouse_name)}</td>
      <td class="num">${Number(order.quantity).toLocaleString('es-CL')}</td>
      <td>${escapeHtml(new Date(order.order_date).toLocaleString('es-CL'))}</td>
    `;
    tbody.appendChild(tr);
  }
}
