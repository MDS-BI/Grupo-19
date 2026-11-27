# Research: Coherent Logistics Seed Data

**Feature**: `003-seed-data`  
**Date**: 2026-11-27

## R1. Storage y carga demo actual

- **Decision**: Reutilizar `src/storage.js`, `DEMO_BATCH`, `DEMO_FLAG_KEY`, `demo_key` y `idFor` del loader actual.
- **Rationale**: `loadList`/`saveList`, `validateRecord` y `withStorageRollback` ya centralizan persistencia y validación; cambiar el mecanismo duplicaría lógica.
- **Alternatives considered**: Escribir directamente en `localStorage` sin esquemas (rechazado: pierde validación); crear un nuevo storage (rechazado: rompe UI existente).

## R2. Ubicación del dataset

- **Decision**: Crear `src/domain/demo-data.fixture.js` con datos puros y que `demo-data.js` los consuma.
- **Rationale**: El loader actual tiene specs embebidos extensos; separarlos mejora legibilidad y permite probar el fixture sin storage.
- **Alternatives considered**: Mantener arrays en `demo-data.js` (rechazado: archivo ya extenso); JSON externo (rechazado: requeriría fetch asíncrono en arranque).

## R3. Estados de órdenes

- **Decision**: Agregar `status` opcional con valores `borrador`, `aprobada`, `en_proceso`, `completada`, `cancelada`; `createOrderForMovement` usará `aprobada` por defecto.
- **Rationale**: El modelo actual solo tiene `order_type`; el spec exige estados. Hacer el campo opcional evita invalidar órdenes preexistentes.
- **Alternatives considered**: Reutilizar `order_type` (rechazado: semántica distinta); exigir `status` en schema (rechazado: migración innecesaria).

## R4. Estados de envíos

- **Decision**: Ampliar valores a los estados canónicos `preparando`, `despachado`, `en_transito`, `entregado`, `con_incidencia`, conservando `en_bodega` y `en_reparto` como alias legacy.
- **Rationale**: Los tests y flujos actuales dependen de la secuencia `en_bodega → en_transito → en_reparto → entregado`. El seed debe mostrar los estados pedidos sin destruir ese flujo.
- **Alternatives considered**: Solo estados nuevos (rechazado: rompe tests y flujos); traducir en UI sin storage (rechazado: filtros y validaciones usarían valores inconsistentes).

## R5. Estados de transferencias

- **Decision**: Ampliar valores con `en_transito` y `recibida`, conservando `confirmada` como alias funcional de `recibida`.
- **Rationale**: `confirmTransfer` ya aplica el efecto de stock correcto; renombrarlo rompería integraciones. El seed usará `recibida` y el validador aceptará ambos como estados con efecto.
- **Alternatives considered**: Reemplazar `confirmada` (rechazado: migración y ruina de tests); no extender esquema (rechazado: `validateRecord` rechazaría `recibida` si se declaran valores). Nota: hoy el esquema no declara valores, pero se declararán explícitamente para hacer verificable el contrato.

## R6. Generación de órdenes y envíos desde el loader

- **Decision**: Crear órdenes para movimientos `entrada`/`salida` seleccionados y envíos para órdenes `venta`, con IDs referencialmente válidos y `demo_batch`.
- **Rationale**: `registerMovement` generaría órdenes con efectos de stock ya calculados por el loader y asignaría IDs secuenciales difíciles de controlar; escritura controlada + `validateRecord` mantiene idempotencia y coherencia.
- **Alternatives considered**: Llamar `createOrderForMovement` y `createShipment` (rechazado: acoplamiento a estado global y posibles duplicados); no generar órdenes/envíos (rechazado: incumple FR-005/FR-006).

## R7. Coherencia y casos de borde

- **Decision**: Exportar `validateDemoSeed()` desde `demo-data.js`, con checklist de invariantes y devolver array de problemas.
- **Rationale**: SC-002 a SC-006 requieren verificación objetiva; una función reutilizable sirve a tests y diagnóstico manual.
- **Alternatives considered**: Solo pruebas (rechazado: no expone validación al producto); validación implícita en la UI (rechazado: acopla reglas a presentación).

## R8. Resumen de carga

- **Decision**: Ampliar `getDemoDataSummary()` con `stock`, `orders`, `shipments` y mantener claves existentes.
- **Rationale**: FR-014/SC-006 exigen resumen por tipo; agregar claves es compatible con consumidores actuales.
- **Alternatives considered**: Nuevo endpoint/función separada (rechazado: innecesario); reemplazar resumen actual (rechazado: rompe UI/tests).

## R9. Visibilidad del botón de demostración

- **Decision**: No cambiar la decisión de UI de Fase 21; las pruebas de carga pueden invocar el botón directamente y el resumen seguirá en el bloque existente.
- **Rationale**: El feature trata datos, no navegación. El bloque secundario quedó oculto deliberadamente en la limpieza previa.
- **Alternatives considered**: Hacer visible el card de demo (rechazado: revierte decisión previa del usuario).

## R10. Riesgos de compatibilidad

- **Decision**: Actualizar conteos exactos en `tests/unit/demo-data.test.js` y agregar pruebas de aliases sin alterar supuestos de IDs secuenciales en tests que no cargan demo.
- **Rationale**: El dataset crece y los estados se amplían; los tests existentes son regression guards válidos, solo deben reflejar el nuevo contrato.
- **Alternatives considered**: Parchear tests con aserciones menos estrictas (rechazado: perdería precisión); no ejecutar demo en tests de integración (ya es el comportamiento actual).
