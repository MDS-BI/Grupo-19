
# Modelo Entidad-Relación (MER)

## Módulo de Logística e Inventario

El siguiente diagrama representa las siete entidades del módulo, sus atributos y las relaciones entre ellas.

```mermaid
erDiagram
    PRODUCT_CATEGORIES {
        int category_id PK
        string category_name
    }

    PRODUCTS {
        int product_id PK
        string product_name
        string description
        decimal unit_price
        int category_id FK
        string dimensions_height
        string dimensions_width
        string dimensions_depth
        decimal weight
    }

    WAREHOUSES {
        int warehouse_id PK
        string name
        string location
        int capacity
        int responsable_id FK
    }

    USERS {
        int user_id PK
        string user_name
        string role
        string email
        int assigned_warehouse_id FK
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
```

## Restricciones adicionales

- `PRODUCTS.category_id` es obligatorio (cada producto debe pertenecer a una categoría existente).
- En `STOCK`, la combinación (`product_id`, `warehouse_id`) debe ser única; solo puede existir un registro por producto y bodega.
- `INVENTORY_TRANSACTIONS.transaction_type` solo admite los valores "entrada" o "salida".
- `STOCK_TRANSFERS.status` solo admite los valores "pendiente", "confirmada" o "cancelada".

## Referencia visual

El MER original elaborado por nuestro grupo se conserva como referencia visual.


![MER visual original](MER_logisica_visual.jpeg)

