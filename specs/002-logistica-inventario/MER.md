
# Modelo Entidad-Relación (MER)

## Módulo de Logística e Inventario

El siguiente diagrama representa las once entidades del módulo, sus atributos y las relaciones entre ellas.

```mermaid
erDiagram
    PRODUCT_CATEGORIES {
        int category_id PK
        string category_name
    }

    PRODUCTS {
        int product_id PK
        string sku
        string product_name
        string description
        int category_id FK
        decimal sale_price
        decimal cost_price
        string unit_of_measure
        string status
        string supplier
        decimal unit_price
        string dimensions_height
        string dimensions_width
        string dimensions_depth
        decimal weight
        datetime created_at
        datetime updated_at
        int created_by FK
        int updated_by FK
    }

    WAREHOUSES {
        int warehouse_id PK
        string name
        string location
        string description
        int capacity
        string status
        int responsable_id FK
    }

    USERS {
        int user_id PK
        string user_name
        string role
        string email
        int assigned_warehouse_id FK
    }

    ROLES {
        string role_key PK
        string role_label
        string default_landing_module
        boolean is_admin
        string description
    }

    ROLE_PERMISSIONS {
        string role_key PK, FK
        string scope PK
        string resource_key PK
        boolean allowed
    }

    USER_PERMISSION_OVERRIDES {
        int user_id PK, FK
        string scope PK
        string resource_key PK
        boolean allowed
    }

    STOCK {
        int stock_id PK
        int product_id FK
        int warehouse_id FK
        int quantity_available
        int min_stock_level
        date expiration_date
        date update_date
    }

    INVENTORY_TRANSACTIONS {
        int transaction_id PK
        int product_id FK
        int warehouse_id FK
        string transaction_type
        int quantity
        int user_id FK
        date transaction_date
    }

    STOCK_TRANSFERS {
        int transfer_id PK
        int product_id FK
        int source_warehouse_id FK
        int target_warehouse_id FK
        int quantity
        string status
        date transfer_date
        int created_by FK
        int confirmed_by FK
    }

    REPLENISHMENT_REQUESTS {
        int request_id PK
        int product_id FK
        int warehouse_id FK
        int quantity
        string observation
        string status
        date request_date
        int created_by FK
        int approved_by FK
        date approved_at
        int received_by FK
        date received_at
        int cancelled_by FK
        date cancelled_at
        int movement_id FK
        string source
    }

    PRODUCT_CATEGORIES ||--o{ PRODUCTS : clasifica
    PRODUCTS ||--o{ STOCK : tiene
    WAREHOUSES ||--o{ STOCK : almacena
    PRODUCTS ||--o{ INVENTORY_TRANSACTIONS : registra
    WAREHOUSES ||--o{ INVENTORY_TRANSACTIONS : contiene
    USERS ||--o{ INVENTORY_TRANSACTIONS : realiza
    PRODUCTS ||--o{ STOCK_TRANSFERS : transfiere
    WAREHOUSES ||--o{ STOCK_TRANSFERS : origen
    WAREHOUSES ||--o{ STOCK_TRANSFERS : destino
    USERS |o--o{ WAREHOUSES : responsable
    WAREHOUSES |o--o{ USERS : asignados
    USERS ||--o{ STOCK_TRANSFERS : crea
    USERS |o--o{ STOCK_TRANSFERS : confirma
    ROLES ||--o{ USERS : clasifica
    ROLES ||--o{ ROLE_PERMISSIONS : define
    USERS ||--o{ USER_PERMISSION_OVERRIDES : exceptua
    PRODUCTS ||--o{ REPLENISHMENT_REQUESTS : repone
    WAREHOUSES ||--o{ REPLENISHMENT_REQUESTS : recibe
    USERS ||--o{ REPLENISHMENT_REQUESTS : crea
    USERS |o--o{ REPLENISHMENT_REQUESTS : aprueba
    USERS |o--o{ REPLENISHMENT_REQUESTS : recibe
    USERS |o--o{ REPLENISHMENT_REQUESTS : cancela
    INVENTORY_TRANSACTIONS ||--o| REPLENISHMENT_REQUESTS : genera
```

## Restricciones adicionales

- `PRODUCTS.category_id` es obligatorio (cada producto debe pertenecer a una categoría existente).
- `PRODUCTS.sku` es obligatorio y único.
- `WAREHOUSES.name` es obligatorio y único.
- `WAREHOUSES.status` solo admite los valores "activo" o "inactivo".
- En `STOCK`, la combinación (`product_id`, `warehouse_id`) debe ser única; solo puede existir un registro por producto y bodega.
- `INVENTORY_TRANSACTIONS.transaction_type` solo admite los valores "entrada", "salida", "ajuste_entrada" o "ajuste_salida".
- `STOCK_TRANSFERS.status` solo admite los valores "pendiente", "confirmada" o "cancelada".
- `STOCK_TRANSFERS.created_by` es obligatorio y registra al usuario que crea la solicitud.
- `STOCK_TRANSFERS.confirmed_by` es obligatorio cuando la transferencia pasa a estado "confirmada".
- `PRODUCTS.unit_price` se conserva solo por compatibilidad con la plantilla base; las reglas de negocio usan `sale_price` y `cost_price`.
- `STOCK.min_stock_level` se configura por producto y bodega y genera alertas cuando `quantity_available` es menor o igual al mínimo (con mínimo mayor que cero); `STOCK.expiration_date` queda reservado para una iteración futura de vencimientos.
- `WAREHOUSES.responsable_id` identifica al responsable principal de la bodega; `USERS.assigned_warehouse_id` identifica la bodega operativa asignada al usuario.
- `REPLENISHMENT_REQUESTS.status` solo admite los valores "pendiente", "aprobada", "recibida" o "cancelada".
- `REPLENISHMENT_REQUESTS.quantity` debe ser un entero mayor que cero y la bodega debe estar activa al crear la solicitud.
- `REPLENISHMENT_REQUESTS.movement_id` se asigna solo al recibir; apunta a un movimiento de entrada inmutable de `INVENTORY_TRANSACTIONS`.
- Solo se aprueban solicitudes pendientes; solo se cancelan solicitudes pendientes o aprobadas; solo se reciben solicitudes aprobadas.
- `recibida` y `cancelada` son estados terminales: no se aprueban, cancelan ni reciben nuevamente.
- `USERS.role` referencia `ROLES.role_key`; un cargo no reconocido se rechaza.
- `ROLES.default_landing_module` debe ser un módulo conocido y permitido; la semilla usa `dashboard` para administrador, `alerts` para supervisor y `movements` para encargado, y usa `dashboard` como fallback con aviso no bloqueante.
- En `ROLE_PERMISSIONS`, la combinación (`role_key`, `scope`, `resource_key`) es única; en `USER_PERMISSION_OVERRIDES`, la combinación (`user_id`, `scope`, `resource_key`) es única.
- El permiso efectivo es `reglaDeNegocio && (excepciónIndividual ?? permisoDelCargo ?? semillaDelCargo)`; la configuración nunca otorga una acción prohibida por una regla de negocio.
- `admin:permissions` siempre está permitido para el cargo con `is_admin = true`.
- Los cambios de cargo y permisos no alteran entidades operativas ni el usuario activo.

## Referencia visual

El MER original elaborado por nuestro grupo se conserva como referencia visual.


![MER visual original](MER_logisica_visual.jpeg)

## Ampliación HU-11: Seguimiento de envíos al comprador (2026-11-23)

El diagrama anterior se conserva íntegramente. Esta sección añade la entidad `SHIPMENTS` y sus relaciones con órdenes y usuarios. HU-10 no incorpora entidades nuevas: solo consulta `STOCK_TRANSFERS` con filtros.

```mermaid
erDiagram
    PURCHASE_SALES_ORDERS {
        string order_id PK
        string order_type
        string transaction_id FK
    }

    USERS {
        int user_id PK
        string user_name
        string role
    }

    SHIPMENTS {
        int shipment_id PK
        string order_id FK, UK
        string carrier
        string tracking_code
        string status
        int created_by FK
        datetime created_at
        array history
    }

    PURCHASE_SALES_ORDERS ||--o| SHIPMENTS : genera
    USERS ||--o{ SHIPMENTS : registra
    USERS ||--o{ SHIPMENTS : actualiza
```

### Restricciones adicionales HU-11

- `SHIPMENTS.order_id` referencia una orden OV existente (`PURCHASE_SALES_ORDERS.order_type = "venta"`) y es única: una OV tiene como máximo un envío.
- `SHIPMENTS.shipment_id` es una secuencia entera independiente; no reutiliza correlativos `OC`/`OV`.
- `carrier` y `tracking_code` son obligatorios.
- `status` solo admite `en_bodega`, `en_transito`, `en_reparto` o `entregado`.
- `history` conserva `{ status, changed_at, changed_by }` para cada cambio, incluido el estado inicial `en_bodega`.
- Solo se permite avanzar al estado inmediatamente siguiente; `entregado` es terminal.
- El envío no genera movimientos de inventario ni modifica `STOCK`, órdenes ni movimientos.

