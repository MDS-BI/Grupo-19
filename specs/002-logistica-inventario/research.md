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
