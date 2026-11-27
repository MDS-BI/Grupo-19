# Contract: Demo Seed Fixture and Loader

**Feature**: `003-seed-data`  
**Status**: Internal module contract

## Fixture module

**Path**: `src/domain/demo-data.fixture.js`

Exports a frozen-like plain object `DEMO_SEED` with:

```text
{
  products: Array<ProductSpec>,
  warehouses: Array<WarehouseSpec>,
  movements: Array<MovementSpec>,
  transfers: Array<TransferSpec>,
  orderSpecs: Array<{ key: string, movementKey: string, status: string }>,
  shipmentSpecs: Array<{
    key: string,
    orderKey: string,
    status: string,
    carrier: string,
    trackingCode: string
  }>,
  minLevels: Record<string, Record<string, number>>
}
```

Rules:

- The fixture has no imports, side effects, dates or generated IDs.
- Every `demo_key` is stable and unique within its collection.
- `orderSpecs` has >= 5 entries and includes all canonical order states; `movementKey` identifies the sale movement used to build the order.
- `shipmentSpecs` references an `orderSpec` by `orderKey` and includes all canonical shipment states.

## Loader module

**Path**: `src/domain/demo-data.js`

Public API:

- `isDemoDataLoaded(): boolean`
- `getDemoDataSummary(): {loaded, products, warehouses, stock, movements, transfers, orders, shipments}`
- `loadDemoData(): {alreadyLoaded, error?, added: object}`
- `validateDemoSeed(): string[]`

Behavior:

1. If the flag is already set, `loadDemoData` returns `{alreadyLoaded: true, added: {}}`.
2. If no records are added, the flag is not written.
3. Existing records are never overwritten or deleted.
4. Records with an existing natural key (`sku`, warehouse name, composite stock key, `demo_key`) are skipped.
5. Stock is derived from fixture movements and effective transfers only.
6. Orders are derived from selected `entrada`/`salida` movements and assigned canonical states.
7. Shipments are derived from sale orders and assigned canonical states with history.
8. `validateDemoSeed()` returns `[]` when all invariants hold; otherwise an array of human-readable issues.

## UI contract

- `#load-demo-data` triggers `loadDemoData()` only when `base.manage` is active.
- `#demo-data-status` shows counts for products, warehouses, stock, movements, transfers, orders and shipments.
- Order, shipment and transfer lists expose the canonical states in filters/labels; legacy aliases remain visible as their canonical equivalents.

## Test contract

- Unit tests assert fixture minimums, derived stock, canonical states, edge cases and `validateDemoSeed() === []`.
- Unit tests assert second load is idempotent and pre-existing records are preserved.
- Integration tests assert dashboard summary and list filtering for the new states.
