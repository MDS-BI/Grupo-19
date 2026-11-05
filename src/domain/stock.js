import { loadStock, saveStock, loadProducts, loadWarehouses, nextStockId, isNonNegativeNumber } from '../storage.js';

export function getStockRecord(productId, warehouseId){
  return loadStock().find(s => s.product_id === productId && s.warehouse_id === warehouseId);
}

/** Crea o incrementa el stock de product+warehouse (entrada/ajuste_entrada, FR-054). */
export function upsertStockForEntry(productId, warehouseId, quantity){
  const list = loadStock();
  const idx = list.findIndex(s => s.product_id === productId && s.warehouse_id === warehouseId);
  const now = new Date().toISOString().slice(0, 10);
  if(idx === -1){
    const record = {
      stock_id: nextStockId(),
      product_id: productId,
      warehouse_id: warehouseId,
      quantity_available: quantity,
      min_stock_level: 0,
      expiration_date: undefined,
      update_date: now
    };
    list.push(record);
    saveStock(list);
    return record;
  }
  list[idx] = { ...list[idx], quantity_available: list[idx].quantity_available + quantity, update_date: now };
  saveStock(list);
  return list[idx];
}

/** Descuenta stock (salida/ajuste_salida). Rechaza sin modificar STOCK si no hay suficiente (FR-054, FR-055). */
export function deductStockForExit(productId, warehouseId, quantity){
  const list = loadStock();
  const idx = list.findIndex(s => s.product_id === productId && s.warehouse_id === warehouseId);
  if(idx === -1){
    return { ok: false, reason: 'No existe stock registrado para este producto en la bodega seleccionada.' };
  }
  if(list[idx].quantity_available < quantity){
    return { ok: false, reason: 'La cantidad solicitada supera el stock disponible.' };
  }
  const now = new Date().toISOString().slice(0, 10);
  list[idx] = { ...list[idx], quantity_available: list[idx].quantity_available - quantity, update_date: now };
  saveStock(list);
  return { ok: true, record: list[idx] };
}

/** Consulta de solo lectura con filtros por producto y bodega (FR-047, FR-049, FR-051). */
export function listStock({ productId, warehouseId } = {}){
  const products = loadProducts();
  const warehouses = loadWarehouses();
  return loadStock()
    .filter(s => (productId ? s.product_id === Number(productId) : true))
    .filter(s => (warehouseId ? s.warehouse_id === Number(warehouseId) : true))
    .map(s => {
      const product = products.find(p => p.product_id === s.product_id);
      const warehouse = warehouses.find(w => w.warehouse_id === s.warehouse_id);
      return {
        ...s,
        product_name: product ? product.product_name : 'Producto desconocido',
        product_sku: product ? product.sku : '',
        product_status: product ? product.status : 'desconocido',
        warehouse_name: warehouse ? warehouse.name : 'Bodega desconocida',
        warehouse_status: warehouse ? warehouse.status : 'desconocido'
      };
    });
}

/** Total de existencias de un producto sumando todas sus bodegas (FR-048). */
export function getProductTotal(productId){
  return loadStock()
    .filter(s => s.product_id === Number(productId))
    .reduce((sum, s) => sum + s.quantity_available, 0);
}

/** Configura el nivel mínimo de un registro de stock existente (FR-076). */
export function setMinStockLevel(stockId, value){
  if(!isNonNegativeNumber(value)){
    return { success: false, error: 'El nivel mínimo debe ser un número mayor o igual a cero.' };
  }
  const list = loadStock();
  const idx = list.findIndex(s => s.stock_id === Number(stockId));
  if(idx === -1) return { success: false, error: 'No se encontró el registro de stock.' };
  list[idx] = { ...list[idx], min_stock_level: Number(value), update_date: new Date().toISOString().slice(0, 10) };
  saveStock(list);
  return { success: true, record: list[idx] };
}
