import { listStock, setMinStockLevel as setStockMinLevel } from './stock.js';

/**
 * Alertas derivadas de STOCK (sin persistencia propia): quantity_available <= min_stock_level
 * y min_stock_level > 0 (umbral inclusivo, FR-077, FR-084).
 */
export function listAlerts({ productId, warehouseId } = {}){
  return listStock({ productId, warehouseId })
    .filter(s => s.min_stock_level > 0 && s.quantity_available <= s.min_stock_level)
    .map(s => ({ ...s, deficit: s.min_stock_level - s.quantity_available }));
}

export function isInAlert(stockEntry){
  return Boolean(stockEntry && stockEntry.min_stock_level > 0 && stockEntry.quantity_available <= stockEntry.min_stock_level);
}

export const setMinStockLevel = setStockMinLevel;
