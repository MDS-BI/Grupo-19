import { escapeHtml } from '../storage.js';

const STATUS_LABELS = { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada' };
const STATUS_CLASSES = { pendiente: 'status-pending', confirmada: 'status-confirmed', cancelada: 'status-cancelled' };

function setCount(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

export function renderTransferList(tbody, emptyEl, transfers, { onConfirm, onCancel, canConfirm = true, canCancel = true }){
  tbody.innerHTML = '';
  setCount('transfer-count', transfers ? transfers.length : 0);
  if(!transfers || transfers.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const t of transfers){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(t.product_name)}</strong></td>
      <td>${escapeHtml(t.source_warehouse_name)} <span class="route-arrow">→</span> ${escapeHtml(t.target_warehouse_name)}</td>
      <td class="num">${Number(t.quantity).toLocaleString('es-CL')}</td>
      <td><span class="status-badge ${STATUS_CLASSES[t.status] || ''}">${STATUS_LABELS[t.status] || escapeHtml(t.status)}</span></td>
      <td>${escapeHtml(t.created_by_name)}${t.confirmed_by_name ? ' / ' + escapeHtml(t.confirmed_by_name) : ''}${t.cancelled_by_name ? ' / ' + escapeHtml(t.cancelled_by_name) : ''}</td>
    `;
    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell';
    if(t.status === 'pendiente' && (canConfirm || canCancel)){
      if(canConfirm){
        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'secondary';
        confirmBtn.textContent = 'Confirmar';
        confirmBtn.addEventListener('click', () => onConfirm(t));
        actionsTd.appendChild(confirmBtn);
      }
      if(canCancel){
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'danger';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.addEventListener('click', () => onCancel(t));
        actionsTd.appendChild(cancelBtn);
      }
    } else if(t.status === 'pendiente'){
      actionsTd.textContent = 'Solo lectura';
      actionsTd.classList.add('muted');
    } else {
      actionsTd.textContent = '—';
      actionsTd.classList.add('muted');
    }
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
