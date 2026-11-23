# Investigación Técnica: Módulo de Logística e Inventario

**Feature**: `002-logistica-inventario`  
**Fecha**: 2026-11-17  
**Actualizado**: 2026-11-22 (HU-08)  
**Estado**: Decisiones consolidadas a partir de `plan.md`, `spec.md` y del código implementado, ampliadas con la gestión de roles y visibilidad

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

## Decisiones para HU-08 (2026-11-22)

| Tema | Decisión | Justificación |
|---|---|---|
| Estado inicial de la matriz (pregunta diferida en `/speckit.clarify`) | Sembrar `ROLE_PERMISSIONS` con los valores vigentes en `src/domain/permissions.js`: `administrador` con los 11 módulos y todas las acciones excepto `replenishments.receive`; `supervisor_inventario` con `dashboard`, `products`, `warehouses`, `stock`, `movements`, `transfers`, `alerts`, `replenishments` y únicamente `replenishments.create`; `encargado_bodega` con esos mismos módulos y `movements.register`, `movements.adjust`, `transfers.create`, `transfers.confirm`, `transfers.cancel` y `replenishments.receive`. | Mantener el comportamiento actual evita regresiones de HU-01–HU-07 y evita el bloqueo total que produciría una matriz vacía. Esta decisión cierra la pregunta no respondida sobre el estado inicial. |
| Landing page inicial | Valores semilla en `ROLES.default_landing_module`: `administrador` → `dashboard` (Panel general), `supervisor_inventario` → `alerts`, `encargado_bodega` → `movements`; `dashboard` se conserva como fallback (FR-119). | Coincide con las suposiciones ya registradas en `spec.md`; evita contradecir la historia y mantiene una entrada operativa por cargo. |
| Primeras excepciones individuales | Ninguna; `USER_PERMISSION_OVERRIDES` se siembra vacía. | El comportamiento inicial debe coincidir con la matriz por rol; las excepciones se crean solo desde el panel. |
| Modelo de permisos | Matriz por rol + excepciones por usuario, evaluadas como `reglaDeNegocio && (override ?? permisoRol ?? semillaRol)`. | FR-124 exige que la configuración solo opere dentro de lo permitido por las reglas de negocio; una excepción puede prevalecer sobre el cargo (SC-045), pero no superar una regla como la de quién puede recibir en HU-07. |
| Identificadores de recurso | `module:<nombre>`, `view:<nombre>`, `section:<id>`, `action:<id>` y `admin:permissions`, derivados de `MODULES` y `VIEWS`. | Reutiliza claves ya estables en `app.js` y `shell.js`, evita duplicar catálogos y simplifica las pruebas. |
| Panel de administración | Nueva vista `admin` con recurso `admin:permissions`, siempre permitida para `administrador` y oculta para los demás roles. | Cumple FR-118 y SC-048 sin depender de que la matriz sea editable por quien la administra. |
| Cambio de cargo | `setUserRole()` actualiza solo `USERS.role`, conserva `user_id` y bodega asignada, recalcula permisos y abre la landing del nuevo rol. | FR-120 y FR-121 prohíben alterar datos operativos o el usuario activo; la identidad del usuario no cambia, solo su cargo. |
| Disparadores de redirección | Al cargar la aplicación con el usuario activo por defecto, al cambiar el usuario activo en la cabecera y al cambiar el cargo del usuario activo. | Respuesta A confirmada en `/speckit.clarify` y coherente con FR-107, FR-116 y FR-117. |
| Acceso directo | Enrutado mínimo por hash `#/<module>` resuelto dentro de `showModule()`, con aviso y redirección a la landing cuando se deniega. | Hace verificable FR-115 y SC-043 sin añadir un router externo ni modificar el modelo SPA actual. |
| Persistencia | Tres claves nuevas bajo la convención `logistics:*`: `logistics:roles`, `logistics:role_permissions` y `logistics:user_permission_overrides`; semillas idempotentes. | Conserva el despliegue sin backend y la persistencia entre sesiones exigida por FR-122. |
| Saneamiento | Los textos configurables del panel pasan por `escapeHtml` antes de renderizarse. | Extiende FR-046, FR-092 y FR-103 a los nuevos campos de configuración (FR-123). |

## Decisiones pendientes de refuerzo

- Atomicidad de escrituras multi-clave en `movements.js`, `transfers.js` y `replenishments.js`: ver T081–T083.
- Escape completo de HTML en `storage.js`: ver T084.
- Verificación ejecutable de la suite, incluidos los casos HU-08 derivados de `plan.md`: ver T066.
- Implementación de las decisiones HU-08 anteriores: se incorporará como tareas nuevas cuando se ejecute `/speckit.tasks`.

## Fuente

- `spec.md`: historias HU-01..HU-08, clarificaciones y criterios de éxito.
- `plan.md`: pila técnica, decisión de estructura y diseño de HU-08.
- `data-model.md`, `MER.md` y `contracts/logistics-storage.md`: esquemas, relaciones y claves de persistencia.
- `src/domain/permissions.js`, `src/components/shell.js` y `src/app.js`: matriz vigente, navegación y cambio de usuario.
- `tasks.md`: estado real y trabajo residual.

## Decisiones para HU-09 (2026-11-23)

**Alcance**: documentar y verificar la funcionalidad OC/OV ya implementada. No se reprograma, no se renombran campos en código y no se modifica la planificación de HU-01 a HU-08.

| Tema | Decisión | Justificación | Alternativas consideradas |
|---|---|---|---|
| Enfoque de planeación | Planeación documental sobre el código existente, con inventario de evidencia y brechas | `src/domain/orders.js`, `src/components/order-list.js`, `index.html`, `tests/unit/orders.test.js` y `tests/integration/orders.test.js` ya implementan y validan OC/OV; rehacerlos generaría regresiones y duplicaría trabajo del grupo | Reimplementar `orders.js`; rechazado por redundante y por el requisito original de no rehacer la funcionalidad |
| Persistencia | Clave única `logistics:orders` con la lista completa de órdenes; el movimiento guarda `order_id` | Coincide con `LOGISTICS_KEYS.orders` y `LOGISTICS_SCHEMAS.orders` en `src/storage.js`; mantiene el patrón `logistics:*` del módulo | Tabla de contadores separada; rechazada porque no existe en el código y exigiría migración de datos |
| Numeración | `OC-0001`, `OV-0001`, etc., calculada con el máximo existente por prefijo y `padStart(4, '0')` | `nextOrderId()` ya resuelve secuencias independientes y detecta colisiones; las pruebas cubren continuidad tras huecos | Secuencia global compartida; rechazada por FR-126 y por cambiar el formato ya probado |
| Correspondencia de nombres | En documentación: `movement_id` de la spec equivale a `transaction_id` en código; `order_type` `"OC"`/`"OV"` de la spec equivale a `"adquisicion"`/`"venta"` más el prefijo en `order_id` | Permite alinear artifacts sin tocar la implementación ni invalidar los datos persistidos | Renombrar campos en `orders.js`; rechazado porque modificaría código y datos existentes |
| Regla de generación | Solo `entrada` → OC y `salida` → OV. Ajustes no entran en `ORDER_CONFIG`; reposiciones usan `generateOrder:false`; transferencias no llaman a `registerMovement()` | Refleja `src/domain/orders.js`, `src/domain/replenishments.js` y `src/domain/transfers.js`, y satisface FR-127 | Deducir el tipo desde cada historia; rechazado por duplicar decisiones ya centralizadas |
| Atomicidad | `stock`, `inventory_transactions` y `orders` se escriben dentro de `withStorageRollback()` | `registerMovement()` ya revierte las tres claves ante fallo; satisface FR-128 en la capa de dominio | Compensación manual posterior; rechazada por riesgo de registros parciales |
| UI y permisos | Panel «Órdenes generadas» dentro de Movimientos, sin módulo ni permiso `orders` | `index.html`, `order-list.js` y `app.js` ya lo renderizan bajo `guardModuleAccess('movements')`; cumple FR-129 | Vista propia con permiso nuevo; rechazada por HU-08 y por la clarificación 2026-11-23 |
| Verificación | Ampliar las pruebas existentes con los casos HU-09 y ejecutar la suite completa en T110 | Las pruebas cubren OC/OV, numeración, idempotencia, rollback, validación, esquema, error visible y no generación en ajustes/reposiciones | Crear una suite nueva desde cero; rechazado por duplicar cobertura existente |

### Brechas HU-09 cerradas y seguimiento restante

- Resuelta en T104: `errors.storage` se muestra en `error-movement-storage`; el rollback atómico se conserva.
- Resuelta en T105: `createOrderForMovement()` invoca `validateRecord('orders', ...)` antes de persistir.
- Resuelta en T106: `order_id` queda declarado como opcional en `LOGISTICS_SCHEMAS.movements` para preservar datos legacy.
- Resuelta en T109: `orderPrefixForMovementType()` se eliminó y `listOrders()` sitúa al final los `transaction_id` no numéricos.
- Aclarada en T108: no existe clave de contador; borrar `logistics:orders` reinicia la numeración, pero los correlativos no se reutilizan mientras se conserve el historial persistido.
- Diferida como T107: no hay filtros propios en el panel de órdenes ni columna de usuario; `listOrders()` añade solo nombres de producto y bodega en memoria.
- Decisión preservada: no se hace backfill de órdenes para movimientos legacy; los movimientos previos muestran `—` en la columna Orden y SC-051 se verifica sobre datos nuevos.

El seguimiento técnico quedó cerrado para T104–T106 y T108–T110 sin rehacer la funcionalidad; T107 permanece como mejora UX opcional.

## Decisiones para HU-10 y HU-11 (2026-11-23)

**Alcance**: ampliación documental y de diseño exclusivamente para el buscador/filtros de transferencias (HU-10) y el seguimiento de envíos al comprador (HU-11). No se reemplaza la planificación de HU-01 a HU-09, no se modifica código y no se crean ramas, commits ni push.

| Tema | Decisión | Justificación | Alternativas consideradas |
|---|---|---|---|
| Enfoque general | Ampliación aditiva de `plan.md`, `research.md`, `data-model.md`, `MER.md`, `contracts/logistics-storage.md` y `quickstart.md`; `tasks.md` queda para `/speckit.tasks`. | Cumple el requisito de conservar el trabajo existente y deja la generación de tareas para su fase correspondiente. | Reescribir los artefactos completos; rechazado porque sobrescribiría HU-01–HU-09. |
| Clarificaciones | No quedan `NEEDS CLARIFICATION` para HU-10/HU-11: las cinco decisiones funcionales están registradas en `spec.md`, sesión 2026-11-23. | Las preguntas sobre roles, cardinalidad, transiciones, ubicación de la vista y semántica de búsqueda ya fueron respondidas. | Volver a preguntar; rechazado por redundante. |
| HU-10 — API de consulta | Extender `listTransfers()` con un argumento opcional `filters = { term, status, productId, sourceWarehouseId, targetWarehouseId }`. `term` aplica coincidencia parcial e insensible a mayúsculas sobre `product_name` y sobre la representación textual de `transfer_id`; los filtros se combinan con AND. | Mantiene compatible la API actual: sin filtros devuelve exactamente el listado actual que consume el panel y el dashboard. | Crear una función `searchTransfers()` paralela; rechazada por duplicar reglas de listado y ordenación. |
| HU-10 — UI y permisos | Añadir los controles dentro de la tarjeta existente «Transferencias registradas» (`#view-transfers`) y una columna `#ID` para hacer verificable la búsqueda por identificador. No se crea permiso nuevo: se hereda `module:transfers`. | Reutiliza `.toolbar`, `.filter-grid`, `transfer-list-empty` y el guard existente, sin tocar navegación ni matriz. | Módulo propio o permiso `transfers.search`; rechazado porque un recurso no sembrado produjo denegación por defecto y porque HU-10 es solo lectura. |
| HU-10 — Integridad | La búsqueda no escribe `STOCK_TRANSFERS`, `STOCK`, catálogos ni movimientos; los IDs de filtros se normalizan con `Number(...)`. | Evita regresiones de solo lectura y desajustes entre valores `string` del DOM e IDs numéricos persistidos. | Filtrar solo en el componente; rechazado porque dejaría la regla fuera del dominio y sin prueba unitaria. |
| HU-11 — Persistencia | Nueva clave `logistics:shipments` con una lista completa de envíos. `shipment_id` entero secuencial; `order_id` único con FK lógica a una orden OV existente; historial embebido `history[]`. | Sigue el contrato una-clave-por-entidad y evita coordinar dos escrituras para el envío y su historial. | Clave `logistics:shipment_history` separada; rechazada por exigir rollback multi-clave sin beneficio funcional. |
| HU-11 — Restricción de unicidad | Declarar `unique: [['shipment_id'], ['order_id']]` y validar en dominio que la orden referenciada tenga `order_type = "venta"`. | `shipment_id` es PK y `order_id` materializa la relación 1:1 confirmada en clarificaciones; el tipo de orden no puede expresarse en el esquema genérico. | Unicidad compuesta plana o confiar solo en la UI; rechazado por permitir duplicados y por no cubrir acceso directo. |
| HU-11 — Estados | Persistir `en_bodega`, `en_transito`, `en_reparto`, `entregado` con etiquetas visibles «En bodega», «En tránsito», «En reparto», «Entregado». Solo se permite avanzar al estado inmediatamente siguiente; `entregado` es terminal. | Coincide con la clarificación de avance secuencial y con el patrón de estados semilla + etiquetas usado por reposiciones. | Retroceso libre o salto de etapas; rechazado por la clarificación 2026-11-23. |
| HU-11 — Historial y actor | Cada envío nace con un evento `en_bodega`; cada avance agrega `{ status, changed_at, changed_by }` con el usuario activo validado. | Conserva fecha, hora y responsable exigidos por la historia sin crear una entidad adicional. | Historial solo en memoria; rechazado porque debe persistir entre sesiones. |
| HU-11 — Permisos | Añadir `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status`. La semilla permite módulo, vista y acciones a los tres roles; la matriz solo puede restringir (FR-118, FR-124). | La clarificación respondió que los tres roles pueden actualizar estados; la creación se alinea con el acceso al módulo sin introducir una regla nueva. | Permiso `action:shipments.search` o restricción exclusiva a administrador; rechazado por no estar en la clarificación y por añadir fricción innecesaria. |
| HU-11 — Semilla existente | No reescribir `ROLE_PERMISSIONS` ya persistido; el fallback de `getEffectivePermission()` cubre las filas nuevas ausentes. | Preserva personalizaciones anteriores y evita reabrir decisiones de HU-08. | Migración automática de matriz; rechazada por sobrescribir configuración del usuario. |
| HU-11 — Aislamiento | `src/domain/shipments.js` no llama a `registerMovement()`, no modifica `STOCK` y no altera `logistics:orders`; solo valida la orden de origen y persiste el envío. | HU-11 exige que el seguimiento no genere movimientos adicionales ni reescriba el stock. | Reutilizar el flujo de reposiciones; rechazado porque sí crea movimiento de entrada. |
| HU-11 — UI | Nuevo módulo `shipments` con `shipment-form.js` y `shipment-list.js`, ruta `#/shipments`, botón en la barra lateral y guard mediante `showModule()`. | Es la decisión confirmada en clarificaciones y sigue el patrón extremo a extremo de reposiciones y permisos. | Panel dentro de Movimientos u Órdenes; rechazado por la clarificación 2026-11-23. |
| Pruebas | Ampliar pruebas unitarias/de integración de transferencias; añadir `tests/unit/shipments.test.js` y `tests/integration/shipments.test.js`; ajustar el recuento esperado de botones de navegación de 11 a 12. | Cubre dominio, interfaz, permisos y no mutación sin rehacer la suite existente. | Suite nueva aislada; rechazada por duplicar configuración y helpers. |
| Datos de demostración | No generar órdenes OV retroactivas ni envíos semilla; la vista puede estar vacía hasta registrar una salida real. | Conserva el historial HC-09 y evita backfill no solicitado. | Sembrar envíos de ejemplo; rechazado por alterar datos operativos previos. |

### Fuentes de la investigación

- `src/domain/transfers.js`, `src/components/transfer-list.js`, `src/app.js`, `src/domain/permissions.js`, `src/domain/seed.js`, `index.html`, `src/styles.css`: patrón actual de listado, filtros, permisos y navegación.
- `src/storage.js`, `src/domain/orders.js`, `src/domain/replenishments.js`: contrato de persistencia, validación, rollback y transiciones.
- `tests/unit/transfers.test.js`, `tests/integration/transfers.test.js`, `tests/integration/workspace-shell.test.js`, `tests/unit/orders.test.js`, `tests/integration/orders.test.js`: organización y helpers de prueba.

**Resultado**: todas las decisiones técnicas necesarias para pasar a la Fase 1 están resueltas; no se requiere volver a `/speckit.clarify`.
