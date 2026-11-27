# Plan de Implementación: Módulo de Logística e Inventario

## 1. Resumen

Para desarrollar nuestro módulo de Logística e Inventario utilizaremos la plantilla ERP entregada por el profesor, aprovechando las funciones que ya incluye para registrar, modificar y consultar información. La idea es adaptar estas herramientas para trabajar con productos y movimientos de inventario, incorporando también el control de las existencias y las transferencias entre bodegas.

El desarrollo se basará en el Modelo Entidad-Relación que diseñamos, donde se consideran productos, categorías, bodegas, usuarios, stock, movimientos y transferencias. A partir de esta estructura, buscaremos implementar las principales funciones del módulo, como registrar entradas y salidas, actualizar las cantidades disponibles y generar alertas cuando el stock sea bajo. La HU-08 amplía el módulo con cargos configurables, páginas de inicio por rol, una matriz de permisos administrable y control de visibilidad del usuario activo, sin incorporar autenticación real ni modificar los datos operativos. Finalmente, realizaremos pruebas con datos de ejemplo para comprobar que el sistema funcione correctamente.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Interacciones responsivas para listas de hasta 500 registros; la búsqueda y las actualizaciones de la interfaz deben sentirse instantáneas  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance (vigente)**: MVP canónico `HU-01`–`HU-15`; menú lateral con Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas; panel principal solo con cuatro indicadores; reposiciones en Alertas y órdenes/envíos en Movimientos  
**Control de Acceso (HU-08)**: Matriz de permisos por rol y excepciones por usuario persistidas en `localStorage`, con las reglas de negocio vigentes como límite superior (FR-124); la semilla completa y las acciones prohibidas están en `spec.md:FR-124`  
**Persistencia HU-08**: Claves `logistics:roles`, `logistics:role_permissions` y `logistics:user_permission_overrides`, junto a `logistics:active_user_id` existente  
**Persistencia canónica**: La spec enumera las claves `logistics:*`, formatos y reglas de no mutación; el dataset `logistics-demo-v1` deriva `quantity_available` de movimientos y transferencias confirmadas y publica por separado `min_stock_level`  
**Navegación (HU-08)**: `showModule()` sigue siendo el único punto de cambio de vista; el enrutado por hash `#/<module>` hace verificable el bloqueo de acceso directo (FR-115); las rutas heredadas redirigen a la pestaña o sección permitida  
**Identidad**: Usuario activo simulado desde `USERS` y `logistics:active_user_id`; sin login, contraseñas ni backend; si la clave falta o es inválida, se usa el primer usuario del catálogo y se persiste ese `user_id`

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- Calidad: La implementación usará una estructura JavaScript pequeña y modular con límites de función claros y nomenclatura consistente, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas antes de completar.
- Experiencia de Usuario: La interfaz proporcionará mensajes de validación claros, estados vacíos y comportamiento de formulario consistente, presentados dentro de un marco de espacio de trabajo ERP con marca (barra superior + barra lateral) que se ve y se comporta idénticamente en todas las pantallas.
- Rendimiento: La búsqueda y el renderizado de listas se optimizarán para colecciones de hasta 500 registros usando actualizaciones ligeras del DOM.
- Calidad (HU-08): La decisión de permisos se centralizará en `src/domain/permissions.js`, conservando la API pública existente (`canAccessModule`, `canPerform`, `resolveActiveUser`) para no duplicar comprobaciones en componentes.
- Pruebas (HU-08): Se cubrirán con Vitest la semilla de roles, el cálculo de permisos efectivos, la precedencia de FR-124, las landing pages, el cambio de usuario/cargo, el bloqueo de ruta y la no mutación de datos operativos.
- Experiencia de Usuario (HU-08): La navegación no autorizada se ocultará o deshabilitará y el acceso denegado mostrará un aviso claro no bloqueante; el administrador conservará siempre el panel de permisos (FR-118).
- Rendimiento (HU-08): La evaluación de permisos se resolverá en memoria a partir de la configuración cargada una sola vez por cambio de usuario/cargo, cumpliendo el objetivo de propagación en menos de 2 segundos (SC-042).
- Calidad (2026-11-27): Antes de cerrar el MVP deben configurarse y ejecutarse `npm run lint`, `npm run format:check`, `npm run analyze`, `npm test` y `npm run build`, con código 0 y cero advertencias sin resolver que afecten corrección o mantenibilidad; T168 registra la evidencia requerida por el principio de calidad de la constitución.

**Resultado de la comprobación**: las decisiones funcionales respetan la constitución, pero la verificación de calidad queda pendiente hasta ejecutar T168; por eso no se declara conformidad final sin esa evidencia.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/002-logistica-inventario/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── data-model.md
├── MER.md
├── MER_logisica_visual.jpeg
├── contracts/
│   ├── entity-storage.md
│   └── logistics-storage.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
src/
├── main.js
├── styles.css
├── storage.js        (claves de almacenamiento, esquemas, helpers de repositorio, saneamiento/validación compartidos y carga de semillas)
├── app.js
├── module-config.js
├── components/
│   ├── shell.js          (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral con las pantallas base y logísticas, estado de módulo activo)
│   ├── dashboard.js      (vista de inicio: cuadrícula de acciones rápidas + tarjetas de estadísticas en vivo)
│   ├── entity-form.js    (formulario de creación/edición de entidades base, con campos personalizados)
│   ├── document-form.js  (formulario de creación/edición de documentos base, con campos personalizados y ciclo de vida de estados)
│   ├── product-form.js / product-list.js       (US1 — productos)
│   ├── warehouse-form.js / warehouse-list.js   (US4 — bodegas)
│   ├── movement-form.js / movement-list.js     (US3 — entradas, salidas y ajustes)
│   ├── transfer-form.js / transfer-list.js     (US5 — transferencias entre bodegas)
│   ├── stock-list.js / stock-config.js         (US2 — control de stock y configuración de mínimos)
│   ├── alert-list.js                           (US6 — alertas de stock mínimo)
│   ├── replenishment-form.js / replenishment-list.js (US7 — solicitudes de reposición)
│   └── permissions-panel.js                         (HU-08 — matriz, landing pages y cargos)
└── domain/
    ├── seed.js        (catálogos semilla de PRODUCT_CATEGORIES, USERS, ROLES y ROLE_PERMISSIONS)
    ├── products.js    (US1 — reglas de negocio de productos)
    ├── warehouses.js  (US4 — reglas de negocio de bodegas)
    ├── movements.js   (US3 — entradas, salidas y ajustes con actualización atómica de STOCK)
    ├── transfers.js   (US5 — solicitud, confirmación y cancelación de transferencias)
    ├── stock.js       (US2 — consulta de existencias de solo lectura)
    ├── alerts.js      (US6 — alertas derivadas de STOCK)
    ├── replenishments.js (US7 — solicitudes, aprobación, cancelación y recepción con movimientos HU-03)
    └── permissions.js    (HU-08 — roles, matriz configurable, excepciones y resolución de landing)

tests/
├── unit/
├── integration/
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. El módulo base (Entidad/Documento, `entity-form.js`/`document-form.js`) se conserva intacto para no introducir regresiones (ver FR-001–039), mientras que el dominio de Logística e Inventario se construye como una capa adicional: `src/storage.js` concentra los esquemas, la persistencia y los helpers de validación/saneamiento compartidos por las entidades logísticas (`PRODUCTS`, `PRODUCT_CATEGORIES`, `WAREHOUSES`, `USERS`, `STOCK`, `INVENTORY_TRANSACTIONS`, `STOCK_TRANSFERS`, `REPLENISHMENT_REQUESTS`); `src/domain/` concentra las reglas de negocio de cada historia de usuario (productos, bodegas, movimientos, transferencias, stock, alertas y reposiciones) desacopladas de la interfaz; y `src/components/` añade un formulario y un listado por historia de usuario junto a los componentes base. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos (históricamente con Reposiciones; vigente con Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas según HU-12/HU-14) — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderizaba históricamente botones de acción rápida y ahora solo las cuatro tarjetas de indicadores de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente.

> **Nota de vigencia (2026-11-27)**: la descripción estructural anterior es historial de la plantilla base; la interfaz vigente se rige por FR-135–FR-147, por la reconciliación HU-12/HU-14 y por la matriz canónica de FR-124. No debe interpretarse que el menú incluye Reposiciones ni que el panel ofrece accesos rápidos.

## Ampliación: Diseño para HU-08

### Alcance

La HU-08 se implementa como una capa de control de acceso sobre la navegación ya existente. No sustituye las reglas de negocio de HU-01 a HU-07: la matriz y las excepciones solo pueden restringir lo permitido por esas reglas; una excepción puede prevalecer sobre el cargo, pero nunca otorgar una acción prohibida (FR-124, SC-045, SC-050). Tampoco introduce autenticación: la identidad sigue siendo el usuario activo seleccionado en la cabecera (FR-073).

### Capas y puntos de cambio

- `src/storage.js`: añadir `logistics:roles`, `logistics:role_permissions` y `logistics:user_permission_overrides` a `LOGISTICS_KEYS`, con helpers de carga/guardado idempotentes y saneamiento compartido.
- `src/domain/permissions.js`: convertir la matriz privada `ROLE_PERMISSIONS` en semilla persistida y conservar la API pública (`MODULES`, `getRolePermissions`, `canAccessModule`, `canPerform`, `getActiveUserId`, `setActiveUserId`, `resolveActiveUser`, `roleLabel`). Nuevas operaciones: `getEffectivePermission`, `setRolePermission`, `setUserPermissionOverride`, `setUserRole`, `setRoleLandingModule`, `resolveLandingModule`.
- `src/domain/seed.js`: sembrar `ROLES` y `ROLE_PERMISSIONS` solo si las claves no existen, replicando exactamente la matriz vigente para evitar regresiones.
- `src/components/permissions-panel.js`: nueva vista de administración con matriz por rol, selección de landing page y cambio de cargo de usuarios; usa los helpers de `permissions.js` y no accede a `localStorage` directamente.
- `src/components/shell.js`: reutilizar `applyNavigationPermissions(role)` con los permisos efectivos del usuario activo, añadiendo el botón de administración visible solo para `administrador`.
- `src/app.js`: `showModule()` aplica el guard de permisos y el aviso de denegación; `onActiveUserChange()` dispara recálculo y landing; `initApp()` aplica la landing del usuario por defecto; el cambio de cargo desde el panel recalcula de inmediato.
- `index.html` y `styles.css`: añadir el contenedor `view-admin-permissions`, su botón `nav-admin` y estilos reutilizando los tokens existentes; no se crea un tema nuevo.
- `tests/unit` y `tests/integration`: casos para semilla, precedencia, overrides, landing, cambio de usuario/cargo, denegación de ruta y ausencia de cambios en datos operativos.

### Regla de decisión de permisos

La resolución se centraliza en una sola expresión:

`permitido = reglaDeNegocio(rol, recurso) && (excepcionIndividual ?? permisoDelRol ?? permisoPorDefectoDelRol)`

1. Se evalúa primero la regla de negocio vigente, incluida FR-099; si prohíbe la acción, la configuración no puede revertirla.
2. Después se aplica la excepción individual del usuario (`USER_PERMISSION_OVERRIDES`), que prevalece sobre el rol (SC-045).
3. Si no hay excepción, se usa `ROLE_PERMISSIONS`.
4. Como último recurso se usa el valor semilla del rol; un rol desconocido queda limitado a `dashboard` sin acciones.
5. El recurso `admin:permissions` es siempre `true` para `administrador`; si se intenta desactivar se muestra una advertencia no bloqueante (FR-118, SC-048).

Los recursos se identifican con claves estables: `module:<nombre>`, `view:<nombre>`, `section:<id>`, `action:<id>` y `admin:permissions`, reutilizando los valores de `MODULES` y `VIEWS`.

### Landing pages y cambio de usuario

- `ROLES.default_landing_module` define la página de inicio por cargo; la semilla usa `administrador` → `dashboard` (Panel general), `supervisor_inventario` → `alerts` y `encargado_bodega` → `movements`, con `dashboard` como fallback.
- La landing se abre al cargar la aplicación con el usuario activo por defecto y en cada cambio de usuario activo en la cabecera (FR-107, SC-040); el cambio de cargo del usuario activo también recalcula y abre la landing del nuevo rol (FR-116, FR-117).
- Si la landing configurada no existe, no está permitida para el rol o fue eliminada, se usa `dashboard` y se muestra un aviso no bloqueante (FR-119, SC-049).
- `setUserRole()` modifica solo `USERS.role`; conserva `user_id`, `assigned_warehouse_id` y la selección del usuario activo (FR-121).

### Acceso directo y bloqueo

- `showModule()` sigue siendo el único punto de cambio de vista y mantiene su guard; cuando se deniega una vista se muestra el mensaje de falta de permiso y se redirige a la landing permitida (FR-115, SC-043, SC-046).
- Se añade enrutado mínimo por hash `#/<module>`: `initApp()` lee el hash inicial y `hashchange` delega en `showModule()`. Una ruta denegada se reescribe a la landing permitida.
- No se incorpora `history`, `popstate` ni un router externo; la compatibilidad con la SPA actual se conserva.

### Persistencia y no mutación

- Solo se escriben las tres claves nuevas de configuración y el campo `USERS.role`; nunca se alteran `PRODUCTS`, `WAREHOUSES`, `STOCK`, `INVENTORY_TRANSACTIONS`, `STOCK_TRANSFERS` ni `REPLENISHMENT_REQUESTS` (FR-120, SC-047).
- Los nombres de roles, módulos y secciones introducidos en el panel se sanea con `escapeHtml` antes de mostrarse (FR-123).

### Trazabilidad rápida

| Requisitos | Cubierto por |
|---|---|
| FR-104, FR-105, FR-116, FR-117 | `setUserRole()` en `permissions.js` + panel de administración |
| FR-106–FR-108, FR-119 | `ROLES.default_landing_module` + `resolveLandingModule()` |
| FR-109–FR-112, FR-118, FR-122, FR-123 | `permissions-panel.js` + claves de configuración persistidas |
| FR-113–FR-115 | `applyNavigationPermissions()`, `applyPermissionUiState()`, `showModule()` y hash |
| FR-120, FR-121 | Aislamiento de escritura: solo configuración y `USERS.role` |
| FR-124, SC-050 | Regla de negocio evaluada antes que la matriz |
| SC-040–SC-049 | Casos de prueba unitarios e integración descritos arriba |

**Reevaluación post-diseño (Fase 1)**: sin nuevas violaciones de la constitución. El diseño mantiene la separación dominio/interfaz, centraliza la decisión de permisos, define pruebas verificables y conserva el rendimiento de la navegación existente.

## Verificación

- `T066`: `npx vitest run` y `npm run build` desde la raíz del repositorio.
- `T067`: validación manual de los escenarios de aceptación de `HU-01` a `HU-15` con `spec.md`, incluyendo el recorrido de `quickstart.md` y los criterios manuales parcialmente cubiertos por T136/T145.
- `T068`: reconciliación de `spec.md`, `plan.md`, `tasks.md` y `checklists/requirements.md` con la implementación actual.
- `T168`: ejecución registrada de linting, formato, análisis estático, `npm test` y `npm run build`; requisito bloqueante del criterio de calidad obligatorio de `spec.md`.
- Los casos de HU-08 quedaron incorporados a la suite en T085–T086; su ejecución está cubierta por `T066`.
- La ejecución de la suite no se realizó durante la reconciliación documental de 2026-11-17; T066 conserva esa evidencia histórica y quedó verificado nuevamente el 2026-11-25 con 34 archivos/302 pruebas OK y build correcto. T067 sigue parcial hasta registrar la validación manual por escenario.

## Seguimiento de Complejidad

| Desviación | Por qué sigue presente | Alternativa más simple rechazada | Seguimiento |
|---|---|---|---|
| Atomicidad de escrituras en movimientos, transferencias y recepciones no totalmente transaccional | `localStorage` no ofrece transacciones nativas y la implementación actual ya está operativa; se prefiere reforzar sin rehacer el dominio | Reemplazar toda la capa de persistencia por otra tecnología, con riesgo de perder datos y funcionalidad | T081, T082, T083 |
| `escapeHtml` no cubre comillas/backticks | Los listados actuales usan plantillas de texto; no se observó ejecución de contenido, pero conviene cerrar el caso | Desactivar el renderizado de contenido dinámico, rompiendo la interfaz | T084 |
| Roles simulados sin autenticación real | Decisión confirmada en clarificaciones 2026-11-03 y reafirmada para HU-08; el usuario activo del ERP sigue siendo suficiente | Introducir login y backend, fuera del alcance de 002 | Fuera de alcance; documentado en `spec.md` y `research.md` |
| Matriz persistida junto a una semilla estática del rol | La semilla preserva el comportamiento actual y permite reiniciar la configuración sin romper HU-01–HU-07 | Partir de una matriz vacía y denegar todo hasta configurarlo, con riesgo de bloquear a todos los roles | Resuelto en `research.md`; se valida con pruebas de semilla |
| Enrutado mínimo por hash `#/<module>` | Necesario para que FR-115 sea verificable sin añadir un router externo | Confiar solo en el estado interno de `showModule()`, sin acceso directo comprobable | Pruebas de integración derivadas de este plan |
| Rediseño visual corporativo pendiente | Debe preservarse como iniciativa separada para no alterar la lógica logística | Aplicar cambios globales de estilo dentro de 002, con riesgo de regresiones visuales y funcionales | Feature posterior `003-rediseno-visual-corporativo` |

## Ampliación: Plan de Documentación y Verificación de HU-09 (2026-11-23)

### Alcance y restricción

Esta ampliación cubre **exclusivamente HU-09 — Gestión de órdenes de adquisición y venta** sobre una funcionalidad OC/OV ya implementada. No reprograma, no reemplaza ni elimina la planificación de HU-01 a HU-08, no crea ramas ni altera el historial de Git. Se originó como documentación de decisiones, modelo, contrato de persistencia y guía de verificación; las tareas T104–T110 cerraron después la deuda detectada con cambios acotados y verificados.

La implementación de referencia es:

- `src/domain/orders.js`: `ORDER_CONFIG`, `nextOrderId()`, `createOrderForMovement()`, `listOrders()`.
- `src/domain/movements.js`: generación dentro de `registerMovement()` y rollback conjunto de `stock`, `inventory_transactions` y `orders`.
- `src/storage.js`: clave `logistics:orders`, esquema `orders`, `loadOrders()`/`saveOrders()` y `withStorageRollback()`.
- `src/components/order-list.js`, `src/components/movement-list.js`, `index.html` y `src/app.js`: panel de órdenes dentro de Movimientos y columna Orden en el historial.
- `tests/unit/orders.test.js` y `tests/integration/orders.test.js`: cobertura existente de OC/OV.

### Contexto Técnico HU-09

**Lenguaje/Versión**: JavaScript ES2022, sin cambios respecto al módulo.
**Persistencia**: `logistics:orders` como lista completa de órdenes; `logistics:inventory_transactions` conserva `order_id` en el movimiento generado. La orden es informativa, inmutable y no se elimina de forma independiente.
**Identificador**: `order_id` textual con prefijo `OC`/`OV` y cuatro dígitos; secuencias independientes derivadas del máximo existente. No se reutilizan valores mientras se conserve `logistics:orders`; no se añade contador ni migración.
**Regla de generación**: `entrada` → OC, `salida` → OV; ajustes, reposiciones y transferencias no generan orden.
**Atomicidad**: `withStorageRollback()` revierte stock, movimiento y orden ante fallo de escritura; el error `errors.storage` se muestra en el formulario de movimientos.
**UI**: panel «Órdenes generadas» dentro de Movimientos, sin módulo ni permiso propio; los filtros y la columna de usuario quedan como T107 diferida.
**Clarificaciones**: resueltas en `spec.md`, sesión 2026-11-23; no quedan `NEEDS CLARIFICATION`.

### Verificación de la Constitución — HU-09

- Calidad: la lógica OC/OV ya está aislada en `src/domain/orders.js` y se integra desde `movements.js` sin duplicar reglas en la interfaz; se conserva el diseño modular del módulo.
- Pruebas: existen pruebas unitarias y de integración para numeración, vínculo con el movimiento, idempotencia, no generación en ajustes/reposiciones, rollback y visualización del panel.
- Experiencia de Usuario: el panel reutiliza el marco y la vista de Movimientos; las órdenes aparecen también en el historial. T104 añadió el elemento visual para `errors.storage`; los filtros y la columna de usuario permanecen diferidos como T107.
- Rendimiento: `listOrders()` calcula nombres en memoria sobre una lista ya cargada; no añade round-trips ni dependencias.
- Seguridad/roles: no introduce autenticación ni permisos nuevos; hereda el guard de `movements` de HU-08.

**Resultado**: sin violaciones bloqueantes introducidas. La deuda de UI y de esquema quedó cerrada en T104–T106 y T109; T107 se conserva como mejora UX opcional fuera de esta edición.

### Puntos de cambio documentales

- `research.md`: decisión de documentar sobre código existente, correspondencia de nombres y brechas detectadas.
- `plan.md`: esta ampliación, con trazabilidad de requisitos y seguimiento de deuda.
- `data-model.md`: entidad `PURCHASE_SALES_ORDERS`, campo `order_id` en `INVENTORY_TRANSACTIONS`, relaciones y reglas de validación.
- `contracts/logistics-storage.md`: clave `logistics:orders`, operaciones de repositorio y expectativas de atomicidad.
- `quickstart.md`: recorrido de verificación HU-09 documentado durante la planeación y ejecutado después en T110.

No se crea un módulo `orders`, no se añaden claves de contador y no se renombran campos persistidos.

### Trazabilidad de requisitos HU-09

| Requisito | Evidencia en código/documentación |
|---|---|
| FR-125 | `createOrderForMovement()` persiste `order_id`, `order_type`, `transaction_id`, `product_id`, `warehouse_id`, `quantity`, `user_id` y `order_date`; sin importes ni estados |
| FR-126 | `nextOrderId()` calcula el máximo por prefijo `OC`/`OV` con `padStart(4, '0')` y rechaza colisiones; sin reutilización mientras persista `logistics:orders` |
| FR-127 | `ORDER_CONFIG` solo cubre `entrada`/`salida`; reposiciones pasan `generateOrder:false`; `confirmTransfer()` no crea órdenes |
| FR-128 | `registerMovement()` incluye la escritura de órdenes en `withStorageRollback([...])`; T104 muestra `errors.storage` en `error-movement-storage` y conserva el rollback atómico |
| FR-129 | `index.html` y `order-list.js` renderizan el panel dentro de Movimientos; `app.js` aplica `guardModuleAccess('movements')`; no hay permiso `orders` |
| SC-051 | `tests/unit/orders.test.js`, `tests/unit/storage.test.js` y `tests/integration/orders.test.js` cubren generación exacta, numeración, validación, esquema, errores de escritura y visualización sobre movimientos nuevos |

### Seguimiento de deuda existente

| Hallazgo | Estado documental | Seguimiento |
|---|---|---|
| `errors.storage` sin mensaje visible en UI | Resuelto en T104: `error-movement-storage`, `ERROR_FIELDS` y prueba de integración | Cerrado con rollback atómico conservado |
| Esquema `orders` no invocado desde `createOrderForMovement()` | Resuelto en T105: `validateRecord('orders', order, { list: orders })` antes de persistir | Cerrado con prueba unitaria de rechazo |
| `order_id` ausente en `LOGISTICS_SCHEMAS.movements` | Resuelto en T106: campo declarado como opcional para datos legacy | Cerrado con verificación en `tests/unit/storage.test.js` |
| Sin filtros ni columna de usuario en el panel | `listOrders()` solo añade nombres de producto/bodega | T107 diferida como mejora UX opcional |
| Movimientos legacy sin orden | No se hace backfill, por decisión de preservar historial | SC-051 se verifica sobre movimientos nuevos |
| Numeración dependiente de la lista persistida | Aclarado en T108: borrar `logistics:orders` reinicia la derivación del máximo | No se añade contador ni migración; los correlativos no se reutilizan mientras persista el historial |
| `orderPrefixForMovementType()` sin consumidores; ordenación por `transaction_id` con `NaN` legacy | Resuelto en T109: helper eliminado y comparador numérico con valores no finitos al final | Cerrado con prueba de regresión |

**Reevaluación post-implementación**: la ampliación mantiene la separación dominio/interfaz, no introduce dependencias, preserva HU-01–HU-08 y deja verificable HU-09. T104–T110 están completos; T107 permanece diferida sin afectar lo ya implementado.

## Ampliación: Plan de Diseño para HU-10 y HU-11 (2026-11-23)

### Alcance y restricción

Esta ampliación cubre **exclusivamente HU-10 (buscador y filtros de transferencias)** y **HU-11 (seguimiento de envíos al comprador)**. No reprograma, reemplaza ni elimina la planificación de HU-01 a HU-09; no crea ramas, commits ni push; y no implementa código. Las tareas derivadas se generarán más adelante con `/speckit.tasks`.

Las decisiones funcionales aplicadas son las registradas en `spec.md`, sesión 2026-11-23: búsqueda parcial e insensible a mayúsculas (HU-10), los tres roles pueden actualizar estados, una OV tiene como máximo un envío, avance secuencial con `Entregado` terminal y relación 1:1 OV–envío. La mención original a una «vista propia» de seguimiento quedó superada por FR-133: la interfaz vigente es una pestaña dentro de Movimientos, sin `nav-shipments`.

### Contexto Técnico HU-10/HU-11

**Lenguaje/Versión**: JavaScript ES2022, HTML y CSS; sin cambios respecto al módulo.  
**Persistencia**: claves `logistics:*` existentes más la nueva `logistics:shipments`; una lista completa por entidad.  
**Dominio HU-10**: `listTransfers(filters)` con filtros opcionales; sin escritura.  
**Dominio HU-11**: nuevo módulo `src/domain/shipments.js` con creación, avance de estado, consulta e historial embebido.  
**Identidad**: usuario activo simulado de `logistics:active_user_id`; sin autenticación.  
**Permisos**: matriz existente más `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status`; FR-124 se mantiene como límite superior.  
**Navegación (vigente)**: `shipments` permanece como recurso lógico de permisos y la pestaña «Seguimiento de envíos» vive dentro de Movimientos; `#/shipments` redirige a esa pestaña cuando el permiso está concedido.  
**Pruebas**: Vitest con jsdom; se amplían pruebas de transferencias y se añaden pruebas unitarias/de integración de envíos.  
**Clarificaciones**: resueltas en `spec.md`; no quedan `NEEDS CLARIFICATION`.

### Verificación de la Constitución — HU-10/HU-11

- Calidad: los filtros de transferencias se concentran en `transfers.js` y el seguimiento en `shipments.js`; la interfaz solo consume esas APIs, sin duplicar reglas.
- Pruebas: se cubren combinación de filtros, estado vacío, no mutación, unicidad OV–envío, transiciones secuenciales, historial y permisos con pruebas unitarias e integración.
- Experiencia de Usuario: se reutilizan `.toolbar`, `.filter-grid`, `.empty`, `.data-table` y `.status-badge`; la nueva vista usa el mismo marco ERP y mensajes claros de denegación.
- Rendimiento: el filtrado se resuelve en memoria sobre listas ya cargadas, sin round-trips ni dependencias; compatible con el objetivo de 500 registros.
- Seguridad/roles: se mantiene el modelo de roles simulados; la matriz puede restringir pero no otorgar acciones prohibidas (FR-124), y los textos visibles se escapan con `escapeHtml`.

**Resultado histórico**: sin violaciones de la constitución para HU-10/HU-11 en el momento de ese diseño; el resultado vigente quedó condicionado en la Fase 20 a la ejecución de linting, formato y análisis estático mediante T168.

### Diseño HU-10 — Búsqueda y filtros de transferencias

**Contrato de dominio**

- `listTransfers(filters = {})` conserva la firma sin argumentos y la ordenación actual por `transfer_id` descendente.
- Filtros admitidos: `term`, `status`, `productId`, `sourceWarehouseId`, `targetWarehouseId`.
- `term` aplica coincidencia parcial e insensible a mayúsculas sobre `product_name` y sobre `String(transfer_id)`; no se añade búsqueda por SKU porque no está en el alcance.
- `status`, `productId`, `sourceWarehouseId` y `targetWarehouseId` se comparan de forma exacta; los IDs se normalizan con `Number(...)`.
- Todos los filtros presentes se combinan con AND; un filtro vacío o `undefined` se ignora.
- La operación es de solo lectura: no escribe `logistics:stock_transfers`, `logistics:stock`, catálogos ni movimientos.

**Interfaz y puntos de cambio**

- Controles nuevos dentro de `#view-transfers`, en la tarjeta «Transferencias registradas»: `transfer-search`, `transfer-filter-status`, `transfer-filter-product`, `transfer-filter-source` y `transfer-filter-target`.
- `renderTransferList()` recibe la lista ya filtrada; se mantiene su actualización de `transfer-count` y del estado vacío `transfer-list-empty`.
- Se añade una columna `#ID` al listado para hacer verificable la búsqueda por identificador de transferencia.
- `refreshTransfers()` lee los controles y llama a `listTransfers(filters)`; los eventos `input`/`change` se registran junto a los filtros existentes.
- No se añade permiso ni módulo: HU-10 hereda `module:transfers` y `view:transfers`.
- Puntos de cambio previstos: `src/domain/transfers.js`, `src/app.js`, `src/components/transfer-list.js`, `index.html`, `tests/unit/transfers.test.js`, `tests/integration/transfers.test.js` y, si el filtro incrementa el coste medido, `tests/unit/performance.test.js`.

### Diseño HU-11 — Seguimiento de envíos al comprador

**Persistencia y esquema**

- Clave nueva: `logistics:shipments`, lista completa de registros `SHIPMENTS`.
- Campos persistidos: `shipment_id` (int, PK), `order_id` (string, FK única a `PURCHASE_SALES_ORDERS`, solo OV), `carrier`, `tracking_code`, `status`, `created_by`, `created_at` e `history[]`.
- `history[]` guarda eventos `{ status, changed_at, changed_by }` con fecha ISO y usuario responsable; el evento inicial `en_bodega` se crea junto con el envío.
- Unicidad declarada como `unique: [['shipment_id'], ['order_id']]`; no se usa una unicidad compuesta plana.
- `shipment_id` se deriva con el helper secuencial entero existente; no se reutilizan los prefijos `OC`/`OV`, que pertenecen a HU-09.
- No se crea clave de contador ni migración; no se generan envíos retroactivos.

**Reglas de dominio**

- Estados persistidos: `en_bodega`, `en_transito`, `en_reparto`, `entregado`; etiquetas visibles: «En bodega», «En tránsito», «En reparto», «Entregado».
- `advanceShipmentStatus(shipmentId, actorUserId)` solo permite avanzar al estado inmediatamente siguiente. Se rechazan saltos, retrocesos, repeticiones y cualquier cambio desde `entregado` (FR-132).
- `actorUserId` se valida contra `USERS`; cada avance agrega un evento de historial con `new Date().toISOString()` y el `user_id` numérico.
- `createShipment({ orderId, carrier, trackingCode, createdBy })` valida que la orden exista, sea `order_type = "venta"` y no tenga ya un envío (FR-131).
- `listShipments(filters)` admite búsqueda parcial e insensible a mayúsculas por `orderId` y `trackingCode`, y filtro exacto por `status`.
- El módulo no llama a `registerMovement()`, no modifica `STOCK` y no altera `logistics:orders` ni `logistics:inventory_transactions`.

**Permisos y semilla**

- Recursos nuevos: `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status`.
- La semilla permite módulo, vista y acciones a `administrador`, `supervisor_inventario` y `encargado_bodega`, conforme a la clarificación de roles; FR-124 sigue vigente.
- No se añaden entradas a `FORBIDDEN_BY_ROLE`: la matriz puede restringir, nunca conceder más de lo permitido por reglas de negocio.
- No se sobrescribe `ROLE_PERMISSIONS` ya persistido; las filas ausentes se resuelven con el fallback de la semilla en `getEffectivePermission()`.

**Interfaz y navegación**

- `shipments` permanece como módulo/vista lógico en `MODULES`/`VIEWS` de `app.js` y `permissions.js`, pero la interfaz vigente NO crea `nav-shipments`: el contenedor de seguimiento se integra como pestaña de Movimientos (FR-133, T160).
- Componentes nuevos: `shipment-form.js` (selección de OV elegible, transportista y código de seguimiento) y `shipment-list.js` (listado, búsqueda, historial y acción de avance), alojados en la pestaña de Movimientos.
- `showModule()` aplica el guard `module:shipments`; la ruta directa `#/shipments` redirige a la pestaña permitida y, si no hay permiso, muestra el mensaje de falta de permiso y redirige a la landing permitida.
- La interfaz reutiliza tokens CSS existentes; no se crea un tema nuevo ni se modifica el marco ERP.
- Puntos de cambio previstos: `src/storage.js`, `src/domain/shipments.js`, `src/domain/seed.js`, `src/domain/permissions.js`, `src/components/shipment-form.js`, `src/components/shipment-list.js`, `src/components/shell.js`, `src/app.js`, `index.html`, `tests/unit/shipments.test.js`, `tests/integration/shipments.test.js`, `tests/unit/storage.test.js`, `tests/unit/permissions.test.js`, `tests/integration/permissions.test.js` y `tests/integration/workspace-shell.test.js`.

### Trazabilidad de requisitos HU-10/HU-11

| Requisito | Evidencia prevista |
|---|---|
| FR-130 | `action:shipments.update_status` sembrado para los tres roles; guard de permisos en la vista |
| FR-131 | `unique: [['order_id']]` y validación de orden OV sin envío en `createShipment()` |
| FR-132 | Mapa de transición siguiente y rechazo de retrocesos/terminal en `advanceShipmentStatus()` |
| FR-133 | Módulo `shipments`, vista `view-shipments`, ruta `#/shipments` y entrada en la matriz |
| FR-134 | `listTransfers(filters)` con `term` parcial e insensible a mayúsculas sobre producto e ID |
| Escenarios HU-10 | Controles `#transfer-*`, columna `#ID`, estado vacío y pruebas de combinación de filtros |
| Escenarios HU-11 | Formulario/lista de envíos, historial con actor/fecha, búsqueda y no mutación de stock/movimientos |

### Seguimiento de complejidad y riesgos

| Riesgo | Mitigación |
|---|---|
| `listTransfers()` también alimenta el dashboard | Los filtros son opcionales y por defecto vacíos; sin filtros el resultado es idéntico al actual. |
| Valores de filtro `string` frente a IDs numéricos | Normalización con `Number(...)` antes de comparar. |
| Columna `#ID` nueva | Cambio de solo lectura; actualizar selectores y expectativas de las pruebas de transferencias. |
| Unicidad 1:1 mal declarada | Usar `unique: [['shipment_id'], ['order_id']]`, nunca un array plano compuesto. |
| Matriz persistida sin filas nuevas | Confiar en el fallback semilla sin sobrescribir la configuración guardada. |
| Datos demo sin órdenes OV | Documentar la vista vacía hasta registrar una salida real; no generar backfill. |
| Recuento de navegación | Histórico: se ajustó de 11 a 12 botones con `nav-shipments`; vigente: T146/T160 dejan seis secciones y el seguimiento como pestaña, sin `nav-shipments`. |

**Reevaluación post-diseño (Fase 1)**: sin nuevas violaciones de la constitución. El diseño mantiene la separación dominio/interfaz, preserva HU-01–HU-09, agrega una vista con permisos coherentes y define criterios verificables antes de generar tareas.

## Reconciliación de interfaz para HU-12/HU-14 (2026-11-25)

- La descripción estructural previa se conserva como historial; la interfaz vigente se resuelve en T146–T152.
- `index.html` mantiene el marco persistente, pero el menú lateral solo muestra Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas. El panel principal se alcanza desde la barra superior y el panel de permisos desde un botón de la misma barra, visible solo para `administrador`.
- Entidades, Documentos, Búsqueda, Reposiciones y Envíos conservan sus vistas, formularios, listados y funciones internas; quedan `hidden` y sin accesos visibles para cumplir HU-12/HU-14 sin pérdida de datos.
- Movimientos organiza Entradas, Salidas, Historial, Órdenes y Seguimiento de envíos en pestañas; Alertas organiza Alertas y Reposiciones. `src/app.js` resuelve rutas antiguas y alias a la pestaña correspondiente, aplica el guard de permisos por pestaña y mantiene una pestaña activa por defecto.
- `src/components/dashboard.js` y la vista del panel principal informan cuatro indicadores: productos, bodegas, stock total y alertas activas; no hay botones ni enlaces visibles hacia las seis secciones.
- `src/styles.css` reutiliza tokens existentes para pestañas, botones superiores y panel de indicadores; no se introduce un tema nuevo.
- Verificación: `npx vitest run` con 34 archivos/304 pruebas OK y `npm run build` correcto; sin crear ramas, commits ni push adicionales durante esta corrección documental, conservando el historial previo del repositorio.

## Fase 18: HU-15 — Datos de ejemplo con nombres ficticios variados (2026-11-26)

- Límites: esta fase se añade al final del plan sin reescribir las fases anteriores; sus decisiones abiertas se consolidaron en la Fase 19.
- Alcance: renombrar los cuatro usuarios semilla conservando `user_id`, orden, roles, bodega asignada y referencias por `user_id` (FR-148–FR-150, SC-071 y SC-073).
- Persistencia: `src/domain/seed.js` define los nuevos valores; `src/storage.js` aplica una migración exacta por (`user_id`, nombre, correo), sin duplicados, sin alterar usuarios modificados y sin tocar `logistics:active_user_id`; la siembra sigue ocurriendo solo si el catálogo está vacío (FR-152 y FR-153).
- Datos de demostración: `src/domain/demo-data.js` deriva la bodega desde rol + orden del catálogo (`user_id` 1–4; los `encargado_bodega` en los ids 2 y 4), sin comparar nombres; la interpretación operativa quedó definida en HU-15 y FR-151 durante la Fase 19.
- Verificación de nombres: la condición de nombres ficticios se mantiene como revisión manual documentada con evidencia en `checklists/requirements.md`; el criterio objetivo de no correspondencia con personas reales o públicas se conserva como revisión manual (A1) y no se instrumentó en esta ronda.
- Fallos: el comportamiento ante una escritura fallida durante la migración quedó definido en la Fase 20: rollback de `logistics:users` y `logistics:active_user_id`, error claro y migración no marcada como aplicada.
- Verificación: ampliar `tests/unit/storage.test.js`, `tests/unit/demo-data.test.js` y `tests/integration/shipments.test.js`; ejecutar `npx vitest run` y `npm run build`; actualizar el checklist `HU15-009` y el registro incremental de `tasks.md` con T153–T158 cuando se generen; sin crear ramas ni commits.
- Constitución: `.specify/memory/constitution.md` existe y rige el proyecto; la afirmación histórica N1 sobre su ausencia quedó corregida en la Fase 19.

## Fase 19: Consolidación documental post-clarificación — 2026-11-27

- Límites: solo documentación; no se modifica código, no se crean ramas ni commits y no se ejecutan pruebas nuevas en esta fase.
- Alcance: alinear `spec.md`, `plan.md`, `tasks.md` y `checklists/requirements.md` con las cinco decisiones registradas en la sesión de clarificación 2026-11-27.
- Decisiones aplicadas: HU-15 es parte del MVP; envíos es pestaña de Movimientos con permisos y alias `#/shipments`; el cambio de cargo abre de inmediato la landing del nuevo rol; el dataset canónico es `logistics-demo-v1`; la confirmación de transferencias revalida stock en origen y se rechaza sin cambios si es insuficiente.
- Requisitos nuevos: FR-154 y FR-155, ampliados en Fase 20 con FR-156; criterios nuevos: SC-076 y SC-077, ampliados con SC-078; escenarios nuevos: HU-05 escenario 6; casos límite nuevos: alias `#/shipments`, confirmación con stock insuficiente y fallo del cargador demo.
- Trazabilidad: las decisiones deben quedar reflejadas en las filas de HU-05, HU-08, HU-11 y HU-15 de `spec.md`, y en T159–T163 de `tasks.md`.
- Riesgos residuales: medición instrumentada de SC-011/SC-015/SC-017/SC-024/SC-027/SC-030/SC-033 (T067), validación visual de T136/T145, evidencia parcial de T031/T036/T048/T065 y diferimiento histórico de T107, ahora bloqueante del MVP canónico. La regla de rollback ante fallo de escritura en la migración de HU-15 quedó definida en la Fase 20.
- Verificación: revalidación documental en `checklists/requirements.md` con cobertura FR-001–FR-156, SC-001–SC-078, US1–US15 y casos límite, ampliada en Fase 20 con FR-156/SC-078; sin ejecución de `npx vitest run` ni `npm run build` en esta fase.

## Fase 20: Consolidación reconstruible del MVP — 2026-11-27

- Límites: solo documentación de `spec.md`, `plan.md`, `tasks.md` y checklist; no se modifica código, no se crean ramas ni commits y no se ejecutan pruebas nuevas en esta fase.
- Alcance canónico: el MVP es `HU-01`–`HU-15`; las referencias históricas a `US1`, `US8`, CRUD genérico, `nav-shipments`, doce botones de menú o vista propia de envíos quedan subordinadas a los requisitos vigentes de `spec.md`.
- Datos: `logistics-demo-v1` deriva `quantity_available` de movimientos y transferencias confirmadas y publica por separado la tabla de `min_stock_level`; la tabla de stock publicada en versiones anteriores quedó corregida en `spec.md`. El cargador es una acción utilitaria de la barra superior con FR-156/SC-078, no una tarjeta ni botón del panel principal.
- Permisos: `spec.md:FR-124` contiene la matriz semilla completa, landing por rol, acciones prohibidas y regla de que las excepciones individuales nunca conceden una acción prohibida; `plan.md` usa esa tabla como contrato y no redefine la matriz.
- Terminado: `T031`, `T036`, `T048`, `T065`, `T067`, `T107`, `T136` y `T145` son bloqueantes; cada una requiere evidencia automatizada o revisión manual registrada antes de declarar terminado el MVP.
- Calidad: T168 debe configurar y ejecutar `npm run lint`, `npm run format:check`, `npm run analyze`, `npm test` y `npm run build`, con resultado 0 y sin advertencias relevantes; sin esa evidencia no se afirma conformidad con la constitución.
- Persistencia: `spec.md` es la fuente canónica de claves, formatos, estado inicial, usuario activo por defecto y reglas de no mutación; este plan no introduce claves adicionales.
- Trazabilidad: T164–T168 en `tasks.md` cubren las cinco decisiones de esta ronda y las correcciones de consistencia posteriores al análisis, y actualizan el registro incremental sin renumerar T001–T163.

## Fase 21: Navegación por pestañas del navegador — 2026-11-27

- Alcance: HU-16 con FR-157–FR-160 y SC-079–SC-082; ampliación de navegación que no altera el MVP canónico `HU-01`–`HU-15` ni renombra los FR-125–FR-128 de órdenes.
- Arquitectura: `src/app.js` conserva `showModule()` y las pestañas internas de Movimientos/Alertas; añade `navigateToModule()`, `openModuleInBrowserTab()` y sincronización de `#/<modulo>` para abrir los módulos laterales en pestañas nuevas.
- Persistencia: no se introduce clave ni estado de pestañas; `window.open` solo navega a la misma página con hash y no escribe en `localStorage`.
- Permisos: el guard se aplica antes de abrir; un módulo no autorizado no abre pestaña y muestra el aviso, y un hash no autorizado redirige a la landing del rol.
- Respaldo: si `window.open` devuelve `null` o lanza error, la navegación ocurre en la pestaña actual; los flujos internos (`data-goto`, reposición desde alerta) nunca usan `window.open`.
- Verificación: `tests/integration/browser-tabs.test.js` cubre apertura, hash, denegación, respaldo y flujos internos, conservando las pruebas de las pestañas internas y del panel de indicadores.

