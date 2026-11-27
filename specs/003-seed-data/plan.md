# Implementation Plan: Coherent Logistics Seed Data

**Branch**: `003-seed-data` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-seed-data/spec.md`

## Summary

Ampliar el cargador de demostración existente para producir un conjunto de datos logísticos coherente y verificable. Los datos se definirán en un fixture inmutable (`src/domain/demo-data.fixture.js`), se cargarán mediante `src/domain/demo-data.js` con las convenciones actuales de lote/idempotencia, y se validarán con una función explícita que compruebe relaciones, estados y casos de borde. Para soportar los estados solicitados se extenderán los esquemas, el dominio y la UI de órdenes, envíos y transferencias, conservando alias legacy donde sea necesario para no romper flujos existentes.

## Technical Context

**Language/Version**: JavaScript moderno (ES modules), Node.js para tooling

**Primary Dependencies**: Vite 6.2.x, Vitest 3.1.x, jsdom 30.x; sin framework UI

**Storage**: `localStorage` mediante `src/storage.js`, con esquemas declarados en `LOGISTICS_SCHEMAS`

**Testing**: Vitest unitario e integración con JSDOM; comando `npx vitest run`

**Target Platform**: Navegador de escritorio; aplicación SPA local sin backend

**Project Type**: Aplicación web frontend estática

**Performance Goals**: Sin presupuesto numérico; la carga debe completarse en una sola acción manual sin re-render multiple

**Constraints**: Sin login real; verificación mediante usuario activo simulado y permisos en storage. No hay scripts `lint`, `format:check` ni `analyze`; `npm run build` es la comprobación estática disponible.

**Scale/Scope**: ~20 productos, 4 bodegas, ~24 movimientos, 6 transferencias, 6 órdenes y 6 envíos; un lote reproducible.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. Code Quality & Maintainability: PASA. El fixture separa datos de lógica; el loader conserva funciones pequeñas y naming existente.
- II. Test-First & Verification: PASA. Se agregarán pruebas unitarias de fixture/validator y de integración de carga/resumen/filtros antes de cerrar la feature.
- III. User Experience Consistency: PASA. Los nuevos estados usarán etiquetas y filtros existentes; el resumen se mostrará en el mismo bloque de demostración.
- IV. Performance & Reliability: PASA. La carga es manual, idempotente y usa escrituras agrupadas por clave; sin datos externos ni round-trips.
- Quality Standards: DEVIACIÓN CONTROLADA. No existe tooling de lint/format en `package.json`; se sustituye por `git diff --check`, `npm run build` y suite completa. Documentado en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-seed-data/
├── plan.md              # Este archivo
├── research.md          # Decisiones de Phase 0
├── data-model.md        # Entidades, estados y validaciones
├── quickstart.md        # Guía de validación manual/automatizada
├── contracts/           # Contrato interno del fixture y loader
│   └── demo-seed.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Generado por /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── demo-data.fixture.js   # Nuevo: datos puros del lote
│   ├── demo-data.js           # Loader, resumen y validación de coherencia
│   ├── orders.js              # Estado de orden
│   ├── shipments.js           # Estados ampliados de envío
│   └── transfers.js           # Alias recibida/confirmada
├── storage.js                 # Esquemas y valores permitidos
├── app.js                     # Botón y resumen de demostración
└── components/
    ├── dashboard.js           # Render del resumen ampliado
    ├── order-list.js          # Columna/filtro de estado de orden
    ├── shipment-list.js       # Etiquetas de nuevos estados
    └── transfer-list.js       # Etiquetas de nuevos estados

tests/
├── unit/
│   ├── demo-data.test.js      # Fixture, coherencia e idempotencia
│   └── storage.test.js        # Esquemas ampliados
└── integration/
    ├── dashboard.test.js      # Carga manual y resumen
    ├── orders.test.js         # Estados de orden y orden sin envío
    ├── shipments.test.js      # Estados de envío y compatibilidad
    └── transfers.test.js      # Transferencias recibidas/canceladas
```

**Structure Decision**: Se mantiene el proyecto único existente. El fixture es un módulo de datos puro; la lógica sigue en el dominio actual para reutilizar storage, rollback y convenciones de IDs.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| No hay linting/format/static analysis configurado | El proyecto solo expone `dev`, `build`, `preview` y `test` | Agregar una nueva toolchain excede el alcance del feature; se compensa con `git diff --check`, build y tests completos |
| Estados nuevos conviven con alias legacy | Las pruebas y flujos actuales usan `en_bodega`, `en_reparto` y `confirmada` | Romper esos valores obligaría a migrar datos existentes y reescribir flujos no relacionados con el seed |

## Phase 0 Outline & Research

### Research Tasks

1. Investigar esquemas y servicios actuales de órdenes, envíos, transferencias, movimientos y stock → resuelto en `research.md`.
2. Investigar patrón actual de demo loader, idempotencia y pruebas → resuelto en `research.md`.
3. Investigar conflictos entre estados solicitados y estados implementados → resuelto en `research.md`.

### Decisions

- Usar un fixture dedicado en lugar de arrays embebidos en `demo-data.js`.
- Conservar `DEMO_BATCH`/flag v1 y `demo_key` para idempotencia; el dataset cambia pero el mecanismo no.
- Escribir órdenes/envíos/transferencias directamente desde el loader con validación de esquema y `demo_batch`, sin invocar servicios que generarían efectos laterales no deseados.
- Calcular stock desde movimientos y transferencias con efecto (`recibida`/`confirmada`), nunca desde canceladas/en tránsito/pendientes.
- Aceptar alias legacy como equivalentes funcionales, pero sembrar y mostrar los estados canónicos solicitados.

## Phase 1 Design & Contracts

- `data-model.md`: entidades, campos, estados y reglas de coherencia.
- `contracts/demo-seed.md`: forma del fixture, API del loader y contrato del validador.
- `quickstart.md`: pasos de carga, validación automatizada y validación manual.

## Post-Design Constitution Check

- I: PASA. Separación fixture/loader/dominio.
- II: PASA. Plan de pruebas cubre unidad, integración y build.
- III: PASA. Estados y resumen se integran en UI existente.
- IV: PASA. Carga manual e idempotente; sin trabajo innecesario en arranque.
- Quality Standards: DEVIACIÓN CONTROLADA sin cambios.

## Next Action

Ejecutar `/speckit.tasks` sobre esta feature.
