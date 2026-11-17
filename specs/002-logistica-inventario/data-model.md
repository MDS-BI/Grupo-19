# Modelo de Datos: Módulo de Logística e Inventario

## Descripción general

El módulo permitirá organizar la información de productos, bodegas, usuarios y movimientos de inventario de una empresa.

Para ello, utilizaremos las entidades definidas en nuestro Modelo Entidad-Relación (MER).

## Entidad: PRODUCT_CATEGORIES

Permite clasificar los productos según su categoría.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| category_id | int | Identificador de la categoría | PK, obligatorio y único |
| category_name | string | Nombre de la categoría | Obligatorio, no vacío |

## Entidad: PRODUCTS

Almacena la información de los productos de la empresa.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| product_id | int | Identificador del producto | PK, obligatorio y único |
| sku | string | Código de referencia único del producto | Obligatorio, único, no vacío |
| product_name | string | Nombre del producto | Obligatorio, no vacío |
| description | string | Descripción del producto | Opcional |
| category_id | int | Categoría del producto | FK a PRODUCT_CATEGORIES, obligatorio |
| sale_price | decimal | Precio de venta del producto | Mayor o igual a cero |
| cost_price | decimal | Precio de costo del producto | Mayor o igual a cero |
| unit_of_measure | string | Unidad de medida del producto (p. ej., unidad, caja, kg) | Opcional |
| status | string | Estado del producto | Obligatorio; valores permitidos: "activo" o "inactivo" |
| supplier | string | Proveedor del producto | Opcional |
| unit_price | decimal | Precio unitario heredado de la plantilla base; no se usa en reglas de venta ni de costo | Mayor o igual a cero; solo compatibilidad |
| dimensions_height | string | Altura del producto | Opcional |
| dimensions_width | string | Ancho del producto | Opcional |
| dimensions_depth | string | Profundidad del producto | Opcional |
| weight | decimal | Peso del producto | Mayor o igual a cero |
| created_at | datetime | Marca de tiempo de creación del producto | Obligatorio |
| updated_at | datetime | Marca de tiempo de la última modificación | Obligatorio |
| created_by | int | Usuario que creó el producto | FK a USERS, obligatorio |
| updated_by | int | Usuario que modificó el producto por última vez | FK a USERS, obligatorio |


## Entidad: WAREHOUSES (Bodegas)

Almacena la información de las bodegas de la empresa, incluyendo su ubicación, capacidad y responsable.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| warehouse_id | int | Identificador de la bodega | PK, obligatorio y único |
| name | string | Nombre de la bodega | Obligatorio, único, no vacío |
| location | string | Ubicación de la bodega | Obligatorio |
| description | string | Descripción de la bodega | Opcional |
| capacity | int | Capacidad de almacenamiento | Mayor o igual a cero |
| status | string | Estado de la bodega | Obligatorio; valores permitidos: "activo" o "inactivo" |
| responsable_id | int | Usuario responsable principal de la bodega | FK a USERS, puede ser nulo |

## Entidad: USERS (Usuarios)

Contiene la información de los usuarios que utilizan el sistema de inventario.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| user_id | int | Identificador del usuario | PK, obligatorio y único |
| user_name | string | Nombre del usuario | Obligatorio, no vacío |
| role | string | Rol del usuario dentro del sistema | Obligatorio |
| email | string | Correo electrónico del usuario | Formato de correo válido |
| assigned_warehouse_id | int | Bodega operativa asignada al usuario | FK a WAREHOUSES, puede ser nulo |

## Relaciones entre WAREHOUSES y USERS

- `responsable_id` identifica al usuario responsable principal de la bodega; un usuario puede ser responsable principal de una o varias bodegas.
- `assigned_warehouse_id` identifica la bodega operativa asignada al usuario; una bodega puede tener varios usuarios asignados.
- `responsable_id` referencia a `USERS.user_id`.
- `assigned_warehouse_id` referencia a `WAREHOUSES.warehouse_id`.


## Entidad: STOCK (Existencias)

Registra las cantidades disponibles de cada producto en las distintas bodegas.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| stock_id | int | Identificador del registro de stock | PK, obligatorio y único |
| product_id | int | Producto almacenado | FK a PRODUCTS, forma parte de la restricción única (product_id, warehouse_id) |
| warehouse_id | int | Bodega donde se almacena | FK a WAREHOUSES, forma parte de la restricción única (product_id, warehouse_id) |
| quantity_available | int | Cantidad disponible del producto | Mayor o igual a cero |
| min_stock_level | int | Nivel mínimo configurable por producto y bodega; genera alerta cuando quantity_available es menor o igual a este valor | Mayor o igual a cero; la alerta solo aplica si es mayor que cero |
| expiration_date | date | Fecha de vencimiento del producto; reservada para control de lotes y vencimientos futuro | Opcional; sin reglas en esta iteración |
| update_date | date | Fecha de última actualización del stock | Obligatorio |

**Restricción única:** la combinación (`product_id`, `warehouse_id`) debe ser única; solo puede existir un registro de stock por producto y bodega.

## Entidad: INVENTORY_TRANSACTIONS (Movimientos de inventario)

Registra las entradas, salidas y ajustes de productos, manteniendo un historial inmutable de los movimientos realizados.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| transaction_id | int | Identificador del movimiento | PK, obligatorio y único |
| product_id | int | Producto involucrado | FK a PRODUCTS |
| warehouse_id | int | Bodega donde ocurre el movimiento | FK a WAREHOUSES |
| transaction_type | string | Tipo de movimiento | Obligatorio; valores permitidos: "entrada", "salida", "ajuste_entrada" o "ajuste_salida" |
| quantity | int | Cantidad de productos movidos | Mayor que cero |
| user_id | int | Usuario que registra el movimiento | FK a USERS |
| transaction_date | date | Fecha del movimiento | Obligatorio |

## Entidad: STOCK_TRANSFERS (Transferencias entre bodegas)

Registra los traslados de productos desde una bodega de origen hacia una bodega de destino.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| transfer_id | int | Identificador de la transferencia | PK, obligatorio y único |
| product_id | int | Producto que se transfiere | FK a PRODUCTS |
| source_warehouse_id | int | Bodega de origen | FK a WAREHOUSES |
| target_warehouse_id | int | Bodega de destino | FK a WAREHOUSES |
| quantity | int | Cantidad de productos transferidos | Mayor que cero |
| status | string | Estado de la transferencia | Obligatorio; valores permitidos: "pendiente", "confirmada" o "cancelada" |
| transfer_date | date | Fecha de la transferencia | Obligatorio |
| created_by | int | Usuario que registra la solicitud de transferencia | FK a USERS, obligatorio |
| confirmed_by | int | Usuario que confirma la recepción en la bodega de destino | FK a USERS, obligatorio cuando status = "confirmada" |
| cancelled_by | int | Usuario que cancela la transferencia | FK a USERS, obligatorio cuando status = "cancelada" |

## Entidad: REPLENISHMENT_REQUESTS (Solicitudes de reposición)

Registra solicitudes de reposición con trazabilidad de creación, autorización, recepción o cancelación.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| request_id | int | Identificador de la solicitud | PK, obligatorio y único |
| product_id | int | Producto a reponer | FK a PRODUCTS, obligatorio |
| warehouse_id | int | Bodega activa donde se repondrá | FK a WAREHOUSES, obligatorio; solo bodegas activas |
| quantity | int | Cantidad solicitada | Entera, mayor que cero |
| observation | string | Nota opcional para la bodega | Opcional, texto escapado antes de mostrarse |
| status | string | Estado de la solicitud | Obligatorio; valores permitidos: "pendiente", "aprobada", "recibida" o "cancelada" |
| request_date | date | Fecha de creación | Obligatoria, automática |
| created_by | int | Usuario que crea la solicitud | FK a USERS, obligatorio |
| approved_by | int | Usuario que aprueba | FK a USERS, obligatorio cuando status = "aprobada", "recibida" o "cancelada" desde aprobada |
| approved_at | date | Fecha de aprobación | Automática al aprobar |
| received_by | int | Usuario que recibe | FK a USERS, obligatorio cuando status = "recibida" |
| received_at | date | Fecha de recepción | Automática al recibir |
| cancelled_by | int | Usuario que cancela | FK a USERS, obligatorio cuando status = "cancelada" |
| cancelled_at | date | Fecha de cancelación | Automática al cancelar |
| movement_id | int | Movimiento de entrada generado al recibir | FK a INVENTORY_TRANSACTIONS; obligatorio cuando status = "recibida" |
| source | string | Origen de la solicitud | "manual" o "alert" |

## Relaciones entre entidades

Las entidades del módulo de Logística e Inventario se relacionan mediante claves primarias (PK) y foráneas (FK), permitiendo conectar la información de los productos, bodegas, usuarios y movimientos.

### 1. PRODUCT_CATEGORIES - PRODUCTS
Una categoría puede contener varios productos, pero cada producto pertenece a una categoría.

- Cardinalidad: 1:N
- FK: PRODUCTS.category_id

### 2. PRODUCTS - STOCK
Un producto puede tener registros de stock en distintas bodegas. Cada registro de stock corresponde a un producto.

- Cardinalidad: 1:N
- FK: STOCK.product_id

### 3. WAREHOUSES - STOCK
Una bodega puede almacenar distintos productos, y cada registro de stock pertenece a una bodega.

- Cardinalidad: 1:N
- FK: STOCK.warehouse_id

### 4. PRODUCTS - INVENTORY_TRANSACTIONS
Un producto puede tener varios movimientos de inventario, como entradas y salidas.

- Cardinalidad: 1:N
- FK: INVENTORY_TRANSACTIONS.product_id

### 5. WAREHOUSES - INVENTORY_TRANSACTIONS
En una bodega pueden realizarse varios movimientos de inventario.

- Cardinalidad: 1:N
- FK: INVENTORY_TRANSACTIONS.warehouse_id

### 6. USERS - INVENTORY_TRANSACTIONS
Un usuario puede registrar varios movimientos de inventario. Cada movimiento es registrado por un usuario.

- Cardinalidad: 1:N
- FK: INVENTORY_TRANSACTIONS.user_id

### 7. PRODUCTS - STOCK_TRANSFERS
Un producto puede aparecer en varias transferencias entre bodegas.

- Cardinalidad: 1:N
- FK: STOCK_TRANSFERS.product_id

### 8. WAREHOUSES - STOCK_TRANSFERS
Una bodega puede participar en varias transferencias, ya sea como origen o destino.

- Cardinalidad: 1:N en ambos casos
- FK: STOCK_TRANSFERS.source_warehouse_id
- FK: STOCK_TRANSFERS.target_warehouse_id

### 9. USERS - WAREHOUSES (responsable principal)
Un usuario puede ser responsable principal de varias bodegas, mientras que cada bodega puede tener un responsable principal.

- Cardinalidad: 1:N
- FK: WAREHOUSES.responsable_id

### 10. WAREHOUSES - USERS (bodega operativa)
Una bodega puede tener varios usuarios asignados operativamente, mientras que cada usuario puede estar asignado a una bodega.

- Cardinalidad: 1:N
- FK: USERS.assigned_warehouse_id

### 11. USERS - STOCK_TRANSFERS
Un usuario puede crear, confirmar y cancelar varias transferencias. Cada transferencia registra el usuario creador y, según su desenlace, el usuario que recibe o el usuario que cancela.

- Cardinalidad: 1:N
- FK: STOCK_TRANSFERS.created_by
- FK: STOCK_TRANSFERS.confirmed_by
- FK: STOCK_TRANSFERS.cancelled_by

### 12. PRODUCTS - REPLENISHMENT_REQUESTS
Un producto puede tener varias solicitudes de reposición. Cada solicitud referencia un producto existente.

- Cardinalidad: 1:N
- FK: REPLENISHMENT_REQUESTS.product_id

### 13. WAREHOUSES - REPLENISHMENT_REQUESTS
Una bodega puede recibir varias reposiciones. Solo se permiten bodegas activas al crear la solicitud.

- Cardinalidad: 1:N
- FK: REPLENISHMENT_REQUESTS.warehouse_id

### 14. USERS - REPLENISHMENT_REQUESTS
Un usuario puede crear, aprobar, recibir y cancelar varias solicitudes según su rol.

- Cardinalidad: 1:N
- FK: REPLENISHMENT_REQUESTS.created_by
- FK: REPLENISHMENT_REQUESTS.approved_by
- FK: REPLENISHMENT_REQUESTS.received_by
- FK: REPLENISHMENT_REQUESTS.cancelled_by

### 15. INVENTORY_TRANSACTIONS - REPLENISHMENT_REQUESTS
Cada solicitud recibida genera exactamente un movimiento de entrada; el movimiento conserva su propio historial inmutable.

- Cardinalidad: 1:1
- FK: REPLENISHMENT_REQUESTS.movement_id


## Reglas de validación

Para mantener la información del inventario correcta, el sistema deberá considerar las siguientes reglas:

### Productos
- Cada producto debe tener un identificador único.
- El SKU es obligatorio y único en todo el catálogo de productos.
- El nombre del producto es obligatorio.
- Los precios de venta, costo y referencia, y el peso no pueden ser negativos.
- `unit_price` se conserva solo como campo de compatibilidad con la plantilla base; las reglas de negocio usan `sale_price` y `cost_price`.
- El estado del producto solo puede ser "activo" o "inactivo".
- Cada producto debe estar asociado a una categoría existente.
- Cada producto debe registrar el usuario que lo crea y el que lo modifica, junto con las marcas de tiempo `created_at` y `updated_at`.

### Bodegas
- Cada bodega debe tener un identificador único.
- El nombre de la bodega es obligatorio y único.
- La ubicación de la bodega es obligatoria.
- La descripción es opcional.
- La capacidad no puede ser negativa.
- El estado de la bodega solo puede ser "activo" o "inactivo".
- Una bodega inactiva no puede seleccionarse para nuevos movimientos ni transferencias.

### Stock
- Las cantidades disponibles no pueden ser negativas.
- Cada registro de stock debe estar asociado a un producto y una bodega.
- `min_stock_level` se configura por producto y bodega y genera alertas cuando `quantity_available` es menor o igual al mínimo (con mínimo mayor que cero); `expiration_date` se reserva para una iteración futura de control de vencimientos.
- Para este prototipo se mantendrá un registro de stock por producto y bodega; la combinación (`product_id`, `warehouse_id`) debe ser única.

### Movimientos de inventario
- Cada movimiento debe indicar un producto, una bodega, una cantidad y un usuario responsable.
- El tipo de movimiento solo puede ser "entrada", "salida", "ajuste_entrada" o "ajuste_salida".
- La cantidad registrada debe ser mayor que cero.
- Las entradas y los ajustes de entrada aumentan el stock disponible.
- Las salidas y los ajustes de salida disminuyen el stock disponible.
- No se permitirá retirar una cantidad superior a la disponible.
- Cada movimiento deberá quedar registrado con su fecha.
- Los movimientos son inmutables: no se editan ni se eliminan; las correcciones se realizan con un nuevo movimiento de ajuste.

### Transferencias entre bodegas
- Cada transferencia debe indicar un producto, una bodega de origen y una de destino.
- Cada transferencia debe registrar el usuario que la crea (`created_by`).
- El estado de la transferencia solo puede ser "pendiente", "confirmada" o "cancelada".
- La bodega de origen debe ser distinta de la bodega de destino.
- La cantidad transferida debe ser mayor que cero.
- No se permitirá transferir más productos de los disponibles en la bodega de origen.
- Al confirmar una transferencia, se descontará la cantidad de la bodega de origen y se agregará a la de destino.
- La confirmación debe registrar el usuario que recibe (`confirmed_by`).
- Solo las transferencias pendientes pueden confirmarse; una transferencia confirmada no se modifica ni vuelve a actualizar el stock.
- Solo las transferencias pendientes pueden cancelarse; al cancelarse se registra `cancelled_by` y no se modifica `STOCK`.
- La confirmación de una transferencia pendiente se rechaza si la bodega de origen o la de destino está inactiva en ese momento.

### Reposiciones entre bodegas
- Cada solicitud debe indicar producto existente, bodega activa y cantidad entera mayor que cero.
- El estado solo puede ser "pendiente", "aprobada", "recibida" o "cancelada".
- La creación registra `created_by`, `request_date` y `source` automáticamente; no modifica `STOCK`.
- Solo las solicitudes pendientes pueden aprobarse, registrando `approved_by` y `approved_at`.
- Solo el administrador puede cancelar; pueden cancelarse solicitudes pendientes o aprobadas, registrando `cancelled_by` y `cancelled_at`.
- Solo el encargado de bodega puede recibir, y únicamente solicitudes aprobadas.
- La recepción crea un movimiento de entrada inmutable, vincula `movement_id`, marca la solicitud como "recibida" y aumenta `STOCK` una sola vez.
- No se permite aprobar, cancelar ni recibir dos veces una solicitud en estado terminal; `recibida` y `cancelada` son inmutables.

## Catálogos semilla y alcance de la iteración

- `PRODUCT_CATEGORIES` y `USERS` se precargan como catálogos semilla para que `PRODUCTS`, `WAREHOUSES`, `INVENTORY_TRANSACTIONS`, `STOCK_TRANSFERS` y `REPLENISHMENT_REQUESTS` puedan referenciarlos; no se incluyen pantallas de administración de categorías ni de usuarios en esta iteración.
- El módulo no requiere autenticación en esta iteración. El campo `USERS.role` es informativo y los usuarios que registran movimientos, transferencias y reposiciones se toman del usuario activo del ERP seleccionado en la cabecera, sin selector manual en los formularios.
- Las alertas de stock mínimo (`STOCK.min_stock_level`) forman parte de la HU-06 y se derivan al consultar `STOCK`; el control de vencimientos (`STOCK.expiration_date`) queda fuera del alcance de esta iteración.

## Compatibilidad con la plantilla ERP

El módulo se desarrollará utilizando la plantilla entregada por el profesor, que cuenta con estructuras generales llamadas Entity, Document y ModuleConfig.

### Entity
La estructura Entity permite registrar datos maestros. En nuestro módulo se utilizará como referencia para gestionar los productos, manteniendo los identificadores y campos necesarios de la plantilla. El campo `unit_price` se conserva únicamente por compatibilidad y no participa en las reglas de venta ni de costo.

### Document
La estructura Document permite registrar operaciones asociadas a una entidad. Se utilizará como referencia para los movimientos de inventario, considerando el producto, la cantidad, la fecha y el estado de la operación.

### ModuleConfig
El archivo module-config.js permite personalizar el nombre del módulo, las etiquetas, los campos adicionales y los estados de los documentos.

Lo utilizaremos para adaptar las opciones disponibles a Logística e Inventario.

### Extensiones necesarias
El control de stock por bodega, la administración de usuarios, las transferencias y las solicitudes de reposición requieren estructuras y funciones adicionales a las que ofrece la plantilla base.

El modelo ERP de referencia utiliza identificadores enteros, mientras que la plantilla trabaja con identificadores de texto. Durante la implementación se deberá mantener un tipo consistente para cada identificador y sus relaciones.

Inicialmente los datos se almacenarán mediante localStorage, manteniendo las relaciones definidas en nuestro MER.

Las estructuras Entity y Document conservarán los campos técnicos necesarios para no afectar las funcionalidades existentes.

## Referencias del Modelo Entidad-Relación (MER)

El modelo de datos se complementa con los siguientes archivos:

- [MER en código Mermaid](MER.md): contiene las entidades y relaciones del módulo en un formato que puede ser interpretado por OpenCode y SpecKit.
- [MER visual original](MER_logisica_visual.jpeg): corresponde al diagrama elaborado por nuestro grupo y se incluye como referencia visual.