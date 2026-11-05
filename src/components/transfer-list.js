import { escapeHtml, loadUsers } from '../storage.js';

const STATUS_LABELS = { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada' };

function userSelect(){
  const select = document.createElement('select');
  select.className = 'transfer-user-select';
  select.setAttribute('aria-label', 'Usuario que confirma o cancela la transferencia');
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Usuario --';
  select.appendChild(blank);
  loadUsers().forEach(u => {
    const opt = document.createElement('option');
    opt.value = String(u.user_id);
    opt.textContent = u.user_name;
    select.appendChild(opt);
  });
  return select;
}

export function renderTransferList(tbody, emptyEl, transfers, { onConfirm, onCancel }){
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
    if(t.status === 'pendiente'){
      const select = userSelect();
      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = 'secondary';
      confirmBtn.textContent = 'Confirmar';
      confirmBtn.addEventListener('click', () => onConfirm(t, select.value));
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'danger';
      cancelBtn.textContent = 'Cancelar';
      cancelBtn.addEventListener('click', () => onCancel(t, select.value));
      actionsTd.appendChild(select);
      actionsTd.appendChild(confirmBtn);
      actionsTd.appendChild(cancelBtn);
    } else {
      actionsTd.textContent = '—';
    }
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
