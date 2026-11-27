import { escapeHtml, loadUsers } from '../storage.js';

const STATUS_LABELS = {
  preparando: 'Preparando',
  despachado: 'Despachado',
  en_transito: 'En tránsito',
  entregado: 'Entregado',
  con_incidencia: 'Con incidencia',
  en_bodega: 'En bodega',
  en_reparto: 'En reparto'
};
const STATUS_CLASSES = {
  preparando: 'status-shipment-warehouse',
  despachado: 'status-shipment-delivery',
  en_transito: 'status-shipment-transit',
  entregado: 'status-shipment-delivered',
  con_incidencia: 'status-cancelled',
  en_bodega: 'status-shipment-warehouse',
  en_reparto: 'status-shipment-delivery'
};

function setCount(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

function userName(userId){
  const user = loadUsers().find(u => Number(u.user_id) === Number(userId));
  return user ? user.user_name : `Usuario ${userId ?? 'desconocido'}`;
}

function statusLabel(status){
  return STATUS_LABELS[status] || escapeHtml(status);
}

function lastActor(shipment){
  const history = Array.isArray(shipment.history) ? shipment.history : [];
  return history.length > 0 ? history[history.length - 1].changed_by : shipment.created_by;
}

function historyHtml(history){
  if(!Array.isArray(history) || history.length === 0) return '<span class="muted">Sin historial</span>';
  return history.map(event => `
    <div class="shipment-history-item">
      <span class="status-badge ${STATUS_CLASSES[event.status] || ''}">${statusLabel(event.status)}</span>
      <span class="muted">${escapeHtml(userName(event.changed_by))} · ${escapeHtml(event.changed_at)}</span>
    </div>
  `).join('');
}

export function renderShipmentList(tbody, emptyEl, shipments, { onAdvance, canUpdateStatus = true } = {}){
  tbody.innerHTML = '';
  setCount('shipment-count', shipments ? shipments.length : 0);
  if(!shipments || shipments.length === 0){
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  for(const shipment of shipments){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(shipment.order_id)}</strong></td>
      <td>${escapeHtml(shipment.carrier)}</td>
      <td><span class="mono">${escapeHtml(shipment.tracking_code)}</span></td>
      <td><span class="status-badge ${STATUS_CLASSES[shipment.status] || ''}">${statusLabel(shipment.status)}</span></td>
      <td><div class="shipment-history">${historyHtml(shipment.history)}</div></td>
      <td>
        <div>Registrado por ${escapeHtml(userName(shipment.created_by))}</div>
        <div class="muted">Último avance: ${escapeHtml(userName(lastActor(shipment)))}</div>
      </td>
    `;
    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell';
    if(canUpdateStatus && shipment.status !== 'entregado' && shipment.status !== 'con_incidencia'){
      const advanceBtn = document.createElement('button');
      advanceBtn.type = 'button';
      advanceBtn.className = 'secondary';
      advanceBtn.textContent = 'Avanzar';
      advanceBtn.addEventListener('click', () => onAdvance(shipment));
      actionsTd.appendChild(advanceBtn);
    } else {
      actionsTd.textContent = ['entregado', 'con_incidencia'].includes(shipment.status) ? statusLabel(shipment.status) : 'Solo lectura';
      actionsTd.classList.add('muted');
    }
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  }
}
