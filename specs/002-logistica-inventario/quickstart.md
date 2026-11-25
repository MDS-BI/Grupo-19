# Guía Rápida: Módulo de Logística e Inventario

**Feature**: `002-logistica-inventario`  
**Fecha**: 2026-11-17  
**Actualizado**: 2026-11-25 (pestañas del navegador)

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

Estos comandos corresponden a T066 y T104. La suite incluye los casos HU-08 y de navegación descritos en `plan.md`; su resultado con el comportamiento vigente de pestañas del navegador debe registrarse al ejecutar T104.

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
10. Pestañas del navegador: pulsar un módulo permitido en la barra lateral y comprobar que se abre una pestaña nueva del navegador con la misma página y el hash `#/<modulo>`; recargarla y verificar que muestra solo ese módulo.

## Verificación específica de pestañas del navegador

- No debe existir una barra de pestañas interna en el ERP; cada módulo principal se abre mediante `window.open` en una pestaña nueva del navegador.
- Con un módulo no autorizado para el usuario activo, no se abre pestaña y se muestra el aviso de acceso denegado.
- Cada pestaña carga la aplicación de forma independiente: recargarla debe mostrar únicamente el módulo indicado por su hash `#/<modulo>`; no se restauran listas de pestañas ni borradores entre pestañas.
- Los botones internos `data-goto` y la creación de reposición desde una alerta deben seguir navegando en la misma pestaña, sin abrir una nueva.
- Si el navegador bloquea ventanas emergentes (o `window.open` no devuelve una ventana), la navegación debe realizarse en la pestaña actual con el mismo hash como respaldo.
- Probar una ruta directa `#/<modulo>` no autorizada: debe mostrar el aviso de falta de permiso y redirigir a una vista permitida, sin abrir pestaña adicional.

## Verificación específica de HU-08

- Probar los tres roles semilla: `administrador`, `supervisor_inventario` y `encargado_bodega`.
- Confirmar que el panel de permisos solo es visible para `administrador` y no puede desactivarse para ese cargo.
- Cambiar el cargo de un usuario y comprobar que la navegación se recalcula de inmediato y se abre la landing del nuevo rol.
- Marcar una excepción individual que contradiga la matriz y verificar que prevalece, salvo que una regla de negocio la prohíba (FR-124).
- Configurar una landing inválida y comprobar que la aplicación cae a `dashboard` con aviso no bloqueante.
- Recargar la página para confirmar que cargos, landing pages y permisos persisten en el mismo navegador.

## Persistencia

- Los datos se guardan en `localStorage` bajo las claves `logistics:*` documentadas en `contracts/logistics-storage.md`, incluidas `logistics:roles`, `logistics:role_permissions` y `logistics:user_permission_overrides`. No hay clave de pestañas ni de borradores compartidos.
- No se requiere borrar datos para validar este módulo.
- No se deben restaurar archivos desde commits antiguos; T002 en `tasks.md` describe la verificación segura del estado actual.

## Estado documental

- Especificación: `spec.md`.
- Decisiones técnicas: `research.md`.
- Diseño: `plan.md`, `data-model.md`, `MER.md`, `contracts/`.
- Calidad de requisitos: `checklists/requirements.md`.
- Ejecución y estado de tareas: `tasks.md`.
