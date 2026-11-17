import { escapeHtml } from '../storage.js';
import { canCancelRequest } from '../domain/replenishments.js';

const STATUS_LABELS = { pendiente: 'Pendiente', aprobada: 'Aprobada', recibida: 'Recibida', cancelada: 'Cancelada' };
const STATUS_CLASSES = { pendiente: 'status-pending', aprobada: 'status-approved', recibida: 'status-received', cancelada: 'status-cancelled' };

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

function formatNumber(value){
  return Number(value || 0).toLocaleString('es-CL');
}

function formatDate(iso){
  if(!iso) return '—';
  const date = new Date(iso);
  if(Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CL');
}

function addButton(parent, label, className, onClick){
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', onClick);
  parent.appendChild(button);
}

export function renderReplenishmentCounts(counts){
  setText('replenishment-count-pending', counts.pendiente);
  setText('replenishment-count-approved', counts.aprobada);
  setText('replenishment-count-received', counts.recibida);
}

export function renderReplenishmentList(tbody, emptyEl, requests, options = {}){
  const {
    canApprove = false, canCancel = false, canReceive = false,
    onApprove = () => {}, onCancel = () => {}, onReceive = () => {}
  } = options;
  tbody.innerHTML = '';
  setText('replenishment-row-count', requests ? requests.length : 0);
  if(!requests || requests.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const request of requests){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(request.product_name)}</strong> <span class="muted">(${escapeHtml(request.product_sku)})</span></td>
      <td>${escapeHtml(request.warehouse_name)}</td>
      <td class="num">${formatNumber(request.quantity)}</td>
      <td><span class="status-badge ${STATUS_CLASSES[request.status] || ''}">${STATUS_LABELS[request.status] || escapeHtml(request.status)}</span></td>
      <td>${request.observation ? escapeHtml(request.observation) : '<span class="muted">—</span>'}</td>
      <td>
        <div>${escapeHtml(request.created_by_name)} · ${escapeHtml(formatDate(request.request_date))}</div>
        ${request.approved_by_name ? `<div class="muted">Aprobada por ${escapeHtml(request.approved_by_name)}</div>` : ''}
        ${request.received_by_name ? `<div class="muted">Recibida por ${escapeHtml(request.received_by_name)}</div>` : ''}
        ${request.cancelled_by_name ? `<div class="muted">Cancelada por ${escapeHtml(request.cancelled_by_name)}</div>` : ''}
      </td>
      <td>${request.movement_id ? `<span class="mono">#${escapeHtml(request.movement_id)}</span>` : '<span class="muted">—</span>'}</td>
    `;
    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell';
    if(canApprove && request.status === 'pendiente') addButton(actionsTd, 'Aprobar', 'secondary', () => onApprove(request));
    if(canReceive && request.status === 'aprobada') addButton(actionsTd, 'Recibir', 'primary', () => onReceive(request));
    if(canCancel && canCancelRequest(request)) addButton(actionsTd, 'Cancelar', 'danger', () => onCancel(request));
    if(!actionsTd.hasChildNodes()){
      actionsTd.textContent = '—';
      actionsTd.classList.add('muted');
    }
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
