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

Estos comandos corresponden a T066 y no se ejecutaron durante la reconciliación documental de 2026-11-17.

## Recorrido funcional

1. Seleccionar el usuario activo en la cabecera del ERP.
2. HU-01: crear y editar un producto con SKU único, precios y categoría.
3. HU-04: crear una bodega y verificar que aparece en los selectores operativos.
4. HU-03: registrar una entrada, luego una salida; comprobar que no existen acciones de edición/eliminación en el historial.
5. HU-05: crear una transferencia, confirmarla y verificar el descuento/incremento de stock.
6. HU-02: consultar existencias por producto/bodega y su total.
7. HU-06: configurar `min_stock_level`, provocar una alerta y comprobar que desaparece al reponer stock.
8. HU-07: desde una alerta, presionar «Solicitar», aprobar la reposición y recibirla; verificar que se crea un único movimiento de entrada y que la alerta desaparece.

## Persistencia

- Los datos se guardan en `localStorage` bajo las claves `logistics:*` documentadas en `contracts/logistics-storage.md`.
- No se requiere borrar datos para validar este módulo.
- No se deben restaurar archivos desde commits antiguos; T002 en `tasks.md` describe la verificación segura del estado actual.

## Estado documental

- Especificación: `spec.md`.
- Decisiones técnicas: `research.md`.
- Diseño: `plan.md`, `data-model.md`, `MER.md`, `contracts/`.
- Calidad de requisitos: `checklists/requirements.md`.
- Ejecución y estado de tareas: `tasks.md`.
