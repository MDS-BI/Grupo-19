import {
  loadEntities, loadDocuments, loadProducts, loadWarehouses, loadStock,
  loadMovements, loadTransfers, escapeHtml
} from '../storage.js';
import { listMovements } from '../domain/movements.js';
import { listTransfers } from '../domain/transfers.js';
import { listAlerts } from '../domain/alerts.js';
import { canAccessModule, canPerform, roleLabel } from '../domain/permissions.js';
import { getDemoDataSummary } from '../domain/demo-data.js';

export function recordCounts(){
  return {
    entities: loadEntities().length,
    documents: loadDocuments().length
  };
}

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

function movementTypeInfo(type){
  if(type === 'salida') return { label: 'Salida', className: 'type-out', dot: 'dot-exit', sign: '−' };
  if(type === 'ajuste_entrada') return { label: 'Ajuste +', className: 'type-adjust', dot: 'dot-adjust', sign: '+' };
  if(type === 'ajuste_salida') return { label: 'Ajuste −', className: 'type-adjust', dot: 'dot-adjust', sign: '−' };
  return { label: 'Entrada', className: '', dot: '', sign: '+' };
}

function renderQuickActions(role){
  const container = document.getElementById('dashboard-quick-actions');
  if(!container) return;
  const actions = [];
  const can = (action) => canPerform(role, action);
  const access = (moduleName) => canAccessModule(role, moduleName);

  if(can('products.manage')){
    actions.push({ label: 'Nuevo producto', hint: 'Registrar en el catálogo', module: 'products', newRecord: true });
  }
  if(can('warehouses.manage')){
    actions.push({ label: 'Nueva bodega', hint: 'Agregar una ubicación', module: 'warehouses', newRecord: true });
  }
  if(can('movements.register') || can('movements.adjust')){
    actions.push({ label: 'Registrar movimiento', hint: 'Entrada, salida o ajuste', module: 'movements' });
  }
  if(can('transfers.create')){
    actions.push({ label: 'Nueva transferencia', hint: 'Solicitar traslado entre bodegas', module: 'transfers' });
  }
  if(access('stock')){
    actions.push({ label: 'Revisar stock', hint: 'Existencias por bodega', module: 'stock' });
  }
  if(access('alerts')){
    actions.push({ label: 'Alertas de stock', hint: 'Productos en nivel mínimo o inferior', module: 'alerts' });
  }
  if(access('products')){
    actions.push({ label: 'Catálogo', hint: 'Consultar productos y estados', module: 'products' });
  }
  if(access('warehouses')){
    actions.push({ label: 'Bodegas', hint: 'Ubicaciones y responsables', module: 'warehouses' });
  }

  container.innerHTML = '';
  for(const action of actions.slice(0, 6)){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-card';
    button.dataset.goto = action.module;
    if(action.newRecord) button.dataset.newRecord = 'true';
    button.innerHTML = `<strong>${escapeHtml(action.label)}</strong><span class="muted">${escapeHtml(action.hint)}</span>`;
    container.appendChild(button);
  }

  setText('dashboard-role-pill', roleLabel(role));
}

function renderActivity(movements){
  const container = document.getElementById('dashboard-activity');
  if(!container) return;
  if(movements.length === 0){
    container.innerHTML = '<div class="mini-empty">Aún no hay movimientos registrados. Registra una entrada o utiliza los datos de demostración.</div>';
    return;
  }
  container.innerHTML = movements.slice(0, 6).map(m => {
    const info = movementTypeInfo(m.transaction_type);
    const signedQuantity = `${info.sign}${formatNumber(m.quantity)}`;
    return `
      <div class="activity-item">
        <span class="activity-dot ${info.dot}" aria-hidden="true"></span>
        <div class="activity-main">
          <div class="activity-title">${escapeHtml(m.product_name)}</div>
          <div class="activity-meta">${escapeHtml(m.warehouse_name)} · ${escapeHtml(formatDateTime(m.transaction_date))} · ${escapeHtml(m.user_name)}</div>
        </div>
        <div class="activity-side">
          <span class="type-badge ${info.className}">${escapeHtml(info.label)}</span>
          <div class="qty-pill ${info.className === 'type-out' ? 'qty-out' : info.className === 'type-adjust' ? 'qty-adjust' : ''}">${escapeHtml(signedQuantity)}</div>
        </div>
      </div>`;
  }).join('');
}

function renderLowStock(alerts){
  const container = document.getElementById('dashboard-low-stock');
  if(!container) return;
  if(alerts.length === 0){
    container.innerHTML = '<div class="mini-empty mini-empty--ok">Sin alertas de stock mínimo. Todos los productos están sobre su nivel configurado.</div>';
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
        <span class="status-badge status-pending">Pendiente</span>
        <div class="mini-meta">${formatNumber(t.quantity)} unidades</div>
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

export function renderDashboard(role = ''){
  const counts = recordCounts();
  const products = loadProducts();
  const warehouses = loadWarehouses();
  const stock = loadStock();
  const movements = loadMovements();
  const transfers = loadTransfers();
  const movementRows = listMovements();
  const transferRows = listTransfers();
  const alerts = listAlerts();
  const pendingTransfers = transferRows.filter(t => t.status === 'pendiente');
  const activeWarehouses = warehouses.filter(w => w.status === 'activo');
  const totalUnits = stock.reduce((sum, record) => sum + Number(record.quantity_available || 0), 0);

  setText('stat-entities', counts.entities);
  setText('stat-documents', counts.documents);
  setText('stat-products', products.length);
  setText('stat-warehouses', activeWarehouses.length);
  setText('stat-units', formatNumber(totalUnits));
  setText('stat-movements', movements.length);
  setText('stat-transfers', pendingTransfers.length);
  setText('stat-alerts', alerts.length);
  setText('dashboard-pending-count', pendingTransfers.length);

  const lastUpdate = document.getElementById('dashboard-last-update');
  if(lastUpdate){
    lastUpdate.textContent = `Actualizado ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  renderQuickActions(role);
  renderActivity(movementRows);
  renderLowStock(alerts);
  renderPendingTransfers(pendingTransfers);
  renderDemoStatus();
}
