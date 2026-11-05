import { escapeHtml } from '../storage.js';

const TYPE_LABELS = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste_entrada: 'Ajuste (entrada)',
  ajuste_salida: 'Ajuste (salida)'
};

/** Historial inmutable: sin acciones de edición/eliminación, solo atajos de ajuste (FR-056, FR-057). */
export function renderMovementList(tbody, emptyEl, movements, { onAdjust }){
  tbody.innerHTML = '';
  if(!movements || movements.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const m of movements){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(new Date(m.transaction_date).toLocaleString('es-CL'))}</td>
      <td>${escapeHtml(TYPE_LABELS[m.transaction_type] || m.transaction_type)}</td>
      <td>${escapeHtml(m.product_name)}</td>
      <td>${escapeHtml(m.warehouse_name)}</td>
      <td>${m.quantity}</td>
      <td>${escapeHtml(m.user_name)}</td>
    `;
    const actionsTd = document.createElement('td');
    const adjustInBtn = document.createElement('button');
    adjustInBtn.type = 'button';
    adjustInBtn.className = 'secondary';
    adjustInBtn.textContent = 'Ajuste +';
    adjustInBtn.addEventListener('click', () => onAdjust(m, 'ajuste_entrada'));
    const adjustOutBtn = document.createElement('button');
    adjustOutBtn.type = 'button';
    adjustOutBtn.className = 'secondary';
    adjustOutBtn.textContent = 'Ajuste -';
    adjustOutBtn.addEventListener('click', () => onAdjust(m, 'ajuste_salida'));
    actionsTd.appendChild(adjustInBtn);
    actionsTd.appendChild(adjustOutBtn);
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
