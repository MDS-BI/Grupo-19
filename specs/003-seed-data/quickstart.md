# Quickstart: Coherent Logistics Seed Data

**Feature**: `003-seed-data`

## Prerequisites

- Node.js and npm dependencies installed (`npm install`).
- Clean `localStorage` or ability to reset it between checks.
- Active user with `base.manage` permission (seed provides user ID 1 with admin role).

## Automated validation

```powershell
npx vitest run
npm run build
git diff --check
```

Expected:

- `tests/unit/demo-data.test.js` verifies fixture minimums, derived stock, canonical states, edge cases, idempotency and preservation.
- `tests/integration/dashboard.test.js` verifies the load button updates the summary without adding visible KPI cards.
- `tests/integration/orders.test.js`, `shipments.test.js` and `transfers.test.js` verify the new state filters.
- Build completes without errors and `git diff --check` reports no whitespace errors.

## Manual validation

1. Start the app with `npm run dev`.
2. In `localStorage`, set an active user with `base.manage`.
3. Trigger the existing demo load action from the dashboard demo block.
4. Confirm `#demo-data-status` reports counts for products, warehouses, stock, movements, transfers, orders and shipments.
5. Open each list and verify:
   - products >= 20, warehouses >= 3 with one inactive;
   - movements include entry, exit and adjustment types;
   - transfers include pendiente, en tránsito, recibida and cancelada;
   - orders include borrador, aprobada, en proceso, completada and cancelada;
   - shipments include preparando, despachado, en tránsito, entregado and con incidencia.
6. Trigger the load action again and confirm the summary reports `alreadyLoaded` and counts do not increase.
7. Verify edge cases in storage: zero stock, draft/cancelled orders without shipment, cancelled transfers without stock effects.

## Coherence check

From a browser console or test context:

```javascript
import { validateDemoSeed } from '/src/domain/demo-data.js';
console.log(validateDemoSeed());
```

Expected result: `[]`.

## Related design

- [data-model.md](./data-model.md)
- [contracts/demo-seed.md](./contracts/demo-seed.md)
