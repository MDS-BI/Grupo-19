# Contrato de Almacenamiento de Logística e Inventario

## Propósito

Además del contrato genérico de Entidad/Documento (`entity-storage.md`, heredado de `001-erp-base-module`), este módulo persiste localmente en `localStorage` las entidades de Logística e Inventario definidas en `data-model.md`, incluidas las de control de roles y permisos de HU-08. Este contrato resume las claves de almacenamiento y las operaciones de repositorio que implementan `src/storage.js` y `src/domain/*.js` (ver tareas T007, T008, T009, T012, T071 y las tareas HU-08 derivadas de `plan.md`).

La forma exacta de cada campo, sus restricciones y sus relaciones están definidas en `data-model.md`; este archivo no las repite, solo fija el contrato de persistencia y las operaciones esperadas.

## Claves de Almacenamiento

Cada entidad se persiste bajo su propia clave de `localStorage`, como una lista completa de registros:

- `logistics:product_categories`
- `logistics:products`
- `logistics:warehouses`
- `logistics:users`
- `logistics:stock`
- `logistics:inventory_transactions`
- `logistics:stock_transfers`
- `logistics:replenishment_requests`
- `logistics:roles`
- `logistics:role_permissions`
- `logistics:user_permission_overrides`

`logistics:active_user_id` se conserva como clave independiente en `src/domain/permissions.js` y no se migra a este contrato.
## Operaciones de Repositorio

### Genéricas (por entidad, implementadas en `src/storage.js`)

- `loadX()`: devuelve todos los registros almacenados de la entidad `X`.
- `saveX(records)`: persiste la lista completa de `X`.
- IDs secuenciales enteros autogenerados por entidad (`product_id`, `warehouse_id`, `stock_id`, `transaction_id`, `transfer_id`, `request_id`, `category_id`, `user_id`), consistentes con el tipo entero usado en el MER (ver "Extensiones necesarias" en `data-model.md`).

### Específicas por dominio (`src/domain/*.js`)

- **Productos** (`products.js`): `createProduct`, `updateProduct` (SKU editable incluso con movimientos asociados, revalidando unicidad — FR-088), `setProductStatus` (permite "Inactivo" con stock existente — FR-090), `findProductBySku`, `searchProducts`.
- **Bodegas** (`warehouses.js`): `createWarehouse`, `updateWarehouse`, `setWarehouseStatus`, `listActiveWarehouses` (excluye inactivas de selectores operativos — FR-063).
- **Stock** (`stock.js`, solo lectura): `getStockByProduct`, `getStockTotals`, `filterStock`; no expone operaciones de escritura (FR-051).
- **Movimientos** (`movements.js`): `registerMovement(type, productId, warehouseId, quantity, userId)` para `entrada`/`salida`/`ajuste_entrada`/`ajuste_salida`, con actualización atómica de `STOCK.quantity_available`; sin `updateMovement` ni `deleteMovement` (FR-056).
- **Transferencias** (`transfers.js`): `requestTransfer(productId, sourceWarehouseId, targetWarehouseId, quantity, createdBy)`, `confirmTransfer(transferId, confirmedBy)` (rechaza si alguna bodega está inactiva — FR-087), `cancelTransfer(transferId, cancelledBy)` (solo desde `"pendiente"`, sin modificar `STOCK` — FR-085, FR-086).
- **Alertas** (`alerts.js`, derivadas, sin persistencia propia): `listAlerts(filters)` comparando `STOCK.quantity_available` con `STOCK.min_stock_level` (FR-077, FR-084); `setMinStockLevel(stockId, value)` para la configuración de administrador (FR-076).
- **Reposiciones** (`replenishments.js`): `requestReplenishment({ productId, warehouseId, quantity, observation, createdBy, source })`, `approveRequest(requestId, approvedBy)`, `cancelRequest(requestId, cancelledBy)`, `receiveRequest(requestId, receivedBy)`, `getReplenishmentRequest(requestId)`, `listReplenishments(filters)`, `replenishmentCounts()` y `canCancelRequest(request)`. La recepción delega en `registerMovement` con `type: "entrada"` y guarda el `transaction_id` como `movement_id` (FR-093–FR-103); `loadReplenishments`, `saveReplenishments` y `nextReplenishmentId` viven en `storage.js`.
- **Roles y permisos** (`permissions.js`): `getRoles`, `getRolePermissions`, `getUserPermissionOverrides`, `getEffectivePermission`, `setRolePermission`, `setUserPermissionOverride`, `setUserRole`, `setRoleLandingModule` y `resolveLandingModule`. `getEffectivePermission` aplica `reglaDeNegocio && (excepción ?? rol ?? semilla)` y garantiza `admin:permissions` para el cargo administrador (FR-104–FR-124).
- **Semillas** (`seed.js`): `seedProductCategories()`, `seedUsers()`, `seedRoles()` y `seedRolePermissions()`, idempotentes (FR-071, FR-122).

## Expectativas de Validación

- Todas las operaciones de escritura usan los helpers compartidos de `src/storage.js`: obligatoriedad, numérico no negativo, unicidad, fecha y escape de texto/HTML antes de mostrar contenido ingresado por el usuario (FR-046, FR-092).
- Las validaciones de integridad referencial (categoría, usuario, bodega existentes) se aplican antes de persistir cualquier registro que los referencie.
- Las operaciones de movimientos y transferencias deben ser atómicas respecto a `STOCK`: si la validación de negocio falla, no debe quedar un registro parcial ni un `STOCK` modificado.
- La recepción de reposiciones crea primero el movimiento de entrada; si ese movimiento falla, la solicitud no se marca como "recibida" y no se persiste `movement_id` (FR-096, FR-097).
- Los cargos se validan contra `ROLES`; un cargo no reconocido se rechaza y se conserva el anterior (FR-105).
- `allowed` es booleano y las claves (`role_key`, `scope`, `resource_key`) y (`user_id`, `scope`, `resource_key`) son únicas.
- Las landing pages se validan contra módulos conocidos y permitidos; una configuración inválida cae a `dashboard` con aviso no bloqueante (FR-119).
- Las etiquetas de roles, módulos y secciones configuradas se escapan con el helper compartido antes de mostrarse (FR-123).
- Las operaciones de roles y permisos nunca escriben entidades operativas ni cambian el usuario activo (FR-120, FR-121).

## Expectativas de Extensibilidad

- Los campos adicionales que un módulo personalizado añada a cualquiera de estas entidades, incluidas `ROLES`, `ROLE_PERMISSIONS` y `USER_PERMISSION_OVERRIDES`, deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento, igual que en `entity-storage.md`.
- Las operaciones de dominio aquí descritas deben permanecer estables para que futuras historias (por ejemplo, control de vencimientos sobre `STOCK.expiration_date`) puedan construirse sobre ellas sin modificarlas.

## Ampliación HU-09: Contrato de Órdenes OC/OV (2026-11-23)

Esta sección añade el contrato ya implementado para las órdenes de adquisición y venta. No reemplaza las claves ni operaciones descritas arriba.

### Clave adicional

- `logistics:orders`: lista completa de registros `PURCHASE_SALES_ORDERS`.

El movimiento correspondiente se persiste en `logistics:inventory_transactions` con el campo `order_id` cuando se genera una orden. No existe una clave de contador: la secuencia se deriva de los `order_id` ya almacenados. Los correlativos no se reutilizan mientras se conserve `logistics:orders`; borrar esa clave reinicia la derivación del máximo, sin migración ni cambios en la implementación.

### Operaciones implementadas

- `loadOrders()` / `saveOrders(records)` en `src/storage.js`: lectura y escritura de la lista completa.
- `nextOrderId(prefix)` en `src/domain/orders.js`: calcula el siguiente `order_id` del prefijo (`OC` u `OV`) a partir del máximo existente, aplica `padStart(4, '0')` y rechaza colisiones.
- `createOrderForMovement(movement)` en `src/domain/orders.js`: devuelve `null` para tipos que no generan orden; reutiliza la orden existente por `transaction_id` o `order_id`; valida la orden nueva con `validateRecord('orders', order, { list: orders })` y la persiste si es válida.
- `listOrders()` en `src/domain/orders.js`: devuelve las órdenes ordenadas por `transaction_id` numérico descendente, con los valores legacy no numéricos al final, y añade en memoria `product_name` y `warehouse_name` sin persistirlos.
- `registerMovement(..., generateOrder = true)` en `src/domain/movements.js`: genera la orden dentro de la misma operación atómica; la recepción de reposiciones pasa `generateOrder: false`.

### Forma persistida

| Campo | Tipo | Origen |
|---|---|---|
| order_id | string | `nextOrderId()`; `OC-0001` o `OV-0001` |
| order_type | string | `"adquisicion"` u `"venta"` según el prefijo |
| transaction_id | int | `movement.transaction_id` |
| product_id | int | movimiento |
| warehouse_id | int | movimiento |
| quantity | int | movimiento |
| user_id | int | movimiento |
| order_date | datetime | `movement.transaction_date` |

### Expectativas de validación y atomicidad

- `order_id` y `transaction_id` son únicos; un movimiento normal no debe tener más de una orden. La orden es informativa, inmutable y no se elimina de forma independiente.
- `order_date` conserva el timestamp ISO completo de `movement.transaction_date`; el tipo `date` de la tabla base de movimientos describe el concepto de fecha, no el formato persistido.
- `LOGISTICS_SCHEMAS.orders` se invoca desde `createOrderForMovement()` antes de persistir; `LOGISTICS_SCHEMAS.movements` declara `order_id` como opcional para datos legacy.
- La escritura de `logistics:stock`, `logistics:inventory_transactions` y `logistics:orders` se ejecuta dentro de `withStorageRollback()`; si falla cualquiera, se restauran las tres claves y `errors.storage` se muestra en `error-movement-storage`.
- No se crea orden para ajustes, recepciones de reposición ni transferencias confirmadas.
- El stock se actualiza una sola vez desde `registerMovement()`; `createOrderForMovement()` solo valida y copia datos.
- No se hacen órdenes retroactivas para movimientos legacy sin `order_id`.

## Ampliación HU-10: Contrato de Consulta de Transferencias (2026-11-23)

Esta sección amplía el contrato de `STOCK_TRANSFERS` sin añadir claves ni campos persistidos.

### Operación ampliada

- `listTransfers(filters = {})` en `src/domain/transfers.js`: conserva la ordenación por `transfer_id` descendente y el enriquecimiento de nombres actual, y admite filtros opcionales `term`, `status`, `productId`, `sourceWarehouseId` y `targetWarehouseId`.
- `term` aplica coincidencia parcial e insensible a mayúsculas sobre `product_name` y `String(transfer_id)`; los IDs se normalizan con `Number(...)`.
- Los filtros se combinan con AND y los ausentes se ignoran. Sin filtros, el resultado es idéntico al contrato vigente.

### Expectativas

- La consulta no escribe `logistics:stock_transfers`, `logistics:stock`, catálogos ni movimientos.
- El dashboard puede seguir llamando a `listTransfers()` sin argumentos.
- La interfaz usa los controles `#transfer-search`, `#transfer-filter-status`, `#transfer-filter-product`, `#transfer-filter-source` y `#transfer-filter-target` dentro de `#view-transfers`.
- No se crea permiso `transfers.search`; se hereda `module:transfers` de HU-08.
- La columna `#ID` del listado muestra `transfer_id` para hacer verificable la búsqueda por identificador.

## Ampliación HU-11: Contrato de Envíos al Comprador (2026-11-23)

### Clave adicional

- `logistics:shipments`: lista completa de registros `SHIPMENTS`.

No se añade clave de contador ni clave separada para el historial: el historial se persiste embebido en cada envío. No se modifica `logistics:orders`, `logistics:inventory_transactions` ni `logistics:stock`.

### Operaciones previstas

- `loadShipments()` / `saveShipments(records)` en `src/storage.js`: lectura y escritura de la lista completa.
- `nextShipmentId()` en `src/storage.js`: secuencia entera derivada del máximo `shipment_id` existente.
- `createShipment({ orderId, carrier, trackingCode, createdBy })` en `src/domain/shipments.js`: valida OV existente, ausencia de envío previo y usuario creador válido; crea el estado inicial `en_bodega` con su evento de historial.
- `advanceShipmentStatus(shipmentId, actorUserId)` en `src/domain/shipments.js`: valida la transición siguiente, agrega el evento de historial y persiste el envío.
- `listShipments(filters)`: filtros opcionales por `orderId`, `trackingCode` (parciales e insensibles a mayúsculas) y `status` (exacto).

### Forma persistida

| Campo | Tipo | Origen o restricción |
|---|---|---|
| shipment_id | int | `nextShipmentId()`; PK entera |
| order_id | string | Orden OV existente; FK lógica única a `logistics:orders` |
| carrier | string | Empresa transportista; obligatoria y escapada al mostrarse |
| tracking_code | string | Código de seguimiento; obligatorio y escapado al mostrarse |
| status | string | `en_bodega`, `en_transito`, `en_reparto` o `entregado` |
| created_by | int | Usuario activo válido al registrar el envío |
| created_at | datetime | ISO generada al crear |
| history | array | Eventos `{ status, changed_at, changed_by }` |

### Expectativas de validación y aislamiento

- `LOGISTICS_SCHEMAS.shipments` declara `unique: [['shipment_id'], ['order_id']]`; un array plano compuesto no satisfaría la restricción 1:1.
- La validación de referencia a órdenes usa valores escalares de `order_id`; el dominio comprueba además `order_type = "venta"`.
- Solo se permite avanzar al estado inmediatamente siguiente. Se rechazan retrocesos, saltos, repeticiones y cambios desde `entregado`.
- Cada avance válido registra `changed_at` ISO y `changed_by` con el usuario activo validado contra `USERS`.
- La escritura ocurre bajo una sola clave; no se requiere `withStorageRollback()` multi-clave, pero cualquier validación fallida debe impedir la escritura.
- El dominio no llama a `registerMovement()` y no modifica `STOCK`, movimientos ni órdenes.
- No se generan envíos ni órdenes retroactivos para datos demo o movimientos legacy.

### Permisos

- Recursos nuevos: `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status`.
- La semilla habilita módulo, vista y acciones para los tres roles definidos; la matriz configurada puede restringirlos, nunca ampliar una regla de negocio (FR-124).
- No se sobrescribe una matriz ya persistida: el fallback semilla cubre las filas ausentes.
