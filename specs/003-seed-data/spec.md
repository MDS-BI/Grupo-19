# Feature Specification: Coherent Logistics Seed Data

**Feature Branch**: `003-seed-data`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Agregar al spec una sección de datos simulados (seed data) con productos, bodegas, movimientos, transferencias, órdenes y envíos coherentes, incluyendo casos de borde; luego planear, generar y cargar los datos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar un catálogo logístico completo (Priority: P1)

Un usuario del sistema carga la demostración y encuentra suficientes productos, bodegas y movimientos para explorar pantallas, filtros y flujos sin crear registros manualmente.

**Why this priority**: Sin un volumen mínimo de datos realistas, las pantallas de inventario no permiten evaluar búsquedas, filtros, alertas ni operaciones habituales.

**Independent Test**: Cargar la demostración en un entorno vacío y verificar que hay al menos 20 productos con SKU, categoría y precios distintos, al menos 3 bodegas con ubicaciones distintas, y movimientos de entrada, salida y ajuste distribuidos entre esas bodegas y productos.

**Acceptance Scenarios**:

1. **Given** un entorno sin datos logísticos, **When** el usuario carga los datos simulados, **Then** el catálogo contiene al menos 20 productos con categorías, SKU y precios variados.
2. **Given** el catálogo cargado, **When** el usuario abre la vista de bodegas, **Then** existen al menos 3 bodegas activas con ubicaciones diferentes.
3. **Given** el catálogo cargado, **When** el usuario consulta movimientos, **Then** hay movimientos de entrada, salida y ajuste repartidos entre varias bodegas y productos.

---

### User Story 2 - Revisar estados operativos realistas (Priority: P1)

Un usuario necesita ver transferencias, órdenes y envíos en estados representativos para comprender el ciclo operativo completo y probar los filtros por estado.

**Why this priority**: Los estados son la base de los flujos de negocio; si faltan estados, no se pueden verificar reportes, permisos ni transiciones.

**Independent Test**: Cargar la demostración y comprobar que existen transferencias pendiente, en tránsito, recibida y cancelada; órdenes borrador, aprobada, en proceso, completada y cancelada; y envíos preparando, despachado, en tránsito, entregado y con incidencia.

**Acceptance Scenarios**:

1. **Given** la demostración cargada, **When** el usuario filtra transferencias por estado, **Then** encuentra al menos un registro en cada estado pendiente, en tránsito, recibida y cancelada.
2. **Given** la demostración cargada, **When** el usuario filtra órdenes por estado, **Then** encuentra al menos un registro en cada estado borrador, aprobada, en proceso, completada y cancelada.
3. **Given** la demostración cargada, **When** el usuario filtra envíos por estado, **Then** encuentra al menos un registro en cada estado preparando, despachado, en tránsito, entregado y con incidencia.

---

### User Story 3 - Confiar en la coherencia de los datos (Priority: P1)

Un usuario espera que los datos simulados respeten las reglas del negocio: un envío no puede estar más avanzado que su orden, las transferencias canceladas no alteran el stock y los casos de borde están disponibles para revisión.

**Why this priority**: Los datos incoherentes generan conclusiones erróneas durante la demostración y ocultan defectos reales en validaciones y reportes.

**Independent Test**: Cargar la demostración y ejecutar una validación de coherencia sobre todas las relaciones entre órdenes, envíos, transferencias, movimientos y stock.

**Acceptance Scenarios**:

1. **Given** un envío entregado, **When** se consulta su orden, **Then** la orden está aprobada, en proceso o completada, nunca en borrador ni cancelada.
2. **Given** una transferencia cancelada, **When** se consultan los saldos de las bodegas origen y destino, **Then** la transferencia no produjo cambios de stock.
3. **Given** la demostración cargada, **When** se revisan productos y saldos, **Then** existe al menos un producto con stock en cero para probar alertas y agotados.
4. **Given** la demostración cargada, **When** se revisan órdenes, **Then** existe al menos una orden sin envío asociado.

---

### User Story 4 - Repetir la carga sin duplicar ni destruir datos (Priority: P2)

Un usuario puede cargar la demostración más de una vez sin duplicar registros, reemplazar información creada manualmente ni perder cambios posteriores.

**Why this priority**: La demostración suele repetirse durante pruebas y capacitación; una carga destructiva generaría pérdida de información o resultados engañosos.

**Independent Test**: Cargar la demostración, modificar un registro creado por el usuario, volver a cargar y verificar que el registro modificado permanece y no aparecen duplicados.

**Acceptance Scenarios**:

1. **Given** una demostración ya cargada, **When** el usuario vuelve a cargarla, **Then** no se crean duplicados y se informa que los datos ya estaban presentes.
2. **Given** registros creados manualmente antes de la carga, **When** se carga la demostración, **Then** esos registros no son borrados ni sobrescritos.

---

### Edge Cases

- Producto con stock en cero en al menos una bodega activa.
- Orden en borrador sin envío y orden cancelada sin envío.
- Transferencia cancelada que no genera movimientos de stock ni cambia saldos.
- Transferencia recibida que sí incrementa el stock de la bodega destino y decrementa el de origen.
- Envío con incidencia asociado a una orden aprobada o en proceso, nunca a una orden borrador o cancelada.
- Envío entregado únicamente asociado a una orden aprobada, en proceso o completada.
- Bodegas inactivas excluidas de operaciones vigentes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer un conjunto de datos simulados con al menos 20 productos, cada uno con SKU único, categoría, precio de venta y precio de costo.
- **FR-002**: El sistema DEBE ofrecer al menos 3 bodegas con nombres y ubicaciones distintas, con al menos una bodega inactiva para probar restricciones.
- **FR-003**: El conjunto DEBE incluir movimientos de inventario de entrada, salida y ajuste, distribuidos entre múltiples productos y bodegas.
- **FR-004**: El conjunto DEBE incluir transferencias entre bodegas en los estados pendiente, en tránsito, recibida y cancelada.
- **FR-005**: El conjunto DEBE incluir órdenes en los estados borrador, aprobada, en proceso, completada y cancelada.
- **FR-006**: El conjunto DEBE incluir envíos en los estados preparando, despachado, en tránsito, entregado y con incidencia.
- **FR-007**: Cada envío DEBE asociarse a una orden existente y su estado DEBE ser compatible con el estado de esa orden; un envío entregado NO DEBE asociarse a una orden en borrador ni cancelada.
- **FR-008**: Cada transferencia DEBE referenciar productos y bodegas existentes, con origen y destino distintos cuando la transferencia esté activa.
- **FR-009**: Las transferencias canceladas NO DEBEN modificar stock ni generar movimientos de inventario.
- **FR-010**: Las transferencias recibidas DEBEN reflejarse en saldos coherentes entre bodega origen y destino.
- **FR-011**: El conjunto DEBE incluir al menos un producto con stock en cero en una bodega activa.
- **FR-012**: El conjunto DEBE incluir al menos una orden sin envío asociado.
- **FR-013**: La carga de datos simulados DEBE ser repetible sin crear duplicados y sin borrar o sobrescribir registros preexistentes.
- **FR-014**: El sistema DEBE exponer un resumen verificable de la carga con cantidades por tipo de registro.
- **FR-015**: Todos los registros simulados DEBEN usar identificadores referencialmente válidos dentro del conjunto cargado.

### Seed Data Catalog

| Tipo de dato | Cantidad mínima | Variedad requerida |
|---|---:|---|
| Productos | 20 | Categorías, SKU únicos, precios de venta y costo distintos |
| Bodegas | 3 | Ubicaciones distintas y al menos una inactiva |
| Movimientos | 20 | Entradas, salidas y ajustes en varias bodegas/productos |
| Transferencias | 4 | Pendiente, en tránsito, recibida y cancelada |
| Órdenes | 5 | Borrador, aprobada, en proceso, completada y cancelada |
| Envíos | 5 | Preparando, despachado, en tránsito, entregado y con incidencia |

### Key Entities *(include if feature involves data)*

- **Producto**: Registro de catálogo con SKU, categoría, precios, proveedor y estado.
- **Bodega**: Ubicación física con estado activo/inactivo, capacidad y responsable.
- **Movimiento de inventario**: Entrada, salida o ajuste que explica cambios de stock por producto y bodega.
- **Stock**: Saldo disponible por producto y bodega, incluido el caso de stock en cero.
- **Transferencia**: Traslado propuesto entre bodegas con estado y efecto condicional sobre el stock.
- **Orden**: Solicitud comercial con estado propio, que puede tener o no un envío asociado.
- **Envío**: Despacho asociado a una orden con estado, transportista, código de seguimiento e historial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La demostración carga al menos 20 productos, 3 bodegas, 20 movimientos, 4 transferencias, 5 órdenes y 5 envíos en una ejecución sobre un entorno vacío.
- **SC-002**: El 100% de los envíos cargados cumple la regla de compatibilidad con el estado de su orden.
- **SC-003**: El 100% de las transferencias canceladas no produce cambios de stock ni movimientos asociados.
- **SC-004**: La demostración contiene al menos 1 producto con stock en cero y al menos 1 orden sin envío.
- **SC-005**: Una segunda carga no incrementa el número total de registros simulados.
- **SC-006**: El resumen de carga coincide exactamente con los registros simulados presentes después de la operación.

## Assumptions

- La demostración se ejecuta de forma voluntaria desde una acción existente o mecanismo equivalente del producto, no automáticamente en cada arranque.
- Los datos simulados se usan solo para demostración, pruebas y capacitación; no representan información real de producción.
- Los estados de orden y envío siguen el orden lógico del negocio: borrador → aprobada → en proceso → completada, con cancelación como estado terminal alternativo.
- Los estados de transferencia siguen el orden lógico: pendiente → en tránsito → recibida, con cancelación como estado terminal alternativo.
- Los usuarios y categorías necesarios ya existen o pueden crearse como parte del mismo conjunto de demostración.
- La coherencia se valida sobre el conjunto cargado y no depende de registros externos no incluidos en la demostración.
