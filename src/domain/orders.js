import { loadOrders, saveOrders, loadProducts, loadWarehouses } from '../storage.js';

const ORDER_CONFIG = {
  entrada: { prefix: 'OC', orderType: 'adquisicion' },
  salida: { prefix: 'OV', orderType: 'venta' }
};

export function orderPrefixForMovementType(type){
  return ORDER_CONFIG[type]?.prefix || null;
}

export function nextOrderId(type){
  const config = ORDER_CONFIG[type];
  if(!config) throw new Error('Este tipo de movimiento no genera órdenes');
  const orders = loadOrders();
  const pattern = new RegExp(`^${config.prefix}-(\\d+)$`);
  const max = orders.reduce((current, order) => {
    const match = pattern.exec(order?.order_id || '');
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  const id = `${config.prefix}-${String(max + 1).padStart(4, '0')}`;
  if(orders.some(order => order?.order_id === id)) throw new Error(`La orden ${id} ya existe`);
  return id;
}

export function createOrderForMovement(movement){
  const config = ORDER_CONFIG[movement.transaction_type];
  if(!config) return null;
  const orders = loadOrders();
  const existingByMovement = movement.transaction_id === undefined
    ? undefined
    : orders.find(order => Number(order.transaction_id) === Number(movement.transaction_id));
  if(existingByMovement) return existingByMovement;
  if(movement.order_id){
    const existing = orders.find(order => order.order_id === movement.order_id);
    if(existing) return existing;
  }
  const order = {
    order_id: nextOrderId(movement.transaction_type),
    order_type: config.orderType,
    transaction_id: movement.transaction_id,
    product_id: movement.product_id,
    warehouse_id: movement.warehouse_id,
    quantity: movement.quantity,
    user_id: movement.user_id,
    order_date: movement.transaction_date
  };
  orders.push(order);
  saveOrders(orders);
  return order;
}

export function listOrders(){
  const products = loadProducts();
  const warehouses = loadWarehouses();
  return loadOrders()
    .map(order => ({
      ...order,
      product_name: products.find(p => p.product_id === order.product_id)?.product_name || 'Producto desconocido',
      warehouse_name: warehouses.find(w => w.warehouse_id === order.warehouse_id)?.name || 'Bodega desconocida'
    }))
    .sort((a, b) => Number(b.transaction_id) - Number(a.transaction_id));
}
