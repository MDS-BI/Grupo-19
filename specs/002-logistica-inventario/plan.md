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
**Pestañas del navegador (FR-125–FR-128)**: los módulos principales de la barra lateral se abren con `window.open` en una pestaña nueva con la URL de la misma página más `#/<modulo>`; no hay barra de pestañas interna ni estado persistido  
**Arranque por hash**: cada pestaña carga la aplicación de forma independiente y muestra solo el módulo indicado por su hash; los flujos internos navegan en la misma pestaña y, si se bloquea la apertura emergente, se usa la pestaña actual como respaldo  
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
- Calidad (pestañas): La apertura se orquestará en `src/app.js` sobre la navegación existente; no se añaden módulos de estado ni componentes de barra. Las reglas de permisos siguen centralizadas en `src/domain/permissions.js`.
- Pruebas (pestañas): Se cubrirán con Vitest la URL pasada a `window.open`, el guard que impide abrir módulos no autorizados, la carga por hash `#/<module>`, el respaldo en la pestaña actual y la permanencia de los flujos internos en la misma pestaña.
- Experiencia de Usuario (pestañas): No hay barra de pestañas interna; el usuario abre módulos desde la barra lateral, ve el aviso de acceso cuando corresponde y mantiene una navegación predecible con el botón atrás del navegador mediante hash.
- Rendimiento (pestañas): Cada pestaña carga solo su módulo desde el hash; la apertura no recarga colecciones operativas ni escribe en `localStorage`.

**Resultado de la comprobación**: sin violaciones de la constitución. La HU-08 y las pestañas del navegador refuerzan los principios existentes (dominio separado, pruebas automatizadas, UX consistente y rendimiento) y no introducen dependencias externas.

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
│   ├── dashboard.js      (vista de inicio: tarjetas de estadísticas logísticas y paneles de actividad en vivo)
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

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. El módulo base (Entidad/Documento, `entity-form.js`/`document-form.js`) se conserva intacto para no introducir regresiones (ver FR-001–039), mientras que el dominio de Logística e Inventario se construye como una capa adicional: `src/storage.js` concentra los esquemas, la persistencia y los helpers de validación/saneamiento compartidos por las entidades logísticas (`PRODUCTS`, `PRODUCT_CATEGORIES`, `WAREHOUSES`, `USERS`, `STOCK`, `INVENTORY_TRANSACTIONS`, `STOCK_TRANSFERS`, `REPLENISHMENT_REQUESTS`); `src/domain/` concentra las reglas de negocio de cada historia de usuario (productos, bodegas, movimientos, transferencias, stock, alertas y reposiciones) desacopladas de la interfaz; y `src/components/` añade un formulario y un listado por historia de usuario junto a los componentes base. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos (ahora incluyendo Productos, Bodegas, Stock, Movimientos, Transferencias, Alertas y Reposiciones) — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza las tarjetas de estadísticas logísticas y los paneles de actividad de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente.

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

## Ampliación: Diseño para pestañas del navegador (FR-125–FR-128)

### Alcance

Los módulos principales de la barra lateral se abren en pestañas nuevas del navegador. No se crea una capa de navegación dentro del ERP: cada pestaña carga la aplicación por su cuenta y `showModule()` sigue siendo el único punto que hace visible una sola vista. No se alteran datos operativos ni la semántica de permisos de HU-08.

### Capas y puntos de cambio

- `src/app.js`: al pulsar un módulo de la barra lateral se comprueban los permisos efectivos del usuario activo; si está permitido se llama a `window.open` con la URL de la misma página más `#/<module>`. Si no está permitido, no se abre pestaña y se muestra el aviso de acceso existente. Si `window.open` no devuelve ventana (bloqueo de emergentes), se navega en la pestaña actual con el mismo hash.
- `src/app.js`: `initApp()` y `hashchange` resuelven el módulo desde `#/<module>` dentro de cada pestaña y delegan en `showModule()`, manteniendo el guard de FR-115 y la landing del rol como fallback.
- `src/app.js`: los botones internos `data-goto` y la creación de reposición desde una alerta continúan navegando en la misma pestaña, sin pasar por `window.open`.
- `index.html` y `src/styles.css`: no hay contenedor ni estilos de barra de pestañas interna; `[hidden]` continúa gobernando la visibilidad de vistas y el marco de barra lateral permanece igual.
- `src/storage.js`: no se añade ninguna clave ni helper de persistencia de pestañas; no se guardan listas de pestañas ni borradores de formularios entre pestañas.
- Se retiran los módulos y pruebas de la barra de pestañas interna; la cobertura se incorpora a la suite de navegación existente en `tests/unit/` y `tests/integration/`.

### Arranque de cada pestaña

- El hash `#/<module>` es la fuente de la vista visible de esa pestaña. Al cargar, si el hash es válido y autorizado se muestra ese módulo; si falta, es desconocido o no está autorizado, se aplica el aviso de acceso y la redirección a landing ya definida para FR-115.
- Recargar una pestaña reproduce el mismo resultado a partir de su hash; no hay estado de pestañas que restaurar ni borradores compartidos entre pestañas.
- Los cambios de usuario, cargo o permisos se evalúan con las reglas de HU-08 en cada pestaña cuando esta carga o navega; no se cierran pestañas del navegador de forma automática.

### Permisos y respaldo

- La decisión de permisos usa `canAccessModule()` y el guard especial del panel de administración; las reglas de negocio de FR-124 siguen siendo el límite superior.
- Un módulo no autorizado no abre pestaña nueva y muestra el aviso de acceso denegado existente.
- Si el navegador bloquea ventanas emergentes, la navegación se realiza en la pestaña actual con el mismo hash como respaldo, sin dejar la acción sin efecto.

### Flujos internos y persistencia

- Los flujos dentro de una vista (`data-goto`, «Solicitar» desde una alerta de HU-06/HU-07) siguen navegando en la misma pestaña.
- No existe `logistics:workspace_tabs`, ni estructuras `dirtyTabs`/`draftSnapshots` compartidas. Cada pestaña mantiene sus propios formularios mientras permanece abierta; al cerrarla no se transfiere estado a otra pestaña.

### Trazabilidad rápida

| Requisitos | Cubierto por |
|---|---|
| FR-125 | Botones de módulos de la barra lateral → `window.open` con `#/<module>`; sin barra interna |
| FR-126 | Carga independiente por hash en `initApp()`/`hashchange`; sin persistencia de pestañas ni borradores |
| FR-127 | Guard de permisos previo a la apertura y aviso de acceso para módulos no autorizados |
| FR-128 | `data-goto` y reposición desde alerta en la misma pestaña; respaldo en la pestaña actual si se bloquea el emergente |

**Reevaluación post-diseño (Fase 1, pestañas)**: sin nuevas violaciones de la constitución. El diseño reutiliza la navegación por hash y la matriz de permisos, no añade dependencias ni módulos de estado, y define verificaciones automáticas para cada requisito nuevo.

## Verificación

- `T066`: `npx vitest run` y `npm run build` desde la raíz del repositorio.
- `T067`: validación manual de los escenarios de aceptación de HU-01 a HU-08 y de FR-125–FR-128 con `spec.md`, incluyendo el recorrido de `quickstart.md`.
- `T068`: reconciliación de `spec.md`, `plan.md`, `tasks.md` y `checklists/requirements.md` con la implementación actual.
- Los casos de HU-08 y de navegación por pestañas del navegador se verifican en la suite de `tests/`; su ejecución está cubierta por `T066` y `T104`.
- La verificación de pestañas debe cubrir: clic en un módulo permitido → pestaña nueva con `#/<module>`, módulo no autorizado → sin pestaña y aviso de acceso, recarga → solo el módulo del hash, flujos internos → misma pestaña, bloqueo de emergentes → respaldo en la pestaña actual, y ausencia de barra interna y de estado persistido.
- La ejecución final tras el cambio a pestañas del navegador se registrará en T104; T066 permanece pendiente en `tasks.md`.

## Seguimiento de Complejidad

| Desviación | Por qué sigue presente | Alternativa más simple rechazada | Seguimiento |
|---|---|---|---|
| Atomicidad de escrituras en movimientos, transferencias y recepciones no totalmente transaccional | `localStorage` no ofrece transacciones nativas y la implementación actual ya está operativa; se prefiere reforzar sin rehacer el dominio | Reemplazar toda la capa de persistencia por otra tecnología, con riesgo de perder datos y funcionalidad | T081, T082, T083 |
| `escapeHtml` no cubre comillas/backticks | Los listados actuales usan plantillas de texto; no se observó ejecución de contenido, pero conviene cerrar el caso | Desactivar el renderizado de contenido dinámico, rompiendo la interfaz | T084 |
| Roles simulados sin autenticación real | Decisión confirmada en clarificaciones 2026-11-03 y reafirmada para HU-08; el usuario activo del ERP sigue siendo suficiente | Introducir login y backend, fuera del alcance de 002 | Fuera de alcance; documentado en `spec.md` y `research.md` |
| Matriz persistida junto a una semilla estática del rol | La semilla preserva el comportamiento actual y permite reiniciar la configuración sin romper HU-01–HU-07 | Partir de una matriz vacía y denegar todo hasta configurarlo, con riesgo de bloquear a todos los roles | Resuelto en `research.md`; se valida con pruebas de semilla |
| Enrutado mínimo por hash `#/<module>` | Necesario para que FR-115 sea verificable sin añadir un router externo | Confiar solo en el estado interno de `showModule()`, sin acceso directo comprobable | Pruebas de integración derivadas de este plan |
| Rediseño visual corporativo pendiente | Debe preservarse como iniciativa separada para no alterar la lógica logística | Aplicar cambios globales de estilo dentro de 002, con riesgo de regresiones visuales y funcionales | Feature posterior `003-rediseno-visual-corporativo` |
| Estado de pestañas internas sustituido por pestañas del navegador | La solicitud vigente es abrir módulos con `window.open` y hash, sin barra interna ni estado compartido | Mantener la barra WAI-ARIA y la clave persistida anteriores, que ya no describen el comportamiento | Resuelto en `research.md`; verificación en T104 |
| Borradores y lista de pestañas no compartidos | Cada pestaña carga la aplicación de forma independiente desde su hash | Persistir valores de formularios o una lista global de pestañas, con riesgo de datos obsoletos y sensibles | Resuelto en `research.md`; se valida en T104 |

