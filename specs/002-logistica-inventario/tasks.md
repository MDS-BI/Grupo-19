# Tareas: Módulo de Logística e Inventario

**Entrada**: Documentos de diseño desde `/specs/002-logistica-inventario/`
**Prerrequisitos**: `plan.md`, `spec.md`, `data-model.md`, `MER.md`, `contracts/`, `research.md`, `quickstart.md`
**Pruebas**: Se incluyen tareas de prueba conforme al Principio II de la Constitución (Test-First & Verification).
**Estado de marcado (2026-11-17; ampliado 2026-11-22; auditado y ampliado 2026-11-25)**: Los ítems `[x]` tienen evidencia de implementación en `src/`, `index.html`, `tests/` y/o documentación. La auditoría de 2026-11-25 conserva `[ ]` en T002, T004, T007, T008, T012, T013, T031, T036, T048, T065 y T067 por evidencia parcial o validación manual pendiente. T085–T094, T095–T106, T108–T135, T137 y T138–T144 están verificados con su evidencia correspondiente; T066 incluye la ejecución de 34 archivos/302 pruebas y build correcto de 2026-11-25. T107 continúa diferida históricamente y es bloqueante del MVP canónico según Fase 20. T136 y T145 permanecen `[ ]`: el usuario confirmó manualmente pestañas, buscador/filtros y menú lateral, pero esa evidencia no cubre todos sus criterios; el detalle está en cada tarea. T146–T152 cubren HU-12/HU-14 sin renumerar ni sobrescribir tareas anteriores; T068 quedó reconciliado al ocultar la interfaz base sin borrar datos ni funciones. Verificación final de 2026-11-25: `npx vitest run` con 34 archivos/304 pruebas OK y `npm run build` correcto.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo solo si toca archivos distintos y sin dependencias pendientes.
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1–US8 originales; US9–US14 se añadieron en fases posteriores sin renumerar).
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
- [ ] T002 Verificar que `index.html`, `src/` y `vitest.config.mjs` permanecen sin cambios frente a `HEAD`, que las 8 claves originales `logistics:*` están en `src/storage.js:12-21` y que las 7 vistas `view-*` están en `index.html`. NO restaurar archivos desde commits antiguos. Evidencia histórica: `git diff --exit-code HEAD -- index.html src vitest.config.mjs` → sin cambios; comprobación de claves/vistas → 8/8 y 7/7. Auditoría 2026-11-25: parcial; `src/storage.js` y `index.html` tienen ahora 13 claves `logistics:*` y 13 vistas `view-*`, además de las vistas base, por lo que las cifras originales ya no coinciden sin borrar trabajo posterior.
- [x] T003 Verificar que el inventario actual de pruebas en `tests/unit/` y `tests/integration/` cubre las historias implementadas; la cobertura de HU-08 se añade en T085–T086 y la de HU-09–HU-11 en fases posteriores. La ejecución completa de la suite se registra en T066.
- [ ] T004 [P] Configurar el nombre, etiquetas, ciclo de vida y color de acento del módulo en `src/module-config.js` — parcial 2026-11-25: `src/module-config.js:21-24` define `moduleName` y `theme.accentColor`; `labels` y `statusLifecycle` no están declarados en `userConfig` y se usan valores predeterminados en `src/module-config.js:32-40`.
- [x] T005 [P] Crear los catálogos semilla de `PRODUCT_CATEGORIES` y `USERS` en `src/domain/seed.js`
- [x] T006 [P] Añadir tokens de diseño y estilos base para las pantallas logísticas en `src/styles.css`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear el almacenamiento, la validación y el enrutamiento compartidos de los que dependen todas las historias.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [ ] T007 Definir las claves de almacenamiento y los esquemas de `PRODUCTS`, `PRODUCT_CATEGORIES`, `WAREHOUSES`, `USERS`, `STOCK`, `INVENTORY_TRANSACTIONS` y `STOCK_TRANSFERS` en `src/storage.js` — parcial 2026-11-25: `REPLENISHMENT_REQUESTS` está incluido en `LOGISTICS_SCHEMAS`, pero `src/storage.js:12-46` no declara campos de `data-model.md:22-42,117-158` como `sale_price`, `created_at`, `created_by`, `min_stock_level`, `update_date`, `confirmed_by` ni `cancelled_by`.
- [ ] T008 Implementar los helpers de repositorio (IDs secuenciales, marcas de tiempo, CRUD, unicidad y validación de FK) en `src/storage.js` — parcial 2026-11-25: IDs, CRUD, rollback y unicidad existen en `src/storage.js:70-98,131-186`, pero las FK declaradas se limitan a `users.role`, `rolePermissions.role_key` y `userPermissionOverrides.user_id`; faltan las FK de productos, stock, movimientos, transferencias, reposiciones, órdenes y envíos.
- [x] T009 Implementar la carga idempotente de los catálogos semilla en `src/storage.js`
- [x] T010 [P] Añadir las entradas de barra lateral y los contenedores de las pantallas Productos, Bodegas, Stock, Movimientos y Transferencias en `index.html` y `src/components/shell.js`
- [x] T011 Registrar las rutas y vistas de las cinco pantallas logísticas en `src/app.js`
- [ ] T012 Añadir los helpers compartidos de saneamiento y validación (obligatorio, numérico no negativo, único, fecha y escape de texto/HTML para prevenir la ejecución de contenido no deseado) en `src/storage.js`, aplicados en los formularios y listados de productos, bodegas, movimientos y transferencias (FR-046, FR-092) — parcial 2026-11-25: `escapeHtml` cubre `& < > " ' \`` y se usa en listados y `src/storage.js:144-178,210-234`, pero los formularios de `src/components/product-form.js`, `warehouse-form.js`, `movement-form.js` y `transfer-form.js` usan `textContent`/`value`, no el helper compartido.
- [ ] T013 [P] Añadir pruebas unitarias de esquemas, repositorio, carga de semillas y saneamiento/escape de texto en `tests/unit/storage.test.js` — parcial 2026-11-25: hay cobertura de esquemas, semillas y escape en `tests/unit/storage.test.js:337-446`, pero la prueba de `withStorageRollback` está en `tests/unit/movements.test.js:87-100`, no en `storage.test.js`.

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
- [x] T017 [P] [US1] Crear el formulario de producto con campos obligatorios, opcionales, selector de categoría y Estado asignado por defecto a "activo" (no solicitado en creación) en `src/components/product-form.js` (FR-091) — actualizado 2026-11-25: sin selector manual de usuario; `created_by`/`updated_by` y el cambio de estado usan el usuario activo de la cabecera (`src/app.js`), con validación y pruebas en `tests/integration/products.test.js`.
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

- [ ] T031 [P] [US3] Añadir pruebas unitarias de efectos de entrada/salida/ajuste, rechazo por stock insuficiente, inmutabilidad y fecha/usuario automáticos en `tests/unit/movements.test.js` — parcial 2026-11-25: rollback y fecha están cubiertos en `tests/unit/movements.test.js:78-100`, pero la prueba no comprueba el `user_id` automático ni su derivación desde el usuario activo (`src/app.js:412-425`).
- [x] T032 [P] [US3] Añadir pruebas de integración para registrar movimientos, consultar el historial y confirmar la ausencia de acciones de edición/eliminación en `tests/integration/movements.test.js`

### Implementación de la Historia de Usuario 3

- [x] T033 [P] [US3] Implementar el servicio de movimientos con actualización atómica de `STOCK` y los tipos `entrada`, `salida`, `ajuste_entrada` y `ajuste_salida` en `src/domain/movements.js` — completado: `registerMovement` usa `withStorageRollback` sobre stock e historial.
- [x] T034 [P] [US3] Crear el formulario de movimiento con selectores de producto, bodega y cantidad, usando el usuario activo del ERP (`app.js:376`) en lugar de un selector manual en `src/components/movement-form.js`
- [x] T035 [P] [US3] Crear el historial inmutable de movimientos con acción de ajuste en `src/components/movement-list.js`
- [ ] T036 [US3] Conectar la pantalla de movimientos y la retroalimentación de éxito/error en `src/app.js` — parcial 2026-11-25: `src/app.js:398-432` y `src/components/movement-form.js` muestran errores, pero `index.html:747-780` solo define contenedores `error-movement-*`; falta el mensaje de éxito exigido por HU-03 en `spec.md:151`.
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

- [x] T041 [P] [US5] Implementar el servicio de transferencias con solicitud, confirmación, cancelación (con `cancelled_by`, solo permitida desde estado `pendiente`, sin modificar `STOCK`) y actualización atómica de `STOCK` en `src/domain/transfers.js` (FR-085, FR-086) — completado: confirmación atómica con rollback sobre stock y transferencias; `cancelled_by` se toma del usuario activo válido (`src/domain/transfers.js:105-115`) conforme a FR-085.
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
- [ ] T048 [P] [US2] Añadir pruebas de integración para filtros, totales, estado vacío y distinción entre sin registro y cantidad cero en `tests/integration/stock.test.js` — parcial 2026-11-25: filtros, totales y vacío están en `tests/integration/stock.test.js:75-92`, pero la distinción “sin registro” vs `quantity_available = 0` solo está cubierta en `tests/unit/stock.test.js:80-87`.

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
- [ ] T065 [P] Verificar el rendimiento de listados y búsquedas con 500 registros en `src/domain/products.js`, `src/domain/warehouses.js`, `src/domain/movements.js`, `src/domain/transfers.js`, `src/domain/stock.js`, `src/domain/alerts.js` y `src/domain/replenishments.js` — parcial 2026-11-25: `tests/unit/performance.test.js:18-77` mide productos, bodegas, stock, alertas, búsquedas y transferencias, pero no siembra transferencias para `listTransfers()` y no ejerce `listMovements()` ni `listReplenishments()` con 500 registros.
- [x] T066 Ejecutar `npx vitest run` y `npm run build` en la raíz del repositorio para verificar que no hay regresiones, incluidos `tests/unit/permissions.test.js` y `tests/integration/permissions.test.js` de HU-08 — evidencia 2026-11-25: 34 archivos/302 pruebas OK y build OK (`dist/index.html`, CSS y JS generados correctamente`).
- [ ] T067 Validar manualmente los escenarios de aceptación de `HU-01`–`HU-15` usando `specs/002-logistica-inventario/spec.md` y el recorrido de `specs/002-logistica-inventario/quickstart.md`, con foco en US1–US8 y verificación explícita de los criterios manuales de HU-09–HU-15 ya cubiertos parcialmente por T136/T145, y registrar los resultados en `specs/002-logistica-inventario/tasks.md`
  - Evidencia histórica (2026-11-22): `npx vitest run` 30 archivos / 260 pruebas OK; `npm run build` OK. Cobertura automatizada de aceptación: HU-01 `tests/integration/products.test.js`, HU-02 `tests/integration/stock.test.js`, HU-03 `tests/integration/movements.test.js`, HU-04 `tests/integration/warehouses.test.js`, HU-05 `tests/integration/transfers.test.js`, HU-06 `tests/integration/alerts.test.js`, HU-07 `tests/integration/replenishments.test.js`, HU-08 `tests/integration/permissions.test.js` + `tests/unit/permissions.test.js`. Residual HU-07/HU-03/HU-05 con rollback atómico verificado por unit tests.
  - Auditoría 2026-11-25: parcial; lo registrado es cobertura automatizada y las cifras quedaron desactualizadas. Falta el registro manual escenario por escenario de `HU-01`–`HU-15`/quickstart, incluidos los criterios visuales y de umbrales temporales pendientes.
- [x] T068 [P] Reconciliar `specs/002-logistica-inventario/plan.md`, `spec.md`, `tasks.md` y `checklists/requirements.md` con la estructura final implementada. Evidencia histórica: edición documental de 2026-11-17. Resolución 2026-11-25: la contradicción de HU-12/HU-14 quedó cerrada sin borrar funcionalidad: Entidades, Documentos, Búsqueda, Reposiciones y Envíos conservan sus vistas/formularios y siguen disponibles solo por código o rutas heredadas, pero no aparecen como accesos visibles; el menú lateral muestra seis secciones, el panel principal solo cuatro indicadores y Movimientos/Alertas usan pestañas. Verificado en T146–T152 con 34 archivos/304 pruebas y build correcto.

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
- Pulido (Fase 11): depende de las ocho historias originales y de la reconciliación documental T068; las fases 12–17 añadieron US9–US14 después.

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

El MVP histórico del módulo era solo US1; con HU-08 el MVP recomendado incluye US8 porque gobierna lo que cada usuario puede ver. Decisión vigente (Fase 20): el MVP canónico comprende `HU-01`–`HU-15`, no solo `US1`/`US8`.

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
10. Pulido → verificación final (T066–T068 y residuales T081–T084); después, fases 12–17 → US9–US14 y reconciliación visual final (T095–T152, con T107, T136 y T145 pendientes).

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
| Completado | T001, T003, T005–T006, T009–T011, T014–T030, T032–T035, T037–T047, T049–T064, T066, T069–T106, T108–T135, T137, T138–T144, T146–T152 | Archivo o prueba presente en `src/`, `index.html`, `tests/` o documentación reconciliada. |
| Parcial o pendiente de verificación | T002, T004, T007, T008, T012, T013, T031, T036, T048, T065, T067, T136, T145 | Implementación o documentación base presente con brecha descrita en la propia tarea; T136 y T145 tienen confirmación manual parcial del usuario, pero no cubren todos sus criterios; se mantienen `[ ]`. |
| Diferida históricamente, bloqueante del MVP | T107 | Mejora UX opcional de HU-09 no ejecutada; Fase 20 exige su evidencia para cerrar `HU-01`–`HU-15`. |
| Salto de numeración | T140 | No aparece en el historial conservado; la numeración pasa de T139 a T141 y no se renumera. |
| Completadas HU-08 | T085–T094 | Generadas en 2026-11-22 y verificadas con dominio, matriz, panel, enrutado y pruebas. |
| Sustituida | T002 | Restauración eliminada; convertida en verificación segura del estado actual y auditada como parcial en 2026-11-25. |

`npx vitest run` y `npm run build` no se ejecutaron en la edición documental original; T110 los ejecutó después para HU-09 con 279/279 pruebas OK y build OK. T066 conserva esa evidencia histórica y añade la verificación de 2026-11-25: 34 archivos/302 pruebas OK y build correcto. La verificación final de HU-12 a HU-14 se registró en T152 con 34 archivos/304 pruebas OK y build correcto.

---

## Fase 12: Historia de Usuario 9 - Gestión de Órdenes de Adquisición y Venta (Prioridad: P2) (Verificación y cierre de deuda HU-09)

**Nota de IDs**: T095–T110 son correlativos con las fases anteriores. Esta fase se añade al final por instrucción explícita; no reordena ni reemplaza T001–T094.

**Objetivo**: Registrar, verificar y cerrar la deuda HU-09 detectada sobre la funcionalidad OC/OV ya construida, sin reimplementar dominio, persistencia ni interfaz.

**Prueba Independiente**: Registrar una entrada y una salida normales, confirmar `OC-0001` y `OV-0001` en el historial y en el panel «Órdenes generadas»; registrar un ajuste, una recepción de reposición y una transferencia confirmada, confirmando que no generan orden; forzar un fallo de escritura y verificar que no quedan stock, movimiento ni orden; comprobar que el panel vive dentro de Movimientos y que no existe módulo ni permiso `orders`.

### Implementación existente y pruebas (verificación)

- [x] T095 [P] [US9] Verificar en `src/storage.js` la clave `logistics:orders`, el esquema `orders`, los helpers `loadOrders()`/`saveOrders()` y el uso de `withStorageRollback()` sin clave de contador, conservando `logistics:inventory_transactions` como fuente del campo `order_id` del movimiento (FR-125, FR-128)
- [x] T096 [US9] Verificar en `src/domain/orders.js` que `ORDER_CONFIG` mapea `entrada` → `OC`/`adquisicion` y `salida` → `OV`/`venta`, que `nextOrderId()` usa secuencias independientes con `padStart(4, '0')` y rechaza colisiones, y que `createOrderForMovement()` es idempotente por `transaction_id` o `order_id` (FR-125, FR-126)
- [x] T097 [US9] Verificar en `src/domain/movements.js` que `registerMovement()` invoca `createOrderForMovement()`, copia `order_id` al movimiento e incluye stock, movimientos y órdenes en `withStorageRollback()`; evidencia: rollback probado en `tests/unit/orders.test.js` (FR-128)
- [x] T098 [US9] Verificar que `src/domain/orders.js` no genera órdenes para ajustes, que `src/domain/replenishments.js` envía `generateOrder: false` en la recepción y que `confirmTransfer()` en `src/domain/transfers.js` no crea órdenes; evidencia: `tests/unit/orders.test.js` y `tests/integration/orders.test.js` (FR-127)
- [x] T099 [P] [US9] Verificar el panel «Órdenes generadas» y la columna Orden del historial en `index.html`, `src/components/order-list.js` y `src/components/movement-list.js`, con escape HTML, contador, estado vacío y sin opción propia en el menú lateral (FR-129)
- [x] T100 [US9] Verificar en `refreshMovements()` de `src/app.js` que `renderOrderList()` se actualiza junto al historial bajo `guardModuleAccess('movements')`, sin permiso ni guard `orders` (FR-129)
- [x] T101 [P] [US9] Verificar las 10 pruebas unitarias de `tests/unit/orders.test.js` para `OC-0001`/`OV-0001`, secuencias con huecos, idempotencia, exclusión de ajustes/reposiciones, rollback de stock/movimiento/orden, escritura única de stock, preservación de datos legacy y nombres de producto/bodega
- [x] T102 [P] [US9] Verificar las 5 pruebas de integración de `tests/integration/orders.test.js` para alta desde formulario, historial y panel, numeraciones independientes, exclusión de ajustes, panel dentro de Movimientos y movimientos legacy sin orden
- [x] T103 [P] [US9] Verificar la documentación HU-09 en `specs/002-logistica-inventario/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/logistics-storage.md`, `quickstart.md` y `checklists/requirements.md`, dejando CHK017–CHK018 sin marcar y sin renombrar `transaction_id` ni los valores `adquisicion`/`venta`

**Evidencia de ejecución (2026-11-23)**: verificación inicial 2 archivos/15 pruebas OK; cierre de deuda `npx vitest run tests/unit/orders.test.js` → 12 OK, `npx vitest run tests/unit/storage.test.js` → 43 OK, `npx vitest run tests/integration/orders.test.js` → 6 OK; `npx vitest run` → 32 archivos/279 pruebas OK; `npm run build` → OK.

### Deuda cerrada y verificaciones

- [x] T104 [P] [US9] Mostrar el error `errors.storage` devuelto por `registerMovement()` cuando falla la escritura: contenedor `error-movement-storage` en `index.html`, `ERROR_FIELDS` ampliado en `src/components/movement-form.js` y prueba en `tests/integration/orders.test.js`; rollback atómico conservado (FR-128). Evidencia: 6/6 pruebas de integración OK
- [x] T105 [US9] Reforzar `LOGISTICS_SCHEMAS.orders` invocando `validateRecord('orders', order, { list: orders })` desde `createOrderForMovement()` en `src/domain/orders.js`, con prueba de rechazo en `tests/unit/orders.test.js` y sin duplicar validaciones en la interfaz. Evidencia: 12/12 pruebas unitarias de órdenes OK
- [x] T106 [US9] Declarar `order_id` como opcional en `LOGISTICS_SCHEMAS.movements` de `src/storage.js` y verificarlo en `tests/unit/storage.test.js`, alineando el esquema con el campo ya persistido. Evidencia: 43/43 pruebas unitarias de almacenamiento OK
- [ ] T107 [US9] Diferida históricamente, bloqueante para el cierre del MVP canónico: añadir como mejora UX opcional los filtros por tipo de orden, producto y bodega y la columna de usuario en `src/components/order-list.js`, `src/app.js`, `index.html` y `src/styles.css`, con prueba en `tests/integration/orders.test.js`
- [x] T108 [US9] Documentar la política de numeración: no se reutilizan correlativos mientras se conserve `logistics:orders`; borrar esa clave reinicia la derivación del máximo y no se añade contador ni migración. Comportamiento de `src/domain/orders.js` preservado y aclarado en `spec.md`, `data-model.md` y `contracts/logistics-storage.md`
- [x] T109 [US9] Eliminar `orderPrefixForMovementType()` sin consumidores y corregir la ordenación por `transaction_id` con valores legacy no numéricos en `src/domain/orders.js`, con prueba de regresión en `tests/unit/orders.test.js`
- [x] T110 [US9] Ejecutar `npx vitest run` y `npm run build` en la raíz, incluyendo HU-01–HU-09, y actualizar la evidencia en `tasks.md`. Evidencia: 32 archivos/279 pruebas OK y build OK; T066 conserva su evidencia histórica de 2026-11-22

**Punto de control**: OC/OV se generan solo para entradas y salidas normales, numeraciones persisten sin reutilización mientras exista el historial, rollback es atómico y visible, panel depende solo de Movimientos, y la deuda cerrada no afecta lo ya implementado; T107 queda diferida históricamente y su evidencia es bloqueante para cerrar el MVP canónico.

### Dependencias HU-09 (complemento de la sección anterior)

- US9 (Fase 12): depende de la Fase 2, de US3 para los movimientos, de US4 para las bodegas y de US8 para el guard `movements`; no introduce Fase nueva en el código ni permiso `orders`.
- T095–T103 son verificaciones ya ejecutadas; T104–T106 y T108–T110 se ejecutaron y verificaron secuencialmente. T107 permanece diferida históricamente y es bloqueante según Fase 20.
- T104, T107 y T110 comparten `index.html`, `src/app.js` o `tests/integration/orders.test.js`; T104 y T110 se ejecutaron por separado, T107 sigue sin ejecutarse.
- T105 y T106 comparten `src/storage.js`; T105, T108 y T109 comparten `src/domain/orders.js`, por lo que se ejecutaron secuencialmente.

### Ejemplo Paralelo: Historia de Usuario 9

```bash
# Verificación de OC/OV ya ejecutada
Task: "npx vitest run tests/unit/orders.test.js"
Task: "npx vitest run tests/unit/storage.test.js"
Task: "npx vitest run tests/integration/orders.test.js"

# Cierre ejecutado
Task: "npx vitest run"
Task: "npm run build"
```

## Notas de Marcado HU-09

| Estado | IDs | Criterio usado |
|---|---|---|
| Completado | T095–T103, T104–T106, T108–T110 | Implementación, pruebas y documentación presentes; 279/279 pruebas OK y build OK el 2026-11-23. |
| Diferida históricamente, bloqueante del MVP | T107 | Mejora UX opcional no ejecutada; requiere evidencia antes de cerrar `HU-01`–`HU-15`. |

`npx vitest run` y `npm run build` se ejecutaron en esta edición HU-09 con resultado OK; T066 conserva su evidencia histórica.

---

## Fase 13: Historia de Usuario 10 - Buscador y filtros de transferencias entre bodegas (Prioridad: P2) (Ampliación 2026-11-23)

**Nota de alcance**: T111–T137 se añaden al final por instrucción explícita; no reordenan, reemplazan ni cambian el estado de T001–T110. T107 continúa diferida históricamente y es bloqueante del MVP canónico. Esta ampliación implementa solo HU-10 y HU-11, sin crear ramas, commits ni push desde la generación de tareas.

**Objetivo**: Buscar y filtrar transferencias registradas por producto, identificador de transferencia, bodegas y estado, conservando el listado completo por defecto y sin alterar datos operativos.

**Prueba Independiente**: Registrar varias transferencias con productos, bodegas y estados diferentes; aplicar búsquedas y filtros individuales y combinados; verificar el contador, la columna `#ID` y el estado vacío; limpiar los filtros; confirmar que transferencias, stock y movimientos permanecen intactos.

### Pruebas para la Historia de Usuario 10

> Escribir estas pruebas primero y verificar que fallan antes de tocar la implementación.

- [X] T111 [P] [US10] Añadir pruebas unitarias de `listTransfers(filters = {})` en `tests/unit/transfers.test.js` para: sin filtros conserva la ordenación por `transfer_id` descendente y los nombres enriquecidos; `term` aplica coincidencia parcial e insensible a mayúsculas sobre `product_name` y `String(transfer_id)`; `status`, `productId`, `sourceWarehouseId` y `targetWarehouseId` comparan de forma exacta con IDs normalizados mediante `Number(...)`; todos los filtros se combinan con AND; la consulta no escribe `logistics:stock_transfers`, `logistics:stock`, catálogos ni movimientos (FR-134; Escenarios HU-10 1–4, 7)
- [X] T112 [P] [US10] Añadir pruebas de integración en `tests/integration/transfers.test.js` para los controles `#transfer-search`, `#transfer-filter-status`, `#transfer-filter-product`, `#transfer-filter-source`, `#transfer-filter-target` y `#transfer-filters-clear` dentro de `#view-transfers`, la columna `#ID`, el contador `transfer-count`, el estado vacío `transfer-list-empty`, la combinación de filtros, la limpieza y la no mutación de transferencias, stock ni movimientos (FR-134; Escenarios HU-10 1–7)

### Implementación de la Historia de Usuario 10

- [X] T113 [P] [US10] Extender `listTransfers(filters = {})` en `src/domain/transfers.js` con los filtros opcionales `term`, `status`, `productId`, `sourceWarehouseId` y `targetWarehouseId`, conservando la firma sin argumentos, el enriquecimiento de nombres, la ordenación por `transfer_id` descendente, ignorando filtros vacíos o `undefined` y combinando los presentes con AND (FR-134; Escenarios HU-10 1–4, 7)
- [X] T114 [P] [US10] Añadir dentro de `#view-transfers` en `index.html` la barra de filtros de la tarjeta «Transferencias registradas» con `#transfer-search`, `#transfer-filter-status`, `#transfer-filter-product`, `#transfer-filter-source`, `#transfer-filter-target` y `#transfer-filters-clear`, reutilizando `.toolbar` y `.filter-grid`, sin crear permiso ni módulo nuevo (Escenarios HU-10 2–5)
- [X] T115 [P] [US10] Añadir la columna `#ID` a la tabla de `src/components/transfer-list.js` y a su cabecera en `index.html`, mostrando `transfer_id` escapado con `escapeHtml`, delante de Producto, conservando `transfer-count` y `transfer-list-empty` (Escenarios HU-10 1, 6)
- [X] T116 [US10] Conectar `refreshTransfers()` en `src/app.js` para leer los controles `#transfer-search`, `#transfer-filter-status`, `#transfer-filter-product`, `#transfer-filter-source` y `#transfer-filter-target`, construir el objeto `filters`, llamar a `listTransfers(filters)`, pasar el resultado a `renderTransferList()`, registrar eventos `input`/`change` y el botón `#transfer-filters-clear`, manteniendo `guardModuleAccess('transfers', { silent: true })` y las llamadas sin argumentos del dashboard (FR-134; Escenarios HU-10 1–7)
- [X] T117 [US10] Ajustar los estilos de la barra de filtros, la columna `#ID` y el estado vacío de transferencias en `src/styles.css`, reutilizando tokens y clases existentes sin introducir un tema nuevo (Escenario HU-10 6)
- [X] T118 [US10] Ejecutar `npx vitest run tests/unit/transfers.test.js tests/integration/transfers.test.js` en la raíz del repositorio, verificar que las pruebas T111–T112 pasan sin regresiones de HU-05 y registrar la evidencia en `specs/002-logistica-inventario/tasks.md` (FR-134; Escenarios HU-10 1–7)

**Punto de control**: HU-10 es funcional de forma independiente; el listado por defecto no cambia, los filtros son de solo lectura y no aparece ningún permiso `transfers.search`.

---

## Fase 14: Historia de Usuario 11 - Seguimiento de envíos al comprador (Prioridad: P2) (Ampliación 2026-11-23)

**Objetivo**: Registrar, consultar y avanzar manualmente envíos asociados a órdenes de venta, conservando historial con fecha, hora y usuario, sin modificar stock, movimientos ni órdenes.

**Prueba Independiente**: Generar `OV-0001` desde una salida normal, crear un envío con transportista y código de seguimiento, rechazar un segundo envío para la misma OV, avanzar `en_bodega → en_transito → en_reparto → entregado`, rechazar retrocesos/saltos/repeticiones/cambios terminales, buscar por OV/código/estado y verificar persistencia y no mutación de inventario.

### Pruebas para la Historia de Usuario 11

> Escribir estas pruebas primero y verificar que fallan antes de tocar la implementación.

- [X] T119 [P] [US11] Añadir pruebas unitarias de almacenamiento en `tests/unit/storage.test.js` para `LOGISTICS_KEYS.shipments === 'logistics:shipments'`, `LOGISTICS_SCHEMAS.shipments`, `loadShipments()`, `saveShipments()` y `nextShipmentId()`, verificando `shipment_id` «PK, obligatorio y único; secuencia entera propia», `order_id` «FK a `PURCHASE_SALES_ORDERS.order_id`, obligatoria y única; la orden debe ser `order_type = "venta"` (OV)», `carrier` y `tracking_code` «Obligatorio, no vacío; escapado antes de mostrarse», `status` con valores `en_bodega`, `en_transito`, `en_reparto`, `entregado`, `created_by` y `created_at` obligatorios, `history` con al menos el evento inicial, y `unique: [['shipment_id'], ['order_id']]` sin usar un array plano compuesto (FR-131, FR-133)
- [X] T120 [US11] Crear pruebas unitarias en `tests/unit/shipments.test.js` para `createShipment()`, `advanceShipmentStatus()` y `listShipments()`, cubriendo OV existente con `order_type = "venta"`, rechazo de OC y de OV duplicada, validación de `createdBy` y `actorUserId` contra `USERS`, evento inicial `en_bodega`, transiciones inmediatas, rechazo de retrocesos, saltos, repeticiones y cambios desde `entregado`, eventos `history` con `changed_at` ISO y `changed_by`, búsqueda parcial e insensible a mayúsculas por `orderId` y `trackingCode`, filtro exacto por `status`, y ausencia de llamadas a `registerMovement()` ni cambios en `logistics:orders`, `logistics:inventory_transactions` o `logistics:stock` (FR-130, FR-131, FR-132)
- [X] T121 [P] [US11] Crear pruebas de integración en `tests/integration/shipments.test.js` para la vista `#view-shipments`, la ruta `#/shipments`, el formulario con OV elegibles, el rechazo de duplicados, el listado con etiquetas «En bodega», «En tránsito», «En reparto» y «Entregado», el historial visible, los filtros por OV/código/estado, los botones de avance sujetos a `action:shipments.update_status`, la denegación de `module:shipments`, la persistencia tras recarga, la no mutación de stock, movimientos ni órdenes y la ausencia de conexiones automáticas con transportistas comprobando que no se invoca `fetch`, `XMLHttpRequest` ni otro cliente HTTP externo durante el registro o avance manual (FR-130, FR-132, FR-133; Escenario HU-11 10)
- [X] T122 [P] [US11] Actualizar `tests/unit/permissions.test.js` y `tests/integration/permissions.test.js` para los recursos `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status`, verificando que los tres roles definidos pueden ver y actualizar estados, que no se añaden entradas a `FORBIDDEN_BY_ROLE` y que una matriz persistida sin las filas nuevas resuelve el acceso mediante el fallback de `ROLE_PERMISSION_SEED` sin sobrescribirse (FR-130, FR-133, FR-124)
- [X] T123 [P] [US11] Histórico, superado por T146/T160: Actualizar `tests/integration/workspace-shell.test.js` para esperar 12 botones `.nav-module`, comprobar `#nav-shipments`, verificar que desaparece al denegar `module:shipments` y confirmar que `#/shipments` muestra el aviso de acceso restringido y redirige a la landing permitida (FR-113, FR-115, FR-133). La interfaz vigente tiene seis secciones, sin `nav-shipments`, y usa la pestaña de Movimientos.

### Implementación de la Historia de Usuario 11

- [X] T124 [P] [US11] Añadir en `src/storage.js` la clave `shipments: 'logistics:shipments'`, el esquema `LOGISTICS_SCHEMAS.shipments` con `unique: [['shipment_id'], ['order_id']]`, `loadShipments()`, `saveShipments()` y `nextShipmentId()` derivado del máximo `shipment_id`, sin clave de contador, sin clave separada de historial y sin modificar `logistics:orders`, `logistics:inventory_transactions` ni `logistics:stock` (FR-131, FR-133)
- [X] T125 [P] [US11] Crear `src/domain/shipments.js` con `createShipment({ orderId, carrier, trackingCode, createdBy })`, `advanceShipmentStatus(shipmentId, actorUserId)` y `listShipments(filters)`, validando contra `validateRecord('shipments', ...)` y, antes de cualquier escritura, comprobando explícitamente que la OV existe en `loadOrders()` con `order_type = "venta"`, que no existe un envío previo con el mismo `order_id` en `loadShipments()`, que `createdBy` y `actorUserId` corresponden a usuarios válidos de `loadUsers()`, que `carrier` y `trackingCode` son texto no vacío, que el estado inicial es `en_bodega` y que todo avance usa únicamente `en_transito`, `en_reparto` o `entregado` según la transición inmediatamente siguiente; cualquier validación fallida DEBE devolver errores y NO DEBE invocar `saveShipments()` ni persistir parcialmente; persistir `history[]` embebido con `changed_at` ISO y `changed_by`, sin llamar a `registerMovement()`, sin conexiones automáticas con transportistas y sin modificar `STOCK`, movimientos ni órdenes (FR-130, FR-131, FR-132; Escenarios HU-11 1, 3, 4, 5, 7, 8, 9, 10)
- [X] T126 [P] [US11] Actualizar `src/domain/seed.js` para incluir `shipments` en `ALL_MODULES` y `OPERATION_MODULES`, añadir `shipment-form` a `SECTIONS`, sembrar `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status` para `administrador`, `supervisor_inventario` y `encargado_bodega`, permitir `section:shipment-form` cuando corresponda y no reescribir una matriz `ROLE_PERMISSIONS` ya persistida (FR-130, FR-133)
- [X] T127 [P] [US11] Actualizar `src/domain/permissions.js` añadiendo `shipments` a `MODULES`, sin nuevas entradas en `FORBIDDEN_BY_ROLE`, para que `canAccessModule()`, `resolveLandingModule()` y el panel de permisos reconozcan el módulo y la matriz solo pueda restringir lo permitido por reglas de negocio (FR-124, FR-133)
- [X] T128 [P] [US11] Histórico, superado por T146/T160: Añadir en `index.html` el botón `#nav-shipments` con `class="nav-module"`, `data-module="shipments"` y un elemento `<span class="nav-label">Seguimiento de envíos</span>`, la sección `#view-shipments`, el formulario `#shipment-form` con `#shipment-order`, `#shipment-carrier`, `#shipment-tracking-code`, `#shipment-submit-button` y contenedores `error-shipment-orderId`, `error-shipment-carrier`, `error-shipment-trackingCode`, `error-shipment-createdBy`, además del listado con `#shipment-search`, `#shipment-filter-status`, `#shipment-count`, `#shipment-list-body` y `#shipment-list-empty` (FR-113, FR-133; Escenario HU-11 11). La interfaz vigente integra estos controles en una pestaña de Movimientos, sin botón de menú propio.
- [X] T129 [P] [US11] Crear `src/components/shipment-form.js` con funciones para poblar `#shipment-order` solo con órdenes `order_type = "venta"` sin envío existente, mostrar errores de validación en los contenedores `error-shipment-*`, construir el payload con `orderId`, `carrier`, `trackingCode` y `createdBy`, y conservar el usuario activo del ERP sin selector manual (FR-131, FR-133)
- [X] T130 [P] [US11] Crear `src/components/shipment-list.js` para renderizar en `#shipment-list-body` el `order_id`, `carrier` y `tracking_code` escapados, las etiquetas de estado, el historial con `changed_at` y `changed_by`, `#shipment-count`, `#shipment-list-empty` y el botón de avance solo cuando `canUpdateStatus` sea verdadero y el estado no sea `entregado` (FR-132, FR-133)
- [X] T131 [US11] Integrar HU-11 en `src/app.js`: importar el dominio y los componentes, añadir `shipments` a `MODULES` y `VIEWS` con `shipments: 'view-shipments'`, implementar `refreshShipments()` con guard `module:shipments`, cablear `submit` de `#shipment-form`, eventos de filtros y avance de estado con `guardAction('shipments.create')` y `guardAction('shipments.update_status')`, mostrar errores, deshabilitar `#shipment-form` según permisos en `applyPermissionUiState()` y refrescar la vista tras crear o avanzar (FR-130, FR-133)
- [X] T132 [P] [US11] Ajustar los estilos del formulario, listado, historial, badges de estado y botón de avance de envíos en `src/styles.css`, reutilizando `.toolbar`, `.filter-grid`, `.empty`, `.data-table` y `.status-badge` con los tokens corporativos existentes
- [X] T133 [P] [US11] Actualizar `README.md` con el módulo «Seguimiento de envíos», la ruta `#/shipments`, la clave `logistics:shipments`, los cuatro recursos de permisos nuevos, la regla de que no genera movimientos ni modifica stock u órdenes y la ausencia de conexiones automáticas con servicios de transportistas, indicando que el seguimiento se actualiza solo manualmente desde el ERP (FR-133; Escenario HU-11 10)

**Punto de control**: HU-11 es funcional de forma independiente; cada OV tiene como máximo un envío, `Entregado` es terminal, el historial conserva fecha/hora/usuario y la vista está protegida por HU-08 sin autenticación real.

---

## Fase 15: Verificación y cierre de HU-10 y HU-11 (Ampliación 2026-11-23)

**Propósito**: Verificar regresiones, rendimiento, accesibilidad y documentación aditiva sin alterar el trabajo de HU-01–HU-09.

- [X] T134 Ejecutar `npx vitest run` en la raíz del repositorio, incluyendo `tests/unit/transfers.test.js`, `tests/integration/transfers.test.js`, `tests/unit/shipments.test.js`, `tests/integration/shipments.test.js`, `tests/unit/storage.test.js`, `tests/unit/permissions.test.js`, `tests/integration/permissions.test.js` y `tests/integration/workspace-shell.test.js`, y registrar el resultado en `specs/002-logistica-inventario/tasks.md`
- [X] T135 Ejecutar `npm run build` en la raíz del repositorio y registrar el resultado en `specs/002-logistica-inventario/tasks.md`
- [ ] T136 Validar manualmente todos los escenarios de `specs/002-logistica-inventario/quickstart.md` para HU-10 y HU-11, incluyendo búsqueda parcial, filtros combinados, estado vacío, 1:1 OV–envío, transiciones secuenciales, denegación por permisos, persistencia y verificación explícita de que no existen conexiones automáticas con transportistas, y registrar la evidencia en `specs/002-logistica-inventario/tasks.md` — confirmación manual del usuario (2026-11-25): probó en navegador las pestañas de Movimientos (Entradas, Salidas, Historial, Órdenes y Envíos), la pestaña Reposiciones en Alertas y el buscador/filtros de Transferencias. Esta evidencia no cubre todos los criterios: falta confirmar búsqueda parcial por texto/ID y capitalización, filtros combinados, estado vacío, 1:1 OV–envío, transiciones secuenciales con rechazo de retroceso/salto/repetición y estado terminal, denegación por permisos, persistencia tras recarga y ausencia explícita de conexiones automáticas con transportistas; se mantiene `[ ]`.
- [X] T137 Registrar el marcado final de T111–T137 en `specs/002-logistica-inventario/tasks.md`, conservando T001–T110 sin cambios, T107 como diferida históricamente y bloqueante del MVP, y T066 con su evidencia histórica

**Evidencia de verificación**
- T118: `npx vitest run tests/unit/transfers.test.js tests/integration/transfers.test.js` → `Test Files 2 passed (2)`, `Tests 21 passed (21)`.
- T119–T123: `npx vitest run tests/unit/storage.test.js tests/unit/shipments.test.js tests/integration/shipments.test.js tests/unit/permissions.test.js tests/integration/permissions.test.js tests/integration/workspace-shell.test.js` → `Test Files 6 passed (6)`, `Tests 86 passed (86)`.
- T134: `npx vitest run` → `Test Files 34 passed (34)`, `Tests 300 passed (300)`.
- T135: `npm run build` → `✓ built in 192ms`; artefactos generados en `dist/` (`index.html`, CSS y JS).
- T136 (cobertura automatizada y confirmación manual parcial; no sustituyen la validación completa pendiente): los recorridos de `quickstart.md` para HU-10 y HU-11 quedan cubiertos por `tests/integration/transfers.test.js`, `tests/integration/shipments.test.js`, `tests/integration/permissions.test.js` y `tests/integration/workspace-shell.test.js`: búsqueda parcial, filtros combinados y estado vacío; OV duplicada rechazada; transiciones secuenciales con rechazo de saltos/repeticiones/terminal; historial con fecha y usuario; denegación de módulo y de acción; persistencia tras recarga; snapshots sin cambios en órdenes, movimientos ni stock; spies de `fetch`/`XMLHttpRequest` sin llamadas y código sin temporizadores ni clientes HTTP externos.

**Punto de control**: T111–T137 quedan verificados con suite completa y build correctos, sin sobrescribir tareas ni estados anteriores.

---

## Dependencias HU-10/HU-11 (complemento de las secciones anteriores)

### Dependencias entre Fases

- US10 (Fase 13): depende de la Fase 2, de US5 para el historial de transferencias y de US8 para el guard `transfers`; no crea módulo ni permiso nuevo.
- US11 (Fase 14): depende de la Fase 2, de US8 para la matriz de permisos y de US9 para las órdenes `OV`; no reutiliza contadores `OC`/`OV` ni modifica HU-09.
- Verificación (Fase 15): depende de T111–T133 y se ejecuta solo después de que ambas historias estén completas.

### Dependencias entre Tareas

- En US10, T111 y T112 pueden ejecutarse en paralelo; T113, T114 y T115 pueden ejecutarse en paralelo tras las pruebas; T116 depende de T113–T115; T117 depende de T114–T115; T118 depende de T111–T117.
- En US11, T119, T120, T121, T122 y T123 pueden ejecutarse en paralelo porque escriben archivos distintos: `tests/unit/storage.test.js`, `tests/unit/shipments.test.js`, `tests/integration/shipments.test.js`, las pruebas de permisos y `tests/integration/workspace-shell.test.js`.
- T124 precede a T125; T126 y T127 pueden ejecutarse en paralelo tras T119–T123; T128, T129 y T130 pueden ejecutarse en paralelo; T131 depende de T124–T130; T132 depende de T128–T130; T133 depende de la definición aprobada de T128–T131.
- T116 (US10) y T131 (US11) comparten `src/app.js`; si hay un solo desarrollador, ejecutar T116 antes que T131. Si hay dos, coordinar el merge de ese archivo.
- T118 y T134 comparten evidencia en `specs/002-logistica-inventario/tasks.md`; registrar la evidencia de US10 antes de la verificación final.

### Oportunidades Paralelas

- Las pruebas T111–T112 y T119–T123 pueden escribirse simultáneamente.
- T124, T126, T127, T128, T129 y T130 tocan archivos distintos y pueden avanzar en paralelo una vez cerradas sus pruebas.
- US10 y US11 pueden desarrollarse en paralelo salvo por el punto de integración compartido `src/app.js`.

---

## Ejemplo Paralelo: Historia de Usuario 10

```bash
# Pruebas HU-10 en paralelo
Task: "T111 añadir pruebas unitarias en tests/unit/transfers.test.js"
Task: "T112 añadir pruebas de integración en tests/integration/transfers.test.js"

# Implementación HU-10 en paralelo
Task: "T113 extender listTransfers en src/domain/transfers.js"
Task: "T114 añadir controles en index.html"
Task: "T115 añadir columna #ID en src/components/transfer-list.js"
```

## Ejemplo Paralelo: Historia de Usuario 11

```bash
# Pruebas HU-11 en paralelo
Task: "T119 añadir pruebas de almacenamiento en tests/unit/storage.test.js"
Task: "T121 crear pruebas de integración en tests/integration/shipments.test.js"
Task: "T122 actualizar pruebas de permisos en tests/unit/permissions.test.js y tests/integration/permissions.test.js"
Task: "T123 actualizar recuento de navegación en tests/integration/workspace-shell.test.js"

# Implementación HU-11 en paralelo
Task: "T124 añadir clave y helpers en src/storage.js"
Task: "T126 actualizar semilla en src/domain/seed.js"
Task: "T127 actualizar MODULES en src/domain/permissions.js"
Task: "T128 añadir vista y formulario en index.html"
Task: "T129 crear src/components/shipment-form.js"
Task: "T130 crear src/components/shipment-list.js"
```

---

## Estrategia de Implementación HU-10/HU-11

### MVP First

1. Completar T111–T118 (US10) y validar de forma independiente.
2. **DETENERSE y VALIDAR**: comprobar búsqueda, filtros combinados, estado vacío y no mutación.
3. Completar T119–T133 (US11) y validar de forma independiente.
4. **DETENERSE y VALIDAR**: comprobar 1:1 OV–envío, transiciones, historial, permisos y aislamiento de inventario.
5. Completar T134–T137.

### Entrega Incremental

1. US10 → validar → demostrar sin tocar permisos ni navegación.
2. US11 → validar → demostrar con módulo lógico y ruta alias; la interfaz vigente usa la pestaña de Movimientos sin `nav-shipments` (histórico: módulo propio con matriz actualizada).
3. Verificación final → suite completa, build y evidencia documental.

### Estrategia de Equipo Paralelo

1. Desarrollador A: T111–T118 (US10).
2. Desarrollador B: T119–T125 (almacenamiento, dominio y pruebas de envíos).
3. Desarrollador C: T126–T130 (permisos, semilla, vista y componentes).
4. Integrar `src/app.js` de forma secuencial: T116 y después T131.
5. Ejecutar T134–T137 conjuntamente.

---

## Notas de Marcado HU-10/HU-11

| Estado | IDs | Criterio usado |
|---|---|---|
| Nuevas US10 | T111–T118 | Tareas generadas desde HU-10, `plan.md`, `data-model.md`, `contracts/logistics-storage.md` y `quickstart.md`. |
| Nuevas US11 | T119–T133 | Tareas generadas desde HU-11, `MER.md`, `data-model.md`, `contracts/logistics-storage.md` y `quickstart.md`. |
| Nueva verificación | T134–T137 | Suite completa, build, validación manual y registro de evidencia. |
| Sin cambios | T001–T110 | Se conservan tal cual, incluida T107 como diferida históricamente y bloqueante del MVP, y T066 con su evidencia histórica. |

Los comandos `npx vitest run` y `npm run build` de T134–T135 deben ejecutarse después de la implementación; esta generación de tareas no ejecuta código ni modifica ramas, commits o push.

---

## Fase 16: Ajustes visuales/UI-UX (Sin cambios funcionales)

**Objetivo**: Aplicar únicamente los ajustes visuales aprobados, sin modificar funcionalidades, permisos, lógica de negocio, backend ni base de datos.

**Prueba Independiente**: Verificar en navegador que los cambios visuales no alteran flujos, permisos, datos ni mensajes funcionales existentes.

- [X] T138 [P] Consolidar tokens visuales y acento en `src/styles.css` y `src/module-config.js`, aplicando `--accent` de forma consistente en botones, navegación activa, anillos de foco, gradientes y logo SVG en `src/components/shell.js`, sin modificar lógica.
- [X] T139 [P] Diferenciar avisos informativos, de advertencia y de error en `index.html` y `src/styles.css`, manteniendo `role="status"` y `aria-live="polite"` para mensajes no bloqueantes, sin cambiar mensajes ni flujos.
- [X] T141 [P] Añadir `aria-label`/`title` y tooltips a botones colapsados de `index.html` y `src/components/shell.js`, ajustando `src/styles.css` para que las etiquetas queden accesibles sin cambiar diseño ni comportamiento.
- [X] T142 [P] Ajustar textos y semántica visual del panel en `src/components/dashboard.js`, `index.html` y `src/styles.css`, conservando datos y lógica existentes: pista de datos demo solo cuando corresponda, copy de alertas sin exageración y colores/captions neutros para pendientes.
- [X] T143 Presentar la matriz de permisos de forma más clara en `src/components/permissions-panel.js`, `index.html` y `src/styles.css`: etiquetas legibles, cabeceras desde `getRoles()`, feedback por severidad y badge/tooltip de bloqueo en celdas `admin:permissions`, sin alterar el funcionamiento de los permisos.
- [X] T144 [P] Añadir indicador de scroll horizontal y `aria-label` a contenedores de tablas anchas en `index.html` y `src/styles.css`, sin modificar columnas, datos ni comportamiento.
- [ ] T145 Verificar en navegador los cambios visuales de `index.html`, `src/styles.css`, `src/components/shell.js`, `src/components/dashboard.js` y `src/components/permissions-panel.js`, sin marcar tareas como completadas — confirmación manual del usuario (2026-11-25): probó en navegador las pestañas de Movimientos y Alertas, el buscador/filtros de Transferencias y el menú lateral de seis secciones sin Entidades, Documentos ni Búsqueda. No cubre explícitamente la revisión visual del panel principal (`src/components/dashboard.js`, cuatro indicadores y sin accesos rápidos), del panel de permisos (`src/components/permissions-panel.js`) ni del resto de cambios de `src/styles.css`; tampoco registra los 20 recorridos cronometrados exigidos por SC-064; se mantiene `[ ]`.

---

## Fase 17: Navegación reducida, pestañas por sección y panel de indicadores (HU-12, HU-13 y HU-14)

**Nota de IDs**: T146–T152 se añaden al final por instrucción explícita; no reordenan, reemplazan ni cambian el estado de T001–T145. T140 no existe en el historial conservado: la numeración pasa de T139 a T141 y no se renumera.

**Objetivo**: Mostrar solo seis secciones en el menú lateral, integrar Reposiciones en Alertas y Envíos/Órdenes en Movimientos mediante pestañas, y convertir el panel principal en una vista de cuatro indicadores sin accesos duplicados, conservando datos, formularios, historiales y permisos vigentes.

### Pruebas para HU-12/HU-13/HU-14

> Escribir estas pruebas primero y verificar que fallan antes de tocar la implementación.

- [x] T146 [P] [US12] Actualizar `tests/integration/workspace-shell.test.js` y `tests/integration/permissions.test.js` para comprobar que el menú lateral expone solo Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas; que Entidades, Documentos, Búsqueda, Reposiciones y Envíos no aparecen como entradas visibles; que el panel de permisos se abre desde la barra superior; y que las rutas antiguas `#/entities`, `#/documents`, `#/search`, `#/replenishments` y `#/shipments` redirigen a una vista permitida sin mostrar la sección genérica (FR-135, FR-136, FR-147).
- [x] T147 [P] [US13/US14] Actualizar `tests/integration/dashboard.test.js` y añadir casos en `tests/integration/workspace-shell.test.js` para verificar que el panel principal muestra solo cuatro indicadores visibles (productos, bodegas, stock total y alertas activas), que no expone acciones rápidas ni enlaces a las seis secciones, que Movimientos tiene pestañas Entradas/Salidas/Historial/Órdenes/Seguimiento de envíos con una activa por defecto, que Alertas tiene pestañas Alertas/Reposiciones, que el cambio de pestaña no altera datos y que las pestañas no autorizadas quedan ocultas o deshabilitadas (FR-139, FR-141–FR-145).

### Implementación de HU-12/HU-13/HU-14

- [x] T148 [P] [US12/US13/US14] Reestructurar `index.html`: mover el acceso al panel y al panel de permisos a la barra superior, dejar en la barra lateral solo las seis secciones, ocultar los accesos genéricos y los módulos integrados sin borrar sus vistas ni formularios, reducir el panel principal a los cuatro indicadores, y añadir las pestañas de Movimientos y Alertas con Reposiciones y Envíos anidados (FR-135–FR-140, FR-142, FR-147).
- [x] T149 [P] [US13] Añadir en `src/styles.css` los estilos de las pestañas, los botones de la barra superior y el panel de indicadores, reutilizando tokens existentes y sin crear un tema nuevo (FR-141, FR-146).
- [x] T150 [US12/US13/US14] Adaptar `src/app.js` y `src/components/shell.js`: enrutado de alias y pestañas, guard de permisos por pestaña, activación de pestaña por defecto, navegación única desde la barra lateral, ocultamiento permanente de accesos base/alias y actualización de los cuatro indicadores sin borrar funciones internas (FR-135–FR-138, FR-141–FR-146).
- [x] T151 [P] Reconciliar `specs/002-logistica-inventario/spec.md`, `plan.md`, `README.md` y `checklists/requirements.md` con la interfaz resultante, actualizar `T068` y conservar el historial documental previo (FR-147, REV-007).
- [x] T152 Ejecutar `npx vitest run` y `npm run build` en la raíz, verificar que no se pierden funcionalidades, datos ni permisos de HU-01 a HU-11, y registrar la evidencia en `specs/002-logistica-inventario/tasks.md`. Evidencia 2026-11-25: 34 archivos/304 pruebas OK; Vite `built in 139ms` sin errores.

**Punto de control**: El menú lateral tiene seis destinos, las funciones base y los módulos integrados siguen disponibles sin accesos propios, el panel principal solo informa, y la suite completa y el build pasan sin regresiones. Verificado el 2026-11-25 con 34 archivos/304 pruebas y build correcto; sin crear ramas, commits ni push adicionales durante esta corrección documental, conservando el historial previo del repositorio.

### REGISTRO INCREMENTAL (HU-09 a HU-14)

| HU | Funcionalidad incorporada | Archivos principales | Evidencia |
|---|---|---|---|
| HU-09 | Órdenes `OC`/`OV` generadas desde entradas y salidas normales, secuencias independientes, persistencia y rollback atómico; panel dentro de Movimientos sin permiso propio. T107 queda diferida históricamente y es bloqueante del MVP canónico. | `src/domain/orders.js`, `src/domain/movements.js`, `src/storage.js`, `src/components/movement-form.js`, `src/components/order-list.js`, `src/app.js`, `index.html` | T095–T106, T108–T110; `tests/unit/orders.test.js`, `tests/unit/storage.test.js`, `tests/integration/orders.test.js`. |
| HU-10 | Búsqueda y filtros combinados de transferencias por producto, bodegas y estado, integrados en el listado existente. | `src/domain/transfers.js`, `src/components/transfer-list.js`, `src/app.js`, `index.html` | T111–T118, T134; `tests/unit/transfers.test.js`, `tests/integration/transfers.test.js`. T136 tiene confirmación manual parcial de buscador/filtros; faltan criterios detallados en T136. |
| HU-11 | Seguimiento de envíos 1:1 con orden de venta, estados secuenciales, historial, restricciones por permiso y ausencia de clientes HTTP externos. | `src/storage.js`, `src/domain/shipments.js`, `src/domain/seed.js`, `src/domain/permissions.js`, `src/components/shipment-form.js`, `src/components/shipment-list.js`, `src/app.js`, `index.html` | T119–T135, T137; `tests/unit/storage.test.js`, `tests/unit/shipments.test.js`, `tests/unit/permissions.test.js`, `tests/integration/shipments.test.js`, `tests/integration/permissions.test.js`, `tests/integration/workspace-shell.test.js`. T136 tiene confirmación manual parcial de la pestaña Envíos; faltan 1:1, transiciones, permisos, persistencia y ausencia de conexiones. |
| HU-12 | Menú lateral reducido a seis secciones; accesos base/alias ocultados sin borrar vistas, formularios ni permisos. | `index.html`, `src/app.js`, `src/components/shell.js`, `src/styles.css` | T068, T146, T148, T150–T152; `tests/integration/workspace-shell.test.js`, `tests/integration/permissions.test.js`. |
| HU-13 | Pestañas de Movimientos y Alertas, alias de rutas y guard por permiso por pestaña sin mutar datos al cambiar de pestaña. | `index.html`, `src/app.js`, `src/styles.css` | T147–T152; `tests/integration/workspace-shell.test.js`, `tests/integration/dashboard.test.js`, `tests/integration/permissions.test.js`. |
| HU-14 | Panel principal reducido a cuatro indicadores y sin accesos rápidos; navegación única desde la barra lateral. | `index.html`, `src/components/dashboard.js`, `src/app.js` | T147, T148, T150–T152; `tests/integration/dashboard.test.js`, `tests/integration/workspace-shell.test.js`. |

Los ajustes visuales de Fase 16 se conservan como trabajo intermedio: T138–T144 completos; T145 mantiene `[ ]` con confirmación manual parcial del usuario y revisión visual pendiente de dashboard, panel de permisos y estilos globales.

---

## Fase 18: HU-15 — Datos de ejemplo con nombres ficticios variados

**Nota de IDs**: T153–T158 se añaden al final; no reordenan, renumeran, desmarcan ni modifican T001–T152 ni las tareas de HU-12 a HU-14. T140 sigue sin existir por decisión histórica documentada.

**Objetivo**: Renombrar la semilla, migrar solo coincidencias exactas, derivar bodegas de rol + orden del catálogo y conservar historial, permisos y usuario activo (FR-148–FR-153, SC-071–SC-075). La interpretación operativa de “posición” quedó definida en la Fase 19; el comportamiento ante fallo de escritura sigue registrado como riesgo residual.

**Criterio de aceptación independiente**: con un navegador vacío aparecen los cuatro usuarios nuevos en orden; con la semilla anterior se migran solo las coincidencias exactas; cargas repetidas no producen cambios; las bodegas de demostración no se reasignan por el renombrado; y la suite completa pasa sin regresiones (SC-071–SC-075).

**Paralelismo**: T153 ∥ T154; T157 puede ejecutarse en paralelo con T155/T156 una vez escritas las pruebas. T158 depende de T155–T157.

### Pruebas para HU-15

> Escribir estas pruebas primero y verificar que fallan antes de tocar la implementación.

- [X] T153 [P] [US15] Actualizar `tests/unit/storage.test.js` para comprobar migración exacta por `user_id`, nombre y correo, usuarios modificados intactos, idempotencia, sin duplicados y conservación de `logistics:active_user_id` (FR-152, FR-153, SC-072, SC-073).
- [X] T154 [P] [US15] Actualizar `tests/unit/demo-data.test.js` y `tests/integration/shipments.test.js` para los cuatro nombres y correos nuevos (`Millaray Antileo`/`millaray.antileo@empresa.cl`, `Tomás Wiegand`/`tomas.wiegand@empresa.cl`, `Yasmina Haddad`/`yasmina.haddad@empresa.cl` y `Sebastián Quispe`/`sebastian.quispe@empresa.cl`) y la asignación de bodegas por rol + orden del catálogo (`user_id` 1–4, `encargado_bodega` en ids 2 y 4), sin depender del texto del nombre (FR-148, FR-149, FR-151, SC-071, SC-074, SC-075).

### Implementación de HU-15

- [X] T155 [US15] Actualizar `USER_SEED` en `src/domain/seed.js` con `user_id` 1 Millaray Antileo/`administrador`/`millaray.antileo@empresa.cl`, `user_id` 2 Tomás Wiegand/`encargado_bodega`/`tomas.wiegand@empresa.cl`, `user_id` 3 Yasmina Haddad/`supervisor_inventario`/`yasmina.haddad@empresa.cl` y `user_id` 4 Sebastián Quispe/`encargado_bodega`/`sebastian.quispe@empresa.cl`, conservando ids, roles y orden (FR-148).
- [X] T156 [US15] Añadir en `src/storage.js` la migración exacta de (`1`/`Ana Torres`/`ana.torres@empresa.cl`, `2`/`Carlos Pérez`/`carlos.perez@empresa.cl`, `3`/`María López`/`maria.lopez@empresa.cl`, `4`/`Jorge Soto`/`jorge.soto@empresa.cl`) a los valores de T155, con una sola escritura del catálogo de usuarios, sin alterar usuarios modificados, sin duplicados y sin tocar `logistics:active_user_id`; mantener la siembra solo cuando el catálogo esté vacío (FR-152, FR-153).
- [X] T157 [P] [US15] Sustituir en `src/domain/demo-data.js` las comparaciones por nombre con una regla por rol + orden del catálogo, preservando la bodega histórica de los usuarios de ids 2 y 4 (FR-151).
- [X] T158 [US15] Ejecutar `npx vitest run` y `npm run build` en la raíz; actualizar el checklist `HU15-009` en `specs/002-logistica-inventario/checklists/requirements.md` y el registro incremental de esta fase en `specs/002-logistica-inventario/tasks.md`; verificar que no se pierden datos, permisos ni operaciones de HU-01 a HU-14, sin crear ramas ni commits.

### REGISTRO INCREMENTAL (HU-15)

| HU | Funcionalidad incorporada | Archivos principales | Evidencia |
|---|---|---|---|
| HU-15 | Catálogo semilla con nombres y correos ficticios, migración exacta e idempotente y bodegas por rol + orden. | `src/domain/seed.js`, `src/domain/demo-data.js`, `src/storage.js` | T153–T158; `tests/unit/storage.test.js`, `tests/unit/demo-data.test.js`, `tests/integration/shipments.test.js`; 34 archivos/308 pruebas OK y build correcto. |

**Punto de control**: las tareas previas permanecen intactas; los cuatro usuarios nuevos aparecen en orden, la migración es idempotente, las bodegas no cambian por el renombrado y la suite completa y el build pasan sin regresiones. Verificado el 2026-11-26 con 34 archivos/308 pruebas y build correcto; sin crear ramas, commits ni push adicionales, conservando el historial previo del repositorio.

---

## Fase 19: Consolidación documental post-clarificación — 2026-11-27

**Nota de IDs**: T159–T163 se añaden al final; no reordenan, renumeran ni desmarcan T001–T158. T140 sigue sin existir por decisión histórica documentada.

**Objetivo**: dejar `spec.md`, `plan.md` y `tasks.md` suficientes para reconstruir el MVP sin leer código, incorporando las cinco decisiones de la sesión de clarificación 2026-11-27.

**Criterio de aceptación independiente**: una persona que solo lea los tres artefactos puede determinar el alcance de HU-15, la navegación de envíos, el cambio de rol, el dataset demo y la revalidación de stock al confirmar transferencias.

**Paralelismo**: T159 ∥ T160 ∥ T161; T162 depende de T159–T161; T163 depende de T162.

### Documentación de decisiones

- [X] T159 [P] [US15] Registrar en `spec.md` y `plan.md` que HU-15 forma parte del MVP vigente, con T153–T158 completos y evidencia de 34 archivos/308 pruebas y build correcto (FR-148–FR-153, SC-071–SC-075).
- [X] T160 [P] [US8,US11] Registrar que Seguimiento de envíos es pestaña de Movimientos con entradas `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status`, sin `nav-shipments`, con alias `#/shipments`, y que el cambio de cargo abre de inmediato la landing del nuevo rol (FR-107, FR-117, FR-133, FR-147, SC-060, SC-066–SC-068).
- [X] T161 [P] [US5,US15] Documentar el conjunto canónico `logistics-demo-v1` y la regla de confirmación de transferencias con stock insuficiente, añadiendo FR-154, FR-155, SC-076, SC-077, el escenario 6 de HU-05 y los casos límite correspondientes.
- [X] T162 [P] Actualizar `plan.md` con la Fase 19, corregir la afirmación histórica sobre la ausencia de `.specify/memory/constitution.md` y conservar los riesgos residuales de medición, validación visual y rollback de migración.
- [X] T163 Revalidar `checklists/requirements.md` con la sección `Revalidación post-clarificación — 2026-11-27`, cubriendo FR-001–FR-155, SC-001–SC-077, US1–US15 y casos límite, ampliado en Fase 20 a FR-001–FR-156 y SC-001–SC-078, sin crear ramas ni commits.

### REGISTRO INCREMENTAL (Fase 19)

| Ámbito | Decisión consolidada | Archivos principales | Evidencia |
|---|---|---|---|
| HU-15 | Parte del MVP, con dataset canónico `logistics-demo-v1` y cargador utilitario en la barra superior | `spec.md`, `plan.md`, `tasks.md`, `checklists/requirements.md` | T159, T161, T165; FR-154, FR-156, SC-076, SC-078 |
| HU-08/HU-11 | Envíos como pestaña de Movimientos y landing inmediata tras cambio de cargo | `spec.md`, `plan.md`, `tasks.md` | T160; FR-107, FR-117, FR-133, FR-147 |
| HU-05 | Confirmación revalida stock y se rechaza sin cambios si es insuficiente | `spec.md`, `plan.md`, `tasks.md` | T161; FR-155, SC-077 |
| Calidad documental | Cobertura completa y riesgos residuales registrados | `checklists/requirements.md`, `plan.md` | T162, T163 |

**Punto de control**: los tres artefactos quedan alineados; no se modificó código, no se crearon ramas ni commits y no se ejecutaron pruebas nuevas en esta fase.

---

## Fase 20: Consolidación reconstruible del MVP — 2026-11-27

**Nota de IDs**: T164–T168 se añaden al final; no reordenan, renumeran ni desmarcan T001–T163. T140 sigue sin existir por decisión histórica documentada.

**Objetivo**: garantizar que `spec.md`, `plan.md` y `tasks.md` permitan reconstruir el MVP canónico `HU-01`–`HU-15` sin leer código.

**Criterio de aceptación independiente**: una persona o agente que solo lea los tres artefactos puede determinar alcance, dataset, permisos, tareas bloqueantes y verificaciones de calidad obligatorias.

**Paralelismo**: T165 ∥ T166 ∥ T168; T167 depende del cierre de T031, T036, T048, T065, T067, T107, T136 y T145.

### Documentación y verificación

- [X] T164 [P] Registrar en `spec.md`, `plan.md` y `tasks.md` que el MVP canónico comprende `HU-01`–`HU-15`, que las menciones históricas a `US1`/`US8` quedan subordinadas y que T031, T036, T048, T065, T067, T107, T136 y T145 son bloqueantes (C4, C5).
- [ ] T165 [P] [US15] Verificar que `src/domain/demo-data.js` reproduce exactamente la tabla derivada de `quantity_available` y la tabla separada de `min_stock_level` publicadas en `spec.md`; verificar que el botón «Cargar datos de demostración» está en la barra superior, exige `action:base.manage`, publica el resultado en `#demo-data-status`, que `alreadyLoaded` deshabilita la carga y que un fallo de escritura restaura el estado previo sin activar la marca; actualizar `tests/unit/demo-data.test.js` con ambos conjuntos de valores y con la regla de que los movimientos/transferencias son la fuente autoritativa, además de una prueba de integración de la barra superior (C6, C7, C8, FR-154, FR-156, SC-076, SC-078).
- [ ] T166 [P] [US8] Verificar que `src/domain/seed.js` y `src/domain/permissions.js` coinciden con la matriz semilla canónica de `spec.md:FR-124`, incluidos landing por rol, acciones permitidas/prohibidas y que las excepciones individuales no conceden acciones prohibidas; ampliar `tests/unit/permissions.test.js` y `tests/integration/permissions.test.js` (C11).
- [ ] T167 Cerrar con evidencia automatizada o revisión manual registrada las tareas bloqueantes T031, T036, T048, T065, T067, T107, T136 y T145; verificar también el rollback de HU-15 ante fallo de escritura conforme a FR-153; actualizar `spec.md`, `plan.md`, `tasks.md` y `checklists/requirements.md` solo cuando la evidencia exista (C5, C9, criterio de terminado del MVP).
- [ ] T168 [P] Configurar en `package.json` los scripts `lint`, `format:check` y `analyze`, y ejecutar `npm run lint` (ESLint sobre `src/`, `tests/` y JavaScript raíz con `--max-warnings=0`), `npm run format:check` (Prettier `--check` sobre código, configuración, HTML, CSS y Markdown de la feature), `npm run analyze` (ESLint estático con reglas estrictas de corrección/mantenibilidad), `npm test` y `npm run build`; registrar comandos, resultados y advertencias resueltas en `specs/002-logistica-inventario/plan.md` y en esta fase, exigiendo código 0 y cero advertencias sin resolver que afecten corrección o mantenibilidad antes de declarar conformidad constitucional (C13, criterio de calidad obligatorio).

### REGISTRO INCREMENTAL (Fase 20)

| Ámbito | Decisión consolidada | Archivos principales | Evidencia |
|---|---|---|---|
| Alcance | MVP canónico `HU-01`–`HU-15`; tareas pendientes bloqueantes | `spec.md`, `plan.md`, `tasks.md` | T164 |
| Dataset | Movimientos/transferencias autoritativos; mínimos publicados por separado | `spec.md`, `src/domain/demo-data.js`, `tests/unit/demo-data.test.js` | T165 |
| Permisos | Matriz semilla y reglas prohibidas documentadas en `spec.md` | `spec.md`, `src/domain/seed.js`, `src/domain/permissions.js` | T166 |
| Terminado | Cierre evidenciado de T031/T036/T048/T065/T067/T107/T136/T145 | `spec.md`, `plan.md`, `tasks.md`, `checklists/requirements.md` | T167 |
| Calidad | `npm run lint`, `npm run format:check`, `npm run analyze`, `npm test` y `npm run build` | `package.json`, `plan.md`, `tasks.md` | T168 |

**Punto de control**: la documentación ya permite reconstruir el MVP; la implementación solo podrá declararse terminada después de T165–T168 y del cierre evidenciado de las tareas bloqueantes.
