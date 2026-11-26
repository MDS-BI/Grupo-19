import {
  loadProductCategories, loadProducts, saveProducts, loadWarehouses, saveWarehouses,
  loadUsers, loadStock, saveStock, loadMovements, saveMovements,
  loadTransfers, saveTransfers, seedLogisticsCatalogs
} from '../storage.js';

/**
 * Carga de datos de demostración para Logística e Inventario.
 *
 * Reglas de seguridad:
 * - Es opcional y se ejecuta solo desde el botón del dashboard.
 * - No borra, reemplaza ni sobrescribe registros existentes.
 * - Usa una marca de lote y claves de demostración para no duplicar registros.
 * - Genera stock, movimientos y transferencias coherentes entre sí.
 * - Conserva las reglas de negocio: cantidades no negativas, bodegas activas,
 *   estados de transferencia válidos y usuarios existentes.
 */

const DEMO_BATCH = 'logistics-demo-v1';
const DEMO_FLAG_KEY = 'logistics:demo_data_loaded_v1';

const CATEGORY = {
  electronica: 'Electrónica',
  alimentos: 'Alimentos y Bebidas',
  ferretería: 'Ferretería',
  oficina: 'Insumos de Oficina',
  limpieza: 'Limpieza y Aseo'
};

const WAREHOUSE = {
  central: 'Bodega Central Santiago',
  valparaiso: 'Bodega Valparaíso',
  concepcion: 'Bodega Concepción',
  maipu: 'Bodega Maipú (inactiva)'
};

const PRODUCT_SPECS = [
  {
    sku: 'DEMO-LAP-001', name: 'Notebook Lenovo ThinkPad E14', category: CATEGORY.electronica,
    description: 'Notebook empresarial 14", 16 GB RAM, 512 GB SSD.', salePrice: 749990, costPrice: 620000,
    unit: 'unidad', supplier: 'TecnoAndes SpA', weight: 1.6, status: 'activo'
  },
  {
    sku: 'DEMO-MOU-002', name: 'Mouse inalámbrico Logitech M240', category: CATEGORY.electronica,
    description: 'Mouse inalámbrico compacto con receptor USB.', salePrice: 15990, costPrice: 10500,
    unit: 'unidad', supplier: 'TecnoAndes SpA', weight: 0.12, status: 'activo'
  },
  {
    sku: 'DEMO-CAF-003', name: 'Café molido 1 kg', category: CATEGORY.alimentos,
    description: 'Café tostado molido, bolsa de 1 kg para consumo masivo.', salePrice: 12990, costPrice: 8500,
    unit: 'kg', supplier: 'Distribuidora Sur Ltda.', weight: 1, status: 'activo'
  },
  {
    sku: 'DEMO-ARR-004', name: 'Arroz grado 1 saco 5 kg', category: CATEGORY.alimentos,
    description: 'Arroz largo ancho grado 1, saco de 5 kg.', salePrice: 6990, costPrice: 4200,
    unit: 'saco', supplier: 'Distribuidora Sur Ltda.', weight: 5, status: 'activo'
  },
  {
    sku: 'DEMO-TAL-005', name: 'Taladro percutor 650W', category: CATEGORY.ferretería,
    description: 'Taladro percutor eléctrico con maletín y set de brocas.', salePrice: 89990, costPrice: 62000,
    unit: 'unidad', supplier: 'Ferretería Central SpA', weight: 2.4, status: 'activo'
  },
  {
    sku: 'DEMO-GUA-006', name: 'Guantes de seguridad anticorte', category: CATEGORY.ferretería,
    description: 'Guantes de protección anticorte nivel 5, talla única.', salePrice: 4990, costPrice: 2500,
    unit: 'par', supplier: 'Ferretería Central SpA', weight: 0.15, status: 'activo'
  },
  {
    sku: 'DEMO-PAP-007', name: 'Resma papel A4 500 hojas', category: CATEGORY.oficina,
    description: 'Papel blanco A4 de 75 g/m², resma de 500 hojas.', salePrice: 4990, costPrice: 3200,
    unit: 'resma', supplier: 'Papelería Andina Ltda.', weight: 2.3, status: 'activo'
  },
  {
    sku: 'DEMO-LIM-008', name: 'Detergente industrial 5 L', category: CATEGORY.limpieza,
    description: 'Detergente líquido concentrado para limpieza industrial.', salePrice: 14990, costPrice: 9800,
    unit: 'bidón', supplier: 'Química Limpia SpA', weight: 5.2, status: 'activo'
  },
  {
    sku: 'DEMO-CAB-009', name: 'Cable HDMI 2.1 de 2 metros', category: CATEGORY.electronica,
    description: 'Cable HDMI 2.1 8K, conectores reforzados, 2 metros.', salePrice: 12990, costPrice: 7500,
    unit: 'unidad', supplier: 'TecnoAndes SpA', weight: 0.18, status: 'inactivo'
  },
  {
    sku: 'DEMO-TON-010', name: 'Cartucho de tóner compatible', category: CATEGORY.oficina,
    description: 'Cartucho de tóner compatible para impresoras láser de oficina.', salePrice: 32990, costPrice: 22000,
    unit: 'unidad', supplier: 'Papelería Andina Ltda.', weight: 0.7, status: 'activo'
  }
];

const WAREHOUSE_SPECS = [
  {
    name: WAREHOUSE.central, location: 'Av. Américo Vespucio 1234, Quilicura, Santiago',
    description: 'Centro de distribución principal para la Región Metropolitana.',
    capacity: 5000, status: 'activo'
  },
  {
    name: WAREHOUSE.valparaiso, location: 'Camino La Pólvora 880, Valparaíso',
    description: 'Bodega regional para despachos de la zona costera.',
    capacity: 2500, status: 'activo'
  },
  {
    name: WAREHOUSE.concepcion, location: 'Ruta 150 Km 12, Concepción',
    description: 'Bodega de apoyo para la zona sur del país.',
    capacity: 1800, status: 'activo'
  },
  {
    name: WAREHOUSE.maipu, location: 'Av. Pajaritos 4500, Maipú, Santiago',
    description: 'Bodega antigua en proceso de cierre operativo.',
    capacity: 800, status: 'inactivo'
  }
];

const MOVEMENT_SPECS = [
  { key: 'p1-c-ent', product: 'DEMO-LAP-001', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 15, daysAgo: 21 },
  { key: 'p1-c-sal', product: 'DEMO-LAP-001', warehouse: WAREHOUSE.central, type: 'salida', quantity: 3, daysAgo: 13 },
  { key: 'p1-v-ent', product: 'DEMO-LAP-001', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 4, daysAgo: 19 },
  { key: 'p1-v-sal', product: 'DEMO-LAP-001', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 2, daysAgo: 9 },
  { key: 'p1-cc-ent', product: 'DEMO-LAP-001', warehouse: WAREHOUSE.concepcion, type: 'entrada', quantity: 2, daysAgo: 11 },

  { key: 'p2-c-ent', product: 'DEMO-MOU-002', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 60, daysAgo: 22 },
  { key: 'p2-c-sal', product: 'DEMO-MOU-002', warehouse: WAREHOUSE.central, type: 'salida', quantity: 15, daysAgo: 10 },
  { key: 'p2-v-ent', product: 'DEMO-MOU-002', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 20, daysAgo: 20 },
  { key: 'p2-v-sal', product: 'DEMO-MOU-002', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 12, daysAgo: 8 },

  { key: 'p3-c-ent', product: 'DEMO-CAF-003', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 100, daysAgo: 25 },
  { key: 'p3-c-sal', product: 'DEMO-CAF-003', warehouse: WAREHOUSE.central, type: 'salida', quantity: 20, daysAgo: 12 },
  { key: 'p3-v-ent', product: 'DEMO-CAF-003', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 30, daysAgo: 21 },
  { key: 'p3-v-sal', product: 'DEMO-CAF-003', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 15, daysAgo: 7 },
  { key: 'p3-cc-ent', product: 'DEMO-CAF-003', warehouse: WAREHOUSE.concepcion, type: 'entrada', quantity: 40, daysAgo: 15 },

  { key: 'p4-c-ent', product: 'DEMO-ARR-004', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 150, daysAgo: 26 },
  { key: 'p4-c-sal', product: 'DEMO-ARR-004', warehouse: WAREHOUSE.central, type: 'salida', quantity: 30, daysAgo: 14 },
  { key: 'p4-v-ent', product: 'DEMO-ARR-004', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 40, daysAgo: 22 },
  { key: 'p4-v-sal', product: 'DEMO-ARR-004', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 15, daysAgo: 6 },
  { key: 'p4-cc-ent', product: 'DEMO-ARR-004', warehouse: WAREHOUSE.concepcion, type: 'entrada', quantity: 60, daysAgo: 16 },

  { key: 'p5-c-ent', product: 'DEMO-TAL-005', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 10, daysAgo: 24 },
  { key: 'p5-c-sal', product: 'DEMO-TAL-005', warehouse: WAREHOUSE.central, type: 'salida', quantity: 4, daysAgo: 11 },
  { key: 'p5-v-ent', product: 'DEMO-TAL-005', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 3, daysAgo: 18 },
  { key: 'p5-v-sal', product: 'DEMO-TAL-005', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 2, daysAgo: 5 },
  { key: 'p5-cc-ent', product: 'DEMO-TAL-005', warehouse: WAREHOUSE.concepcion, type: 'entrada', quantity: 2, daysAgo: 9 },
  { key: 'p5-cc-sal', product: 'DEMO-TAL-005', warehouse: WAREHOUSE.concepcion, type: 'salida', quantity: 2, daysAgo: 3 },

  { key: 'p6-c-ent', product: 'DEMO-GUA-006', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 250, daysAgo: 23 },
  { key: 'p6-c-sal', product: 'DEMO-GUA-006', warehouse: WAREHOUSE.central, type: 'salida', quantity: 50, daysAgo: 11 },
  { key: 'p6-v-ent', product: 'DEMO-GUA-006', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 50, daysAgo: 17 },
  { key: 'p6-v-sal', product: 'DEMO-GUA-006', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 15, daysAgo: 4 },
  { key: 'p6-cc-ent', product: 'DEMO-GUA-006', warehouse: WAREHOUSE.concepcion, type: 'entrada', quantity: 100, daysAgo: 13 },
  { key: 'p6-cc-sal', product: 'DEMO-GUA-006', warehouse: WAREHOUSE.concepcion, type: 'salida', quantity: 10, daysAgo: 2 },

  { key: 'p7-c-ent', product: 'DEMO-PAP-007', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 40, daysAgo: 27 },
  { key: 'p7-c-sal', product: 'DEMO-PAP-007', warehouse: WAREHOUSE.central, type: 'salida', quantity: 16, daysAgo: 8 },
  { key: 'p7-v-ent', product: 'DEMO-PAP-007', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 60, daysAgo: 19 },
  { key: 'p7-v-sal', product: 'DEMO-PAP-007', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 10, daysAgo: 3 },
  { key: 'p7-cc-ent', product: 'DEMO-PAP-007', warehouse: WAREHOUSE.concepcion, type: 'entrada', quantity: 30, daysAgo: 10 },
  { key: 'p7-cc-sal', product: 'DEMO-PAP-007', warehouse: WAREHOUSE.concepcion, type: 'salida', quantity: 12, daysAgo: 2 },

  { key: 'p8-c-ent', product: 'DEMO-LIM-008', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 20, daysAgo: 22 },
  { key: 'p8-c-sal', product: 'DEMO-LIM-008', warehouse: WAREHOUSE.central, type: 'salida', quantity: 6, daysAgo: 7 },
  { key: 'p8-v-ent', product: 'DEMO-LIM-008', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 10, daysAgo: 14 },
  { key: 'p8-v-sal', product: 'DEMO-LIM-008', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 7, daysAgo: 3 },
  { key: 'p8-cc-ent', product: 'DEMO-LIM-008', warehouse: WAREHOUSE.concepcion, type: 'entrada', quantity: 10, daysAgo: 6 },
  { key: 'p8-cc-sal', product: 'DEMO-LIM-008', warehouse: WAREHOUSE.concepcion, type: 'salida', quantity: 4, daysAgo: 1 },

  { key: 'p9-c-ent', product: 'DEMO-CAB-009', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 5, daysAgo: 20 },
  { key: 'p9-c-sal', product: 'DEMO-CAB-009', warehouse: WAREHOUSE.central, type: 'salida', quantity: 5, daysAgo: 15 },
  { key: 'p9-v-ent', product: 'DEMO-CAB-009', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 10, daysAgo: 19 },

  { key: 'p10-c-ent', product: 'DEMO-TON-010', warehouse: WAREHOUSE.central, type: 'entrada', quantity: 12, daysAgo: 20 },
  { key: 'p10-c-sal', product: 'DEMO-TON-010', warehouse: WAREHOUSE.central, type: 'salida', quantity: 7, daysAgo: 9 },
  { key: 'p10-v-ent', product: 'DEMO-TON-010', warehouse: WAREHOUSE.valparaiso, type: 'entrada', quantity: 8, daysAgo: 15 },
  { key: 'p10-v-sal', product: 'DEMO-TON-010', warehouse: WAREHOUSE.valparaiso, type: 'salida', quantity: 6, daysAgo: 4 },
  { key: 'p10-cc-ent', product: 'DEMO-TON-010', warehouse: WAREHOUSE.concepcion, type: 'entrada', quantity: 7, daysAgo: 7 }
];

const TRANSFER_SPECS = [
  { key: 't-cafe-conf', product: 'DEMO-CAF-003', source: WAREHOUSE.central, target: WAREHOUSE.valparaiso, quantity: 10, status: 'confirmada', daysAgo: 5 },
  { key: 't-notebook-pend', product: 'DEMO-LAP-001', source: WAREHOUSE.central, target: WAREHOUSE.valparaiso, quantity: 3, status: 'pendiente', daysAgo: 1 },
  { key: 't-guantes-conf', product: 'DEMO-GUA-006', source: WAREHOUSE.valparaiso, target: WAREHOUSE.concepcion, quantity: 5, status: 'confirmada', daysAgo: 4 },
  { key: 't-arroz-pend', product: 'DEMO-ARR-004', source: WAREHOUSE.central, target: WAREHOUSE.concepcion, quantity: 20, status: 'pendiente', daysAgo: 2 },
  { key: 't-detergente-conf', product: 'DEMO-LIM-008', source: WAREHOUSE.central, target: WAREHOUSE.concepcion, quantity: 3, status: 'confirmada', daysAgo: 3 },
  { key: 't-mouse-cancel', product: 'DEMO-MOU-002', source: WAREHOUSE.central, target: WAREHOUSE.valparaiso, quantity: 5, status: 'cancelada', daysAgo: 6 },
  { key: 't-guantes-pend', product: 'DEMO-GUA-006', source: WAREHOUSE.central, target: WAREHOUSE.valparaiso, quantity: 40, status: 'pendiente', daysAgo: 1 },
  { key: 't-cable-cancel', product: 'DEMO-CAB-009', source: WAREHOUSE.valparaiso, target: WAREHOUSE.central, quantity: 2, status: 'cancelada', daysAgo: 4 }
];

const MIN_LEVELS = {
  'DEMO-LAP-001': { [WAREHOUSE.central]: 5, [WAREHOUSE.valparaiso]: 4, [WAREHOUSE.concepcion]: 2 },
  'DEMO-MOU-002': { [WAREHOUSE.central]: 10, [WAREHOUSE.valparaiso]: 10 },
  'DEMO-CAF-003': { [WAREHOUSE.central]: 20, [WAREHOUSE.valparaiso]: 20, [WAREHOUSE.concepcion]: 10 },
  'DEMO-ARR-004': { [WAREHOUSE.central]: 30, [WAREHOUSE.valparaiso]: 10, [WAREHOUSE.concepcion]: 20 },
  'DEMO-TAL-005': { [WAREHOUSE.central]: 3, [WAREHOUSE.valparaiso]: 2, [WAREHOUSE.concepcion]: 1 },
  'DEMO-GUA-006': { [WAREHOUSE.central]: 50, [WAREHOUSE.valparaiso]: 20, [WAREHOUSE.concepcion]: 40 },
  'DEMO-PAP-007': { [WAREHOUSE.central]: 30, [WAREHOUSE.valparaiso]: 15, [WAREHOUSE.concepcion]: 20 },
  'DEMO-LIM-008': { [WAREHOUSE.central]: 10, [WAREHOUSE.valparaiso]: 5, [WAREHOUSE.concepcion]: 4 },
  'DEMO-CAB-009': { [WAREHOUSE.central]: 0, [WAREHOUSE.valparaiso]: 0 },
  'DEMO-TON-010': { [WAREHOUSE.central]: 8, [WAREHOUSE.valparaiso]: 5, [WAREHOUSE.concepcion]: 3 }
};

const ENTRY_TYPES = new Set(['entrada', 'ajuste_entrada']);
const STOCK_SEPARATOR = '::';

function idFor(list, field){
  return list.reduce((max, record) => Math.max(max, Number(record[field]) || 0), 0) + 1;
}

function readFlag(){
  try { return localStorage.getItem(DEMO_FLAG_KEY) === 'true'; } catch (error) { return false; }
}

function writeFlag(){
  try { localStorage.setItem(DEMO_FLAG_KEY, 'true'); } catch (error) { /* almacenamiento no disponible */ }
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
  if(warehouseName === WAREHOUSE.central) return primary;
  return managers[1] || primary;
}

function categoryIdFor(categories, categoryName){
  return (categories.find(category => category.category_name === categoryName) || categories[0]).category_id;
}

function stockKey(productId, warehouseId){
  return `${productId}${STOCK_SEPARATOR}${warehouseId}`;
}

export function isDemoDataLoaded(){
  return readFlag();
}

export function getDemoDataSummary(){
  const demoProducts = loadProducts().filter(product => product.demo_batch === DEMO_BATCH);
  const demoWarehouses = loadWarehouses().filter(warehouse => warehouse.demo_batch === DEMO_BATCH);
  const demoStock = loadStock().filter(record => record.demo_batch === DEMO_BATCH);
  const demoMovements = loadMovements().filter(movement => movement.demo_batch === DEMO_BATCH);
  const demoTransfers = loadTransfers().filter(transfer => transfer.demo_batch === DEMO_BATCH);
  return {
    loaded: isDemoDataLoaded(),
    products: demoProducts.length,
    warehouses: demoWarehouses.length,
    stock: demoStock.length,
    movements: demoMovements.length,
    transfers: demoTransfers.length
  };
}

/**
 * Carga el set de demostración una sola vez. Si ya fue cargado, no escribe nada.
 * Devuelve un resumen con los registros agregados para informar al usuario.
 */
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

  const managedProducts = new Map();
  const managedWarehouses = new Map();
  let nextProductId = idFor(products, 'product_id');
  let nextWarehouseId = idFor(warehouses, 'warehouse_id');
  let nextStockId = idFor(stock, 'stock_id');
  let nextMovementId = idFor(movements, 'transaction_id');
  let nextTransferId = idFor(transfers, 'transfer_id');
  let addedProducts = 0;
  let addedWarehouses = 0;
  let addedStock = 0;
  let addedMovements = 0;
  let addedTransfers = 0;

  for(const spec of PRODUCT_SPECS){
    const existing = products.find(product => String(product.sku).toLowerCase() === spec.sku.toLowerCase());
    if(existing){
      if(existing.demo_batch === DEMO_BATCH) managedProducts.set(spec.sku, existing);
      continue;
    }
    const categoryId = categoryIdFor(categories, spec.category);
    const product = {
      product_id: nextProductId++,
      sku: spec.sku,
      product_name: spec.name,
      description: spec.description,
      category_id: categoryId,
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
    managedProducts.set(spec.sku, product);
    addedProducts++;
  }

  for(const spec of WAREHOUSE_SPECS){
    const existing = warehouses.find(warehouse => warehouse.name.trim().toLowerCase() === spec.name.toLowerCase());
    if(existing){
      if(existing.demo_batch === DEMO_BATCH) managedWarehouses.set(spec.name, existing);
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
    managedWarehouses.set(spec.name, warehouse);
    addedWarehouses++;
  }

  const movementPlans = MOVEMENT_SPECS.filter(plan => managedProducts.has(plan.product) && managedWarehouses.has(plan.warehouse));
  const transferPlans = TRANSFER_SPECS.filter(plan =>
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
    if(plan.status !== 'confirmada') continue;
    addBalance(plan.product, plan.source, -plan.quantity);
    addBalance(plan.product, plan.target, plan.quantity);
  }

  const existingStockByKey = new Map(stock.map(record => [stockKey(record.product_id, record.warehouse_id), record]));
  for(const [key, quantity] of balances.entries()){
    const [productSku, warehouseName] = key.split(STOCK_SEPARATOR);
    const product = managedProducts.get(productSku);
    const warehouse = managedWarehouses.get(warehouseName);
    if(!product || !warehouse) continue;
    if(existingStockByKey.has(stockKey(product.product_id, warehouse.warehouse_id))) continue;
    const minLevel = (MIN_LEVELS[productSku] && MIN_LEVELS[productSku][warehouseName]) || 0;
    const record = {
      stock_id: nextStockId++,
      product_id: product.product_id,
      warehouse_id: warehouse.warehouse_id,
      quantity_available: Math.max(0, quantity),
      min_stock_level: minLevel,
      expiration_date: undefined,
      update_date: dateDaysAgo(1),
      demo_batch: DEMO_BATCH
    };
    stock.push(record);
    existingStockByKey.set(stockKey(product.product_id, warehouse.warehouse_id), record);
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
    movements.push({
      transaction_id: nextMovementId++,
      product_id: product.product_id,
      warehouse_id: warehouse.warehouse_id,
      transaction_type: plan.type,
      quantity: plan.quantity,
      user_id: user.user_id,
      transaction_date: isoDaysAgo(plan.daysAgo),
      demo_key: plan.key,
      demo_batch: DEMO_BATCH
    });
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
    const createdBy = warehouseUser(users, plan.source);
    transfers.push({
      transfer_id: nextTransferId++,
      product_id: product.product_id,
      source_warehouse_id: source.warehouse_id,
      target_warehouse_id: target.warehouse_id,
      quantity: plan.quantity,
      status: plan.status,
      transfer_date: isoDaysAgo(plan.daysAgo),
      created_by: createdBy.user_id,
      confirmed_by: plan.status === 'confirmada' ? admin.user_id : undefined,
      cancelled_by: plan.status === 'cancelada' ? admin.user_id : undefined,
      demo_key: plan.key,
      demo_batch: DEMO_BATCH
    });
    existingTransferKeys.add(plan.key);
    addedTransfers++;
  }

  if(addedProducts > 0) saveProducts(products);
  if(addedWarehouses > 0) saveWarehouses(warehouses);
  if(addedStock > 0) saveStock(stock);
  if(addedMovements > 0) saveMovements(movements);
  if(addedTransfers > 0) saveTransfers(transfers);

  const addedSomething = addedProducts + addedWarehouses + addedStock + addedMovements + addedTransfers > 0;
  if(addedSomething) writeFlag();

  return {
    success: true,
    alreadyLoaded: false,
    added: {
      products: addedProducts,
      warehouses: addedWarehouses,
      stock: addedStock,
      movements: addedMovements,
      transfers: addedTransfers
    },
    summary: getDemoDataSummary(),
    message: addedSomething
      ? 'Datos de demostración cargados sin modificar los registros existentes.'
      : 'No se agregaron registros porque los identificadores de demostración ya existían.'
  };
}
