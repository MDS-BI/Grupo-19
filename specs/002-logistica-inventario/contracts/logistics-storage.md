# Contrato de Almacenamiento de Logística e Inventario

## Propósito

Además del contrato genérico de Entidad/Documento (`entity-storage.md`, heredado de `001-erp-base-module`), este módulo persiste localmente en `localStorage` las siete entidades de Logística e Inventario definidas en `data-model.md`. Este contrato resume las claves de almacenamiento y las operaciones de repositorio que implementan `src/storage.js` y `src/domain/*.js` (ver tareas T007, T008, T009, T012).

La forma exacta de cada campo, sus restricciones y sus relaciones están definidas en `data-model.md`; este archivo no las repite, solo fija el contrato de persistencia y las operaciones esperadas.

## Claves de Almacenamiento

Cada entidad se persiste bajo su propia clave de `localStorage`, como una lista completa de registros:

- `logistics.product_categories`
- `logistics.products`
- `logistics.warehouses`
- `logistics.users`
- `logistics.stock`
- `logistics.inventory_transactions`
- `logistics.stock_transfers`

## Operaciones de Repositorio

### Genéricas (por entidad, implementadas en `src/storage.js`)

- `loadX()`: devuelve todos los registros almacenados de la entidad `X`.
- `saveX(records)`: persiste la lista completa de `X`.
- IDs secuenciales enteros autogenerados por entidad (`product_id`, `warehouse_id`, `stock_id`, `transaction_id`, `transfer_id`, `category_id`, `user_id`), consistentes con el tipo entero usado en el MER (ver "Extensiones necesarias" en `data-model.md`).

### Específicas por dominio (`src/domain/*.js`)

- **Productos** (`products.js`): `createProduct`, `updateProduct` (SKU editable incluso con movimientos asociados, revalidando unicidad — FR-088), `setProductStatus` (permite "Inactivo" con stock existente — FR-090), `findProductBySku`, `searchProducts`.
- **Bodegas** (`warehouses.js`): `createWarehouse`, `updateWarehouse`, `setWarehouseStatus`, `listActiveWarehouses` (excluye inactivas de selectores operativos — FR-063).
- **Stock** (`stock.js`, solo lectura): `getStockByProduct`, `getStockTotals`, `filterStock`; no expone operaciones de escritura (FR-051).
- **Movimientos** (`movements.js`): `registerMovement(type, productId, warehouseId, quantity, userId)` para `entrada`/`salida`/`ajuste_entrada`/`ajuste_salida`, con actualización atómica de `STOCK.quantity_available`; sin `updateMovement` ni `deleteMovement` (FR-056).
- **Transferencias** (`transfers.js`): `requestTransfer(productId, sourceWarehouseId, targetWarehouseId, quantity, createdBy)`, `confirmTransfer(transferId, confirmedBy)` (rechaza si alguna bodega está inactiva — FR-087), `cancelTransfer(transferId, cancelledBy)` (solo desde `"pendiente"`, sin modificar `STOCK` — FR-085, FR-086).
- **Alertas** (`alerts.js`, derivadas, sin persistencia propia): `listAlerts(filters)` comparando `STOCK.quantity_available` con `STOCK.min_stock_level` (FR-077, FR-084); `setMinStockLevel(stockId, value)` para la configuración de administrador (FR-076).
- **Semillas** (`seed.js`): `seedProductCategories()`, `seedUsers()`, idempotentes (FR-071).

## Expectativas de Validación

- Todas las operaciones de escritura usan los helpers compartidos de `src/storage.js`: obligatoriedad, numérico no negativo, unicidad, fecha y escape de texto/HTML antes de mostrar contenido ingresado por el usuario (FR-046, FR-092).
- Las validaciones de integridad referencial (categoría, usuario, bodega existentes) se aplican antes de persistir cualquier registro que los referencie.
- Las operaciones de movimientos y transferencias deben ser atómicas respecto a `STOCK`: si la validación de negocio falla, no debe quedar un registro parcial ni un `STOCK` modificado.

## Expectativas de Extensibilidad

- Los campos adicionales que un módulo personalizado añada a cualquiera de estas entidades deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento, igual que en `entity-storage.md`.
- Las operaciones de dominio aquí descritas deben permanecer estables para que futuras historias (por ejemplo, control de vencimientos sobre `STOCK.expiration_date`) puedan construirse sobre ellas sin modificarlas.
