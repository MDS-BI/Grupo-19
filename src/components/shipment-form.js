import { loadOrders, loadShipments } from '../storage.js';

function qs(id){ return document.getElementById(id); }

function populateSelect(select, items, blankLabel){
  const prev = select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = blankLabel;
  select.appendChild(blank);
  items.forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
  if(prev && [...select.options].some(o => o.value === prev)) select.value = prev;
}

export function populateShipmentOrderSelect(){
  const select = qs('shipment-order');
  if(!select) return;
  const shipped = new Set(loadShipments().map(shipment => String(shipment.order_id)));
  const options = loadOrders()
    .filter(order => order.order_type === 'venta' && !shipped.has(String(order.order_id)))
    .map(order => [String(order.order_id), `${order.order_id} · ${Number(order.quantity).toLocaleString('es-CL')} unidades`]);
  populateSelect(select, options, '-- Selecciona una orden de venta --');
}

const ERROR_FIELDS = ['orderId', 'carrier', 'trackingCode', 'createdBy'];

export function clearShipmentForm(){
  const order = qs('shipment-order');
  const carrier = qs('shipment-carrier');
  const trackingCode = qs('shipment-tracking-code');
  if(order) order.value = '';
  if(carrier) carrier.value = '';
  if(trackingCode) trackingCode.value = '';
  clearShipmentErrors();
}

export function clearShipmentErrors(){
  ERROR_FIELDS.forEach(field => {
    const el = qs(`error-shipment-${field}`);
    if(el) el.textContent = '';
  });
}

export function collectShipmentPayload(){
  return {
    orderId: qs('shipment-order').value,
    carrier: qs('shipment-carrier').value,
    trackingCode: qs('shipment-tracking-code').value
  };
}

export function showShipmentErrors(errors = {}){
  ERROR_FIELDS.forEach(field => {
    const el = qs(`error-shipment-${field}`);
    if(el) el.textContent = errors[field] || '';
  });
}
