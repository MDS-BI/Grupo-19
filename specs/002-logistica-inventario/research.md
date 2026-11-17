# Investigación Técnica: Módulo de Logística e Inventario

**Feature**: `002-logistica-inventario`  
**Fecha**: 2026-11-17  
**Estado**: Decisiones consolidadas a partir de `plan.md`, `spec.md` y del código implementado

Este documento completa la estructura SpecKit de la funcionalidad. No registra una investigación nueva ni sustituye decisiones ya aplicadas; consolida las elecciones técnicas que hicieron posible la implementación actual sin modificarla.

## Decisiones ya aplicadas

| Tema | Decisión | Justificación |
|---|---|---|
| Interfaz | JavaScript ES2022, HTML y CSS con Vite; sin framework de interfaz pesado | El ERP base ya expone una arquitectura modular ligera y suficiente para las siete historias. |
| Persistencia | `localStorage` con claves `logistics:*` | Permite funcionar sin backend y conservar datos entre sesiones del mismo navegador. |
| Dominio | Módulos independientes bajo `src/domain/` | Separa reglas de negocio de componentes y evita acoplar las historias entre sí. |
| Componentes | Un formulario/listado por historia bajo `src/components/` | Facilita probar cada historia de forma independiente, según el principio de MVP. |
| Usuario de operación | Usuario activo del ERP, nunca un selector manual en movimientos/transferencias | Coherente con la clarificación 2026-11-03 y con la ausencia de autenticación. |
| Alertas | Derivadas de `STOCK` en el momento de consulta | No se persiste una tabla de alertas; desaparecen solas al superar el mínimo. |
| Reposiciones | Entidad propia `REPLENISHMENT_REQUESTS`; la recepción delega en HU-03 | Conserva trazabilidad y evita editar movimientos inmutables. |
| Pruebas | Vitest con jsdom, unitarias e integración | Cubre dominio y flujos de interfaz sin necesidad de backend. |
| Estilo | Tokens CSS y componentes liquid-glass discretos | Mantiene la identidad visual sin introducir dependencias de UI. |

## Decisiones pendientes de refuerzo

- Atomicidad de escrituras multi-clave en `movements.js`, `transfers.js` y `replenishments.js`: ver T081–T083.
- Escape completo de HTML en `storage.js`: ver T084.
- Verificación ejecutable de la suite: ver T066.

## Fuente

- `spec.md`: historias HU-01..HU-07, clarificaciones y criterios de éxito.
- `plan.md`: pila técnica y decisión de estructura.
- `data-model.md` y `contracts/logistics-storage.md`: esquemas y claves de persistencia.
- `tasks.md`: estado real y trabajo residual.
