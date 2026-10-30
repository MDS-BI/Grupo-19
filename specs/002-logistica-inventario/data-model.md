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
| product_name | string | Nombre del producto | Obligatorio, no vacío |
| description | string | Descripción del producto | Opcional |
| unit_price | decimal | Precio unitario | Mayor o igual a cero |
| category_id | int | Categoría del producto | FK a PRODUCT_CATEGORIES, obligatorio |
| dimensions_height | string | Altura del producto | Opcional |
| dimensions_width | string | Ancho del producto | Opcional |
| dimensions_depth | string | Profundidad del producto | Opcional |
| weight | decimal | Peso del producto | Mayor o igual a cero |


## Entidad: WAREHOUSES (Bodegas)

Almacena la información de las bodegas de la empresa, incluyendo su ubicación, capacidad y responsable.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| warehouse_id | int | Identificador de la bodega | PK, obligatorio y único |
| name | string | Nombre de la bodega | Obligatorio, no vacío |
| location | string | Ubicación de la bodega | Obligatorio |
| capacity | int | Capacidad de almacenamiento | Mayor o igual a cero |
| responsable_id | int | Usuario responsable de la bodega | FK a USERS, puede ser nulo |

## Entidad: USERS (Usuarios)

Contiene la información de los usuarios que utilizan el sistema de inventario.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| user_id | int | Identificador del usuario | PK, obligatorio y único |
| user_name | string | Nombre del usuario | Obligatorio, no vacío |
| role | string | Rol del usuario dentro del sistema | Obligatorio |
| email | string | Correo electrónico del usuario | Formato de correo válido |
| assigned_warehouse_id | int | Bodega asignada al usuario | FK a WAREHOUSES, puede ser nulo |

## Relaciones entre WAREHOUSES y USERS

- Un usuario puede ser responsable de una o varias bodegas.
- Una bodega puede tener varios usuarios asignados.
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
| min_stock_level | int | Cantidad mínima de stock permitida | Mayor o igual a cero |
| expiration_date | date | Fecha de vencimiento del producto | Opcional |
| update_date | date | Fecha de última actualización del stock | Obligatorio |

**Restricción única:** la combinación (`product_id`, `warehouse_id`) debe ser única; solo puede existir un registro de stock por producto y bodega.

## Entidad: INVENTORY_TRANSACTIONS (Movimientos de inventario)

Registra las entradas y salidas de productos, manteniendo un historial de los movimientos realizados.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| transaction_id | int | Identificador del movimiento | PK, obligatorio y único |
| product_id | int | Producto involucrado | FK a PRODUCTS |
| warehouse_id | int | Bodega donde ocurre el movimiento | FK a WAREHOUSES |
| transaction_type | string | Tipo de movimiento | Obligatorio; valores permitidos: "entrada" o "salida" |
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

### 9. USERS - WAREHOUSES
Un usuario puede ser responsable de varias bodegas, mientras que cada bodega puede tener un responsable.

- Cardinalidad: 1:N
- FK: WAREHOUSES.responsable_id

### 10. WAREHOUSES - USERS
Una bodega puede tener varios usuarios asignados, mientras que cada usuario puede estar asignado a una bodega.

- Cardinalidad: 1:N
- FK: USERS.assigned_warehouse_id


## Reglas de validación

Para mantener la información del inventario correcta, el sistema deberá considerar las siguientes reglas:

### Productos
- Cada producto debe tener un identificador único.
- El nombre del producto es obligatorio.
- El precio y el peso no pueden ser negativos.
- Cada producto debe estar asociado a una categoría existente.

### Stock
- Las cantidades disponibles no pueden ser negativas.
- Cada registro de stock debe estar asociado a un producto y una bodega.
- El sistema debe identificar los productos cuyo stock disponible sea menor al mínimo establecido.
- Para este prototipo se mantendrá un registro de stock por producto y bodega; la combinación (`product_id`, `warehouse_id`) debe ser única.

### Movimientos de inventario
- Cada movimiento debe indicar un producto, una bodega, una cantidad y un usuario responsable.
- El tipo de movimiento solo puede ser "entrada" o "salida".
- La cantidad registrada debe ser mayor que cero.
- Las entradas aumentan el stock disponible.
- Las salidas disminuyen el stock disponible.
- No se permitirá retirar una cantidad superior a la disponible.
- Cada movimiento deberá quedar registrado con su fecha.

### Transferencias entre bodegas
- Cada transferencia debe indicar un producto, una bodega de origen y una de destino.
- El estado de la transferencia solo puede ser "pendiente", "confirmada" o "cancelada".
- La bodega de origen debe ser distinta de la bodega de destino.
- La cantidad transferida debe ser mayor que cero.
- No se permitirá transferir más productos de los disponibles en la bodega de origen.
- Al confirmar una transferencia, se descontará la cantidad de la bodega de origen y se agregará a la de destino.
- Una transferencia confirmada no debe volver a actualizar el stock.

## Compatibilidad con la plantilla ERP

El módulo se desarrollará utilizando la plantilla entregada por el profesor, que cuenta con estructuras generales llamadas Entity, Document y ModuleConfig.

### Entity
La estructura Entity permite registrar datos maestros. En nuestro módulo se utilizará como referencia para gestionar los productos, manteniendo los identificadores y campos necesarios de la plantilla.

### Document
La estructura Document permite registrar operaciones asociadas a una entidad. Se utilizará como referencia para los movimientos de inventario, considerando el producto, la cantidad, la fecha y el estado de la operación.

### ModuleConfig
El archivo module-config.js permite personalizar el nombre del módulo, las etiquetas, los campos adicionales y los estados de los documentos.

Lo utilizaremos para adaptar las opciones disponibles a Logística e Inventario.

### Extensiones necesarias
El control de stock por bodega, la administración de usuarios y las transferencias requieren estructuras y funciones adicionales a las que ofrece la plantilla base.

El modelo ERP de referencia utiliza identificadores enteros, mientras que la plantilla trabaja con identificadores de texto. Durante la implementación se deberá mantener un tipo consistente para cada identificador y sus relaciones.

Inicialmente los datos se almacenarán mediante localStorage, manteniendo las relaciones definidas en nuestro MER.

Las estructuras Entity y Document conservarán los campos técnicos necesarios para no afectar las funcionalidades existentes.

## Referencias del Modelo Entidad-Relación (MER)

El modelo de datos se complementa con los siguientes archivos:

- [MER en código Mermaid](MER.md): contiene las entidades y relaciones del módulo en un formato que puede ser interpretado por OpenCode y SpecKit.
- [MER visual original](MER_logisica_visual.jpeg): corresponde al diagrama elaborado por nuestro grupo y se incluye como referencia visual.