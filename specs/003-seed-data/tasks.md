---

description: "Task list for feature 003-seed-data"
---

# Tasks: Coherent Logistics Seed Data

**Input**: Design documents from `/specs/003-seed-data/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Se incluyen pruebas porque el usuario pidió verificación explícita de casos de borde y coherencia.

**Organization**: Las tareas se agrupan por user story para permitir implementación y validación independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: User story al que pertenece (US1, US2, US3, US4)
- Incluye rutas de archivo exactas.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar el módulo de fixture y la estructura de carga.

- [X] T001 Verificar que `.specify/feature.json` apunta a `specs/003-seed-data` y que `specs/003-seed-data/plan.md` declara la rama `003-seed-data`
- [X] T002 Crear `src/domain/demo-data.fixture.js` con el objeto `DEMO_SEED` vacío y la forma definida en `specs/003-seed-data/contracts/demo-seed.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Esquemas y andamiaje que bloquean todas las historias.

- [X] T003 Agregar `status` con valores `borrador`, `aprobada`, `en_proceso`, `completada`, `cancelada` a `LOGISTICS_SCHEMAS.orders` en `src/storage.js`, manteniendo los campos requeridos actuales
- [X] T004 Ampliar `LOGISTICS_SCHEMAS.shipments.values.status` en `src/storage.js` con `preparando`, `despachado`, `en_transito`, `entregado`, `con_incidencia`, `en_bodega` y `en_reparto`
- [X] T005 Ampliar `LOGISTICS_SCHEMAS.transfers.values.status` en `src/storage.js` con `pendiente`, `en_transito`, `recibida`, `confirmada` y `cancelada`
- [X] T006 Refactorizar `src/domain/demo-data.js` para importar `DEMO_SEED` desde `src/domain/demo-data.fixture.js` y conservar `DEMO_BATCH`, `DEMO_FLAG_KEY`, `readFlag`, `writeFlag`, `idFor` e `isDemoDataLoaded`

**Checkpoint**: La base está lista; las historias pueden implementarse en orden de prioridad.

---

## Phase 3: User Story 1 - Explorar un catálogo logístico completo (Priority: P1)

**Goal**: Cargar suficientes productos, bodegas y movimientos para explorar filtros y pantallas.

**Independent Test**: Cargar la demostración en storage limpio y verificar >=20 productos, >=3 bodegas con una inactiva y movimientos de entrada, salida y ajuste.

### Tests for User Story 1

- [X] T007 [US1] Actualizar `tests/unit/demo-data.test.js` con aserciones de >=20 SKUs únicos, categorías/precios variados, >=3 bodegas con ubicaciones distintas y al menos una inactiva, y >=20 movimientos con los cuatro tipos

### Implementation for User Story 1

- [X] T008 [US1] Poblar `DEMO_SEED.products`, `DEMO_SEED.warehouses`, `DEMO_SEED.movements` y `DEMO_SEED.minLevels` en `src/domain/demo-data.fixture.js` con datos deterministas y `demo_key` estable por registro
- [X] T009 [US1] Implementar en `src/domain/demo-data.js` la escritura de productos, bodegas, stock y movimientos desde el fixture, deduplicando por SKU, nombre de bodega, par producto/bodega y `demo_key`
- [X] T010 [US1] Calcular en `src/domain/demo-data.js` el stock del lote desde los movimientos del fixture, aplicando `entrada`/`ajuste_entrada` como suma y `salida`/`ajuste_salida` como resta, con `Math.max(0, quantity)` y `update_date` en formato `YYYY-MM-DD`

**Checkpoint**: US1 es funcional de forma independiente.

---

## Phase 4: User Story 2 - Revisar estados operativos realistas (Priority: P1)

**Goal**: Mostrar transferencias, órdenes y envíos en los estados solicitados.

**Independent Test**: Cargar la demostración y encontrar al menos un registro en cada estado canónico de transferencia, orden y envío.

### Tests for User Story 2

- [X] T011 [P] [US2] Actualizar `tests/integration/orders.test.js` para verificar que el listado de órdenes sembradas expone los cinco estados y que las órdenes borrador/cancelada no tienen envío
- [X] T012 [P] [US2] Actualizar `tests/integration/shipments.test.js` para verificar los cinco estados canónicos de envío, el historial y la compatibilidad con la orden
- [X] T013 [P] [US2] Actualizar `tests/integration/transfers.test.js` para verificar filtros por `pendiente`, `en_transito`, `recibida`, `cancelada` y el alias `confirmada`

### Implementation for User Story 2

- [X] T014 [US2] Poblar `DEMO_SEED.transfers`, `DEMO_SEED.orderSpecs` y `DEMO_SEED.shipmentSpecs` en `src/domain/demo-data.fixture.js`, incluyendo los cinco estados de orden y envío y los cuatro estados de transferencia
- [X] T015 [US2] Modificar `src/domain/orders.js` para que `createOrderForMovement` persista `status: 'aprobada'` sin cambiar la numeración OC/OV ni la creación idempotente
- [X] T016 [US2] Modificar `src/domain/shipments.js` para aceptar estados canónicos y aliases legacy, manteniendo la transición inicial vigente y agregando `con_incidencia` como estado terminal desde `en_transito`
- [X] T017 [US2] Modificar `src/domain/transfers.js` para tratar `recibida` y `confirmada` como equivalentes en filtros y validaciones, sin cambiar el efecto de stock de `confirmTransfer`
- [X] T018 [US2] Implementar en `src/domain/demo-data.js` la generación de órdenes desde movimientos sembrados y de envíos desde órdenes `venta`, con `order_id`, `shipment_id`, `history`, `demo_batch` y `demo_key` válidos
- [X] T019 [P] [US2] Agregar en `src/components/order-list.js` una columna/etiqueta de estado usando `borrador`, `aprobada`, `en proceso`, `completada` y `cancelada`
- [X] T020 [P] [US2] Actualizar `src/components/shipment-list.js` para mostrar etiquetas de `preparando`, `despachado`, `en tránsito`, `entregado` y `con incidencia`, conservando aliases legacy
- [X] T021 [P] [US2] Actualizar `src/components/transfer-list.js` para mostrar `pendiente`, `en tránsito`, `recibida` y `cancelada`, conservando `confirmada` como alias de `recibida`
- [X] T022 [P] [US2] Actualizar `index.html` para incluir las opciones de filtro de estado de orden, envío y transferencia definidas en `specs/003-seed-data/data-model.md`

**Checkpoint**: US1 y US2 funcionan de forma independiente.

---

## Phase 5: User Story 3 - Confiar en la coherencia de los datos (Priority: P1)

**Goal**: Garantizar reglas de negocio y casos de borde verificables.

**Independent Test**: Ejecutar `validateDemoSeed()` después de cargar y obtener `[]`; comprobar stock cero, orden sin envío y transferencia cancelada sin efectos.

### Tests for User Story 3

- [X] T023 [US3] Ampliar `tests/unit/demo-data.test.js` con casos de stock cero en bodega activa, orden sin envío, transferencia cancelada sin cambios de stock, transferencia recibida con efectos opuestos y envíos entregados/con incidencia compatibles
- [X] T024 [P] [US3] Actualizar `tests/unit/storage.test.js` para reflejar los valores ampliados de `orders`, `shipments` y `transfers` en `src/storage.js`

### Implementation for User Story 3

- [X] T025 [US3] Implementar `validateDemoSeed()` en `src/domain/demo-data.js` para devolver un array de problemas sobre integridad referencial, stock derivado, estados de envío/orden, efectos de transferencias y unicidad de `demo_key`
- [X] T026 [US3] Ejecutar `validateDemoSeed()` al final de `loadDemoData()` en `src/domain/demo-data.js` y devolver `result.error` si existen problemas

**Checkpoint**: Todas las historias P1 son funcionales y verificables de forma independiente.

---

## Phase 6: User Story 4 - Repetir la carga sin duplicar ni destruir datos (Priority: P2)

**Goal**: Hacer la carga idempotente y exponer un resumen verificable por tipo.

**Independent Test**: Cargar dos veces y verificar que los totales no cambian, que `alreadyLoaded` es `true` en la segunda carga y que los registros manuales preexistentes permanecen.

### Tests for User Story 4

- [X] T027 [US4] Actualizar `tests/unit/demo-data.test.js` con una segunda carga que no incremente totales y con un registro manual preexistente que no sea sobrescrito
- [X] T028 [US4] Actualizar `tests/integration/dashboard.test.js` para verificar que el botón de demostración actualiza `#demo-data-status` con cantidades de productos, bodegas, stock, movimientos, transferencias, órdenes y envíos sin agregar KPIs visibles

### Implementation for User Story 4

- [X] T029 [US4] Ampliar `getDemoDataSummary()` en `src/domain/demo-data.js` con `stock`, `orders` y `shipments`, manteniendo las claves `loaded`, `products`, `warehouses`, `movements` y `transfers`
- [X] T030 [US4] Actualizar `src/components/dashboard.js` para renderizar en `#demo-data-status` las siete cantidades del resumen ampliado
- [X] T031 [US4] Actualizar `src/app.js` para usar el resumen ampliado al confirmar la carga de demostración

**Checkpoint**: Todas las historias son funcionales.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validación final y consistencia documental.

- [X] T032 Ejecutar `npx vitest run` y corregir regresiones en `tests/unit/` y `tests/integration/`
- [X] T033 Ejecutar `npm run build` y confirmar que `src/` compila sin errores
- [X] T034 Ejecutar `git diff --check` y revisar que no haya errores de whitespace en `specs/003-seed-data/` ni en `src/`
- [X] T035 Seguir `specs/003-seed-data/quickstart.md` y verificar arranque con `npm run dev`, carga manual y resumen reflejado en pantalla

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Setup; bloquea todas las historias
- **User Stories (Phase 3-6)**: Dependen de Foundational
- **Polish (Phase 7)**: Depende de todas las historias

### User Story Dependencies

- **US1 (P1)**: Puede empezar tras Foundational; sin dependencias de otras historias
- **US2 (P1)**: Depende de los esquemas y del loader base; las pruebas son independientes de US1
- **US3 (P1)**: Depende de US1 y US2 para validar stock, órdenes y envíos sembrados
- **US4 (P2)**: Depende de las historias P1 para resumir todos los tipos

### Within Each User Story

- Tests antes o junto con la implementación
- Datos del fixture antes del loader
- Loader antes de UI y validación
- Validación P1 antes del resumen P2

### Parallel Opportunities

- T011, T012 y T013 pueden ejecutarse en paralelo
- T019, T020, T021 y T022 pueden ejecutarse en paralelo
- T024 puede ejecutarse en paralelo con T023

---

## Parallel Example: User Story 2

```powershell
# Ejecutar pruebas de estados en paralelo:
Task: "T011 orders state tests"
Task: "T012 shipments state tests"
Task: "T013 transfers state tests"

# Actualizar vistas de estado en paralelo:
Task: "T019 order-list status label"
Task: "T020 shipment-list labels"
Task: "T021 transfer-list labels"
Task: "T022 index.html filter options"
```

---

## Implementation Strategy

### MVP First (US1)

1. Completar Setup y Foundational
2. Implementar US1
3. Validar catálogo y movimientos de forma independiente

### Incremental Delivery

1. Setup + Foundational
2. US1 → validar catálogo
3. US2 → validar estados
4. US3 → validar coherencia y casos de borde
5. US4 → validar idempotencia y resumen

### Parallel Team Strategy

1. Equipo completo: Setup + Foundational
2. Desarrollador A: US1
3. Desarrollador B: US2
4. Desarrollador C: US3/US4 después de US1 y US2

---

## Notes

- [P] indica archivos distintos y sin dependencias incompletas.
- Cada tarea incluye ruta exacta.
- Todas las tareas usaron el formato `- [ ] TXXX ...` y quedaron marcadas como `[X]` tras completarse.
- No se realizará commit salvo petición explícita del usuario.
