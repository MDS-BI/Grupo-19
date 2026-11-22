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
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y capacidades de navegación  
**Control de Acceso (HU-08)**: Matriz de permisos por rol y excepciones por usuario persistidas en `localStorage`, con las reglas de negocio vigentes como límite superior (FR-124)  
**Persistencia HU-08**: Claves `logistics:roles`, `logistics:role_permissions` y `logistics:user_permission_overrides`, junto a `logistics:active_user_id` existente  
**Navegación (HU-08)**: `showModule()` sigue siendo el único punto de cambio de vista; se añade enrutado por hash `#/<module>` para hacer verificable el bloqueo de acceso directo (FR-115)  
**Identidad**: Usuario activo simulado desde `USERS` y `logistics:active_user_id`; sin login, contraseñas ni backend

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

**Resultado de la comprobación**: sin violaciones de la constitución. La HU-08 refuerza los principios existentes (dominio separado, pruebas automatizadas, UX consistente y rendimiento) y no introduce dependencias externas.

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

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. El módulo base (Entidad/Documento, `entity-form.js`/`document-form.js`) se conserva intacto para no introducir regresiones (ver FR-001–039), mientras que el dominio de Logística e Inventario se construye como una capa adicional: `src/storage.js` concentra los esquemas, la persistencia y los helpers de validación/saneamiento compartidos por las entidades logísticas (`PRODUCTS`, `PRODUCT_CATEGORIES`, `WAREHOUSES`, `USERS`, `STOCK`, `INVENTORY_TRANSACTIONS`, `STOCK_TRANSFERS`, `REPLENISHMENT_REQUESTS`); `src/domain/` concentra las reglas de negocio de cada historia de usuario (productos, bodegas, movimientos, transferencias, stock, alertas y reposiciones) desacopladas de la interfaz; y `src/components/` añade un formulario y un listado por historia de usuario junto a los componentes base. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos (ahora incluyendo Productos, Bodegas, Stock, Movimientos, Transferencias, Alertas y Reposiciones) — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente.

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
- `T067`: validación manual de los escenarios de aceptación de HU-01 a HU-08 con `spec.md`, incluyendo el recorrido de `quickstart.md`.
- `T068`: reconciliación de `spec.md`, `plan.md`, `tasks.md` y `checklists/requirements.md` con la implementación actual.
- Los casos de HU-08 quedarán incorporados a la suite cuando se generen las tareas derivadas de este plan; su ejecución está cubierta por `T066`.
- La ejecución de la suite no se realizó durante la reconciliación documental de 2026-11-17; por eso T066 permanece pendiente en `tasks.md`.

## Seguimiento de Complejidad

| Desviación | Por qué sigue presente | Alternativa más simple rechazada | Seguimiento |
|---|---|---|---|
| Atomicidad de escrituras en movimientos, transferencias y recepciones no totalmente transaccional | `localStorage` no ofrece transacciones nativas y la implementación actual ya está operativa; se prefiere reforzar sin rehacer el dominio | Reemplazar toda la capa de persistencia por otra tecnología, con riesgo de perder datos y funcionalidad | T081, T082, T083 |
| `escapeHtml` no cubre comillas/backticks | Los listados actuales usan plantillas de texto; no se observó ejecución de contenido, pero conviene cerrar el caso | Desactivar el renderizado de contenido dinámico, rompiendo la interfaz | T084 |
| Roles simulados sin autenticación real | Decisión confirmada en clarificaciones 2026-11-03 y reafirmada para HU-08; el usuario activo del ERP sigue siendo suficiente | Introducir login y backend, fuera del alcance de 002 | Fuera de alcance; documentado en `spec.md` y `research.md` |
| Matriz persistida junto a una semilla estática del rol | La semilla preserva el comportamiento actual y permite reiniciar la configuración sin romper HU-01–HU-07 | Partir de una matriz vacía y denegar todo hasta configurarlo, con riesgo de bloquear a todos los roles | Resuelto en `research.md`; se valida con pruebas de semilla |
| Enrutado mínimo por hash `#/<module>` | Necesario para que FR-115 sea verificable sin añadir un router externo | Confiar solo en el estado interno de `showModule()`, sin acceso directo comprobable | Pruebas de integración derivadas de este plan |
| Rediseño visual corporativo pendiente | Debe preservarse como iniciativa separada para no alterar la lógica logística | Aplicar cambios globales de estilo dentro de 002, con riesgo de regresiones visuales y funcionales | Feature posterior `003-rediseno-visual-corporativo` |

