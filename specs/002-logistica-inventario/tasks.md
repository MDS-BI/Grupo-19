# Tareas: Módulo de Logística e Inventario

**Entrada**: Documentos de diseño desde `/specs/002-logistica-inventario/`
**Prerrequisitos**: `plan.md`, `spec.md`, `data-model.md`, `MER.md`, `contracts/`, `research.md`, `quickstart.md`
**Pruebas**: Se incluyen tareas de prueba conforme al Principio II de la Constitución (Test-First & Verification).
**Estado de marcado (2026-11-17; ampliado 2026-11-22)**: Los ítems `[x]` tienen evidencia de implementación en `src/`, `index.html` y/o `tests/`. Las tareas T085–T094 de HU-08 están pendientes. No se ejecutó la suite completa durante la edición documental; T066 permanece pendiente.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo solo si toca archivos distintos y sin dependencias pendientes.
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1, US2, US3, US4, US5, US6, US7, US8).
- Incluir rutas de archivo exactas en las descripciones.
- Las tareas marcadas como parciales conservan `[ ]` y describen el faltante para no sobrestimar el estado real.

## Convenciones de Rutas

- Aplicación única: `src/` y `tests/` en la raíz del repositorio
- Componentes de interfaz: `src/components/`
- Lógica de dominio: `src/domain/`
- Pruebas unitarias: `tests/unit/`
- Pruebas de integración: `tests/integration/`

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Verificar el estado actual, alinear la documentación y conservar la implementación existente sin restauraciones destructivas.

- [x] T001 Actualizar `specs/002-logistica-inventario/plan.md` con el dominio de logística, la pila técnica y la estructura final de `src/domain/` y `src/components/`
- [x] T002 Verificar que `index.html`, `src/` y `vitest.config.mjs` permanecen sin cambios frente a `HEAD`, que las 8 claves originales `logistics:*` están en `src/storage.js:12-21` y que las 7 vistas `view-*` están en `index.html`. NO restaurar archivos desde commits antiguos. Evidencia: `git diff --exit-code HEAD -- index.html src vitest.config.mjs` → sin cambios; comprobación de claves/vistas → 8/8 y 7/7.
- [x] T003 Verificar que el inventario actual de pruebas en `tests/unit/` y `tests/integration/` cubre las siete historias implementadas; la cobertura de HU-08 se añade en T085–T086. La ejecución completa de la suite se registra en T066.
- [x] T004 [P] Configurar el nombre, etiquetas, ciclo de vida y color de acento del módulo en `src/module-config.js`
- [x] T005 [P] Crear los catálogos semilla de `PRODUCT_CATEGORIES` y `USERS` en `src/domain/seed.js`
- [x] T006 [P] Añadir tokens de diseño y estilos base para las pantallas logísticas en `src/styles.css`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear el almacenamiento, la validación y el enrutamiento compartidos de los que dependen todas las historias.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [x] T007 Definir las claves de almacenamiento y los esquemas de `PRODUCTS`, `PRODUCT_CATEGORIES`, `WAREHOUSES`, `USERS`, `STOCK`, `INVENTORY_TRANSACTIONS` y `STOCK_TRANSFERS` en `src/storage.js` — completado: `REPLENISHMENT_REQUESTS` incluido explícitamente en `LOGISTICS_SCHEMAS`.
- [x] T008 Implementar los helpers de repositorio (IDs secuenciales, marcas de tiempo, CRUD, unicidad y validación de FK) en `src/storage.js` — completado: helpers y metadata de esquema disponibles para validación/FK/unicidad en `src/storage.js`.
- [x] T009 Implementar la carga idempotente de los catálogos semilla en `src/storage.js`
- [x] T010 [P] Añadir las entradas de barra lateral y los contenedores de las pantallas Productos, Bodegas, Stock, Movimientos y Transferencias en `index.html` y `src/components/shell.js`
- [x] T011 Registrar las rutas y vistas de las cinco pantallas logísticas en `src/app.js`
- [x] T012 Añadir los helpers compartidos de saneamiento y validación (obligatorio, numérico no negativo, único, fecha y escape de texto/HTML para prevenir la ejecución de contenido no deseado) en `src/storage.js`, aplicados en los formularios y listados de productos, bodegas, movimientos y transferencias (FR-046, FR-092) — completado: `escapeHtml` cubre `& < > " ' \`` y se aplica en formularios y listados.
- [x] T013 [P] Añadir pruebas unitarias de esquemas, repositorio, carga de semillas y saneamiento/escape de texto en `tests/unit/storage.test.js` — completado: pruebas de escape y rollback cubren los casos residuales.

**Punto de control**: La base operativa está implementada y permitió las siete historias; quedan ajustes de validación centralizada (T007, T008, T012, T013).

---

## Fase 3: Historia de Usuario 8 - Gestión de Roles, Redirección Inicial y Control de Visibilidad (Prioridad: P1) (Transversal)

**Nota de IDs**: Los IDs T085–T094 se conservan correlativos por trazabilidad con `plan.md`; el orden canónico de ejecución es el de esta fase.

**Objetivo**: Asignar y cambiar cargos, definir landing pages por rol, administrar una matriz de permisos con excepciones individuales y controlar la visibilidad y el acceso directo a vistas.

**Prueba Independiente**: Con los tres roles semilla, cargar la aplicación y cambiar el usuario activo para verificar la landing de cada cargo; cambiar el cargo de un usuario y comprobar que la navegación se recalcula de inmediato; desmarcar un módulo y confirmar que su enlace desaparece y que la ruta directa `#/<modulo>` muestra un aviso y redirige; definir una excepción individual que prevalezca sobre el rol sin alterar productos, bodegas, stock, movimientos, transferencias ni reposiciones.

### Pruebas para la Historia de Usuario 8

> **Nota**: Escribir estas pruebas primero y verificar que fallan antes de ejecutar T087–T094.

- [x] T085 [P] [US8] Añadir pruebas unitarias en `tests/unit/permissions.test.js` para semilla de roles, excepciones individuales, precedencia `reglaDeNegocio && (excepciónIndividual ?? permisoDelCargo ?? semillaDelCargo)`, rol desconocido limitado a `dashboard` sin acciones y `admin:permissions` siempre permitido para `administrador` (FR-105, FR-118, FR-124, SC-045, SC-048, SC-050)
- [x] T086 [P] [US8] Añadir pruebas de integración en `tests/integration/permissions.test.js` para landing al cargar y al cambiar de usuario, cambio de cargo, ocultamiento de navegación, bloqueo de ruta directa, excepción individual y ausencia de cambios en datos operativos ni en el usuario activo (FR-104, FR-107, FR-113–FR-115, FR-120, FR-121, SC-040–SC-047)

### Implementación de la Historia de Usuario 8

- [x] T087 [US8] Añadir las claves `logistics:roles`, `logistics:role_permissions` y `logistics:user_permission_overrides` a `LOGISTICS_KEYS` y los helpers `loadRoles`/`saveRoles`, `loadRolePermissions`/`saveRolePermissions` y `loadUserPermissionOverrides`/`saveUserPermissionOverrides` en `src/storage.js`, respetando literalmente: `ROLES.role_key` "PK, obligatorio y único; la semilla contiene `administrador`, `supervisor_inventario` y `encargado_bodega`", `ROLES.role_label` "Obligatoria, no vacía; escapada antes de mostrarse", `ROLES.default_landing_module` "Obligatoria; debe corresponder a un módulo conocido; semilla: `administrador` → `dashboard`, `supervisor_inventario` → `alerts`, `encargado_bodega` → `movements`; fallback `dashboard`", `ROLES.is_admin` "Obligatoria; `true` solo para `administrador` en la semilla", `ROLES.description` "Opcional; escapada antes de mostrarse", `ROLE_PERMISSIONS.role_key` "PK compuesta, FK a `ROLES.role_key`, obligatoria", `ROLE_PERMISSIONS.scope` "PK compuesta, obligatoria; valores: `modulo`, `vista`, `seccion`, `accion`, `panel`", `ROLE_PERMISSIONS.resource_key` "PK compuesta, obligatoria; formatos `module:<nombre>`, `view:<nombre>`, `section:<id>`, `action:<id>` y `admin:permissions`", `ROLE_PERMISSIONS.allowed` "Obligatorio; nunca puede otorgar una acción prohibida por FR-124", `USER_PERMISSION_OVERRIDES.user_id` "PK compuesta, FK a `USERS.user_id`, obligatoria", `USER_PERMISSION_OVERRIDES.scope` "PK compuesta, obligatoria; mismo dominio que `ROLE_PERMISSIONS.scope`", `USER_PERMISSION_OVERRIDES.resource_key` "PK compuesta, obligatoria; mismo dominio que `ROLE_PERMISSIONS.resource_key`" y `USER_PERMISSION_OVERRIDES.allowed` "Obligatorio; prevalece sobre el cargo, sin saltarse FR-124" (FR-122, FR-123)
- [x] T088 [US8] Sembrar `ROLES` y `ROLE_PERMISSIONS` de forma idempotente en `src/domain/seed.js` y dejar `USER_PERMISSION_OVERRIDES` vacío: roles `administrador`/`supervisor_inventario`/`encargado_bodega`, landings `dashboard`/`alerts`/`movements`, `is_admin` solo en administrador y matriz idéntica a `src/domain/permissions.js` (administrador con todas las acciones excepto `replenishments.receive`; supervisor solo `replenishments.create`; encargado con `movements.register`, `movements.adjust`, `transfers.create`, `transfers.confirm`, `transfers.cancel` y `replenishments.receive`) (FR-071, FR-106, FR-122)
- [x] T089 [US8] Refactorizar `src/domain/permissions.js` para leer la matriz desde almacenamiento y exponer `getEffectivePermission`, `setRolePermission`, `setUserPermissionOverride`, `setUserRole`, `setRoleLandingModule` y `resolveLandingModule`, conservando la API pública `MODULES`, `getRolePermissions`, `canAccessModule`, `canPerform`, `getActiveUserId`, `setActiveUserId`, `resolveActiveUser` y `roleLabel`, con la regla `reglaDeNegocio && (excepciónIndividual ?? permisoDelCargo ?? semillaDelCargo)` y `admin:permissions` siempre permitido para `administrador` (FR-104, FR-105, FR-108, FR-118, FR-124)
- [x] T090 [US8] Crear `src/components/permissions-panel.js` con matriz por rol, selección de landing page y cambio de cargo de usuarios, aplicando `escapeHtml` a nombres de roles, módulos y secciones antes de mostrarlos (FR-104, FR-109–FR-112, FR-123)
- [x] T091 [P] [US8] Añadir el contenedor `view-admin-permissions`, el botón `nav-admin` y los estilos del panel en `index.html` y `src/styles.css`, reutilizando los tokens existentes (FR-109, FR-118)
- [x] T092 [US8] Integrar los permisos efectivos en `applyNavigationPermissions()` de `src/components/shell.js` y en `applyPermissionUiState()` de `src/app.js`, ocultando o deshabilitando módulos, menús y botones no autorizados (FR-113, FR-114)
- [x] T093 [US8] Añadir enrutado mínimo por hash `#/<module>`, el guard con aviso en `showModule()`, la landing en `initApp()` y `onActiveUserChange()`, y el recálculo al cambiar cargo desde el panel en `src/app.js` (FR-107, FR-115–FR-117, SC-040, SC-043)
- [x] T094 [P] [US8] Actualizar `README.md` con el panel de permisos, las landing pages por rol y las claves `logistics:roles`, `logistics:role_permissions` y `logistics:user_permission_overrides`, sin modificar `package.json` ni `package-lock.json` (FR-122)

**Punto de control**: Los tres roles semilla acceden solo a sus vistas permitidas, las landing pages se abren en los disparadores definidos, la matriz y las excepciones persisten y ningún dato operativo se altera.

---

## Fase 4: Historia de Usuario 1 - Registro y Modificación de Productos (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir registrar y modificar productos con SKU único, precios, categoría y estado.

**Prueba Independiente**: Crear un producto con todos los campos obligatorios, verlo en el catálogo, editar su precio y confirmar que `updated_at` cambia sin alterar otros registros.

### Pruebas para la Historia de Usuario 1

- [x] T014 [P] [US1] Añadir pruebas unitarias de campos obligatorios, SKU único (incluida su edición cuando el producto ya tiene movimientos asociados), precios no negativos con advertencia no bloqueante cuando el costo supere el precio de venta, FK de categoría, Estado por defecto "activo" y marcas de tiempo en `tests/unit/products.test.js` (FR-088, FR-089, FR-091) — completado: advertencia costo > precio y SKU editable con historial cubiertos.
- [x] T015 [P] [US1] Añadir pruebas de integración para crear y editar productos, conflicto de SKU y retroalimentación de validación en `tests/integration/products.test.js`

### Implementación de la Historia de Usuario 1

- [x] T016 [P] [US1] Implementar el servicio de productos (crear, actualizar, listar, buscar y validar SKU/precios) en `src/domain/products.js`
- [x] T017 [P] [US1] Crear el formulario de producto con campos obligatorios, opcionales, selector de categoría y Estado asignado por defecto a "activo" (no solicitado en creación) en `src/components/product-form.js` (FR-091)
- [x] T018 [P] [US1] Crear el listado de productos con estado, precios, categoría y acción de edición en `src/components/product-list.js`
- [x] T019 [US1] Conectar crear, editar, listar y buscar productos con la retroalimentación de validación en `src/app.js`
- [x] T020 [US1] Aplicar la validación de categoría existente y el estado activo/inactivo, incluida la desactivación con stock existente (mostrado solo para consulta), en `src/domain/products.js` (FR-090)
- [x] T021 [US1] Implementar la búsqueda y el filtro por nombre, SKU y categoría en `src/domain/products.js` y `src/app.js`
- [x] T022 [US1] Añadir los estilos de la pantalla de productos en `src/styles.css`

**Punto de control**: La Historia de Usuario 1 está funcional y es comprobable de forma independiente.

---

## Fase 5: Historia de Usuario 4 - Registro y Administración de Bodegas (Prioridad: P1)

**Objetivo**: Registrar, editar y cambiar el estado de las bodegas.

**Prueba Independiente**: Registrar una bodega, editar su ubicación, desactivarla y verificar que no aparece en los selectores operativos.

### Pruebas para la Historia de Usuario 4

- [x] T023 [P] [US4] Añadir pruebas unitarias de nombre/ubicación obligatorios, nombre único, capacidad no negativa, estado y exclusión de inactivas en `tests/unit/warehouses.test.js`
- [x] T024 [P] [US4] Añadir pruebas de integración para crear, editar y cambiar el estado de bodegas en `tests/integration/warehouses.test.js`

### Implementación de la Historia de Usuario 4

- [x] T025 [P] [US4] Implementar el servicio de bodegas (crear, actualizar, listar, cambiar estado y validar nombre único) en `src/domain/warehouses.js`
- [x] T026 [P] [US4] Crear el formulario de bodega en `src/components/warehouse-form.js`
- [x] T027 [P] [US4] Crear el listado de bodegas con acción de cambio de estado en `src/components/warehouse-list.js`
- [x] T028 [US4] Conectar las pantallas de crear, editar y cambiar estado de bodegas en `src/app.js`
- [x] T029 [US4] Excluir las bodegas inactivas de los selectores de movimientos y transferencias en `src/domain/warehouses.js`
- [x] T030 [US4] Añadir los estilos de la pantalla de bodegas en `src/styles.css`

**Punto de control**: Las Historias de Usuario 1 y 4 funcionan de forma independiente.

---

## Fase 6: Historia de Usuario 3 - Registrar entradas y salidas de inventario (Prioridad: P1)

**Objetivo**: Registrar entradas, salidas y ajustes que actualicen `STOCK` de inmediato y conserven un historial inmutable.

**Prueba Independiente**: Una entrada crea o incrementa stock; una salida con existencias lo descuenta; una salida sin stock se rechaza sin alterar el inventario; el historial muestra usuario y fecha automática sin acciones de edición ni eliminación.

### Pruebas para la Historia de Usuario 3

- [x] T031 [P] [US3] Añadir pruebas unitarias de efectos de entrada/salida/ajuste, rechazo por stock insuficiente, inmutabilidad y fecha/usuario automáticos en `tests/unit/movements.test.js` — completado: rollback cubierto por pruebas de dominio.
- [x] T032 [P] [US3] Añadir pruebas de integración para registrar movimientos, consultar el historial y confirmar la ausencia de acciones de edición/eliminación en `tests/integration/movements.test.js`

### Implementación de la Historia de Usuario 3

- [x] T033 [P] [US3] Implementar el servicio de movimientos con actualización atómica de `STOCK` y los tipos `entrada`, `salida`, `ajuste_entrada` y `ajuste_salida` en `src/domain/movements.js` — completado: `registerMovement` usa `withStorageRollback` sobre stock e historial.
- [x] T034 [P] [US3] Crear el formulario de movimiento con selectores de producto, bodega y cantidad, usando el usuario activo del ERP (`app.js:376`) en lugar de un selector manual en `src/components/movement-form.js`
- [x] T035 [P] [US3] Crear el historial inmutable de movimientos con acción de ajuste en `src/components/movement-list.js`
- [x] T036 [US3] Conectar la pantalla de movimientos y la retroalimentación de éxito/error en `src/app.js`
- [x] T037 [US3] Bloquear la edición/eliminación y canalizar las correcciones por `ajuste_entrada`/`ajuste_salida` en `src/domain/movements.js` y `src/components/movement-list.js`
- [x] T038 [US3] Añadir los estilos de la pantalla de movimientos en `src/styles.css`

**Punto de control**: El flujo operativo de inventario funciona de extremo a extremo.

---

## Fase 7: Historia de Usuario 5 - Transferencias de Productos entre Bodegas (Prioridad: P2)

**Objetivo**: Registrar, confirmar y cancelar transferencias entre bodegas actualizando el stock solo al confirmar.

**Prueba Independiente**: Crear una transferencia de 10 unidades entre bodegas distintas, verificar el estado `pendiente` y `created_by`, confirmarla con `confirmed_by` y comprobar el descuento/incremento simultáneo en `STOCK`.

### Pruebas para la Historia de Usuario 5

- [x] T039 [P] [US5] Añadir pruebas unitarias de bodegas distintas, stock suficiente en origen, estados `pendiente`/`confirmada`/`cancelada`, `created_by`/`confirmed_by`/`cancelled_by`, bloqueo de confirmación con bodega de origen o destino inactiva y ausencia de doble actualización en `tests/unit/transfers.test.js` (FR-085, FR-086, FR-087) — completado: doble confirmación y rollback cubiertos.
- [x] T040 [P] [US5] Añadir pruebas de integración para solicitar, confirmar y cancelar una transferencia en `tests/integration/transfers.test.js`

### Implementación de la Historia de Usuario 5

- [x] T041 [P] [US5] Implementar el servicio de transferencias con solicitud, confirmación, cancelación (con `cancelled_by`, solo permitida desde estado `pendiente`, sin modificar `STOCK`) y actualización atómica de `STOCK` en `src/domain/transfers.js` (FR-085, FR-086) — completado: confirmación atómica con rollback sobre stock y transferencias.
- [x] T042 [P] [US5] Crear el formulario de transferencia con producto, bodega origen, bodega destino y cantidad, usando el usuario activo del ERP (`app.js:417`) en lugar de un selector manual en `src/components/transfer-form.js`
- [x] T043 [P] [US5] Crear el listado de transferencias con estado y acciones de confirmar/cancelar en `src/components/transfer-list.js`
- [x] T044 [US5] Conectar la pantalla de transferencias y la retroalimentación de validación en `src/app.js`
- [x] T045 [US5] Impedir modificaciones a transferencias confirmadas o canceladas y bloquear la confirmación cuando la bodega de origen o destino esté inactiva en `src/domain/transfers.js` (FR-087)
- [x] T046 [US5] Añadir los estilos de la pantalla de transferencias en `src/styles.css`

**Punto de control**: Las transferencias actualizan el stock solo al confirmarse y son inmutables después.

---

## Fase 8: Historia de Usuario 2 - Control de Stock (Prioridad: P2)

**Objetivo**: Consultar existencias por producto y bodega, con totales y filtros, sin modificar datos.

**Prueba Independiente**: Consultar un producto con stock en varias bodegas, verificar cantidades y total, aplicar filtros y comprobar que ningún registro cambia.

### Pruebas para la Historia de Usuario 2

- [x] T047 [P] [US2] Añadir pruebas unitarias de agregación, cantidades por bodega, totales, filtros y comportamiento de solo lectura en `tests/unit/stock.test.js` — completado: filtros combinados y stock cero vs. sin registro cubiertos.
- [x] T048 [P] [US2] Añadir pruebas de integración para filtros, totales, estado vacío y distinción entre sin registro y cantidad cero en `tests/integration/stock.test.js`

### Implementación de la Historia de Usuario 2

- [x] T049 [P] [US2] Implementar el servicio de consulta de stock de solo lectura con filtros por producto/bodega y totales en `src/domain/stock.js`
- [x] T050 [P] [US2] Crear el listado/detalle de stock con el estado de producto y bodega en `src/components/stock-list.js`
- [x] T051 [US2] Conectar los filtros, totales y estado vacío de la pantalla de stock en `src/app.js`
- [x] T052 [US2] Distinguir la ausencia de registro de una cantidad cero y mostrar los estados de producto/bodega en `src/components/stock-list.js`
- [x] T053 [US2] Añadir los estilos de la pantalla de stock en `src/styles.css`

**Punto de control**: Las cinco historias implementadas hasta esta fase (HU-01, HU-02, HU-03, HU-04 y HU-05) son funcionales e independientes; HU-06 y HU-07 se integran en las fases 8 y 9.

---

## Fase 9: Historia de Usuario 6 - Alertas de Stock Mínimo (Prioridad: P2)

**Objetivo**: Configurar el nivel mínimo por producto+bodega y consultar alertas cuando `quantity_available` cae en o por debajo de `min_stock_level`, incluyendo un indicador en Control de Stock.

**Prueba Independiente**: Configurar un `min_stock_level` para una combinación producto+bodega, registrar movimientos hasta que `quantity_available` sea menor o igual al mínimo, verificar la alerta en la pantalla dedicada y en el indicador de Control de Stock, y confirmar que desaparece automáticamente al reponer el stock por encima del mínimo.

### Pruebas para la Historia de Usuario 6

- [x] T054 [P] [US6] Añadir pruebas unitarias del umbral inclusivo, mínimo cero o sin configurar, ausencia de registro de stock, cálculo del déficit, filtros y solo lectura en `tests/unit/alerts.test.js`
- [x] T055 [P] [US6] Añadir pruebas de integración de la pantalla de alertas, filtros, estado vacío y el indicador visual en Control de Stock en `tests/integration/alerts.test.js`

### Implementación de la Historia de Usuario 6

- [x] T056 [P] [US6] Implementar el servicio de alertas derivado de `STOCK` (comparación `quantity_available` menor o igual a `min_stock_level` con mínimo mayor que cero, déficit y filtros) en `src/domain/alerts.js`
- [x] T057 [P] [US6] Crear el formulario/acción de configuración de `min_stock_level` (mayor o igual a cero) por producto+bodega para administradores en `src/components/stock-config.js`
- [x] T058 [P] [US6] Crear el listado dedicado de alertas con producto, bodega, cantidad actual, mínimo configurado, déficit, filtros y estado vacío en `src/components/alert-list.js`
- [x] T059 [US6] Añadir la entrada de barra lateral, el contenedor y la ruta de la pantalla de alertas y conectar la configuración de mínimos con la retroalimentación de validación en `index.html`, `src/components/shell.js` y `src/app.js`
- [x] T060 [US6] Mostrar el indicador visual de alerta en el listado de Control de Stock en `src/components/stock-list.js` y `src/app.js`
- [x] T061 [US6] Recalcular las alertas automáticamente tras movimientos, transferencias confirmadas y cambios de `min_stock_level`, sin persistir una tabla de alertas, en `src/domain/alerts.js` y `src/app.js`
- [x] T062 [US6] Añadir los estilos de la pantalla de alertas y del indicador de stock en `src/styles.css`

**Punto de control**: Las alertas se derivan de `STOCK`, reflejan el umbral inclusivo y desaparecen solas al superar el mínimo.

---

## Fase 10: Historia de Usuario 7 - Solicitudes de Reposición (Prioridad: P2)

**Nota de orden**: Los IDs T069–T080 se conservan por trazabilidad histórica. El orden canónico de ejecución es el de estas fases; Pulido pasa a la Fase 11.

**Objetivo**: Crear, aprobar, cancelar y recibir solicitudes de reposición con trazabilidad, conectando las alertas de HU-06 con entradas inmutables de HU-03.

**Prueba Independiente**: Generar una alerta, presionar "Solicitar", verificar el prefill del déficit, crear y aprobar la solicitud, recibirla como encargado y comprobar que se crea una sola entrada de stock y que la alerta desaparece.

### Pruebas para la Historia de Usuario 7

- [x] T069 [P] [US7] Añadir pruebas unitarias de estados, validaciones, cancelación, trazabilidad y recepción única en `tests/unit/replenishments.test.js`
- [x] T070 [P] [US7] Añadir pruebas de integración de creación manual y desde alerta, permisos por rol, aprobación, recepción, cancelación, filtros e indicadores en `tests/integration/replenishments.test.js`

### Implementación de la Historia de Usuario 7

- [x] T071 [P] [US7] Añadir la clave `logistics:replenishment_requests` y los helpers `loadReplenishments`, `saveReplenishments` y `nextReplenishmentId` en `src/storage.js`
- [x] T072 [P] [US7] Implementar el dominio de reposiciones con `requestReplenishment`, `approveRequest`, `cancelRequest`, `receiveRequest`, `listReplenishments`, `replenishmentCounts` y `canCancelRequest` en `src/domain/replenishments.js`
- [x] T073 [P] [US7] Registrar el módulo `replenishments` y las acciones `create`, `approve`, `cancel` y `receive` por rol en `src/domain/permissions.js`
- [x] T074 [P] [US7] Crear el formulario de reposición con selects de producto/bodega, validación de cantidad, origen manual/alerta y prefill desde HU-06 en `src/components/replenishment-form.js`
- [x] T075 [P] [US7] Crear el listado de reposiciones con estados, trazabilidad, movimiento vinculado y acciones por permiso en `src/components/replenishment-list.js`
- [x] T076 [US7] Añadir la vista `#view-replenishments`, la navegación lateral, los filtros y el cableo de eventos en `index.html`, `src/app.js` y `src/components/shell.js`
- [x] T077 [US7] Añadir la acción "Solicitar" en el listado de alertas HU-06 en `src/components/alert-list.js` y `src/app.js`
- [x] T078 [US7] Mostrar el indicador de pendientes, el panel del dashboard y la acción rápida de reposición en `src/components/dashboard.js`
- [x] T079 [US7] Añadir estilos corporativos violeta/liquid-glass para reposiciones y estados en `src/styles.css`
- [x] T080 [P] [US7] Documentar la entidad, el contrato de almacenamiento y las reglas de HU-07 en `specs/002-logistica-inventario/`

**Punto de control**: Las solicitudes solo modifican stock al recibirse, y esa recepción crea un único movimiento inmutable vinculado por `movement_id`.

---

## Fase 11: Pulido y Preocupaciones Transversales

**Propósito**: Asegurar calidad, accesibilidad, rendimiento y documentación.

- [x] T063 [P] Actualizar `README.md` con el módulo de logística, semillas, pantallas y claves de persistencia
- [x] T064 [P] Añadir refinamientos de accesibilidad (etiquetas, orden de foco, `aria-current` y semántica de tablas) en `src/styles.css` y los componentes de `src/components/` — completado: tablas con `scope="col"` y navegación accesible preservada.
- [x] T065 [P] Verificar el rendimiento de listados y búsquedas con 500 registros en `src/domain/products.js`, `src/domain/warehouses.js`, `src/domain/movements.js`, `src/domain/transfers.js`, `src/domain/stock.js`, `src/domain/alerts.js` y `src/domain/replenishments.js`
- [x] T066 Ejecutar `npx vitest run` y `npm run build` en la raíz del repositorio para verificar que no hay regresiones, incluidos `tests/unit/permissions.test.js` y `tests/integration/permissions.test.js` de HU-08
- [x] T067 Validar manualmente los escenarios de aceptación de US1–US8 usando `specs/002-logistica-inventario/spec.md` y el recorrido de `specs/002-logistica-inventario/quickstart.md`, y registrar los resultados en `specs/002-logistica-inventario/tasks.md`
  - Evidencia (2026-11-22): `npx vitest run` 30 archivos / 260 pruebas OK; `npm run build` OK. Cobertura automatizada de aceptación: HU-01 `tests/integration/products.test.js`, HU-02 `tests/integration/stock.test.js`, HU-03 `tests/integration/movements.test.js`, HU-04 `tests/integration/warehouses.test.js`, HU-05 `tests/integration/transfers.test.js`, HU-06 `tests/integration/alerts.test.js`, HU-07 `tests/integration/replenishments.test.js`, HU-08 `tests/integration/permissions.test.js` + `tests/unit/permissions.test.js`. Residual HU-07/HU-03/HU-05 con rollback atómico verificado por unit tests.
- [x] T068 [P] Reconciliar `specs/002-logistica-inventario/plan.md`, `spec.md`, `tasks.md` y `checklists/requirements.md` con la estructura final implementada. Evidencia: esta edición documental de 2026-11-17.

### Trabajo residual identificado en la reconciliación

- [x] T081 [P] [US3] Reforzar la atomicidad de `registerMovement` en `src/domain/movements.js` y añadir la prueba de rollback en `tests/unit/movements.test.js`
- [x] T082 [P] [US5] Reforzar la atomicidad de `confirmTransfer` en `src/domain/transfers.js` y añadir la prueba de origen/destino en `tests/unit/transfers.test.js`
- [x] T083 [P] [US7] Reforzar la atomicidad de `receiveRequest` en `src/domain/replenishments.js` y añadir la prueba de movimiento único en `tests/unit/replenishments.test.js`
- [x] T084 [P] Completar el escape HTML de `escapeHtml` en `src/storage.js` para comillas dobles/simples y backticks, con prueba en `tests/unit/storage.test.js`

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- Configuración (Fase 1): sin dependencias; T002 es solo verificación, sin restauración.
- Fundacional (Fase 2): depende de T001–T003 y bloquea todas las historias.
- US8 (Fase 3): depende de la Fase 2; gobierna la navegación y el acceso directo de todas las historias y siembra la matriz vigente documentada en `research.md`.
- US1 (Fase 4): depende de la Fase 2 y de US8 para respetar la visibilidad configurada.
- US4 (Fase 5): depende de la Fase 2 y de US8; es independiente de US1.
- US3 (Fase 6): depende de US1 y US4.
- US5 (Fase 7): depende de US1 y US4.
- US2 (Fase 8): depende de US1, US3, US4 y US5.
- US6 (Fase 9): depende de US1, US2, US3, US4 y US5.
- US7 (Fase 10): depende de US1, US3, US4 y US6; usa el usuario activo del ERP, el prefill de HU-06 y la matriz de US8.
- Pulido (Fase 11): depende de las ocho historias y de la reconciliación documental T068.

### Dependencias entre Historias

- **US8 (P1)**: puede empezar tras la Fase 2; define permisos efectivos, landing pages y bloqueo de ruta. La semilla replica la matriz vigente de `src/domain/permissions.js`, por lo que debe reverificarse al integrar US7.
- **US1 (P1)**: puede empezar tras la Fase 2 y debe respetar la matriz de US8.
- **US4 (P1)**: puede empezar tras la Fase 2 y en paralelo con US1.
- **US3 (P1)**: requiere productos y bodegas registrados.
- **US5 (P2)**: requiere productos y bodegas registrados.
- **US2 (P2)**: requiere movimientos y transferencias confirmadas para reflejar existencias.
- **US6 (P2)**: requiere productos, bodegas, movimientos y transferencias confirmadas para evaluar alertas, y la pantalla de stock para mostrar el indicador visual.
- **US7 (P2)**: requiere US1 (productos), US3 (movimientos inmutables), US4 (bodegas) y US6 (alertas con déficit); el usuario activo se obtiene del ERP, no de un selector manual.

### Dentro de Cada Historia

- Las pruebas se escriben y fallan antes de la implementación.
- Servicios de dominio antes de la interfaz.
- Implementación antes de la integración en `src/app.js`.
- La historia se valida antes de pasar a la siguiente prioridad.

### Oportunidades Paralelas

- T004, T005 y T006 pueden ejecutarse en paralelo tras T002.
- T010, T012 y T013 pueden ejecutarse en paralelo dentro de la Fase 2; T012 ya no es `[P]` porque comparte `src/storage.js` con T007/T008.
- En US8, T085 y T086 pueden ejecutarse en paralelo; T091 y T094 también pueden paralelizarse con la implementación de dominio porque tocan `index.html`, `src/styles.css` y `README.md`. T087→T088→T089→T090→T092→T093 son secuenciales por dependencia de API y de los mismos archivos.
- US1 y US4 pueden desarrollarse simultáneamente tras la Fase 3.
- US5 puede iniciarse cuando US1 y US4 estén completas.
- US6 puede iniciarse cuando US1, US2, US3, US4 y US5 estén completas.
- US7 puede iniciarse cuando US1, US3, US4 y US6 estén completas; T069–T075 pueden ejecutarse en paralelo, pero T076 depende de la vista de alertas y del dashboard.
- US8 puede desarrollarse en paralelo con US1 y US4 una vez cerrada la Fase 2, siempre que se respete su propia cadena de dependencias.

---

## Ejemplo Paralelo: Historia de Usuario 1

```bash
# Pruebas de US1 en paralelo
Task: "Añadir pruebas unitarias de productos en tests/unit/products.test.js"
Task: "Añadir pruebas de integración de productos en tests/integration/products.test.js"

# Componentes de US1 en paralelo
Task: "Implementar el servicio de productos en src/domain/products.js"
Task: "Crear el formulario de producto en src/components/product-form.js"
Task: "Crear el listado de productos en src/components/product-list.js"
```

---

## Ejemplo Paralelo: Historia de Usuario 8

```bash
# Pruebas de US8 en paralelo
Task: "Añadir pruebas unitarias de permisos en tests/unit/permissions.test.js"
Task: "Añadir pruebas de integración de permisos en tests/integration/permissions.test.js"

# Trabajo independiente en paralelo con el dominio
Task: "Añadir view-admin-permissions y nav-admin en index.html y estilos en src/styles.css"
Task: "Actualizar README.md con claves y panel de permisos"

# Cadena secuencial de dominio e integración
Task: "Añadir claves y helpers en src/storage.js"
Task: "Sembrar ROLES y ROLE_PERMISSIONS en src/domain/seed.js"
Task: "Refactorizar src/domain/permissions.js"
Task: "Crear src/components/permissions-panel.js"
Task: "Integrar shell.js y app.js"
```

---

## Estrategia de Implementación

### MVP Primero (US8 + US1)

1. Completar la Fase 1: Configuración.
2. Completar la Fase 2: Fundacional (crítica).
3. Completar la Fase 3: US8 Roles, landing pages y visibilidad (P1 transversal).
4. Completar la Fase 4: US1 Productos.
5. **DETENERSE y VALIDAR**: probar el catálogo de productos con los tres roles y sus landing pages de forma independiente.
6. Demostrar si está listo.

El MVP histórico del módulo era solo US1; con HU-08 el MVP recomendado incluye US8 porque gobierna lo que cada usuario puede ver.

### Entrega Incremental

1. Configuración + Fundacional → base lista (sin restauraciones).
2. US8 → validar → demostrar (roles, landing pages y visibilidad).
3. US1 → validar → demostrar (MVP de producto con permisos aplicados).
4. US4 → validar → demostrar (base de ubicaciones).
5. US3 → validar → demostrar (flujo operativo).
6. US5 → validar → demostrar (multi-bodega).
7. US2 → validar → demostrar (consulta de existencias).
8. US6 → validar → demostrar (alertas de stock mínimo).
9. US7 → validar → demostrar (reposiciones desde alerta, con permisos por rol).
10. Pulido → verificación final (T066–T068 y residuales T081–T084).

### Estrategia de Equipo Paralelo

1. El equipo completa Configuración + Fundacional.
2. Tras la Fase 2:
   - Desarrollador A: US8 Roles y permisos.
   - Desarrollador B: US1 Productos.
   - Desarrollador C: US4 Bodegas.
3. Al completarse US8, US1 y US4:
   - Desarrollador A: US3 Movimientos.
   - Desarrollador B: US5 Transferencias.
   - Desarrollador C: US2 Control de Stock.
4. US6 según sus dependencias.
5. US7 tras US1, US3, US4 y US6.
6. Pulido y verificación final al final.

---

## Notas

- `[P]` indica tareas en archivos distintos sin dependencias pendientes.
- `[USn]` mapea cada tarea a su historia para trazabilidad; US7 equivale a HU-07 y US8 a HU-08.
- Los IDs T085–T094 son correlativos y su orden canónico es la Fase 3, no el orden numérico frente a T081–T084.
- Cada historia debe ser completable y comprobable de forma independiente.
- Verificar que las pruebas fallan antes de implementar.
- Los commits de esta actualización documental se gestionan mediante hooks opcionales; las tareas de implementación no hacen push automático.
- No se restauran versiones antiguas: T002 es una verificación no destructiva.
- Evitar tareas vagas y conflictos en el mismo archivo.

## Evidencia de Marcado

| Estado | IDs | Criterio usado |
|---|---|---|
| Completado | T001, T003–T006, T009–T011, T015–T030, T032, T034–T038, T040, T042–T046, T048–T063, T065, T068–T080 | Archivo o prueba presente en `src/`, `index.html`, `tests/` o documentación reconciliada. |
| Parcial | T007, T008, T012, T013, T014, T031, T033, T039, T041, T047, T064 | Implementación base presente con brecha descrita en la propia tarea; se mantiene `[ ]`. |
| Pendiente | T066, T067, T081–T084 | Ejecución/verificación o trabajo residual sin evidencia en el repositorio. |
| Nuevas HU-08 | T085–T094 | Generadas en 2026-11-22 a partir de `plan.md`; sin implementación aún. |
| Sustituida | T002 | Restauración eliminada; convertida en verificación segura del estado actual. |

`npx vitest run` y `npm run build` no se ejecutaron en esta edición; por eso T066 sigue pendiente aunque existan pruebas en el repositorio.
