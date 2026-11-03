# Tareas: Módulo de Logística e Inventario

**Entrada**: Documentos de diseño desde `/specs/002-logistica-inventario/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), data-model.md, MER.md
**Pruebas**: Se incluyen tareas de prueba conforme al Principio II de la Constitución (Test-First & Verification).

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1, US2, US3, US4, US5)
- Incluir rutas de archivo exactas en las descripciones

## Convenciones de Rutas

- Aplicación única: `src/` y `tests/` en la raíz del repositorio
- Componentes de interfaz: `src/components/`
- Lógica de dominio: `src/domain/`
- Pruebas unitarias: `tests/unit/`
- Pruebas de integración: `tests/integration/`

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Restaurar la plantilla base, alinear la documentación y preparar la configuración del módulo logístico.

- [ ] T001 Actualizar `specs/002-logistica-inventario/plan.md` con el dominio de logística, la pila técnica y la estructura final de `src/domain/` y `src/components/`
- [ ] T002 Restaurar `index.html`, `src/` y `vitest.config.mjs` desde el commit `a0062c0^` en la raíz del repositorio
- [ ] T003 Verificar que la suite base pasa con `npx vitest run` en `tests/` antes de modificar el dominio
- [ ] T004 [P] Configurar el nombre, etiquetas, ciclo de vida y color de acento del módulo en `src/module-config.js`
- [ ] T005 [P] Crear los catálogos semilla de `PRODUCT_CATEGORIES` y `USERS` en `src/domain/seed.js`
- [ ] T006 [P] Añadir tokens de diseño y estilos base para las pantallas logísticas en `src/styles.css`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear el almacenamiento, la validación y el enrutamiento compartidos de los que dependen todas las historias.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [ ] T007 Definir las claves de almacenamiento y los esquemas de `PRODUCTS`, `PRODUCT_CATEGORIES`, `WAREHOUSES`, `USERS`, `STOCK`, `INVENTORY_TRANSACTIONS` y `STOCK_TRANSFERS` en `src/storage.js`
- [ ] T008 Implementar los helpers de repositorio (IDs secuenciales, marcas de tiempo, CRUD, unicidad y validación de FK) en `src/storage.js`
- [ ] T009 Implementar la carga idempotente de los catálogos semilla en `src/storage.js`
- [ ] T010 [P] Añadir las entradas de barra lateral y los contenedores de las pantallas Productos, Bodegas, Stock, Movimientos y Transferencias en `index.html` y `src/components/shell.js`
- [ ] T011 Registrar las rutas y vistas de las cinco pantallas logísticas en `src/app.js`
- [ ] T012 [P] Añadir los helpers compartidos de saneamiento y validación (obligatorio, numérico no negativo, único y fecha) en `src/storage.js`
- [ ] T013 [P] Añadir pruebas unitarias de esquemas, repositorio y carga de semillas en `tests/unit/storage.test.js`

**Punto de control**: La base está lista y las historias pueden implementarse en paralelo.

---

## Fase 3: Historia de Usuario 1 - Registro y Modificación de Productos (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir registrar y modificar productos con SKU único, precios, categoría y estado.

**Prueba Independiente**: Crear un producto con todos los campos obligatorios, verlo en el catálogo, editar su precio y confirmar que `updated_at` cambia sin alterar otros registros.

### Pruebas para la Historia de Usuario 1

- [ ] T014 [P] [US1] Añadir pruebas unitarias de campos obligatorios, SKU único, precios no negativos, FK de categoría y marcas de tiempo en `tests/unit/products.test.js`
- [ ] T015 [P] [US1] Añadir pruebas de integración para crear y editar productos, conflicto de SKU y retroalimentación de validación en `tests/integration/products.test.js`

### Implementación de la Historia de Usuario 1

- [ ] T016 [P] [US1] Implementar el servicio de productos (crear, actualizar, listar, buscar y validar SKU/precios) en `src/domain/products.js`
- [ ] T017 [P] [US1] Crear el formulario de producto con campos obligatorios, opcionales y selector de categoría en `src/components/product-form.js`
- [ ] T018 [P] [US1] Crear el listado de productos con estado, precios, categoría y acción de edición en `src/components/product-list.js`
- [ ] T019 [US1] Conectar crear, editar, listar y buscar productos con la retroalimentación de validación en `src/app.js`
- [ ] T020 [US1] Aplicar la validación de categoría existente y el estado activo/inactivo en `src/domain/products.js`
- [ ] T021 [US1] Implementar la búsqueda y el filtro por nombre, SKU y categoría en `src/domain/products.js` y `src/app.js`
- [ ] T022 [US1] Añadir los estilos de la pantalla de productos en `src/styles.css`

**Punto de control**: La Historia de Usuario 1 está funcional y es comprobable de forma independiente.

---

## Fase 4: Historia de Usuario 4 - Registro y Administración de Bodegas (Prioridad: P1)

**Objetivo**: Registrar, editar y cambiar el estado de las bodegas.

**Prueba Independiente**: Registrar una bodega, editar su ubicación, desactivarla y verificar que no aparece en los selectores operativos.

### Pruebas para la Historia de Usuario 4

- [ ] T023 [P] [US4] Añadir pruebas unitarias de nombre/ubicación obligatorios, nombre único, capacidad no negativa, estado y exclusión de inactivas en `tests/unit/warehouses.test.js`
- [ ] T024 [P] [US4] Añadir pruebas de integración para crear, editar y cambiar el estado de bodegas en `tests/integration/warehouses.test.js`

### Implementación de la Historia de Usuario 4

- [ ] T025 [P] [US4] Implementar el servicio de bodegas (crear, actualizar, listar, cambiar estado y validar nombre único) en `src/domain/warehouses.js`
- [ ] T026 [P] [US4] Crear el formulario de bodega en `src/components/warehouse-form.js`
- [ ] T027 [P] [US4] Crear el listado de bodegas con acción de cambio de estado en `src/components/warehouse-list.js`
- [ ] T028 [US4] Conectar las pantallas de crear, editar y cambiar estado de bodegas en `src/app.js`
- [ ] T029 [US4] Excluir las bodegas inactivas de los selectores de movimientos y transferencias en `src/domain/warehouses.js`
- [ ] T030 [US4] Añadir los estilos de la pantalla de bodegas en `src/styles.css`

**Punto de control**: Las Historias de Usuario 1 y 4 funcionan de forma independiente.

---

## Fase 5: Historia de Usuario 3 - Registrar entradas y salidas de inventario (Prioridad: P1)

**Objetivo**: Registrar entradas, salidas y ajustes que actualicen `STOCK` de inmediato y conserven un historial inmutable.

**Prueba Independiente**: Una entrada crea o incrementa stock; una salida con existencias lo descuenta; una salida sin stock se rechaza sin alterar el inventario; el historial muestra usuario y fecha automática sin acciones de edición ni eliminación.

### Pruebas para la Historia de Usuario 3

- [ ] T031 [P] [US3] Añadir pruebas unitarias de efectos de entrada/salida/ajuste, rechazo por stock insuficiente, inmutabilidad y fecha/usuario automáticos en `tests/unit/movements.test.js`
- [ ] T032 [P] [US3] Añadir pruebas de integración para registrar movimientos, consultar el historial y confirmar la ausencia de acciones de edición/eliminación en `tests/integration/movements.test.js`

### Implementación de la Historia de Usuario 3

- [ ] T033 [P] [US3] Implementar el servicio de movimientos con actualización atómica de `STOCK` y los tipos `entrada`, `salida`, `ajuste_entrada` y `ajuste_salida` en `src/domain/movements.js`
- [ ] T034 [P] [US3] Crear el formulario de movimiento con selectores de producto, bodega, usuario y cantidad en `src/components/movement-form.js`
- [ ] T035 [P] [US3] Crear el historial inmutable de movimientos con acción de ajuste en `src/components/movement-list.js`
- [ ] T036 [US3] Conectar la pantalla de movimientos y la retroalimentación de éxito/error en `src/app.js`
- [ ] T037 [US3] Bloquear la edición/eliminación y canalizar las correcciones por `ajuste_entrada`/`ajuste_salida` en `src/domain/movements.js` y `src/components/movement-list.js`
- [ ] T038 [US3] Añadir los estilos de la pantalla de movimientos en `src/styles.css`

**Punto de control**: El flujo operativo de inventario funciona de extremo a extremo.

---

## Fase 6: Historia de Usuario 5 - Transferencias de Productos entre Bodegas (Prioridad: P2)

**Objetivo**: Registrar, confirmar y cancelar transferencias entre bodegas actualizando el stock solo al confirmar.

**Prueba Independiente**: Crear una transferencia de 10 unidades entre bodegas distintas, verificar el estado `pendiente` y `created_by`, confirmarla con `confirmed_by` y comprobar el descuento/incremento simultáneo en `STOCK`.

### Pruebas para la Historia de Usuario 5

- [ ] T039 [P] [US5] Añadir pruebas unitarias de bodegas distintas, stock suficiente en origen, estados `pendiente`/`confirmada`/`cancelada`, `created_by`/`confirmed_by` y ausencia de doble actualización en `tests/unit/transfers.test.js`
- [ ] T040 [P] [US5] Añadir pruebas de integración para solicitar y confirmar una transferencia en `tests/integration/transfers.test.js`

### Implementación de la Historia de Usuario 5

- [ ] T041 [P] [US5] Implementar el servicio de transferencias con solicitud, confirmación, cancelación y actualización atómica de `STOCK` en `src/domain/transfers.js`
- [ ] T042 [P] [US5] Crear el formulario de transferencia con producto, bodega origen, bodega destino, cantidad y usuario creador en `src/components/transfer-form.js`
- [ ] T043 [P] [US5] Crear el listado de transferencias con estado y acciones de confirmar/cancelar en `src/components/transfer-list.js`
- [ ] T044 [US5] Conectar la pantalla de transferencias y la retroalimentación de validación en `src/app.js`
- [ ] T045 [US5] Impedir modificaciones a transferencias confirmadas y bloquear bodegas inactivas en `src/domain/transfers.js`
- [ ] T046 [US5] Añadir los estilos de la pantalla de transferencias en `src/styles.css`

**Punto de control**: Las transferencias actualizan el stock solo al confirmarse y son inmutables después.

---

## Fase 7: Historia de Usuario 2 - Control de Stock (Prioridad: P2)

**Objetivo**: Consultar existencias por producto y bodega, con totales y filtros, sin modificar datos.

**Prueba Independiente**: Consultar un producto con stock en varias bodegas, verificar cantidades y total, aplicar filtros y comprobar que ningún registro cambia.

### Pruebas para la Historia de Usuario 2

- [ ] T047 [P] [US2] Añadir pruebas unitarias de agregación, cantidades por bodega, totales, filtros y comportamiento de solo lectura en `tests/unit/stock.test.js`
- [ ] T048 [P] [US2] Añadir pruebas de integración para filtros, totales, estado vacío y distinción entre sin registro y cantidad cero en `tests/integration/stock.test.js`

### Implementación de la Historia de Usuario 2

- [ ] T049 [P] [US2] Implementar el servicio de consulta de stock de solo lectura con filtros por producto/bodega y totales en `src/domain/stock.js`
- [ ] T050 [P] [US2] Crear el listado/detalle de stock con el estado de producto y bodega en `src/components/stock-list.js`
- [ ] T051 [US2] Conectar los filtros, totales y estado vacío de la pantalla de stock en `src/app.js`
- [ ] T052 [US2] Distinguir la ausencia de registro de una cantidad cero y mostrar los estados de producto/bodega en `src/components/stock-list.js`
- [ ] T053 [US2] Añadir los estilos de la pantalla de stock en `src/styles.css`

**Punto de control**: Las cinco historias son funcionales e independientes.

---

## Fase 8: Pulido y Preocupaciones Transversales

**Propósito**: Asegurar calidad, accesibilidad, rendimiento y documentación.

- [ ] T054 [P] Actualizar `README.md` con el módulo de logística, semillas, pantallas y claves de persistencia
- [ ] T055 [P] Añadir refinamientos de accesibilidad (etiquetas, orden de foco, `aria-current` y semántica de tablas) en `src/styles.css` y los componentes de `src/components/`
- [ ] T056 [P] Verificar el rendimiento de listados y búsquedas con 500 registros en `src/domain/products.js` y `src/domain/stock.js`
- [ ] T057 Ejecutar `npx vitest run` y `npm run build` en la raíz del repositorio para verificar que no hay regresiones
- [ ] T058 Validar manualmente los escenarios de aceptación de US1–US5 usando `specs/002-logistica-inventario/spec.md` y registrar los resultados en `specs/002-logistica-inventario/tasks.md`
- [ ] T059 [P] Reconciliar `specs/002-logistica-inventario/plan.md` y `specs/002-logistica-inventario/tasks.md` con la estructura final implementada

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- Configuración (Fase 1): sin dependencias.
- Fundacional (Fase 2): depende de T001–T003 y bloquea todas las historias.
- US1 (Fase 3): depende de la Fase 2; no depende de otras historias.
- US4 (Fase 4): depende de la Fase 2; es independiente de US1.
- US3 (Fase 5): depende de US1 y US4.
- US5 (Fase 6): depende de US1 y US4.
- US2 (Fase 7): depende de US1, US3, US4 y US5.
- Pulido (Fase 8): depende de todas las historias deseadas.

### Dependencias entre Historias

- **US1 (P1)**: puede empezar tras la Fase 2.
- **US4 (P1)**: puede empezar tras la Fase 2 y en paralelo con US1.
- **US3 (P1)**: requiere productos y bodegas registrados.
- **US5 (P2)**: requiere productos y bodegas registrados.
- **US2 (P2)**: requiere movimientos y transferencias confirmadas para reflejar existencias.

### Dentro de Cada Historia

- Las pruebas se escriben y fallan antes de la implementación.
- Servicios de dominio antes de la interfaz.
- Implementación antes de la integración en `src/app.js`.
- La historia se valida antes de pasar a la siguiente prioridad.

### Oportunidades Paralelas

- T004, T005 y T006 pueden ejecutarse en paralelo tras restaurar la plantilla.
- T010, T012 y T013 pueden ejecutarse en paralelo dentro de la Fase 2.
- Las pruebas y los componentes de cada historia pueden ejecutarse en paralelo.
- US1 y US4 pueden desarrollarse simultáneamente tras la Fase 2.
- US5 puede iniciarse cuando US1 y US4 estén completas.

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

## Estrategia de Implementación

### MVP Primero (Solo Historia de Usuario 1)

1. Completar la Fase 1: Configuración.
2. Completar la Fase 2: Fundacional (crítica).
3. Completar la Fase 3: US1 Productos.
4. **DETENERSE y VALIDAR**: probar el catálogo de productos de forma independiente.
5. Demostrar si está listo.

### Entrega Incremental

1. Configuración + Fundacional → base lista.
2. US1 → validar → demostrar (MVP).
3. US4 → validar → demostrar (base de ubicaciones).
4. US3 → validar → demostrar (flujo operativo).
5. US5 → validar → demostrar (multi-bodega).
6. US2 → validar → demostrar (consulta de existencias).
7. Pulido → verificación final.

### Estrategia de Equipo Paralelo

1. El equipo completa Configuración + Fundacional.
2. Tras la Fase 2:
   - Desarrollador A: US1 Productos.
   - Desarrollador B: US4 Bodegas.
3. Al completarse US1 y US4:
   - Desarrollador A: US3 Movimientos.
   - Desarrollador B: US5 Transferencias.
4. US2 y pulido al final.

---

## Notas

- `[P]` indica tareas en archivos distintos sin dependencias pendientes.
- `[USn]` mapea cada tarea a su historia para trazabilidad.
- Cada historia debe ser completable y comprobable de forma independiente.
- Verificar que las pruebas fallan antes de implementar.
- No se crean ramas; el trabajo se realiza directamente en `main`.
- No se realizan commits ni push desde el agente.
- Evitar tareas vagas y conflictos en el mismo archivo.
