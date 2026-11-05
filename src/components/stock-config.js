/** Acción de administrador para configurar `min_stock_level` por producto+bodega (FR-076). */
export function renderMinStockEditor(stockEntry, onSave){
  const wrap = document.createElement('div');
  wrap.className = 'min-stock-editor';
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = '1';
  input.value = stockEntry.min_stock_level ?? 0;
  input.setAttribute('aria-label', `Nivel mínimo para ${stockEntry.product_name} en ${stockEntry.warehouse_name}`);
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'secondary';
  saveBtn.textContent = 'Guardar mínimo';
  const error = document.createElement('div');
  error.className = 'error';
  error.setAttribute('aria-live', 'polite');
  saveBtn.addEventListener('click', () => {
    const result = onSave(stockEntry.stock_id, input.value);
    error.textContent = result && !result.success ? result.error : '';
  });
  wrap.appendChild(input);
  wrap.appendChild(saveBtn);
  wrap.appendChild(error);
  return wrap;
}
