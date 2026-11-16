import { escapeHtml } from '../storage.js';

const STATUS_LABELS = { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada' };

export function renderTransferList(tbody, emptyEl, transfers, { onConfirm, onCancel, canConfirm = true, canCancel = true }){
  tbody.innerHTML = '';
  if(!transfers || transfers.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const t of transfers){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(t.product_name)}</td>
      <td>${escapeHtml(t.source_warehouse_name)} &rarr; ${escapeHtml(t.target_warehouse_name)}</td>
      <td>${t.quantity}</td>
      <td><span class="status-badge">${STATUS_LABELS[t.status] || escapeHtml(t.status)}</span></td>
      <td>${escapeHtml(t.created_by_name)}${t.confirmed_by_name ? ' / ' + escapeHtml(t.confirmed_by_name) : ''}${t.cancelled_by_name ? ' / ' + escapeHtml(t.cancelled_by_name) : ''}</td>
    `;
    const actionsTd = document.createElement('td');
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
      actionsTd.className = 'muted';
    } else {
      actionsTd.textContent = '—';
    }
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
