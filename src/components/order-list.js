import { escapeHtml } from '../storage.js';

const TYPE_LABELS = {
  adquisicion: 'Adquisición',
  venta: 'Venta'
};

const TYPE_CLASSES = {
  adquisicion: 'type-in',
  venta: 'type-out'
};

const STATUS_LABELS = {
  borrador: 'Borrador',
  aprobada: 'Aprobada',
  en_proceso: 'En proceso',
  completada: 'Completada',
  cancelada: 'Cancelada'
};

const STATUS_CLASSES = {
  borrador: 'status-pending',
  aprobada: 'status-confirmed',
  en_proceso: 'status-shipment-transit',
  completada: 'status-confirmed',
  cancelada: 'status-cancelled'
};

let lastRender = null;

function setCount(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

function bindStatusFilter(){
  const select = document.getElementById('order-filter-status');
  if(!select) return;
  select.onchange = () => {
    if(lastRender) renderOrderList(...lastRender);
  };
}

function visibleOrders(orders){
  const status = document.getElementById('order-filter-status')?.value;
  return (orders || []).filter(order => !status || String(order.status) === String(status));
}

export function renderOrderList(tbody, emptyEl, orders){
  bindStatusFilter();
  lastRender = [tbody, emptyEl, orders];
  const filtered = visibleOrders(orders);
  tbody.innerHTML = '';
  setCount('order-count', filtered.length);
  if(filtered.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const order of filtered){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono"><strong>${escapeHtml(order.order_id)}</strong></td>
      <td><span class="type-badge ${TYPE_CLASSES[order.order_type] || ''}">${escapeHtml(TYPE_LABELS[order.order_type] || order.order_type)}</span></td>
      <td class="mono">#${escapeHtml(order.transaction_id)}</td>
      <td><strong>${escapeHtml(order.product_name)}</strong></td>
      <td>${escapeHtml(order.warehouse_name)}</td>
      <td class="num">${Number(order.quantity).toLocaleString('es-CL')}</td>
      <td>${escapeHtml(new Date(order.order_date).toLocaleString('es-CL'))}</td>
      <td><span class="status-badge ${STATUS_CLASSES[order.status] || ''}">${escapeHtml(STATUS_LABELS[order.status] || order.status)}</span></td>
    `;
    tbody.appendChild(tr);
  }
}
