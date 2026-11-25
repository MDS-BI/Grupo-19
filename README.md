# Logística e Inventario | Grupo 19

Nuestro proyecto consiste en desarrollar un módulo de Logística e Inventario para un sistema ERP, que permita llevar un mejor control de los productos y bodegas de una empresa. El sistema estará orientado al registro de productos, la consulta de las cantidades disponibles y el control de las entradas y salidas de inventario. También incorpora transferencias entre bodegas, alertas cuando las existencias estén por debajo del stock mínimo establecido y solicitudes de reposición con aprobación y recepción trazables.

Para desarrollar el módulo utilizaremos la plantilla entregada por el profesor, aprovechando sus funciones de registro, edición y búsqueda de información. El sistema tomará como referencia nuestro Modelo Entidad-Relación, que considera productos, categorías, bodegas, usuarios, existencias, movimientos, transferencias y solicitudes de reposición. La idea es adaptar la estructura existente y desarrollar las funciones necesarias para administrar el inventario de manera más organizada.

## Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

## Tests

Run the full test suite (unit + integration) with:

```bash
npm test
```

Or a one-off run without watch mode:

```bash
npx vitest run
```

## Building Custom Modules

Custom ERP modules built on this base define:

- What an **Entity** represents (e.g., customer, product, asset) plus domain-specific fields.
- What a **Document** represents (e.g., order, invoice, contract).
- Module-specific labels and validation rules.

The base module handles identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search. See `specs/001-erp-base-module/` for the full specification.

## Tailoring via Configuration

All tailoring lives in one place: the `userConfig` object at the top of `src/module-config.js`. Developers edit this single export; no core code changes are required. Available knobs:

- `moduleName` — display name shown in the top bar, dashboard, and document title; also derives the logo monogram.
- `labels` — rename Entity/Document terms across every screen, including sidebar buttons, quick actions, forms, and messages. Spanish articles and agreements (el/la, seleccionado/a) are derived from the first word of each configured term.
- `customFields` — declare extra fields per record type with `target` (`entity` or `document`), `key`, `label`, `type` (`text`, `number`, `date`, or `select`), optional `required`, and `options` for selects. Keys must not collide with base field names (see `specs/001-erp-base-module/data-model.md`). Values persist alongside records and appear in search results.
- `statusLifecycle` — restrict document statuses to a configured list of `statuses` with permitted `transitions` between them. Without it, status stays a free-form field.
- `theme.accentColor` — a hex color (e.g., `"#0f62fe"`) applied across the shell as highlights and primary controls. Invalid values fall back to the default.

If the configuration is invalid (unknown types, bad keys, transitions referencing unknown statuses, non-hex accent colors), the app shows the problems in a banner and falls back to defaults instead of breaking.

## Notes

- Data is persisted to `localStorage` under the keys `erp_base_module:entities` and `erp_base_module:documents`.
- Deleting an entity also deletes its documents (cascade).
- This project intentionally uses vanilla HTML, CSS, and JavaScript for simplicity.

## Logística e Inventario

On top of the generic Entity/Document base, this feature adds eight dedicated screens reachable from the sidebar: **Productos**, **Bodegas**, **Stock**, **Movimientos**, **Transferencias**, **Alertas**, **Reposiciones** and **Permisos**. See `specs/002-logistica-inventario/` (`spec.md`, `plan.md`, `data-model.md`, `MER.md`, `contracts/`) for the full specification.

### Domain layer

- `src/domain/products.js`, `warehouses.js`, `stock.js`, `movements.js`, `transfers.js`, `alerts.js`, `replenishments.js` — business rules per user story, decoupled from the UI.
- `src/components/replenishment-form.js` / `replenishment-list.js` — HU-07 form with alert prefill and status/action list.
- `src/domain/seed.js` — raw seed data for the `PRODUCT_CATEGORIES`, `USERS`, `ROLES` and `ROLE_PERMISSIONS` catalogs.
- `src/domain/permissions.js` — effective-permission resolution combining business rules, individual overrides, stored role permissions and seed defaults.
- `src/components/permissions-panel.js` — HU-08 role assignment and permission matrix.
- `src/storage.js` — extended with the logistics storage keys, schema metadata, sequential-id helpers, `escapeHtml`/validation helpers, transactional `withStorageRollback()` and `seedLogisticsCatalogs()` (idempotent).

### Storage keys

`logistics:product_categories`, `logistics:products`, `logistics:warehouses`, `logistics:users`, `logistics:stock`, `logistics:inventory_transactions`, `logistics:stock_transfers`, `logistics:replenishment_requests`, `logistics:roles`, `logistics:role_permissions`, `logistics:user_permission_overrides`. No tab list or form drafts are persisted.

### Seed catalogs

`PRODUCT_CATEGORIES`, `USERS`, `ROLES` and `ROLE_PERMISSIONS` are preloaded on first boot (no admin screens for them in this iteration). There is no real authentication: the active user is selected in the topbar and its identity is recorded automatically in movements, transfers and replenishment requests.

### Roles, landings and permissions (HU-08)

- Roles: `administrador` (landing `dashboard`), `supervisor_inventario` (landing `alerts`), `encargado_bodega` (landing `movements`).
- Effective permission: `businessRule && (individualOverride ?? rolePermission ?? roleSeed ?? false)`.
- The administrator always retains the permissions panel (`admin:permissions`); business rules remain above configurable permissions.
- On load, direct hash navigation or active-user change, the app routes to the role landing or falls back to `dashboard` with an access notice.

### Browser tabs (FR-125–FR-128)

- Each main sidebar module opens in a new browser tab via `window.open`, using the same page URL with the hash `#/<module>`; there is no internal tab bar.
- The active user's permissions are checked before opening: an unauthorized module does not open a tab and shows the access notice.
- Each tab loads the app independently and shows only the module indicated by its hash. No tab list or form drafts are persisted or shared between tabs.
- Internal flows (`data-goto` buttons, creating a replenishment from an alert) keep navigating in the same tab. If the browser blocks pop-ups, navigation falls back to the current tab.

### Business rules worth knowing

- Inventory movements (`entrada`/`salida`/`ajuste_entrada`/`ajuste_salida`) are immutable — corrections are made with a new adjustment movement, never by editing history.
- A warehouse transfer only moves stock when **confirmed**; it can be **cancelled** while still `pendiente` without touching `STOCK`.
- Minimum-stock alerts are derived on the fly by comparing `STOCK.quantity_available` to `STOCK.min_stock_level` — there is no separate alerts table.
- Replenishment requests can be created manually or from an alert; they only change stock when received by a warehouse manager, which creates exactly one input movement linked by `movement_id`.
