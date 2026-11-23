import { escapeHtml } from '../storage.js';

const TYPE_LABELS = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste_entrada: 'Ajuste (entrada)',
  ajuste_salida: 'Ajuste (salida)'
};

const TYPE_CLASSES = {
  entrada: 'type-in',
  salida: 'type-out',
  ajuste_entrada: 'type-adjust',
  ajuste_salida: 'type-adjust'
};

function setCount(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

/** Historial inmutable: sin acciones de edición/eliminación, solo atajos de ajuste (FR-056, FR-057). */
export function renderMovementList(tbody, emptyEl, movements, { onAdjust, canAdjust = true }){
  tbody.innerHTML = '';
  setCount('movement-count', movements ? movements.length : 0);
  if(!movements || movements.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const m of movements){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(new Date(m.transaction_date).toLocaleString('es-CL'))}</td>
      <td class="mono">${escapeHtml(m.order_id || '—')}</td>
      <td><span class="type-badge ${TYPE_CLASSES[m.transaction_type] || ''}">${escapeHtml(TYPE_LABELS[m.transaction_type] || m.transaction_type)}</span></td>
      <td><strong>${escapeHtml(m.product_name)}</strong></td>
      <td>${escapeHtml(m.warehouse_name)}</td>
      <td class="num">${Number(m.quantity).toLocaleString('es-CL')}</td>
      <td>${escapeHtml(m.user_name)}</td>
    `;
    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell';
    if(canAdjust){
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
    } else {
      actionsTd.textContent = 'Solo lectura';
      actionsTd.classList.add('muted');
    }
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
