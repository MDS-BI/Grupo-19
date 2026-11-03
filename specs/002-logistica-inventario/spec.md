# Especificación de la Funcionalidad: Módulo de Logística e Inventario

**Rama de la funcionalidad**: 002-logistica-inventario
**Creada**: 2026-10-29 
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Desarrollar un módulo de Logística e Inventario para gestionar productos, bodegas y existencias, permitiendo registrar entradas y salidas de productos, realizar transferencias entre bodegas y generar alertas de stock mínimo".

## Propósito

El módulo de Logística e Inventario tiene como objetivo facilitar la gestión de productos, bodegas y existencias de una empresa. Permitirá registrar entradas y salidas de productos, consultar el stock disponible, realizar transferencias entre bodegas y generar alertas cuando las existencias sean bajas.

## Clarifications

### Session 2026-10-30

- Q: Cuando se guarda un movimiento de entrada o salida, ¿cómo debe actualizarse el stock? → A: Actualización inmediata; si no existe registro de stock para producto+bodega, la entrada lo crea y la salida sin existencias se rechaza.
- Q: Una vez registrado un movimiento de inventario, ¿se debe poder editar o eliminar? → A: El movimiento es inmutable; no se edita ni elimina y las correcciones se hacen con un nuevo movimiento de ajuste que deja rastro.
- Q: ¿Cómo se debe determinar el usuario que registra el movimiento de inventario? → A: El formulario exige seleccionar un usuario existente de USERS y guarda su user_id; el movimiento se rechaza si el usuario no existe.
- Q: ¿Cómo se debe establecer la fecha del movimiento de inventario? → A: El sistema asigna automáticamente la fecha y hora al guardar; el usuario no puede modificarla.
- Q: Cuando se registra una entrada de un producto con vencimiento, ¿cómo se debe manejar la fecha de vencimiento? → A: Queda fuera de HU-03; se difiere a una historia posterior de lotes o vencimientos.


## Escenarios de Usuario y Pruebas *(obligatorio)*


### Historia de Usuario 1 - Registro y Modificación de Productos (Prioridad: P1)

Como administrador del sistema, quiero registrar nuevos productos y modificar los existentes, para mantener la información del inventario actualizada, precisa y disponible para las operaciones de venta y logística.

**Por qué es prioridad**: El catálogo de productos es la entidad fundacional de todo el sistema. Sin productos registrados y correctamente tipificados, es imposible ejecutar módulos dependientes como las entradas/salidas de bodega (HU-03), el control de existencias, reportes o ventas. Esta historia desbloquea el flujo operativo principal.

**Prueba Independiente**: Se puede probar creando un producto de prueba en un entorno aislado, proporcionando todos los campos requeridos (Nombre, SKU, Precio, Categoría), validando su correcta inserción en la base de datos, luego modificando su precio y confirmando que la fecha de actualización cambia sin afectar el histórico de otros registros.

**Escenarios de Aceptación**:

1. **Dado que** el administrador se encuentra en la pantalla de "Nuevo Producto", **Cuando** ingresa todos los campos obligatorios válidos (Nombre, SKU único, Precio de Venta, Categoría) y guarda, **Entonces** el sistema almacena el producto, muestra un mensaje de éxito ("Producto registrado correctamente") y lo lista en el inventario con estado activo.
2. **Dado que** el administrador intenta registrar un producto nuevo o editar uno existente, **Cuando** ingresa un SKU que ya está en uso por otro producto, **Entonces** el sistema impide la acción, conserva los datos en el formulario y muestra un mensaje de error: "El SKU ingresado ya existe".
3. **Dado que** el administrador está editando un producto existente, **Cuando** modifica atributos permitidos (como Precio de Venta o Descripción) y guarda, **Entonces** los cambios se reflejan inmediatamente en el listado y el sistema actualiza de manera automática la "Fecha de última modificación".
4. **Dado que** el administrador está en el formulario de creación/edición, **Cuando** intenta guardar dejando campos obligatorios en blanco, **Entonces** el sistema bloquea el envío y resalta visualmente los campos faltantes requiriendo su llenado.

---

### Casos Límite

* ¿Qué ocurre si un administrador intenta modificar el SKU de un producto que ya tiene historial de movimientos (entradas/salidas) asociados?
* ¿Cómo se advierte al usuario si ingresa un "Precio de Costo" superior al "Precio de Venta"? (¿Se bloquea o solo alerta?).
* ¿Qué sucede si un usuario intenta cambiar el estado de un producto a "Inactivo" pero este aún cuenta con stock físico en bodegas?
* ¿Cómo maneja el sistema la importación o el copiado y pegado de texto que incluye espacios en blanco al inicio o final del SKU o el Nombre?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

* **FR-001**: El sistema DEBE permitir el registro de productos requiriendo como mínimo: Nombre, SKU (Código de Referencia Único), Precio de Venta, Categoría y Estado.
* **FR-002**: El sistema DEBE permitir añadir campos opcionales como: Descripción, Precio de Costo, Proveedor y Unidad de Medida.
* **FR-003**: El sistema DEBE garantizar que el campo SKU sea único en toda la base de datos de productos.
* **FR-004**: El sistema DEBE validar que los valores numéricos ingresados en "Precio de Venta" y "Precio de Costo" sean mayores o iguales a 0.
* **FR-005**: El sistema DEBE registrar automáticamente el usuario que crea/modifica el producto, así como las marcas de tiempo de creación (`created_at`) y actualización (`updated_at`).
* **FR-006**: El sistema DEBE permitir alternar el estado del producto (Activo/Inactivo) para controlar su disponibilidad en los módulos operativos.
* **FR-007**: El sistema DEBE sanitizar todos los campos de texto ingresados para prevenir ataques XSS antes de su renderizado.

### Entidades Clave

* **Producto**: Representa el artículo físico o bien gestionado en el inventario. Atributos clave: Identificador interno (`product_id`), SKU (único), Nombre, Descripción, Categoría, Precio de Venta, Precio de Costo, Unidad de Medida, Estado (Activo/Inactivo), Fecha de Creación, Fecha de Modificación.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

* **SC-001**: Los usuarios administradores pueden registrar un nuevo producto sin errores de navegación en menos de 1 minuto.
* **SC-002**: El sistema detecta y bloquea intentos de duplicación de SKU en menos de 1 segundo tras la solicitud de guardado, sin que se caiga la aplicación.
* **SC-003**: Las modificaciones realizadas a un producto se reflejan en el listado general inmediatamente sin necesidad de que el usuario fuerce la recarga del navegador.
* **SC-004**: El 100% de los envíos con datos faltantes son atajados por la validación del front-end antes de llegar al servidor.

## Suposiciones

* El administrador cuenta con los privilegios de seguridad necesarios para la creación y edición del catálogo.
* El SKU es un código alfanumérico estandarizado por la empresa; no se genera automáticamente en esta versión (el usuario lo digita).
* No se contempla el manejo de imágenes múltiples de productos en esta iteración inicial; se trabajará únicamente con datos alfanuméricos.
* La gestión de impuestos sobre el producto se considerará resuelta de manera global o en una capa de facturación posterior; el módulo almacena el valor neto.



### Historia de Usuario 3 - Registrar entradas y salidas de inventario (Prioridad: P1)

Como encargado de bodega, quiero registrar las entradas y salidas de productos, indicando el producto, la bodega y la cantidad correspondiente, para mantener actualizado el stock disponible y conservar un historial de los movimientos realizados.

- **Actualización de stock**: al guardar un movimiento, el stock se actualiza inmediatamente. Si no existe un registro de stock para la combinación producto+bodega, una entrada lo crea con la cantidad indicada y una salida se rechaza.
- **Historial inmutable**: los movimientos registrados no se editan ni eliminan; las correcciones se realizan con un nuevo movimiento de entrada o salida que queda en el historial.
- **Usuario responsable**: el formulario de movimiento exige seleccionar un usuario existente de USERS; el sistema guarda su `user_id` y rechaza el movimiento si el usuario no existe.
- **Fecha automática**: la fecha y hora del movimiento se asignan automáticamente al guardar y no son editables por el usuario.
- **Vencimientos fuera de alcance**: HU-03 no captura fechas de vencimiento ni lotes; se abordan en una historia posterior.

---

### Casos Límite

- ¿Qué ocurre cuando un usuario intenta guardar una entidad sin nombre o código obligatorio?
- ¿Cómo gestiona el sistema una búsqueda que no devuelve coincidencias?
- ¿Qué ocurre si un usuario intenta editar o eliminar una entidad que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha objetivo que no es una fecha de calendario válida?
- ¿Qué ocurre con los documentos de una entidad cuando esta se elimina?
- ¿Qué ocurre cuando un usuario introduce una fecha final anterior a la fecha inicial en un documento?
- ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base?
- ¿Qué ocurre cuando la configuración referencia un tipo de campo desconocido o una definición de transición de ciclo de vida inválida?
- ¿Qué ocurre cuando los registros almacenados contienen valores de campos personalizados que ya no están declarados en la configuración?
- ¿Qué ocurre cuando un usuario abre la aplicación directamente en la pantalla de gestión o búsqueda (p. ej., vía enlace profundo o recarga del navegador) sin pasar por el panel de inicio?
- ¿Qué ocurre cuando un usuario pulsa el botón atrás del navegador estando en la pantalla de gestión o búsqueda?
- ¿Qué ocurre si un usuario navega fuera de la pantalla de gestión mientras un formulario aún tiene cambios sin guardar?
- ¿Permanecen intactas las entidades y los documentos al navegar entre el panel, la gestión y la búsqueda?
- ¿Qué ocurre cuando el panel se abre con cero entidades o cero documentos (valores estadísticos)?
- ¿Qué ocurre cuando el color de acento configurado no es un valor de color válido?
- ¿Cómo mantiene la barra lateral contraída las etiquetas de módulo accesibles en ventanas gráficas estrechas?
- ¿Qué ocurre cuando se registra una salida sin stock disponible para el producto y la bodega?
- ¿Qué ocurre cuando se intenta editar o eliminar un movimiento de inventario ya registrado?
- ¿Qué ocurre cuando se intenta registrar un movimiento con un usuario que no existe?
- ¿Qué ocurre cuando se registra una entrada de un producto con fecha de vencimiento? (Se difiere a una historia posterior).

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de entidad con al menos un nombre y un código.
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un registro de entidad existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un registro de entidad existente.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar registros de entidad por nombre, código, categoría u otras palabras clave descriptivas.
- **FR-005**: El sistema DEBE mostrar una lista clara de entidades e indicar cuándo ningún resultado coincide con una búsqueda.
- **FR-006**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria o no se puede completar una acción.
- **FR-007**: El sistema DEBE mantener los datos de entidad consistentes tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir a los usuarios añadir, editar y eliminar detalles de documentos de una entidad.
- **FR-009**: El sistema DEBE asociar cada documento exactamente a una entidad y eliminar los documentos asociados cuando la entidad se elimina.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial, con botones de acción rápida claramente etiquetados para las tareas ERP clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Entidades, Documentos y Buscar, etiquetados desde la configuración del módulo.
- **FR-013**: El botón de módulo Entidades DEBE mostrar el contenido de gestión de entidades.
- **FR-014**: El botón de módulo Documentos DEBE mostrar el contenido de gestión de documentos en la pantalla de gestión.
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión NO DEBE mostrar la lista de entidades.
- **FR-017**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar entidades.
- **FR-018**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar documentos.
- **FR-019**: El sistema DEBE navegar a una pantalla de búsqueda dedicada cuando se selecciona el botón Buscar en la barra lateral.
- **FR-020**: La pantalla de búsqueda DEBE permitir buscar entidades por nombre, código, categoría, descripción o fecha objetivo.
- **FR-021**: La pantalla de búsqueda DEBE ser accesible tanto desde la barra lateral como desde la acción rápida de buscar registros del panel.
- **FR-022**: El sistema DEBE mantener los datos de entidades y documentos intactos y consistentes durante la navegación entre pantallas.
- **FR-023**: El sistema DEBE cargar la configuración del módulo al arrancar y aplicarla en todas las pantallas.
- **FR-024**: El sistema DEBE retroceder a los valores predeterminados integrados (terminología Entidad/Documento, sin campos personalizados, sin ciclo de vida) cuando no se proporciona configuración.
- **FR-025**: El sistema DEBE informar claramente de una configuración inválida o conflictiva en lugar de fallar silenciosamente.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada que coincidan con sus tipos declarados.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar, usando la misma experiencia de retroalimentación que la validación base.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en los resultados de búsqueda y mostrarlos en listas y vistas de detalle.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario de la configuración del módulo en lugar de texto fijo en el código.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas en los documentos independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener el estado del documento como texto libre cuando no hay ciclo de vida configurado.
- **FR-032**: El sistema DEBE mantener el renderizado de listas y la búsqueda ágiles y correctos para conjuntos de datos de al menos 500 registros de entidad.
- **FR-033**: El panel DEBE ofrecer al menos cuatro botones de acción rápida: nueva entidad, nuevo documento, abrir gestión de entidades y buscar registros.
- **FR-034**: Activar la acción rápida de nueva entidad o nuevo documento DEBE abrir el área de gestión correspondiente con un formulario vacío listo para introducir datos.
- **FR-035**: El panel DEBE mostrar tarjetas de estadísticas con el número de entidades y documentos almacenados, actualizadas cada vez que se muestra el panel.
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral DEBE resaltar visualmente el módulo activo en cada pantalla.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente en todo el marco y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas gráficas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable.
- **FR-040**: Al guardar un movimiento de inventario, el sistema DEBE actualizar inmediatamente `quantity_available` del registro de stock correspondiente al producto y la bodega.
- **FR-041**: Si no existe un registro de stock para la combinación producto+bodega, una entrada DEBE crear el registro; una salida DEBE rechazarse.
- **FR-042**: Una salida cuya cantidad supere el stock disponible DEBE rechazarse sin modificar el stock.
- **FR-043**: El sistema DEBE impedir la edición y eliminación de movimientos de inventario ya registrados.
- **FR-044**: El sistema DEBE permitir corregir un movimiento mediante un nuevo movimiento de ajuste que quede registrado en el historial.
- **FR-045**: El formulario de movimiento DEBE exigir la selección de un usuario existente en USERS y guardar su `user_id`; el sistema DEBE rechazar el movimiento si el usuario no existe.
- **FR-046**: El sistema DEBE asignar automáticamente la fecha y hora del movimiento al guardarlo y NO DEBE permitir que el usuario la modifique.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Entidad**: Un registro de datos maestros gestionado por el módulo, que incluye su nombre, código de negocio, detalles descriptivos, categoría de clasificación, una fecha objetivo opcional y un entity_id autogenerado. Los módulos personalizados definen qué representa una Entidad en el mundo real (p. ej., cliente, producto, activo).
- **Documento**: Detalles transaccionales adjuntos a una entidad, vinculados a ella por el entity_id de la entidad. Los módulos personalizados definen qué representa un Documento (p. ej., pedido, factura, contrato).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados y el ciclo de vida de estados de documentos. Consulte data-model.md para su forma completa.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear una nueva entidad y verla en la lista en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar una entidad existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de crear, editar, eliminar y buscar sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 registros de entidad sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar las pantallas de gestión y búsqueda desde el panel o la barra lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad existente de gestión de entidades y documentos sigue operativa tras el rediseño del marco ERP y el panel (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión y búsqueda sin perder ninguna entidad ni documento almacenado.
- **SC-008**: Un desarrollador puede producir un módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas de registros mostradas en el panel siempre coinciden con el número de entidades y documentos almacenados.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre áreas ocurre mediante una barra lateral persistente; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
  ## Feature Specification: Gestión de Bodegas (HU-04)

**Feature Branch**: `[004-warehouse-management]`

**Created**: [2026-11-01]

**Status**: Draft

**Input**: User description based on User Story HU-04 (Gestión de bodegas).

## User Scenarios & Testing *(mandatory)*

### Historia de Usuario 4 - Registro y Administración de Bodegas (Priority: P1)

Como administrador, quiero registrar y administrar bodegas para organizar los lugares donde se almacenan los productos.

**Why this priority**: Es la funcionalidad central requerida para habilitar la estructura física del sistema de inventario. Sin bodegas registradas, no es posible asociar existencias, registrar entradas/salidas ni realizar transferencias entre ubicaciones.

**Independent Test**: Se puede probar registrando una nueva bodega con su información básica, modificando sus datos y cambiando su estado (activo/inactivo), verificando que cada cambio se refleje correctamente en el sistema.

**Acceptance Scenarios**:

1. **Given** que el administrador se encuentra en el módulo de configuración de bodegas, **When** ingresa los datos obligatorios de una nueva bodega (nombre, ubicación y descripción) y guarda los cambios, **Then** el sistema registra la bodega exitosamente y la muestra en el listado general con estado activo.
2. **Given** que una bodega ya se encuentra registrada en el sistema, **When** el administrador edita sus detalles (por ejemplo, cambia el nombre o la ubicación) y confirma la actualización, **Then** el sistema guarda los nuevos datos de manera correcta.
3. **Given** que una bodega existe en el sistema, **When** el administrador cambia su estado a inactivo, **Then** el sistema actualiza su disponibilidad y restringe la selección de esta bodega para nuevos movimientos operativos.

---

### Edge Cases

* ¿Qué sucede si el administrador intenta registrar una nueva bodega utilizando un nombre o identificador que ya existe en el sistema?
* ¿Cómo maneja el sistema la desactivación o eliminación lógica de una bodega que aún contiene stock de productos o historial de movimientos activos?
* ¿Qué ocurre si un usuario intenta realizar una operación seleccionando una bodega que ha sido marcada como inactiva?

## Requirements *(mandatory)*

### Functional Requirements

* **FR-001**: El sistema MUST permitir registrar nuevas bodegas indicando nombre único, ubicación física y detalles opcionales.
* **FR-002**: El sistema MUST permitir al administrador modificar la información descriptiva y de ubicación de las bodegas existentes.
* **FR-003**: El sistema MUST permitir cambiar el estado de una bodega entre activo e inactivo.
* **FR-004**: El sistema MUST impedir la selección de bodegas inactivas para la realización de nuevos movimientos de inventario o transferencias.
* **FR-005**: El sistema MUST validar que no se dupliquen los nombres o códigos identificatorios de las bodegas.

### Key Entities

* **Bodega**: Representa la ubicación física o almacén donde se resguardan los productos. Atributos clave: Identificador único, Nombre, Ubicación/Dirección, Descripción, Estado (Activo/Inactivo), Fecha de creación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

* **SC-001**: Los administradores pueden registrar una nueva bodega completa en menos de 1 minuto.
* **SC-002**: El listado y la actualización de los datos de las bodegas se reflejan en la interfaz de usuario en menos de 2 segundos.
* **SC-003**: El 100% de los intentos de realizar operaciones sobre bodegas inactivas son bloqueados correctamente por el sistema.
* **SC-004**: El 100% de los registros de bodegas nuevas validan y previenen duplicidades de nombres o identificadores.

## Assumptions

* El administrador cuenta con los privilegios de seguridad necesarios para crear, editar y cambiar el estado de las bodegas.
* Una bodega representa una ubicación física real dentro de la operación logística de la organización.
* Las validaciones de duplicidad de nombres de bodegas se realizan a nivel de base de datos o lógica de negocio central.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.
- La fecha de vencimiento y el control por lotes quedan fuera de HU-03; se abordarán en una historia posterior.

### Historia de Usuario 5 - Transferencias de Productos entre Bodegas (Prioridad: P2)

**Como** encargado de bodega, 
**quiero** registrar transferencias de productos entre distintas bodegas, 
**para** controlar los traslados de mercadería, evitar pérdidas de stock y mantener la trazabilidad de los envíos.

**Por qué es prioridad**: Las transferencias permiten balancear existencias entre distintas ubicaciones físicas sin alterar el balance global de inventario. Esta historia es clave para la operación multi-bodega y conecta directamente las entidades `WAREHOUSES`, `PRODUCTS` y la tabla transaccional `STOCK_TRANSFERS`.

**Prueba Independiente**: Se puede probar generando una solicitud de traslado de 10 unidades del Producto A desde Bodega Origen hacia Bodega Destino. Se verifica que la orden quede en estado `"pendiente"`, que no permita seleccionar la misma bodega como origen y destino, y que al confirmarse actualice de forma simultánea el stock acumulado en la tabla `STOCK` de ambas ubicaciones.

**Escenarios de Aceptación**:
1. **Dado que** el encargado de bodega se encuentra en el formulario de "Nueva Transferencia", **Cuando** selecciona un producto válido, una bodega de origen con stock suficiente, una bodega de destino diferente y una cantidad mayor a cero, **Entonces** el sistema genera el registro con estado `"pendiente"` y asigna la fecha del día (`transfer_date`).
2. **Dado que** existe una transferencia registrada en estado `"pendiente"`, **Cuando** el usuario confirma la recepción en la bodega de destino, **Entonces** el sistema cambia el estado a `"confirmada"`, descuenta las unidades de la bodega origen e incrementa el stock en la bodega destino.
3. **Dado que** un usuario intenta registrar una transferencia, **Cuando** selecciona la misma bodega como origen y destino, **Entonces** el sistema bloquea el envío y muestra el mensaje de error: "La bodega de destino debe ser diferente a la bodega de origen".
4. **Dado que** la cantidad a transferir supera el stock disponible en la bodega de origen (`quantity_available`), **Cuando** el usuario intenta guardar la solicitud, **Entonces** el sistema rechaza la transacción informando falta de existencias.

**Casos Límite**: 
* ¿Qué ocurre si la bodega de destino pasa a estar inactiva mientras existe una transferencia en camino en estado 'pendiente'?
* ¿Qué sucede si un usuario intenta cancelar o editar una transferencia que ya fue marcada como 'confirmada'? (El sistema bloquea la acción; los traslados confirmados son inmutables).
* ¿Cómo reacciona el sistema si el registro de stock para el producto aún no existe en la bodega de destino al momento de confirmar la recepción? (El sistema crea automáticamente la entrada correspondiente en `STOCK`).

**Requisitos Funcionales**:
* **FR-047**: El sistema DEBE permitir registrar solicitudes de transferencia entre bodegas requiriendo: Producto (`product_id`), Bodega Origen (`source_warehouse_id`), Bodega Destino (`target_warehouse_id`) y Cantidad (`quantity`).
* **FR-048**: El sistema DEBE validar que la Bodega Origen y la Bodega Destino sean entidades distintas.
* **FR-049**: El sistema DEBE verificar que la Bodega Origen disponga de `quantity_available` suficiente en `STOCK` antes de autorizar el registro.
* **FR-050**: El sistema DEBE gestionar el estado de la transferencia permitiendo únicamente los valores: 'pendiente', 'confirmada' y 'cancelada'.
* **FR-051**: El sistema DEBE actualizar los niveles de `STOCK` en origen y destino únicamente cuando la transferencia cambie a estado 'confirmada'.
* **FR-052**: El sistema DEBE registrar la fecha de la transacción (`transfer_date`) de forma automática.

**Entidades Clave**: 
* **Transferencia de Stock (`STOCK_TRANSFERS`)**: Documento transaccional que enlaza `transfer_id`, `product_id`, `source_warehouse_id`, `target_warehouse_id`, `quantity`, `status` y `transfer_date`.

**Criterios de Éxito Medibles**: 
* **SC-051**: Los usuarios pueden registrar una solicitud de transferencia en menos de 45 segundos.
* **SC-052**: El 100% de los intentos de transferencia entre bodegas idénticas o sin stock suficiente son bloqueados por las validaciones.
* **SC-053**: El stock de ambas bodegas se actualiza en la interfaz de forma inmediata al confirmar la recepción.

**Suposiciones**: 
* Ambas bodegas participantes deben estar en estado activo al momento de crear la solicitud.
* Las transferencias confirmadas no vuelven a actualizar el stock para evitar duplicaciones.
   
