import {
  loadProductCategories, loadProducts, saveProducts, loadWarehouses, saveWarehouses,
  loadUsers, loadStock, saveStock, loadMovements, saveMovements,
  loadTransfers, saveTransfers, loadOrders, saveOrders, loadShipments, saveShipments,
  seedLogisticsCatalogs, validateRecord
} from '../storage.js';
import { DEMO_SEED } from './demo-data.fixture.js';

const DEMO_BATCH = 'logistics-demo-v1';
const DEMO_FLAG_KEY = 'logistics:demo_data_loaded_v1';

const STOCK_SEPARATOR = '::';
const ENTRY_TYPES = new Set(['entrada', 'ajuste_entrada']);
const EFFECTIVE_TRANSFER_STATUSES = new Set(['recibida', 'confirmada']);
const MOVEMENT_TYPES = new Set(['entrada', 'salida', 'ajuste_entrada', 'ajuste_salida']);
const ORDER_STATUSES = new Set(['borrador', 'aprobada', 'en_proceso', 'completada', 'cancelada']);
const SHIPMENT_STATUSES = new Set(['preparando', 'despachado', 'en_transito', 'entregado', 'con_incidencia']);
const TRANSFER_STATUSES = new Set(['pendiente', 'en_transito', 'recibida', 'confirmada', 'cancelada']);

function idFor(list, field){
  return list.reduce((max, record) => Math.max(max, Number(record[field]) || 0), 0) + 1;
}

function readFlag(){
  try { return localStorage.getItem(DEMO_FLAG_KEY) === 'true'; } catch (error) { return false; }
}

function writeFlag(){
  try { localStorage.setItem(DEMO_FLAG_KEY, 'true'); } catch (error) { return false; }
}

function isoDaysAgo(daysAgo){
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function dateDaysAgo(daysAgo){
  return isoDaysAgo(daysAgo).slice(0, 10);
}

function userByRole(users, role){
  return users.find(user => user.role === role) || users[0];
}

function warehouseUser(users, warehouseName){
  const managers = users.filter(user => user.role === 'encargado_bodega');
  const primary = managers[0] || users[0];
  if(warehouseName === DEMO_SEED.warehouses[0].name) return primary;
  return managers[1] || primary;
}

function categoryIdFor(categories, categoryName){
  return (categories.find(category => category.category_name === categoryName) || categories[0]).category_id;
}

function stockKey(productId, warehouseId){
  return `${productId}${STOCK_SEPARATOR}${warehouseId}`;
}

function assertValid(schemaName, record, context = {}){
  const check = validateRecord(schemaName, record, context);
  if(!check.valid){
    throw new Error(`${schemaName} inválido: ${Object.values(check.errors).join(', ')}`);
  }
}

function nextOrderId(prefix, orders){
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = orders.reduce((current, order) => {
    const match = pattern.exec(order?.order_id || '');
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  let id;
  do {
    max += 1;
    id = `${prefix}-${String(max).padStart(4, '0')}`;
  } while(orders.some(order => order.order_id === id));
  return id;
}

function isDemoRecord(record){
  return record?.demo_batch === DEMO_BATCH;
}

function uniqueKeys(list, getKey){
  const seen = new Set();
  const duplicates = new Set();
  for(const item of list){
    const key = getKey(item);
    if(seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return duplicates;
}

export function isDemoDataLoaded(){
  return readFlag();
}

export function getDemoDataSummary(){
  return {
    loaded: isDemoDataLoaded(),
    products: loadProducts().filter(isDemoRecord).length,
    warehouses: loadWarehouses().filter(isDemoRecord).length,
    stock: loadStock().filter(isDemoRecord).length,
    movements: loadMovements().filter(isDemoRecord).length,
    transfers: loadTransfers().filter(isDemoRecord).length,
    orders: loadOrders().filter(isDemoRecord).length,
    shipments: loadShipments().filter(isDemoRecord).length
  };
}

export function loadDemoData(){
  seedLogisticsCatalogs();
  const users = loadUsers();
  const categories = loadProductCategories();

  if(users.length === 0){
    return { success: false, error: 'No hay usuarios de ejemplo disponibles para registrar los datos de demostración.' };
  }
  if(categories.length === 0){
    return { success: false, error: 'No hay categorías disponibles para crear los productos de demostración.' };
  }
  if(readFlag()){
    return {
      success: true,
      alreadyLoaded: true,
      summary: getDemoDataSummary(),
      message: 'Los datos de demostración ya estaban cargados. No se modificó ningún registro.'
    };
  }

  const now = new Date().toISOString();
  const admin = userByRole(users, 'administrador');
  const products = loadProducts();
  const warehouses = loadWarehouses();
  const stock = loadStock();
  const movements = loadMovements();
  const transfers = loadTransfers();
  const orders = loadOrders();
  const shipments = loadShipments();

  const managedProducts = new Map();
  const managedWarehouses = new Map();
  const productBySku = new Map(products.map(product => [String(product.sku).toLowerCase(), product]));
  const warehouseByName = new Map(warehouses.map(warehouse => [String(warehouse.name).trim().toLowerCase(), warehouse]));
  let nextProductId = idFor(products, 'product_id');
  let nextWarehouseId = idFor(warehouses, 'warehouse_id');
  let nextStockId = idFor(stock, 'stock_id');
  let nextMovementId = idFor(movements, 'transaction_id');
  let nextTransferId = idFor(transfers, 'transfer_id');
  let nextShipmentId = idFor(shipments, 'shipment_id');
  let addedProducts = 0;
  let addedWarehouses = 0;
  let addedStock = 0;
  let addedMovements = 0;
  let addedTransfers = 0;
  let addedOrders = 0;
  let addedShipments = 0;
  let assignedOrders = 0;

  for(const spec of DEMO_SEED.products){
    const key = spec.sku.toLowerCase();
    const existing = productBySku.get(key);
    if(existing){
      if(isDemoRecord(existing)) managedProducts.set(spec.sku, existing);
      continue;
    }
    const product = {
      product_id: nextProductId++,
      sku: spec.sku,
      product_name: spec.name,
      description: spec.description,
      category_id: categoryIdFor(categories, spec.category),
      sale_price: spec.salePrice,
      cost_price: spec.costPrice,
      unit_of_measure: spec.unit,
      status: spec.status,
      supplier: spec.supplier,
      unit_price: spec.salePrice,
      weight: spec.weight,
      created_at: now,
      updated_at: now,
      created_by: admin.user_id,
      updated_by: admin.user_id,
      demo_batch: DEMO_BATCH
    };
    products.push(product);
    productBySku.set(key, product);
    managedProducts.set(spec.sku, product);
    addedProducts++;
  }

  for(const spec of DEMO_SEED.warehouses){
    const key = spec.name.trim().toLowerCase();
    const existing = warehouseByName.get(key);
    if(existing){
      if(isDemoRecord(existing)) managedWarehouses.set(spec.name, existing);
      continue;
    }
    const warehouse = {
      warehouse_id: nextWarehouseId++,
      name: spec.name,
      location: spec.location,
      description: spec.description,
      capacity: spec.capacity,
      status: spec.status,
      responsable_id: warehouseUser(users, spec.name).user_id,
      demo_batch: DEMO_BATCH
    };
    warehouses.push(warehouse);
    warehouseByName.set(key, warehouse);
    managedWarehouses.set(spec.name, warehouse);
    addedWarehouses++;
  }

  const movementPlans = DEMO_SEED.movements.filter(plan =>
    managedProducts.has(plan.product) && managedWarehouses.has(plan.warehouse)
  );
  const transferPlans = DEMO_SEED.transfers.filter(plan =>
    managedProducts.has(plan.product) && managedWarehouses.has(plan.source) && managedWarehouses.has(plan.target)
  );

  const balances = new Map();
  const addBalance = (productSku, warehouseName, quantity) => {
    const key = `${productSku}${STOCK_SEPARATOR}${warehouseName}`;
    balances.set(key, (balances.get(key) || 0) + quantity);
  };

  for(const plan of movementPlans){
    addBalance(plan.product, plan.warehouse, ENTRY_TYPES.has(plan.type) ? plan.quantity : -plan.quantity);
  }
  for(const plan of transferPlans){
    if(!EFFECTIVE_TRANSFER_STATUSES.has(plan.status)) continue;
    addBalance(plan.product, plan.source, -plan.quantity);
    addBalance(plan.product, plan.target, plan.quantity);
  }

  const existingStockByKey = new Map(stock.map(record => [stockKey(record.product_id, record.warehouse_id), record]));
  for(const [key, quantity] of balances.entries()){
    const [productSku, warehouseName] = key.split(STOCK_SEPARATOR);
    const product = managedProducts.get(productSku);
    const warehouse = managedWarehouses.get(warehouseName);
    if(!product || !warehouse) continue;
    const compositeKey = stockKey(product.product_id, warehouse.warehouse_id);
    if(existingStockByKey.has(compositeKey)) continue;
    const minLevel = (DEMO_SEED.minLevels[productSku] && DEMO_SEED.minLevels[productSku][warehouseName]) || 0;
    const record = {
      stock_id: nextStockId++,
      product_id: product.product_id,
      warehouse_id: warehouse.warehouse_id,
      quantity_available: Math.max(0, quantity),
      min_stock_level: minLevel,
      update_date: dateDaysAgo(1),
      demo_batch: DEMO_BATCH,
      demo_key: `stock::${productSku}::${STOCK_SEPARATOR}${warehouseName}`
    };
    stock.push(record);
    existingStockByKey.set(compositeKey, record);
    addedStock++;
  }

  const existingMovementKeys = new Set(movements.map(movement => movement.demo_key).filter(Boolean));
  const orderedMovements = movementPlans.slice().sort((a, b) => b.daysAgo - a.daysAgo);
  for(const plan of orderedMovements){
    if(existingMovementKeys.has(plan.key)) continue;
    const product = managedProducts.get(plan.product);
    const warehouse = managedWarehouses.get(plan.warehouse);
    if(!product || !warehouse) continue;
    const user = warehouseUser(users, plan.warehouse);
    const movement = {
      transaction_id: nextMovementId++,
      product_id: product.product_id,
      warehouse_id: warehouse.warehouse_id,
      transaction_type: plan.type,
      quantity: plan.quantity,
      user_id: user.user_id,
      transaction_date: isoDaysAgo(plan.daysAgo),
      demo_key: plan.key,
      demo_batch: DEMO_BATCH
    };
    assertValid('movements', movement);
    movements.push(movement);
    existingMovementKeys.add(plan.key);
    addedMovements++;
  }

  const existingTransferKeys = new Set(transfers.map(transfer => transfer.demo_key).filter(Boolean));
  const orderedTransfers = transferPlans.slice().sort((a, b) => b.daysAgo - a.daysAgo);
  for(const plan of orderedTransfers){
    if(existingTransferKeys.has(plan.key)) continue;
    const product = managedProducts.get(plan.product);
    const source = managedWarehouses.get(plan.source);
    const target = managedWarehouses.get(plan.target);
    if(!product || !source || !target) continue;
    const transfer = {
      transfer_id: nextTransferId++,
      product_id: product.product_id,
      source_warehouse_id: source.warehouse_id,
      target_warehouse_id: target.warehouse_id,
      quantity: plan.quantity,
      status: plan.status,
      transfer_date: isoDaysAgo(plan.daysAgo),
      created_by: warehouseUser(users, plan.source).user_id,
      confirmed_by: EFFECTIVE_TRANSFER_STATUSES.has(plan.status) ? admin.user_id : undefined,
      cancelled_by: plan.status === 'cancelada' ? admin.user_id : undefined,
      demo_key: plan.key,
      demo_batch: DEMO_BATCH
    };
    assertValid('transfers', transfer);
    transfers.push(transfer);
    existingTransferKeys.add(plan.key);
    addedTransfers++;
  }

  const movementsByKey = new Map(movements.filter(isDemoRecord).map(movement => [movement.demo_key, movement]));
  const existingOrderKeys = new Set(orders.map(order => order.demo_key).filter(Boolean));
  for(const spec of DEMO_SEED.orderSpecs){
    if(existingOrderKeys.has(spec.key)) continue;
    const movement = movementsByKey.get(spec.movementKey);
    if(!movement) continue;
    const isPurchase = movement.transaction_type === 'entrada' || movement.transaction_type === 'ajuste_entrada';
    const prefix = isPurchase ? 'OC' : 'OV';
    const order = {
      order_id: nextOrderId(prefix, orders),
      order_type: isPurchase ? 'adquisicion' : 'venta',
      transaction_id: movement.transaction_id,
      product_id: movement.product_id,
      warehouse_id: movement.warehouse_id,
      quantity: movement.quantity,
      user_id: movement.user_id,
      order_date: movement.transaction_date,
      status: spec.status,
      demo_key: spec.key,
      demo_batch: DEMO_BATCH
    };
    assertValid('orders', order, { list: orders });
    orders.push(order);
    existingOrderKeys.add(spec.key);
    const seededMovement = movements.find(candidate => candidate.transaction_id === movement.transaction_id);
    if(seededMovement && !seededMovement.order_id){
      seededMovement.order_id = order.order_id;
      assignedOrders++;
    }
    addedOrders++;
  }

  const ordersByKey = new Map(orders.filter(isDemoRecord).map(order => [order.demo_key, order]));
  const existingShipmentKeys = new Set(shipments.map(shipment => shipment.demo_key).filter(Boolean));
  for(const spec of DEMO_SEED.shipmentSpecs){
    if(existingShipmentKeys.has(spec.key)) continue;
    const order = ordersByKey.get(spec.orderKey);
    if(!order) continue;
    const createdAt = isoDaysAgo(spec.daysAgo);
    const shipment = {
      shipment_id: nextShipmentId++,
      order_id: order.order_id,
      carrier: spec.carrier,
      tracking_code: spec.trackingCode,
      status: spec.status,
      created_by: admin.user_id,
      created_at: createdAt,
      history: [{ status: spec.status, changed_at: createdAt, changed_by: admin.user_id }],
      demo_key: spec.key,
      demo_batch: DEMO_BATCH
    };
    assertValid('shipments', shipment, { list: shipments });
    shipments.push(shipment);
    existingShipmentKeys.add(spec.key);
    addedShipments++;
  }

  if(addedProducts > 0) saveProducts(products);
  if(addedWarehouses > 0) saveWarehouses(warehouses);
  if(addedStock > 0) saveStock(stock);
  if(addedMovements > 0 || assignedOrders > 0) saveMovements(movements);
  if(addedTransfers > 0) saveTransfers(transfers);
  if(addedOrders > 0) saveOrders(orders);
  if(addedShipments > 0) saveShipments(shipments);

  const addedSomething = addedProducts + addedWarehouses + addedStock + addedMovements
    + addedTransfers + addedOrders + addedShipments + assignedOrders > 0;

  const issues = validateDemoSeed();
  if(issues.length > 0){
    return {
      success: false,
      error: `Los datos de demostración no son coherentes: ${issues.join('; ')}`
    };
  }
  if(addedSomething) writeFlag();

  return {
    success: true,
    alreadyLoaded: false,
    added: {
      products: addedProducts,
      warehouses: addedWarehouses,
      stock: addedStock,
      movements: addedMovements,
      transfers: addedTransfers,
      orders: addedOrders,
      shipments: addedShipments
    },
    summary: getDemoDataSummary(),
    message: addedSomething
      ? 'Datos de demostración cargados sin modificar los registros existentes.'
      : 'No se agregaron registros porque los identificadores de demostración ya existían.'
  };
}

export function validateDemoSeed(){
  const allProducts = loadProducts();
  const allWarehouses = loadWarehouses();
  const allUsers = loadUsers();
  const categories = loadProductCategories();
  const products = allProducts.filter(isDemoRecord);
  const warehouses = allWarehouses.filter(isDemoRecord);
  const stock = loadStock().filter(isDemoRecord);
  const movements = loadMovements().filter(isDemoRecord);
  const transfers = loadTransfers().filter(isDemoRecord);
  const orders = loadOrders().filter(isDemoRecord);
  const shipments = loadShipments().filter(isDemoRecord);
  const total = products.length + warehouses.length + stock.length + movements.length
    + transfers.length + orders.length + shipments.length;
  if(total === 0) return ['No hay datos de demostración cargados'];

  const issues = [];
  const productIds = new Set(products.map(product => Number(product.product_id)));
  const warehouseIds = new Set(warehouses.map(warehouse => Number(warehouse.warehouse_id)));
  const userIds = new Set(allUsers.map(user => Number(user.user_id)));
  const categoryIds = new Set(categories.map(category => Number(category.category_id)));
  const productById = new Map(products.map(product => [Number(product.product_id), product]));
  const warehouseById = new Map(warehouses.map(warehouse => [Number(warehouse.warehouse_id), warehouse]));
  const movementById = new Map(movements.map(movement => [Number(movement.transaction_id), movement]));
  const orderById = new Map(orders.map(order => [String(order.order_id), order]));
  const shippedOrderIds = new Set(shipments.map(shipment => String(shipment.order_id)));
  const categoryNames = new Set(categories.map(category => category.category_name));

  const checkDuplicates = (list, getKey, label) => {
    for(const key of uniqueKeys(list, getKey)) issues.push(`${label} duplicado: ${key}`);
  };
  checkDuplicates(products, product => String(product.sku).toLowerCase(), 'SKU de producto');
  checkDuplicates(warehouses, warehouse => String(warehouse.name).trim().toLowerCase(), 'nombre de bodega');
  checkDuplicates(movements, movement => String(movement.demo_key), 'demo_key de movimiento');
  checkDuplicates(movements, movement => Number(movement.transaction_id), 'transaction_id de movimiento');
  checkDuplicates(transfers, transfer => String(transfer.demo_key), 'demo_key de transferencia');
  checkDuplicates(orders, order => String(order.demo_key), 'demo_key de orden');
  checkDuplicates(orders, order => String(order.order_id), 'order_id');
  checkDuplicates(shipments, shipment => String(shipment.demo_key), 'demo_key de envío');
  checkDuplicates(shipments, shipment => String(shipment.order_id), 'order_id de envío');
  checkDuplicates(stock, record => stockKey(record.product_id, record.warehouse_id), 'par producto/bodega de stock');

  const warehouseIsActive = (warehouseId) => warehouseById.get(Number(warehouseId))?.status === 'activo';

  for(const product of products){
    if(!categoryIds.has(Number(product.category_id))) issues.push(`Producto ${product.sku} con categoría inexistente`);
    const expectedCategory = DEMO_SEED.products.find(spec => spec.sku.toLowerCase() === String(product.sku).toLowerCase())?.category;
    if(expectedCategory && !categoryNames.has(expectedCategory)) issues.push(`Categoría ${expectedCategory} no disponible para ${product.sku}`);
  }

  for(const warehouse of warehouses){
    if(!['activo', 'inactivo'].includes(warehouse.status)) issues.push(`Bodega ${warehouse.name} con estado inválido`);
  }

  for(const movement of movements){
    const product = productById.get(Number(movement.product_id));
    const warehouse = warehouseById.get(Number(movement.warehouse_id));
    if(!product) issues.push(`Movimiento ${movement.demo_key} con producto inexistente`);
    if(!warehouse) issues.push(`Movimiento ${movement.demo_key} con bodega inexistente`);
    else if(!warehouseIsActive(movement.warehouse_id)) issues.push(`Movimiento ${movement.demo_key} en bodega inactiva`);
    if(!MOVEMENT_TYPES.has(movement.transaction_type)) issues.push(`Movimiento ${movement.demo_key} con tipo inválido`);
    if(!(Number(movement.quantity) > 0)) issues.push(`Movimiento ${movement.demo_key} con cantidad inválida`);
    if(!userIds.has(Number(movement.user_id))) issues.push(`Movimiento ${movement.demo_key} con usuario inexistente`);
  }

  for(const transfer of transfers){
    if(!productIds.has(Number(transfer.product_id))) issues.push(`Transferencia ${transfer.demo_key} con producto inexistente`);
    if(!warehouseIsActive(transfer.source_warehouse_id) || !warehouseIsActive(transfer.target_warehouse_id)){
      issues.push(`Transferencia ${transfer.demo_key} con bodega inexistente o inactiva`);
    }
    if(String(transfer.source_warehouse_id) === String(transfer.target_warehouse_id)){
      issues.push(`Transferencia ${transfer.demo_key} con origen y destino iguales`);
    }
    if(!TRANSFER_STATUSES.has(transfer.status)) issues.push(`Transferencia ${transfer.demo_key} con estado inválido`);
    if(!(Number(transfer.quantity) > 0)) issues.push(`Transferencia ${transfer.demo_key} con cantidad inválida`);
    if(!userIds.has(Number(transfer.created_by))) issues.push(`Transferencia ${transfer.demo_key} con usuario inexistente`);
    if(transfer.status === 'cancelada' && transfer.confirmed_by){
      issues.push(`Transferencia cancelada ${transfer.demo_key} con confirmación`);
    }
    if(EFFECTIVE_TRANSFER_STATUSES.has(transfer.status) && !transfer.confirmed_by){
      issues.push(`Transferencia efectiva ${transfer.demo_key} sin confirmación`);
    }
    if(movements.some(movement => movement.demo_key === transfer.demo_key || Number(movement.transfer_id) === Number(transfer.transfer_id))){
      issues.push(`Transferencia ${transfer.demo_key} generó movimientos de stock`);
    }
  }

  const balances = new Map();
  const addBalance = (productId, warehouseId, quantity) => {
    const key = stockKey(productId, warehouseId);
    balances.set(key, (balances.get(key) || 0) + quantity);
  };
  for(const movement of movements){
    if(!productIds.has(Number(movement.product_id)) || !warehouseIds.has(Number(movement.warehouse_id))) continue;
    addBalance(movement.product_id, movement.warehouse_id, ENTRY_TYPES.has(movement.transaction_type) ? Number(movement.quantity) : -Number(movement.quantity));
  }
  for(const transfer of transfers){
    if(!EFFECTIVE_TRANSFER_STATUSES.has(transfer.status)) continue;
    if(!productIds.has(Number(transfer.product_id))) continue;
    addBalance(transfer.product_id, transfer.source_warehouse_id, -Number(transfer.quantity));
    addBalance(transfer.product_id, transfer.target_warehouse_id, Number(transfer.quantity));
  }

  for(const record of stock){
    if(!productIds.has(Number(record.product_id)) || !warehouseIds.has(Number(record.warehouse_id))){
      issues.push(`Stock ${record.demo_key} con referencia inexistente`);
    }
    if(!(Number(record.quantity_available) >= 0)) issues.push(`Stock ${record.demo_key} con cantidad negativa`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(record.update_date || ''))){
      issues.push(`Stock ${record.demo_key} con update_date inválida`);
    }
  }
  for(const [key, balance] of balances.entries()){
    const record = stock.find(item => stockKey(item.product_id, item.warehouse_id) === key);
    if(!record){
      issues.push(`Falta registro de stock para ${key}`);
      continue;
    }
    if(Number(record.quantity_available) !== Math.max(0, balance)){
      issues.push(`Stock ${record.demo_key} no coincide con el saldo derivado`);
    }
  }
  for(const record of stock){
    if(!balances.has(stockKey(record.product_id, record.warehouse_id))){
      issues.push(`Stock ${record.demo_key} sin movimientos que lo justifiquen`);
    }
  }

  for(const order of orders){
    if(!productIds.has(Number(order.product_id)) || !warehouseIds.has(Number(order.warehouse_id))){
      issues.push(`Orden ${order.order_id} con referencia inexistente`);
    }
    if(!userIds.has(Number(order.user_id))) issues.push(`Orden ${order.order_id} con usuario inexistente`);
    const movement = movementById.get(Number(order.transaction_id));
    if(!movement) issues.push(`Orden ${order.order_id} sin movimiento asociado`);
    else if(Number(movement.product_id) !== Number(order.product_id) || Number(movement.warehouse_id) !== Number(order.warehouse_id)){
      issues.push(`Orden ${order.order_id} no coincide con su movimiento`);
    }
    const expectedPrefix = order.order_type === 'adquisicion' ? 'OC' : 'OV';
    if(!String(order.order_id).startsWith(`${expectedPrefix}-`)){
      issues.push(`Orden ${order.order_id} con prefijo inconsistente`);
    }
    if(!ORDER_STATUSES.has(order.status)) issues.push(`Orden ${order.order_id} con estado inválido`);
    if(['borrador', 'cancelada'].includes(order.status) && shippedOrderIds.has(String(order.order_id))){
      issues.push(`Orden ${order.order_id} en ${order.status} con envío asociado`);
    }
  }

  for(const shipment of shipments){
    const order = orderById.get(String(shipment.order_id));
    if(!order){
      issues.push(`Envío ${shipment.demo_key} con orden inexistente`);
      continue;
    }
    if(order.order_type !== 'venta') issues.push(`Envío ${shipment.demo_key} asociado a una orden que no es de venta`);
    if(!SHIPMENT_STATUSES.has(shipment.status)) issues.push(`Envío ${shipment.demo_key} con estado inválido`);
    if(!String(shipment.carrier || '').trim() || !String(shipment.tracking_code || '').trim()){
      issues.push(`Envío ${shipment.demo_key} sin transportista o seguimiento`);
    }
    if(!userIds.has(Number(shipment.created_by))) issues.push(`Envío ${shipment.demo_key} con usuario inexistente`);
    const firstEvent = Array.isArray(shipment.history) ? shipment.history[0] : undefined;
    if(!firstEvent || firstEvent.status !== shipment.status || !firstEvent.changed_at || !userIds.has(Number(firstEvent.changed_by))){
      issues.push(`Envío ${shipment.demo_key} con historial inicial inválido`);
    }
    if(shipment.status === 'entregado' && !['aprobada', 'en_proceso', 'completada'].includes(order.status)){
      issues.push(`Envío entregado ${shipment.demo_key} incompatible con orden ${order.status}`);
    }
    if(shipment.status === 'con_incidencia' && !['aprobada', 'en_proceso'].includes(order.status)){
      issues.push(`Envío con incidencia ${shipment.demo_key} incompatible con orden ${order.status}`);
    }
    if(['borrador', 'cancelada'].includes(order.status)){
      issues.push(`Envío ${shipment.demo_key} asociado a una orden ${order.status}`);
    }
  }

  const presentOrderStatuses = new Set(orders.map(order => order.status));
  for(const status of ORDER_STATUSES){
    if(!presentOrderStatuses.has(status)) issues.push(`Falta orden en estado ${status}`);
  }
  const presentShipmentStatuses = new Set(shipments.map(shipment => shipment.status));
  for(const status of SHIPMENT_STATUSES){
    if(!presentShipmentStatuses.has(status)) issues.push(`Falta envío en estado ${status}`);
  }
  const presentTransferStatuses = new Set(transfers.map(transfer => transfer.status));
  for(const status of TRANSFER_STATUSES){
    if(!presentTransferStatuses.has(status)) issues.push(`Falta transferencia en estado ${status}`);
  }
  if(!stock.some(record => Number(record.quantity_available) === 0 && warehouseIsActive(record.warehouse_id))){
    issues.push('No hay stock en cero en una bodega activa');
  }
  if(!orders.some(order => !shippedOrderIds.has(String(order.order_id)))){
    issues.push('No hay órdenes sin envío');
  }

  return issues;
}
