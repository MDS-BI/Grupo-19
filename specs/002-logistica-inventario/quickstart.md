# Guía Rápida: Módulo de Logística e Inventario

**Feature**: `002-logistica-inventario`  
**Fecha**: 2026-11-17

Esta guía describe cómo arrancar y verificar la implementación actual sin regenerar artefactos ni modificar datos.

## Requisitos

- Node.js instalado.
- Dependencias del repositorio instaladas.

## Arranque

```bash
npm install
npm run dev
```

La aplicación se abre en la URL que indique Vite.

## Verificación

```bash
npx vitest run
npm run build
```

Estos comandos corresponden a T066 y no se ejecutaron durante la reconciliación documental de 2026-11-17. La suite debe incorporar los casos HU-08 descritos en `plan.md` cuando se generen sus tareas.

## Recorrido funcional

1. Seleccionar el usuario activo en la cabecera del ERP.
2. HU-01: crear y editar un producto con SKU único, precios y categoría.
3. HU-04: crear una bodega y verificar que aparece en los selectores operativos.
4. HU-03: registrar una entrada, luego una salida; comprobar que no existen acciones de edición/eliminación en el historial.
5. HU-05: crear una transferencia, confirmarla y verificar el descuento/incremento de stock.
6. HU-02: consultar existencias por producto/bodega y su total.
7. HU-06: configurar `min_stock_level`, provocar una alerta y comprobar que desaparece al reponer stock.
8. HU-07: desde una alerta, presionar «Solicitar», aprobar la reposición y recibirla; verificar que se crea un único movimiento de entrada y que la alerta desaparece.
9. HU-08: cambiar el usuario activo y comprobar que se abre la landing de su cargo; entrar al panel de administración, redefinir una landing y desmarcar un módulo; verificar que el enlace desaparece, que la ruta directa `#/<modulo>` muestra el aviso de falta de permiso y que los datos de HU-01–HU-07 permanecen sin cambios.

## Verificación específica de HU-08

- Probar los tres roles semilla: `administrador`, `supervisor_inventario` y `encargado_bodega`.
- Confirmar que el panel de permisos solo es visible para `administrador` y no puede desactivarse para ese cargo.
- Cambiar el cargo de un usuario y comprobar que la navegación se recalcula de inmediato y se abre la landing del nuevo rol.
- Marcar una excepción individual que contradiga la matriz y verificar que prevalece, salvo que una regla de negocio la prohíba (FR-124).
- Configurar una landing inválida y comprobar que la aplicación cae a `dashboard` con aviso no bloqueante.
- Recargar la página para confirmar que cargos, landing pages y permisos persisten en el mismo navegador.

## Persistencia

- Los datos se guardan en `localStorage` bajo las claves `logistics:*` documentadas en `contracts/logistics-storage.md`, incluidas `logistics:roles`, `logistics:role_permissions` y `logistics:user_permission_overrides`.
- No se requiere borrar datos para validar este módulo.
- No se deben restaurar archivos desde commits antiguos; T002 en `tasks.md` describe la verificación segura del estado actual.

## Estado documental

- Especificación: `spec.md`.
- Decisiones técnicas: `research.md`.
- Diseño: `plan.md`, `data-model.md`, `MER.md`, `contracts/`.
- Calidad de requisitos: `checklists/requirements.md`.
- Ejecución y estado de tareas: `tasks.md`.

## Verificación específica de HU-09 (2026-11-23)

Esta guía verifica la funcionalidad OC/OV **ya implementada**. No requiere nuevos comandos de instalación; la planeación solo documentó la verificación, y las correcciones T104–T110 quedaron integradas y ejecutadas en la raíz del repositorio.

### Comandos de verificación automatizada

```bash
npx vitest run tests/unit/orders.test.js tests/unit/storage.test.js tests/integration/orders.test.js
npm run build
```

Cobertura esperada según el estado actual del repositorio: OC-0001/OV-0001, secuencias independientes, continuidad tras huecos, idempotencia, validación de orden, esquema de movimientos con `order_id` opcional, ausencia de órdenes en ajustes y reposiciones, rollback con error visible ante fallo de escritura, stock actualizado una sola vez, panel sin menú propio y ausencia de backfill de movimientos legacy.

### Recorrido manual

1. Seleccionar un usuario activo y abrir **Movimientos**.
2. Registrar una entrada normal: debe aparecer `OC-0001` en la columna Orden del historial y en el panel «Órdenes generadas».
3. Registrar una salida normal: debe aparecer `OV-0001`; la numeración OC no debe cambiar.
4. Registrar un ajuste de entrada o salida: no debe generarse orden y su columna Orden debe mostrar `—`.
5. Desde **Reposiciones**, aprobar y recibir una solicitud: el movimiento de entrada resultante no debe generar OC.
6. Desde **Transferencias**, confirmar un traslado: no debe generarse OC ni OV; verificar el traslado solo en `STOCK_TRANSFERS`.
7. Recargar la página: las órdenes y su numeración deben persistir bajo `logistics:orders`.
8. Cambiar a cualquier rol con acceso a Movimientos: el panel debe seguir visible; no debe existir un módulo ni un permiso «Órdenes» en la barra lateral ni en el panel de administración.
9. Simular un fallo de escritura en `logistics:orders`: debe mostrarse el mensaje de almacenamiento en el formulario, sin movimiento, orden ni cambio de stock parcial.

### Resultados esperados

- Cada entrada o salida normal genera exactamente una orden vinculada a su movimiento.
- OC y OV mantienen secuencias independientes, correlativas y sin reutilización mientras `logistics:orders` permanezca intacto.
- El panel de órdenes se muestra dentro de Movimientos, sin vista ni permiso adicional.
- Los movimientos legacy sin orden se conservan sin backfill.
- Si falla la escritura de la orden, no quedan movimiento ni stock parciales y el error se muestra en el formulario de movimientos.

Las definiciones de campos y relaciones están en `data-model.md`; el contrato de persistencia y atomicidad está en `contracts/logistics-storage.md`.

## Verificación planificada de HU-10 y HU-11 (2026-11-23)

Esta sección describe la validación futura de HU-10 y HU-11. No implica que el código esté implementado: las tareas se generarán con `/speckit.tasks` y los comandos se ejecutarán después de la implementación.

### Comandos previstos

```bash
npx vitest run tests/unit/transfers.test.js tests/integration/transfers.test.js tests/unit/shipments.test.js tests/integration/shipments.test.js
npm run build
```

También debe ejecutarse la suite completa para detectar regresiones en HU-01–HU-09, en particular el recuento de botones de navegación y las pruebas de permisos.

### HU-10 — Búsqueda y filtros de transferencias

1. Abrir **Transferencias** y registrar varias transferencias con productos, bodegas y estados diferentes.
2. Escribir una parte del nombre del producto en `transfer-search` usando distinta capitalización; deben aparecer solo las coincidencias parciales.
3. Buscar una parte del `transfer_id` mostrado en la nueva columna `#ID`; debe filtrar también por coincidencia parcial.
4. Aplicar por separado los filtros de estado, producto, bodega de origen y bodega de destino.
5. Combinar el buscador con varios filtros; el listado y el contador deben reflejar solo la intersección.
6. Limpiar los filtros; deben reaparecer todas las transferencias.
7. Probar una combinación sin resultados; debe mostrarse `transfer-list-empty` con el mensaje de estado vacío.
8. Confirmar que las transferencias, el stock y los movimientos permanecen sin cambios.

### HU-11 — Seguimiento de envíos al comprador

1. Registrar una salida normal desde **Movimientos** para generar una orden `OV-0001`; los datos demo no crean OV, por lo que este paso es necesario para poblar la vista.
2. Abrir **Seguimiento de envíos** y registrar un envío asociado a `OV-0001`, indicando transportista y código de seguimiento.
3. Intentar registrar otro envío para la misma OV; debe rechazarse por la relación uno a uno.
4. Confirmar que el estado inicial es **En bodega** y que el historial contiene el evento inicial con fecha y usuario.
5. Avanzar el estado en orden: **En tránsito** → **En reparto** → **Entregado**; cada paso debe agregar un evento con fecha, hora y usuario responsable.
6. Intentar retroceder, saltar etapas, repetir el estado o cambiar un envío **Entregado**; todas las acciones deben rechazarse.
7. Buscar envíos por identificador de OV, código de seguimiento y estado; verificar coincidencias parciales en texto y coincidencia exacta en estado.
8. Confirmar que la creación y los cambios de estado no crean movimientos ni modifican `STOCK`, órdenes ni inventario.
9. Denegar `module:shipments` a un rol desde el panel de permisos; comprobar que desaparece la navegación, que `#/shipments` muestra el aviso de falta de permiso y que los estados no cambian.
10. Recargar la página y verificar que los envíos y su historial persisten bajo `logistics:shipments`.
11. Confirmar explícitamente que no existen conexiones automáticas con empresas transportistas: durante el registro y los cambios de estado no se observan solicitudes de red, temporizadores ni clientes HTTP externos; toda actualización del seguimiento se realiza manualmente desde el ERP.

### Resultados esperados

- HU-10 solo consulta datos y mantiene el listado completo por defecto.
- La búsqueda por producto e identificador es parcial e insensible a mayúsculas.
- Cada OV tiene como máximo un envío y cada envío pertenece a una sola OV.
- Los estados avanzan solo en orden y `Entregado` es terminal.
- El historial conserva fecha, hora y usuario de cada cambio.
- La vista está protegida por la matriz de HU-08 sin introducir autenticación real.
- El seguimiento de envíos no establece conexiones automáticas con transportistas y solo se actualiza manualmente desde el ERP.
- El seguimiento no modifica stock, movimientos ni órdenes.
