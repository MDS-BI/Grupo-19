# Especificación de la Funcionalidad: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama de la funcionalidad**: 001-erp-base-module  
**Creada**: 2026-07-08  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Construir un módulo base de software de planificación de recursos empresariales (ERP) que pueda extenderse en módulos ERP personalizados. Debe proporcionar gestión de datos maestros (entidades) y documentos transaccionales vinculados con capacidades de crear/editar/eliminar/buscar."

## Propósito

Este proyecto sirve como módulo base reutilizable para construir módulos ERP personalizados. Establece los patrones comunes que todo módulo ERP necesita: gestionar registros de datos maestros (**Entidades**) y sus **Documentos** transaccionales asociados, con navegación, validación, persistencia y búsqueda ya implementadas, de modo que los módulos personalizados solo necesiten definir sus campos y reglas específicos del dominio.

## Clarifications

### Session 2026-11-03

- Q: ¿La sección "Entidades Clave" debe listar solo las 5 entidades nombradas o todas las entidades del data-model de 002? → A: Solo las 5: PRODUCTS, WAREHOUSES, STOCK, INVENTORY_TRANSACTIONS y USERS.
- Q: ¿Debe eliminarse también ModuleConfig o conservarse junto a las 5 entidades reales? → A: Reemplazar Entidad/Documento por las 5 entidades reales y conservar ModuleConfig como contrato de extensibilidad.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Crear y organizar entidades (Prioridad: P1)
Como usuario de negocio, quiero crear entradas de entidad con detalles claros para poder construir y mantener los datos maestros del módulo.

**Por qué esta prioridad**: Este es el valor central del producto porque, sin crear entidades, el resto de la experiencia no puede aportar valor.

**Prueba Independiente**: Un usuario puede abrir el módulo, añadir una nueva entidad y verla aparecer en la lista.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está viendo la lista de entidades, **cuando** crea una nueva entidad con un nombre y un código, **entonces** la nueva entidad se guarda y aparece en la lista.
2. **Dado** que un usuario está creando una entidad, **cuando** deja la información obligatoria en blanco, **entonces** el sistema impide guardar y explica qué se necesita.

---

### Historia de Usuario 2 - Editar y eliminar entidades (Prioridad: P1)
Como usuario de negocio, quiero actualizar o eliminar entidades cuando cambien los datos maestros para que los registros se mantengan precisos.

**Por qué esta prioridad**: Mantener los registros actualizados es esencial para la confianza en la herramienta y para soportar las operaciones comerciales diarias.

**Prueba Independiente**: Un usuario puede seleccionar una entidad existente, cambiar su información o eliminarla, y la lista refleja el cambio.

**Escenarios de Aceptación**:

1. **Dada** una entidad que ya existe en la lista, **cuando** el usuario edita sus detalles, **entonces** la información actualizada se guarda y se muestra en la lista.
2. **Dada** una entidad que ya no es relevante, **cuando** el usuario la elimina, **entonces** desaparece de la lista y deja de aparecer en los resultados de búsqueda.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario edita o elimina una, **entonces** la lista se actualiza correctamente y sigue siendo ágil.

---

### Historia de Usuario 3 - Panel de inicio con acciones rápidas y estadísticas de registros (Prioridad: P1)

Como usuario de negocio, quiero aterrizar en un panel estilo ERP con acciones rápidas sin accesos duplicados y estadísticas de registros al abrir la aplicación, para poder empezar a trabajar de inmediato y consultar el estado del inventario de un vistazo.

**Por qué esta prioridad**: El panel es el punto de entrada de la aplicación. Evitar accesos duplicados frente a la barra lateral (como un acceso directo duplicado a Productos) mantiene la navegación limpia y directa hacia las tareas clave.

**Prueba Independiente**: Un usuario abre la aplicación, ve un panel con acciones rápidas no duplicadas y estadísticas de registros, inicia un flujo operativo o búsqueda con un clic y comprueba que las estadísticas reflejan los datos almacenados.

**Escenarios de Aceptación**:

1. **Dado** que el usuario abre la aplicación, **cuando** la aplicación carga, **entonces** se muestra el panel de inicio con acciones rápidas claramente etiquetadas para tareas clave sin duplicar accesos directos ya expuestos directamente en la barra lateral (por ejemplo, el acceso a Productos).
2. **Dado** que se muestra el panel, **cuando** el usuario activa la acción rápida de crear un movimiento o transferencia, **entonces** la aplicación abre la vista correspondiente con un formulario vacío listo para introducir datos.
3. **Dado** que se muestra el panel, **cuando** el usuario activa la acción rápida de buscar registros, **entonces** la aplicación abre la pantalla de búsqueda con el campo de búsqueda enfocado.
4. **Dadas** entidades y registros almacenados (`PRODUCTS`, `WAREHOUSES`, `STOCK`, `INVENTORY_TRANSACTIONS`, `USERS`), **cuando** el usuario ve el panel, **entonces** las tarjetas de estadísticas muestran el recuento actual de registros.
5. **Dado** que el usuario crea, edita o elimina registros en otra parte de la aplicación, **cuando** vuelve al panel, **entonces** las estadísticas reflejan el cambio.
---

### Historia de Usuario 4 - Gestionar entidades y pestañas en una pantalla dedicada (Prioridad: P1)

Como usuario de negocio, quiero una pantalla dedicada organizada con distintas pestañas donde pueda añadir, editar y eliminar registros de las entidades del módulo, para poder gestionar los datos operativos y maestros en un lugar ordenado y enfocado.

**Por qué esta prioridad**: Esto preserva el valor central de las capacidades de gestión del módulo, organizando cada recurso en pestañas accesibles desde el espacio de trabajo para trabajar sin mezclar vistas.

**Prueba Independiente**: Un usuario puede navegar a la pantalla de gestión mediante la barra lateral, alternar entre distintas pestañas de recursos, y añadir, editar o eliminar registros con éxito manteniendo su persistencia.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de gestión, **cuando** mira la navegación interna o pestañas disponibles, **entonces** puede seleccionar distintas pestañas para alternar entre los apartados configurados del módulo.
2. **Dada** una pestaña seleccionada en la pantalla de gestión, **cuando** el usuario la activa, **entonces** se muestra el contenido correspondiente a esa pestaña y el estado activo queda visualmente identificado.
3. **Dado** que el usuario está en la pantalla de gestión, **cuando** crea un nuevo registro válido en la pestaña activa, **entonces** el registro se guarda y queda disponible en el sistema.
4. **Dado** un registro existente, **cuando** el usuario edita sus detalles, **entonces** la información actualizada se guarda.
5. **Dado** un registro maestro que ya no es relevante, **cuando** el usuario lo elimina, **entonces** se elimina de acuerdo con las reglas de integridad y deja de aparecer en las consultas.
6. **Dado** que el usuario está en la pantalla de gestión, **cuando** intenta guardar con datos obligatorios faltantes o inválidos, **entonces** el sistema impide guardar y explica qué se necesita.
7. **Dado** que el usuario está en la pantalla de gestión, **cuando** cambia de pestaña o activa el botón Panel en la barra lateral, **entonces** los cambios guardados se conservan y vuelve al panel de inicio.

---

### Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

Como desarrollador de módulos, quiero declarar un único archivo de configuración que defina la identidad, terminología, campos personalizados y reglas de mi módulo, para adaptar el módulo base en un módulo específico sin modificar su código central.

**Por qué esta prioridad**: La adaptación mediante configuración es lo que convierte este proyecto de una aplicación fija en una base reutilizable. Sin ella, cada módulo personalizado requeriría editar archivos fuente centrales, lo que frustra el propósito de la plantilla; todas las historias de personalización posteriores dependen de que este mecanismo exista primero.

**Prueba Independiente**: Un desarrollador proporciona un archivo de configuración que define un perfil de Ventas (nombre del módulo, mapeos Entidad→Cliente, campos personalizados, ciclo de vida), y la aplicación se presenta plenamente como un módulo de Ventas; al quitar el archivo se restauran los valores predeterminados de la base sin errores.

**Escenarios de Aceptación**:

1. **Dado** que un archivo de configuración define el nombre del módulo, **cuando** la aplicación carga, **entonces** el panel de inicio y el marco del espacio de trabajo muestran el nombre configurado.
2. **Dada** una configuración completa (nombre, mapeos de términos, campos personalizados, ciclo de vida), **cuando** la aplicación carga, **entonces** el módulo se presenta plenamente bajo la identidad configurada sin que se vean términos del módulo base en ningún sitio.
3. **Dado** que no se proporciona configuración, **cuando** la aplicación carga, **entonces** la aplicación retrocede a los valores predeterminados integrados Entidad/Documento sin errores.
4. **Dada** una configuración con valores inválidos o conflictivos, **cuando** la aplicación carga, **entonces** el sistema informa del problema con claridad en lugar de fallar silenciosamente.

---

### Historia de Usuario 6 - Reetiquetar pantallas y pestañas desde la configuración (Prioridad: P1)

Como desarrollador de módulos, quiero que todas las etiquetas visibles para el usuario —incluidas pestañas, botones, formularios y encabezados— deriven de la configuración del módulo (`ModuleConfig`), para que un módulo adaptado hable su idioma de dominio de forma consistente en todo momento.

**Por qué esta prioridad**: Los usuarios confían en un módulo que usa consistentemente los nombres de sus entidades y pestañas reales (como `PRODUCTS`, `WAREHOUSES`, `STOCK`, `INVENTORY_TRANSACTIONS` y `USERS`) en lugar de términos genéricos de plantilla. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador configura etiquetas y pestañas personalizadas en `ModuleConfig`, y cada pestaña, botón, etiqueta de formulario, encabezado y mensaje muestra los términos configurados.

**Escenarios de Aceptación**:

1. **Dados** mapeos de términos y pestañas definidos en la configuración, **cuando** cualquier pantalla carga, **entonces** pestañas, botones, etiquetas de formulario, encabezados y mensajes de estado vacío muestran los términos configurados.
2. **Dado** que las etiquetas o pestañas han sido remapeadas, **cuando** el usuario navega entre pantallas o cambia de pestaña, **entonces** el comportamiento de navegación no cambia.
3. **Dado** que no se proporcionan mapeos personalizados, **cuando** cualquier pantalla carga, **entonces** se muestran las etiquetas predeterminadas de las entidades del módulo.

---

### Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

Como desarrollador de módulos, quiero declarar campos adicionales para entidades y documentos en la configuración, para que aparezcan automáticamente en formularios, listas, validación y búsqueda sin escribir código de interfaz.

**Por qué esta prioridad**: Los módulos personalizados existen porque sus registros contienen datos específicos del dominio (el límite de crédito de un cliente, la fecha de vencimiento de una factura). Si añadir campos requiere editar formularios y validación a mano, la adaptación es propensa a errores y no escala. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador declara un campo numérico obligatorio personalizado en las entidades; se muestra como entrada numérica en el formulario, bloquea el guardado cuando está en blanco, muestra los valores guardados en las listas y coincide en las búsquedas.

**Escenarios de Aceptación**:

1. **Dado** un campo personalizado de entidad de tipo número declarado como obligatorio, **cuando** el usuario crea o edita una entidad, **entonces** el campo se muestra como entrada numérica y un valor en blanco impide guardar con una explicación clara.
2. **Dado** un campo personalizado con un valor guardado, **cuando** el usuario ve la lista o la vista de detalle, **entonces** el valor se muestra.
3. **Dados** campos personalizados declarados, **cuando** el usuario busca usando un término que coincide con un valor de campo personalizado, **entonces** se devuelven los registros coincidentes.
4. **Dado** que no hay campos personalizados declarados, **cuando** la aplicación se ejecuta, **entonces** el comportamiento es idéntico al del módulo base sin modificar.

---

### Historia de Usuario 8 - Cambiar de rol y configurar visibilidad por bodega (Prioridad: P1)

Como usuario o administrador del módulo, quiero disponer de un botón para cambiar de rol y configurar qué información puede ver cada usuario —incluyendo asignar un encargado por bodega para que vea solo los datos de su bodega—, para que la aplicación abra la vista correspondiente al cargo y restrinja el acceso a datos de otras bodegas.

**Por qué esta prioridad**: Permite cambiar de rol ágilmente según el cargo y aplicar segmentación de datos por bodega (`warehouse_id` / `assigned_warehouse_id`), evitando que un encargado de bodega vea información de bodegas ajenas.

**Prueba Independiente**: Un usuario pulsa el botón de cambio de rol y se abre la vista asociada al cargo seleccionado; al configurar un encargado para una bodega específica, ese usuario solo ve los registros de su bodega asignada y no los de otras bodegas.

**Escenarios de Aceptación**:

1. **Dado** que el usuario se encuentra en la aplicación, **cuando** activa el botón para cambiar de rol, **entonces** se actualiza el rol activo y se abre o adapta la página correspondiente a ese cargo.
2. **Dado** un usuario configurado como encargado de una bodega específica, **cuando** consulta stock, movimientos/transferencias o datos de bodegas, **entonces** solo ve los registros de su bodega asignada y no los de otras bodegas.
3. **Dado** un usuario con rol administrativo o de configuración, **cuando** configura qué datos ve cada usuario o asigna un encargado a una bodega, **entonces** la configuración se guarda y se aplica a los datos visibles de ese usuario.
4. **Dado** que un usuario con visibilidad restringida a una bodega revisa listados o búsquedas, **cuando** se cargan los resultados, **entonces** no se exponen registros pertenecientes a otras bodegas.

---

### Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)
Como usuario de negocio, quiero adjuntar una fecha objetivo opcional a una entidad para planificar y ordenar los registros según cuándo vence algo.

**Por qué esta prioridad**: La planificación consciente de fechas mejora el valor central cuando el conjunto de datos crece, pero no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede fijar una fecha en una entidad y verla mostrada en la lista.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está creando o editando una entidad, **cuando** introduce una fecha objetivo, **entonces** la fecha se guarda y se muestra en la lista.
2. **Dada** una entidad con fecha fijada, **cuando** el usuario ve la lista, **entonces** las entidades con fechas pueden identificarse de un vistazo.
3. **Dado** que un usuario deja la fecha en blanco, **cuando** guarda la entidad, **entonces** la entidad igualmente se guarda sin fecha (campo opcional).

---

### Historia de Usuario 10 - Registrar los detalles de documentos de una entidad (Prioridad: P2)
Como usuario de negocio, quiero registrar detalles de documentos para una entidad, para mantener la actividad transaccional organizada junto a cada registro de datos maestros.

**Por qué esta prioridad**: Los documentos aportan valor operativo práctico una vez que las entidades están gestionadas, pero no son necesarios para la gestión central.

**Prueba Independiente**: Un usuario puede añadir un documento a una entidad y ver los detalles del documento mostrados junto a esa entidad.

**Escenarios de Aceptación**:

1. **Dada** una entidad en la lista, **cuando** el usuario añade un documento con detalles, **entonces** el documento se guarda y queda asociado a esa entidad.
2. **Dado** un documento existente para una entidad, **cuando** el usuario selecciona esa entidad en la pantalla de gestión, **entonces** los detalles del documento se muestran en la vista de gestión de documentos.
3. **Dada** una entidad eliminada, **cuando** se confirma la eliminación, **entonces** sus documentos asociados también se eliminan.
4. **Dado** que un usuario está creando un documento, **cuando** deja la información obligatoria del documento en blanco, **entonces** el sistema impide guardar y explica qué se necesita.

---

### Historia de Usuario 11 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

Como usuario de negocio, quiero una pantalla de búsqueda dedicada para encontrar rápidamente entidades sin que los formularios de edición saturen la vista.

**Por qué esta prioridad**: La recuperación rápida es valiosa cuando el conjunto de datos crece, y una pantalla separada mantiene enfocada la experiencia de gestión, pero la búsqueda no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un término de búsqueda y ver solo las entidades coincidentes.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** introduce un término coincidente, **entonces** solo se muestran las entidades coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** se muestra un estado vacío claro y puede volver a intentarlo.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario busca desde la pantalla de búsqueda, **entonces** los resultados aparecen con prontitud sin retraso perceptible.
4. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio.

---

### Historia de Usuario 12 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

Como desarrollador de módulos, quiero definir los estados permitidos de los documentos y las transiciones permitidas, para que los documentos sigan el ciclo de vida del dominio en lugar de aceptar texto de estado arbitrario.

**Por qué esta prioridad**: Los módulos reales necesitan ciclos de vida controlados (p. ej., cotización → pedido → facturado), pero el estado de texto libre sigue siendo aceptable para extensiones simples, así que esto mejora la base sin ser necesario para la adaptación básica. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador configura un ciclo de vida cotización→pedido→facturado; el control de estado ofrece solo estados siguientes válidos, las transiciones inválidas se rechazan con una explicación, y el estado es visible de un vistazo en las listas.

**Escenarios de Aceptación**:

1. **Dado** un ciclo de vida configurado, **cuando** el usuario edita el estado de un documento, **entonces** solo se ofrecen los estados alcanzables mediante transiciones permitidas.
2. **Dado** que se intenta una transición inválida por cualquier vía, **cuando** se envía, **entonces** el sistema la rechaza con una explicación clara.
3. **Dado** un ciclo de vida configurado, **cuando** el usuario ve listas o detalles de documentos, **entonces** el estado actual es identificable de un vistazo.
4. **Dado** que no hay ciclo de vida configurado, **cuando** se editan documentos, **entonces** el estado permanece como texto libre igual que en el módulo base sin modificar.

---

### Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

Como usuario de negocio, quiero un espacio de trabajo estilo ERP consistente, con una barra superior con marca y una barra lateral de módulos presentes en cada pantalla, para que la aplicación se sienta como un sistema empresarial coherente en lugar de páginas sueltas.

**Por qué esta prioridad**: El marco aporta la marca y la navegación de todas las demás pantallas; construirlo como envoltorio evita tocar cada historia por separado y da al módulo su identidad ERP. Depende del perfil de configuración (Historia de Usuario 5) para el nombre del módulo y la terminología, y reestructura la navegación antes proporcionada por los botones de bienvenida y las pestañas de gestión (Historias de Usuario 3 y 4).

**Prueba Independiente**: En cada pantalla, una barra superior muestra un logotipo derivado del nombre del módulo junto al nombre del módulo, una barra lateral ofrece botones de módulo para Panel, Entidades, Documentos y Buscar con el módulo activo resaltado visualmente, y navegar entre módulos nunca pierde datos.

**Escenarios de Aceptación**:

1. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la página, **entonces** es visible una barra superior que contiene un logotipo SVG en línea derivado del nombre del módulo y el nombre del módulo configurado.
2. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la barra lateral, **entonces** se muestran botones de módulo para Panel, Entidades, Documentos y Buscar usando la terminología configurada.
3. **Dado** que el usuario está en cualquier pantalla, **cuando** mira la barra lateral, **entonces** el botón del módulo activo está resaltado visualmente.
4. **Dado** que la ventana gráfica es estrecha, **cuando** se usa la aplicación en una pantalla pequeña, **entonces** la barra lateral se contrae a una columna de iconos manteniéndose utilizable y etiquetada de forma accesible.
5. **Dada** una configuración que define un color de acento, **cuando** cualquier pantalla carga, **entonces** el marco lo usa consistentemente para resaltados y controles principales; sin valor configurado o con un valor inválido, se usan los valores predeterminados integrados sin errores.
6. **Dado** que el usuario navega entre módulos mediante la barra lateral, **cuando** inspecciona sus datos después, **entonces** todas las entidades y documentos almacenados permanecen intactos.

---

### Historia de Usuario 14 - Generar órdenes de entrada y salida con ID y seguimiento de envíos al comprador (Prioridad: P1)

Como operador logístico o encargado de bodega, quiero generar órdenes de adquisición (entrada) y órdenes de venta (salida) con un ID único dentro de los movimientos y transferencias, y registrar el seguimiento de los envíos que salen de la bodega hacia el comprador, para controlar el inventario y conocer el estado del envío en cada etapa.

**Por qué esta prioridad**: Integra las operaciones de entrada y salida con `INVENTORY_TRANSACTIONS` y `STOCK` mediante IDs únicos, y añade seguimiento logístico únicamente a las salidas de bodega hacia el comprador (como código de seguimiento tipo Bluexpress y etapa del envío: en bodega, en tránsito, en entrega, etc.).

**Prueba Independiente**: Un usuario genera una orden de adquisición (entrada) y una orden de venta (salida) con ID generado, verifica que cada una recibe un ID único y actualiza el stock, y en la salida registra o consulta el código de seguimiento y su etapa de envío.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en movimientos y transferencias, **cuando** genera una orden de adquisición (entrada) con datos válidos y cantidad mayor que cero, **entonces** se genera un ID único para la orden, se registra el movimiento y se incrementa el stock correspondiente.
2. **Dado** que el usuario está en movimientos y transferencias, **cuando** genera una orden de venta (salida) con datos válidos, cantidad mayor que cero y stock disponible suficiente, **entonces** se genera un ID único para la orden, se registra el movimiento y se descuenta el stock correspondiente.
3. **Dado** que se genera o gestiona una orden de venta (salida) desde la bodega hacia el comprador, **cuando** el usuario registra o actualiza el seguimiento del envío, **entonces** puede asignar un código de seguimiento (por ejemplo, de Bluexpress) y actualizar la etapa del envío (por ejemplo: en bodega, en tránsito, en entrega).
4. **Dado** que se registra una orden de adquisición (entrada), **cuando** se guarda la operación, **entonces** no se requiere seguimiento de envío hacia un comprador.
5. **Dado** que un movimiento o transferencia ya fue guardado, **cuando** se consulta el historial, **entonces** conserva su ID y registro histórico sin permitir edición destructiva ni eliminación del movimiento.

---

### Historia de Usuario 15 - Buscar y filtrar transferencias y movimientos (Prioridad: P2)

Como usuario de negocio o encargado de bodega, quiero contar con un buscador con filtros para las transferencias y movimientos, para localizar rápidamente órdenes por ID, tipo (adquisición/entrada o venta/salida), bodega, producto, código de seguimiento o etapa de envío.

**Por qué esta prioridad**: A medida que aumentan las órdenes de entrada y salida y los envíos en curso, buscar y filtrar transferencias reduce tiempos de consulta y facilita el seguimiento operativo.

**Prueba Independiente**: Un usuario introduce un ID de orden, un código de seguimiento o selecciona filtros de tipo, bodega o etapa de envío en el buscador de transferencias y ve solo las transferencias coincidentes.

**Escenarios de Aceptación**:

1. **Dado** que el usuario utiliza el buscador de transferencias y movimientos, **cuando** ingresa un ID de orden, código de seguimiento o palabra clave coincidente, **entonces** se muestran solo las transferencias o movimientos que coinciden.
2. **Dado** que el usuario aplica filtros (como tipo de orden entrada/salida, bodega o etapa de envío como en bodega, en tránsito o en entrega), **cuando** se aplican los filtros, **entonces** la lista muestra únicamente los registros que cumplen con los filtros seleccionados.
3. **Dado** que el usuario es encargado de una bodega específica, **cuando** busca o filtra transferencias, **entonces** los resultados se restringen únicamente a los movimientos o transferencias de su bodega asignada.
4. **Dado** que una búsqueda o combinación de filtros no arroja resultados, **cuando** se actualiza la vista, **entonces** el sistema muestra un estado vacío claro y permite limpiar o modificar los filtros.

### Casos Límite

- ¿Qué ocurre cuando un usuario intenta guardar una entidad o registro sin campos obligatorios (como nombre o código en un producto, o nombre/ubicación en una bodega)?
- ¿Cómo gestiona el sistema una búsqueda o filtro que no devuelve coincidencias?
- ¿Qué ocurre si un usuario intenta editar o eliminar un registro que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha objetivo o de vencimiento que no es una fecha de calendario válida?
- ¿Qué ocurre con los registros dependientes cuando se elimina una entidad maestra (por ejemplo, una bodega con stock o movimientos asociados)?
- ¿Qué ocurre cuando un usuario intenta registrar una orden de venta (`salida`) con una cantidad superior al `quantity_available` disponible en `STOCK` para esa bodega?
- ¿Qué ocurre si se intenta asignar código de seguimiento o etapa de envío a una orden de adquisición (`entrada`), o se deja incompleto el seguimiento de una orden de venta (`salida`) hacia el comprador?
- ¿Qué ocurre cuando un usuario cambia de rol o cuando un encargado de bodega intenta ver, buscar o filtrar registros de bodegas distintas a su `assigned_warehouse_id`?
- ¿Qué ocurre si el usuario cambia de rol o navega entre pestañas mientras un formulario tiene cambios sin guardar?
- ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base o referencia un tipo de campo desconocido?
- ¿Qué ocurre cuando la configuración referencia una transición de ciclo de vida inválida o cuando los registros almacenados contienen valores de campos personalizados ya no declarados en `ModuleConfig`?
- ¿Qué ocurre cuando un usuario abre la aplicación directamente en una vista o pestaña mediante enlace profundo o recarga del navegador sin pasar por el panel de inicio?
- ¿Qué ocurre cuando un usuario pulsa el botón atrás del navegador estando en una vista de gestión, búsqueda o transferencia?
- ¿Permanecen intactas las entidades, el stock y las transferencias al navegar entre el panel, las pestañas, la búsqueda y los distintos roles?
- ¿Qué ocurre cuando el panel se abre con cero registros en las entidades o cuando el color de acento configurado en `ModuleConfig` no es un valor válido?
- ¿Cómo mantiene la barra lateral contraída las etiquetas de módulo accesibles en ventanas gráficas estrechas?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear registros de datos maestros y operativos de las entidades del módulo (`PRODUCTS`, `WAREHOUSES`, `STOCK`, `INVENTORY_TRANSACTIONS`, `USERS`) con sus campos obligatorios validados.
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de registros existentes cuando las reglas del dominio lo permitan (excluyendo la edición destructiva de movimientos históricos en `INVENTORY_TRANSACTIONS`).
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar registros existentes cuando las reglas de integridad y el ciclo de vida de la entidad lo permitan.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar registros por identificador, nombre, código, categoría, bodega u otras palabras clave descriptivas.
- **FR-005**: El sistema DEBE mostrar listas y vistas organizadas e indicar claramente cuándo ningún resultado coincide con una búsqueda o filtro.
- **FR-006**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria, se excede el stock disponible o no se puede completar una acción.
- **FR-007**: El sistema DEBE mantener la consistencia de los datos tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir gestionar los registros y documentos/movimientos asociados a las entidades del módulo según las reglas de cada recurso.
- **FR-009**: El sistema DEBE preservar la integridad referencial entre entidades y registros asociados y aplicar las reglas de eliminación o bloqueo correspondientes.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial con estadísticas de registros y acciones rápidas para tareas clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo etiquetados desde la configuración del módulo (`ModuleConfig`).
- **FR-013**: La navegación del módulo DEBE permitir acceder a los apartados de gestión de las entidades del dominio sin duplicar accesos directos ya presentes en la barra lateral.
- **FR-014**: El espacio de trabajo DEBE soportar distintas pestañas para alternar entre los recursos y vistas configurados del módulo.
- **FR-015**: El botón de módulo correspondiente al panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: Cada pestaña o vista del espacio de trabajo DEBE mostrar únicamente el contenido y controles correspondientes al recurso o sección activa, evitando mezclar vistas simultáneamente.
- **FR-017**: La gestión DEBE proporcionar las operaciones de crear, editar y eliminar aplicables a cada entidad según su naturaleza (incluyendo la inmutabilidad histórica de `INVENTORY_TRANSACTIONS`).
- **FR-018**: La gestión DEBE permitir administrar los movimientos y transferencias vinculados a productos y bodegas.
- **FR-019**: El sistema DEBE proporcionar una pantalla o vista de búsqueda dedicada accesible desde la navegación o acción rápida correspondiente.
- **FR-020**: La búsqueda DEBE permitir consultar registros por campos clave, fechas o atributos descriptivos según el tipo de registro.
- **FR-021**: El acceso a la búsqueda DEBE funcionar de forma consistente sin caminos redundantes innecesarios.
- **FR-022**: El sistema DEBE mantener los datos de todas las entidades intactos y consistentes durante la navegación entre vistas, pestañas y roles.
- **FR-023**: El sistema DEBE cargar `ModuleConfig` al arrancar y aplicar su configuración en todas las pantallas y pestañas.
- **FR-024**: El sistema DEBE retroceder a los valores predeterminados integrados del módulo cuando no se proporcione configuración en `ModuleConfig`.
- **FR-025**: El sistema DEBE informar claramente de una configuración inválida o conflictiva en lugar de fallar silenciosamente.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada acordes a su tipo declarado.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar, usando la misma experiencia de retroalimentación que la validación base.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en búsquedas, listados y vistas de detalle cuando correspondan.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario —incluidas pestañas, botones, encabezados y formularios— de `ModuleConfig` y de las entidades reales del dominio.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener los estados configurables según las reglas definidas cuando no exista un ciclo de vida restrictivo específico.
- **FR-032**: El sistema DEBE mantener el renderizado de listas, búsquedas y filtros ágil y correcto para conjuntos de datos de al menos 500 registros.
- **FR-033**: El panel DEBE ofrecer acciones rápidas claramente etiquetadas para flujos clave sin duplicar accesos directos ya expuestos directamente en la barra lateral (como el acceso a Productos).
- **FR-034**: Activar una acción rápida DEBE abrir la vista correspondiente con el formulario o campo listo para operar.
- **FR-035**: El panel DEBE mostrar tarjetas de estadísticas con el recuento actual de registros de las entidades del módulo, actualizadas al cargar o volver al panel.
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral y las pestañas DEBEN resaltar visualmente el módulo o pestaña activa.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente en todo el marco y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas gráficas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable y accesible.
- **FR-040**: El sistema DEBE incluir un botón para cambiar de rol que actualice el cargo activo y abra o adapte la vista correspondiente a ese rol.
- **FR-041**: El sistema DEBE permitir configurar qué información ve cada usuario y restringir a los encargados de bodega (`assigned_warehouse_id`) para que visualicen, busquen y filtren únicamente los datos de su bodega asignada.
- **FR-042**: Al registrar movimientos o transferencias en `INVENTORY_TRANSACTIONS`, el sistema DEBE generar un ID único para cada orden de adquisición (`entrada`) y orden de venta (`salida`), actualizar `STOCK.quantity_available`, y permitir registrar/actualizar código de seguimiento (p. ej., Bluexpress) y etapa de envío (`En bodega`, `En tránsito`, `En entrega`, `Entregado`) exclusivamente en órdenes de venta (`salida`) hacia el comprador.
- **FR-043**: El sistema DEBE proveer un buscador con filtros para transferencias y movimientos que permita filtrar por ID de orden, tipo (`entrada` o `salida`), bodega, producto, código de seguimiento y etapa de envío.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Producto (`PRODUCTS`)**: Artículo físico o bien gestionado en el inventario. Atributos clave: `product_id` (identificador único), `product_name` (obligatorio, no vacío), `description` (opcional), `unit_price` (mayor o igual a cero), `category_id` (referencia obligatoria a `PRODUCT_CATEGORIES`), `dimensions_height`, `dimensions_width` y `dimensions_depth` (opcionales) y `weight` (mayor o igual a cero).
- **Bodega (`WAREHOUSES`)**: Ubicación física donde se almacenan los productos. Atributos clave: `warehouse_id` (identificador único), `name` (obligatorio, no vacío), `location` (obligatorio), `capacity` (mayor o igual a cero) y `responsable_id` (referencia opcional a `USERS`).
- **Stock (`STOCK`)**: Existencias disponibles de cada producto por bodega. Atributos clave: `stock_id` (identificador único), `product_id` (referencia a `PRODUCTS`), `warehouse_id` (referencia a `WAREHOUSES`), `quantity_available` (mayor o igual a cero), `min_stock_level` (mayor o igual a cero), `expiration_date` (opcional) y `update_date` (obligatorio). La combinación `product_id` + `warehouse_id` es única.
- **Movimiento de Inventario (`INVENTORY_TRANSACTIONS`)**: Registro histórico de entradas y salidas que representa órdenes de adquisición y venta. Atributos clave: `transaction_id` (identificador único), `order_id` (identificador único de la orden generada), `product_id` (referencia a `PRODUCTS`), `warehouse_id` (referencia a `WAREHOUSES`), `transaction_type` (solo `"entrada"` para orden de adquisición o `"salida"` para orden de venta), `quantity` (mayor que cero), `user_id` (referencia obligatoria a `USERS`), `transaction_date` (asignada automáticamente al guardar), y —aplicable únicamente cuando `transaction_type` es `"salida"` hacia un comprador— `tracking_code` (código de seguimiento opcional, p. ej., Bluexpress) y `shipping_stage` (etapa del envío: `En bodega`, `En tránsito`, `En entrega`, `Entregado`). Cada movimiento actualiza de inmediato `STOCK.quantity_available`; los datos base del movimiento son inmutables (no se editan ni eliminan, y las correcciones se realizan con un nuevo movimiento), permitiéndose únicamente actualizar el seguimiento de envío en órdenes de salida.
- **Usuario (`USERS`)**: Persona que opera el sistema y registra movimientos de inventario. Atributos clave: `user_id` (identificador único), `user_name` (obligatorio, no vacío), `role` (cargo obligatorio que determina la vista inicial y navegación disponible al cambiar de rol), `email` (formato de correo válido), `assigned_warehouse_id` (referencia opcional a `WAREHOUSES`; cuando está asignada a un encargado de bodega, restringe su visibilidad exclusivamente a los datos de esa bodega) y `visibility_config` (configuración de módulos, pestañas o datos visibles asignados al usuario).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, la estructura de pestañas, las definiciones de campos personalizados, los perfiles de vista por rol y el ciclo de vida de estados. Consulte `data-model.md` para su forma completa.

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
- La adaptación a un módulo específico se realiza mediante `ModuleConfig` en lugar de editar archivos fuente centrales.
- Las entidades centrales del módulo son `PRODUCTS`, `WAREHOUSES`, `STOCK`, `INVENTORY_TRANSACTIONS` y `USERS`, junto con `ModuleConfig` como contrato de extensibilidad.
- El espacio de trabajo organiza los apartados mediante la barra lateral y pestañas configurables, evitando accesos duplicados desde el panel hacia destinos ya expuestos directamente en la barra lateral.
- El cambio de rol permite alternar entre cargos para abrir la vista correspondiente y aplicar reglas de visibilidad por usuario o por bodega asignada (`assigned_warehouse_id`).
- El seguimiento de envío (código de seguimiento como Bluexpress y etapa del envío: en bodega, en tránsito, en entrega, entregado) aplica únicamente a órdenes de venta (`salida`) desde la bodega hacia el comprador, no a órdenes de adquisición (`entrada`).
- Los movimientos registrados en `INVENTORY_TRANSACTIONS` conservan su historial y su ID de orden; las correcciones de stock se realizan mediante nuevos movimientos y el seguimiento de envío en salidas solo actualiza su etapa o código correspondiente.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una vista o pestaña principal activa a la vez; la navegación interna y el botón atrás del navegador deben comportarse de forma predecible.
- Los datos se persisten en el `localStorage` del navegador y no se ven afectados por la navegación entre pantallas, pestañas o cambios de rol.
- El contenido introducido por el usuario (nombres, códigos, descripciones, códigos de seguimiento, notas) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS), escapando HTML y atributos de eventos al mostrar datos de `localStorage`.
