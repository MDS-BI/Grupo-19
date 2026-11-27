import {
  loadProducts, loadWarehouses, loadStock,
  loadMovements, loadTransfers, escapeHtml
} from '../storage.js';
import { listMovements } from '../domain/movements.js';
import { listTransfers } from '../domain/transfers.js';
import { listAlerts } from '../domain/alerts.js';
import { listReplenishments, replenishmentCounts } from '../domain/replenishments.js';
import { getDemoDataSummary } from '../domain/demo-data.js';

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = String(value);
}

function formatNumber(value){
  return Number(value || 0).toLocaleString('es-CL');
}

function formatDateTime(iso){
  const date = new Date(iso);
  if(Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

function renderCurrentDate(){
  const el = document.getElementById('dashboard-date');
  if(!el) return;
  const now = new Date();
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  el.textContent = `${weekdays[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

function movementTypeInfo(type){
  if(type === 'salida') return { label: 'Salida', className: 'type-out', dot: 'dot-exit', sign: '−' };
  if(type === 'ajuste_entrada') return { label: 'Ajuste +', className: 'type-adjust', dot: 'dot-adjust', sign: '+' };
  if(type === 'ajuste_salida') return { label: 'Ajuste −', className: 'type-adjust', dot: 'dot-adjust', sign: '−' };
  return { label: 'Entrada', className: '', dot: '', sign: '+' };
}

function renderActivity(movements){
  const container = document.getElementById('dashboard-activity');
  if(!container) return;
  if(movements.length === 0){
    container.innerHTML = '<div class="mini-empty">Aún no hay movimientos registrados.</div>';
    return;
  }
  const rows = movements.slice(0, 6).map(m => {
    const info = movementTypeInfo(m.transaction_type);
    const signedQuantity = `${info.sign}${formatNumber(m.quantity)}`;
    const qtyClass = info.className === 'type-out' ? 'qty-out' : info.className === 'type-adjust' ? 'qty-adjust' : '';
    return `
        <tr>
          <td class="activity-time">${escapeHtml(formatDateTime(m.transaction_date))}</td>
          <td class="cell-strong">${escapeHtml(m.product_name)}</td>
          <td class="cell-muted">${escapeHtml(m.warehouse_name)}</td>
          <td><span class="type-badge ${info.className}">${escapeHtml(info.label)}</span></td>
          <td class="num"><span class="qty-pill ${qtyClass}">${escapeHtml(signedQuantity)}</span></td>
          <td class="cell-muted activity-user">${escapeHtml(m.user_name)}</td>
        </tr>`;
  }).join('');
  container.innerHTML = `
      <table class="data-table activity-table">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Producto</th>
            <th scope="col">Bodega</th>
            <th scope="col">Tipo</th>
            <th scope="col" class="num">Cantidad</th>
            <th scope="col">Usuario</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>`;
}

function renderLowStock(alerts){
  const container = document.getElementById('dashboard-low-stock');
  if(!container) return;
  if(alerts.length === 0){
    container.innerHTML = '<div class="mini-empty mini-empty--ok">No hay alertas de stock mínimo en este momento.</div>';
    return;
  }
  container.innerHTML = alerts.slice(0, 5).map(a => `
    <div class="mini-item">
      <div class="mini-main">
        <div class="mini-title">${escapeHtml(a.product_name)} <span class="muted">(${escapeHtml(a.product_sku)})</span></div>
        <div class="mini-meta">${escapeHtml(a.warehouse_name)} · mínimo ${formatNumber(a.min_stock_level)}</div>
      </div>
      <div class="mini-side">
        <span class="alert-badge">Déficit ${formatNumber(a.deficit)}</span>
        <div class="mini-meta">Disponible ${formatNumber(a.quantity_available)}</div>
      </div>
    </div>`).join('');
}

function renderPendingTransfers(transfers){
  const container = document.getElementById('dashboard-transfers');
  if(!container) return;
  if(transfers.length === 0){
    container.innerHTML = '<div class="mini-empty mini-empty--ok">No hay transferencias pendientes de revisión.</div>';
    return;
  }
  container.innerHTML = transfers.slice(0, 4).map(t => `
    <div class="mini-item">
      <div class="mini-main">
        <div class="mini-title">${escapeHtml(t.product_name)}</div>
        <div class="mini-meta">${escapeHtml(t.source_warehouse_name)} <span class="route-arrow">→</span> ${escapeHtml(t.target_warehouse_name)} · ${escapeHtml(t.created_by_name)}</div>
      </div>
      <div class="mini-side">
        <span class="status-badge status-neutral">Pendiente</span>
        <div class="mini-meta">${formatNumber(t.quantity)} unidades</div>
      </div>
    </div>`).join('');
}

function renderPendingReplenishments(requests){
  const container = document.getElementById('dashboard-replenishments');
  if(!container) return;
  if(requests.length === 0){
    container.innerHTML = '<div class="mini-empty mini-empty--ok">No hay reposiciones pendientes de autorización.</div>';
    return;
  }
  container.innerHTML = requests.slice(0, 4).map(r => `
    <div class="mini-item">
      <div class="mini-main">
        <div class="mini-title">${escapeHtml(r.product_name)}</div>
        <div class="mini-meta">${escapeHtml(r.warehouse_name)} · ${escapeHtml(r.created_by_name)}</div>
      </div>
      <div class="mini-side">
        <span class="status-badge status-neutral">Pendiente</span>
        <div class="mini-meta">${formatNumber(r.quantity)} unidades</div>
      </div>
    </div>`).join('');
}

function renderDemoStatus(){
  const status = document.getElementById('demo-data-status');
  const button = document.getElementById('load-demo-data');
  if(!status) return;
  const summary = getDemoDataSummary();
  if(!summary.loaded){
    status.classList.remove('is-success', 'is-error');
    status.textContent = 'La carga es opcional. Los datos actuales no se modifican ni se eliminan.';
    if(button) button.disabled = false;
    return;
  }
  status.classList.remove('is-error');
  status.classList.add('is-success');
  status.textContent = `Datos de demostración cargados: ${summary.products} productos, ${summary.warehouses} bodegas, ${summary.movements} movimientos y ${summary.transfers} transferencias.`;
  if(button){
    button.disabled = true;
    button.textContent = 'Datos de demostración cargados';
  }
}

export function renderDashboard(role = '', userId){
  const products = loadProducts();
  const warehouses = loadWarehouses();
  const stock = loadStock();
  const movements = loadMovements();
  const transfers = loadTransfers();
  const movementRows = listMovements();
  const transferRows = listTransfers();
  const alerts = listAlerts();
  const replenishmentRows = listReplenishments();
  const pendingReplenishments = replenishmentRows.filter(r => r.status === 'pendiente');
  const pendingTransfers = transferRows.filter(t => t.status === 'pendiente');
  const activeWarehouses = warehouses.filter(w => w.status === 'activo');
  const totalUnits = stock.reduce((sum, record) => sum + Number(record.quantity_available || 0), 0);

  setText('stat-products', products.length);
  setText('stat-warehouses', activeWarehouses.length);
  setText('stat-units', formatNumber(totalUnits));
  setText('stat-movements', movements.length);
  setText('stat-transfers', pendingTransfers.length);
  setText('stat-alerts', alerts.length);
  setText('stat-replenishment-pending', replenishmentCounts().pendiente);
  setText('dashboard-pending-count', pendingTransfers.length);

  const lastUpdate = document.getElementById('dashboard-last-update');
  if(lastUpdate){
    lastUpdate.textContent = `Actualizado ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  renderCurrentDate();
  renderActivity(movementRows);
  renderLowStock(alerts);
  renderPendingTransfers(pendingTransfers);
  renderPendingReplenishments(pendingReplenishments);
  renderDemoStatus();
}
