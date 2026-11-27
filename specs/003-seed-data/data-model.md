# Data Model: Coherent Logistics Seed Data

**Feature**: `003-seed-data`  
**Date**: 2026-11-27

## Entities

### Product

- **Fields**: `product_id`, `sku`, `name`, `category_id`, `sale_price`, `cost_price`, `supplier`, `status`, `demo_batch`, `demo_key`
- **Validation**: `sku` único case-insensitive; precios >= 0; categoría existente; `demo_batch` marca pertenencia al lote.
- **Seed coverage**: >= 20 registros, SKU/categoría/precios variados.

### Warehouse

- **Fields**: `warehouse_id`, `name`, `location`, `capacity`, `status`, `manager_user_id`, `demo_batch`, `demo_key`
- **Validation**: nombre único case-insensitive; ubicación distinta; `status` en `activo`/`inactivo`; respons usuario existente.
- **Seed coverage**: 4 registros, al menos 3 activos y 1 inactivo.

### Stock

- **Fields**: `stock_id`, `product_id`, `warehouse_id`, `quantity_available`, `min_stock_level`, `expiration_date`, `update_date`, `demo_batch`, `demo_key`
- **Validation**: par `(product_id, warehouse_id)` único; cantidad >= 0; fecha `YYYY-MM-DD`.
- **Derivation**: se calcula desde movimientos del lote y transferencias con efecto (`recibida`/`confirmada`). Transferencias canceladas, pendientes o en tránsito no afectan saldos.
- **Seed coverage**: incluye al menos un `(producto, bodega activa)` con `quantity_available = 0`.

### InventoryMovement

- **Fields**: `transaction_id`, `product_id`, `warehouse_id`, `transaction_type`, `quantity`, `user_id`, `transaction_date`, `order_id`, `demo_batch`, `demo_key`
- **Validation**: tipo en `entrada`, `salida`, `ajuste_entrada`, `ajuste_salida`; cantidad positiva; producto y bodega existentes; bodega activa.
- **Stock effect**: `entrada`/`ajuste_entrada` suman; `salida`/`ajuste_salida` restan.
- **Seed coverage**: >= 20 registros con los cuatro tipos y varias bodegas/productos.

### Transfer

- **Fields**: `transfer_id`, `product_id`, `source_warehouse_id`, `target_warehouse_id`, `quantity`, `status`, `transfer_date`, `created_by`, `confirmed_by`, `cancelled_by`, `demo_batch`, `demo_key`
- **States**: `pendiente → en_transito → recibida`; `cancelada` terminal alternativa. `confirmada` se conserva como alias legacy de `recibida`.
- **Validation**: producto existente; origen != destino; bodegas activas; cantidad positiva; usuario existente.
- **Stock effect**: solo `recibida`/`confirmada` descuenta origen y aumenta destino.
- **Seed coverage**: 6 registros: pendiente, en tránsito, recibida, cancelada y dos variantes adicionales.

### Order

- **Fields**: `order_id`, `order_type`, `transaction_id`, `product_id`, `warehouse_id`, `quantity`, `user_id`, `order_date`, `status`, `demo_batch`, `demo_key`
- **States**: `borrador → aprobada → en_proceso → completada`; `cancelada` terminal alternativa.
- **Validation**: `order_id` único con prefijo `OC-` para `adquisicion` y `OV-` para `venta`; `transaction_id` único; referencias válidas.
- **Seed coverage**: 6 registros con todos los estados; al menos `borrador` y `cancelada` sin envío.

### Shipment

- **Fields**: `shipment_id`, `order_id`, `carrier`, `tracking_code`, `status`, `created_by`, `created_at`, `history[]`, `demo_batch`, `demo_key`
- **States**: `preparando → despachado → en_transito → entregado`; `con_incidencia` terminal alternativa desde `en_transito`. Aliases legacy: `en_bodega` ≡ `preparando`, `en_reparto` ≡ `despachado`.
- **Validation**: `order_id` debe ser una orden `venta` existente; un envío por orden; transportista y tracking no vacíos; `created_by` usuario existente; `history[]` con `{status, changed_at, changed_by}`.
- **Compatibility rule**: `entregado` solo con orden `aprobada`, `en_proceso` o `completada`; `con_incidencia` solo con orden `aprobada` o `en_proceso`; ningún envío con orden `borrador` o `cancelada`.
- **Seed coverage**: 6 registros con todos los estados.

## Relationships

```text
Product ──< Stock >── Warehouse
Product ──< InventoryMovement >── Warehouse
InventoryMovement ──< Order ──< Shipment
Product ──< Transfer >── Warehouse (origen/destino)
User ──< movements / orders / shipments / transfers
Category ──< Product
```

## Validation Invariants

1. Todo `demo_key` es único por tipo de registro.
2. Todo ID referenciado existe dentro del lote o en catálogos semilla.
3. Ninguna bodega inactiva participa en movimientos o transferencias vigentes.
4. El stock calculado coincide con los saldos persistidos.
5. Una transferencia cancelada no cambia stock ni crea movimientos.
6. Una orden en borrador/cancelada no tiene envío.
7. Un envío entregado cumple la regla de compatibilidad con su orden.
8. El resumen coincide con los registros que tienen `demo_batch`.

## State Transition Implementation

- `orders.js`: `createOrderForMovement` inicializa `status: 'aprobada'`.
- `shipments.js`: `createShipment` conserva `en_bodega` como alias inicial de `preparando`; `advanceShipmentStatus` acepta la unión de transiciones canónicas y legacy.
- `transfers.js`: `confirmTransfer` mantiene `confirmada` por compatibilidad; `recibida` es equivalente para validación y filtros.
- `demo-data.js`: siembra directamente estados canónicos y ejecuta `validateDemoSeed()` después de cargar.
