# Especificación de la Funcionalidad: Módulo de Logística e Inventario

**Rama de la funcionalidad**: 002-logistica-inventario  
**Creada**: 2026-10-29  
**Estado**: HU-01 a HU-15 implementadas, con verificación automatizada registrada para la suite completa (34 archivos/308 pruebas) y build correcto el 2026-11-26; HU-08 incorporada a la matriz de permisos; HU-09 con T104–T106 y T108–T110 cerrados y T107 diferida; HU-12 a HU-14 reconciliadas el 2026-11-25 ocultando la interfaz base sin borrar datos ni funciones; HU-15 incorporada al MVP el 2026-11-27 con semilla renombrada y migración idempotente. Permanecen pendientes T031, T036, T048, T065, T067, T107, T136 y T145 por evidencia parcial, diferimiento histórico convertido en bloqueante o criterios de validación manual/navegador no cubiertos; son bloqueantes para la aceptación del MVP canónico `HU-01`–`HU-15`; T136 y T145 tienen confirmación manual parcial del usuario, pero no se marcan completos.
**Entrada**: Descripción del usuario: "Desarrollar un módulo de Logística e Inventario para gestionar productos, bodegas y existencias, permitiendo registrar entradas y salidas de productos, realizar transferencias entre bodegas y generar alertas de stock mínimo".
**Ampliación (2026-11-22)**: Descripción del usuario: "Agregar una nueva historia de usuario para la gestión de roles, redirección inicial y control de visibilidad por usuario: asignar y cambiar el cargo de un usuario con una página de inicio por rol; configurar qué módulos, vistas o secciones puede ver cada rol o usuario; mostrar u ocultar menús, rutas y botones según permisos y bloquear el acceso directo por URL a vistas no autorizadas".
**Ampliación (2026-11-25)**: Descripción del usuario: "Actualiza la spec existente specs/002-logistica-inventario/spec.md (no crees una carpeta nueva) con estos cambios de interfaz: 1) se eliminan de la interfaz Entidades, Documentos y Búsqueda de la plantilla base; el sistema solo muestra Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas; 2) cada sección puede organizarse en pestañas (por ejemplo Movimientos: Entradas / Salidas / Historial); 3) cada sección tiene un único punto de acceso: el menú lateral. El panel principal solo muestra indicadores (productos, bodegas, stock total, alertas) y no repite accesos del menú. Incluye criterios de aceptación para cada uno".

**Ampliación (2026-11-26)**: Descripción del usuario: "Actualiza la spec existente specs/002-logistica-inventario/spec.md (NO crees carpeta ni rama nueva). Agrega una nueva historia de usuario con el siguiente número disponible, de prioridad P3, titulada 'Datos de ejemplo con nombres ficticios variados', con escenarios de aceptación, casos límite, y los FR y SC con la numeración siguiente a la existente. No modifiques ni borres las demás historias. Los cuatro usuarios del catálogo semilla pasan a tener nombres y correos ficticios en este orden: Millaray Antileo (administrador), Tomás Wiegand (encargado_bodega), Yasmina Haddad (supervisor_inventario) y Sebastián Quispe (encargado_bodega), con correos nombre.apellido@empresa.cl sin tildes. Los nombres no corresponden a personas reales o públicas y no se repiten. Se conservan el orden, los user_id, los roles, la bodega asignada y los vínculos con movimientos, transferencias, reposiciones y envíos; solo cambian nombre y correo. La asignación de bodegas de los datos de demostración no depende del nombre sino del rol y la posición. El cambio no altera stock, movimientos ni permisos. Quien ya tiene datos guardados conservaría los nombres anteriores porque el catálogo solo se siembra cuando está vacío: el sistema debe actualizar automáticamente solo los usuarios que coincidan exactamente con la semilla anterior (mismo user_id, nombre y correo: Ana Torres, Carlos Pérez, María López, Jorge Soto), de forma idempotente, sin tocar usuarios modificados ni distintos, sin perder movimientos ni otros registros y conservando el usuario activo guardado. Agrega también una aclaración en Clarifications y una fila en la tabla de trazabilidad que indique cobertura de seed.js, demo-data.js, storage.js, shipments.test.js, demo-data.test.js y storage.test.js".

## Propósito

El módulo de Logística e Inventario tiene como objetivo facilitar la gestión de productos, bodegas y existencias de una empresa. Permitirá registrar entradas y salidas de productos, consultar el stock disponible, realizar transferencias entre bodegas y generar alertas cuando las existencias sean bajas.

## Clarifications

### Session 2026-10-30

- Q: Cuando se guarda un movimiento de entrada o salida, ¿cómo debe actualizarse el stock? → A: Actualización inmediata; si no existe registro de stock para producto+bodega, la entrada lo crea y la salida sin existencias se rechaza.
- Q: Una vez registrado un movimiento de inventario, ¿se debe poder editar o eliminar? → A: El movimiento es inmutable; no se edita ni elimina y las correcciones se hacen con un nuevo movimiento de ajuste que deja rastro.
- Q: ¿Cómo se debe determinar el usuario que registra el movimiento de inventario? → A: El formulario exige seleccionar un usuario existente de USERS y guarda su user_id; el movimiento se rechaza si el usuario no existe.
- Q: ¿Cómo se debe establecer la fecha del movimiento de inventario? → A: El sistema asigna automáticamente la fecha y hora al guardar; el usuario no puede modificarla.
- Q: Cuando se registra una entrada de un producto con vencimiento, ¿cómo se debe manejar la fecha de vencimiento? → A: Queda fuera de HU-03; se difiere a una historia posterior de lotes o vencimientos.

### Session 2026-11-03

- Q: ¿Cómo debe resolverse la diferencia entre los campos que exige la HU-01 (SKU único, Precio de Venta, Precio de Costo, Unidad de Medida y Estado) y `PRODUCTS` del data-model, que solo define `unit_price`, dimensiones y peso? → A: Ampliar `PRODUCTS` en el data-model con `sku` único, `sale_price`, `cost_price`, `unit_of_measure`, `status` y `supplier`.
- Q: ¿Cómo deben existir las categorías de producto y los usuarios que referencian `PRODUCTS`, `WAREHOUSES` e `INVENTORY_TRANSACTIONS`, si no hay una historia para administrarlos? → A: Precargan como catálogos semilla de categorías y usuarios; no hay pantallas de administración en esta iteración.
- Q: ¿Cómo debe representarse el "movimiento de ajuste" que corrige un movimiento inmutable, si `INVENTORY_TRANSACTIONS.transaction_type` solo admite "entrada" o "salida"? → A: Se añaden los tipos "ajuste_entrada" y "ajuste_salida" a `transaction_type`, manteniendo cantidades positivas y la dirección explícita.
- Q: ¿El módulo debe implementar inicio de sesión y control de acceso por rol, o los roles son solo etiquetas del catálogo de usuarios sin autenticación? → A: Sin autenticación en esta iteración; los roles son informativos y el usuario que registra operaciones se toma del usuario activo seleccionado en la parte superior del ERP (catálogo `USERS`). Esta respuesta es histórica: desde HU-08 los roles gobiernan permisos simulados conforme a FR-073 y FR-104–FR-124.
- Q: ¿La spec debe conservar las secciones del módulo base y en qué orden debe quedar? → A: Conservar todas las secciones base y añadir las de cada historia, ordenando la spec con la misma disposición de `001-erp-base-module/spec.md` (una sección global de Requisitos, Criterios de Éxito y Suposiciones).

### Session 2026-11-03 — Ajustes de Entidades Clave

- Q: ¿Qué conceptos de la plantilla base deben figurar en Entidades Clave? → A: Se excluyen las entidades genéricas "Entidad" y "Documento"; se conserva `ModuleConfig` como contrato de extensibilidad y se listan solo las entidades reales del módulo, siguiendo `001`.
- Q: ¿Qué hacer con `PRODUCTS.unit_price`? → A: Se conserva solo como campo de compatibilidad con la plantilla base; las reglas de negocio usan `sale_price` y `cost_price`.
- Q: ¿Qué alcance tienen `STOCK.min_stock_level` y `STOCK.expiration_date`? → A: `min_stock_level` se incorpora en la HU-06 para las alertas de stock mínimo (ver sesión "Alertas de Stock Mínimo"); `expiration_date` se mantiene reservado para control de vencimientos futuro.
- Q: ¿Cómo se audita una transferencia? → A: Se registra `created_by` al crear la solicitud y `confirmed_by` al confirmar la recepción, ambos seleccionados del catálogo `USERS`.
- Q: ¿Cómo se distinguen las relaciones entre `USERS` y `WAREHOUSES`? → A: `responsable_id` identifica al responsable principal de la bodega; `assigned_warehouse_id` identifica la bodega operativa asignada al usuario.

### Session 2026-11-03 — Alertas de Stock Mínimo

- Q: ¿Cuál es el alcance de la Historia de Usuario 6? → A: Alertas de stock mínimo: generar y consultar alertas cuando `quantity_available` cae en o por debajo de `min_stock_level`.
- Q: ¿Dónde y cómo debe ver el usuario las alertas de stock mínimo? → A: En una pantalla dedicada de alertas y, además, mediante un indicador visual en la pantalla de Control de Stock (HU-02).
- Q: ¿Quién define el nivel mínimo y con qué granularidad? → A: `min_stock_level` se configura por combinación producto+bodega en `STOCK` y solo el administrador puede editarlo.
- Q: ¿Qué ocurre con una alerta cuando el stock vuelve a estar sobre el mínimo o el usuario la revisa? → A: La alerta se recalcula automáticamente y desaparece sola cuando el stock supera el mínimo; no requiere reconocimiento manual.

### Session 2026-11-05 — Resolución de Casos Límite Abiertos

- Q: ¿Quién puede cancelar una transferencia en estado "pendiente" y qué ocurre con el stock? → A: El usuario activo del ERP puede cancelarla y su `user_id` se registra automáticamente como `cancelled_by`; el estado pasa a "cancelada" y el stock no se modifica porque no fue descontado hasta la confirmación. Solo las transferencias "pendientes" pueden cancelarse.
- Q: ¿Se puede cambiar el estado de un producto a "Inactivo" si todavía tiene stock físico en bodegas? → A: Sí, se permite; el stock existente se conserva y se muestra solo para consulta, igual que para una bodega inactiva.
- Q: ¿Se puede modificar el SKU de un producto que ya tiene movimientos de inventario asociados? → A: Sí, el SKU puede editarse porque los movimientos referencian `product_id`, no `sku`; debe mantenerse la validación de unicidad del nuevo valor.
- Q: ¿Qué ocurre si el "Precio de Costo" ingresado es mayor al "Precio de Venta"? → A: El sistema permite guardar el producto y muestra una advertencia no bloqueante; no se impide el registro.
- Q: ¿Qué ocurre si la bodega de origen o de destino de una transferencia "pendiente" pasa a estado inactivo antes de confirmarse? → A: El sistema impide confirmar la transferencia mientras cualquiera de las dos bodegas esté inactiva; la solicitud permanece "pendiente" hasta que ambas vuelvan a estar activas o se cancele.
- Q: ¿Se solicita el campo Estado al crear un producto o se asigna por defecto? → A: Se asigna automáticamente como "activo" al crear; el campo Estado no se solicita en el formulario de creación y solo se modifica después mediante la acción de cambio de estado (FR-045).

### Session 2026-11-17 — Solicitudes de Reposición

- Q: ¿Cómo se identifica el ERP en la interfaz? → A: El nombre configurable del módulo es "Logística e Inventario | Grupo 19", aplicado en título, marca y logotipo derivado.
- Q: ¿Quién crea solicitudes de reposición? → A: El administrador y el supervisor de inventario; el administrador también puede aprobar y cancelar.
- Q: ¿Qué puede hacer el encargado de bodega? → A: Consultar únicamente solicitudes aprobadas y registrar su recepción; no crea, aprueba ni cancela solicitudes.
- Q: ¿Desde qué estados se puede cancelar? → A: Desde "pendiente" y "aprobada"; las solicitudes "recibida" y "cancelada" son inmutables.
- Q: ¿Cómo se usa la paleta visual? → A: Azul marino, verde petróleo, gris oscuro y violeta sutil con acabados Liquid Glass discretos; se evitan neones y animaciones llamativas.
- Q: ¿Cómo se resuelve la contradicción entre la sesión 2026-10-30 (selector de usuario en el formulario) y la sesión 2026-11-03 (usuario activo del ERP)? → A: Prevalece la sesión 2026-11-03: los formularios de movimientos y transferencias usan el usuario activo seleccionado en la cabecera del ERP y no muestran un selector manual.

### Session 2026-11-22 — Gestión de Roles, Redirección Inicial y Control de Visibilidad

- Q: ¿Qué se entiende por "cargo" de un usuario y quién puede modificarlo? → A: El cargo es el `role` ya presente en el catálogo `USERS` (`administrador`, `supervisor_inventario`, `encargado_bodega`); solo el administrador puede asignarlo o cambiarlo desde el panel de administración y el cambio surte efecto de inmediato.
- Q: ¿Qué página de inicio debe abrirse para cada rol? → A: Cada rol tiene una landing page configurable: administrador → Panel general, supervisor_inventario → Alertas/Control de Stock, encargado_bodega → Movimientos/Control de Stock; el administrador puede redefinirla en el panel.
- Q: ¿Cómo se configura qué puede ver cada rol o usuario? → A: Mediante un panel de administración con una matriz de permisos por rol sobre módulos, vistas y secciones, más excepciones individuales por usuario que prevalecen sobre la configuración del rol.
- Q: ¿El bloqueo de acceso directo por URL constituye seguridad real? → A: No. Se mantiene la decisión de FR-073: no hay autenticación en esta iteración y los roles son simulados; el bloqueo y el ocultamiento son de interfaz dentro del modelo simulado y no sustituyen autenticación ni autorización reales.
- Q: ¿Qué ocurre cuando cambia el cargo del usuario activo? → A: Se recalculan de inmediato los permisos y la navegación vigentes y se abre la landing page del nuevo rol, incluso si la vista actual sigue autorizada.
- Q: ¿Cómo se resuelve un conflicto entre un permiso individual y el permiso del rol? → A: Prevalece el permiso individual; si no existe excepción para ese usuario y sección, se aplica lo configurado para su rol.
- Q: ¿Puede el administrador dejar sin acceso al panel de permisos? → A: No; el sistema conserva siempre para el administrador el acceso al panel de administración de permisos para evitar que la configuración quede irreversible.
- Q: ¿Los cambios de permisos alteran datos operativos? → A: No; solo afectan la visibilidad y la navegación, sin modificar productos, bodegas, stock, movimientos, transferencias ni reposiciones.
- Q: ¿Qué evento debe abrir automáticamente la página de inicio según el cargo, dado que en esta iteración no existe una pantalla de inicio de sesión? → A: Al cargar la aplicación con el usuario activo por defecto y también al cambiar de usuario activo en la cabecera del ERP.
- Q: ¿Qué prevalece cuando la matriz de permisos permite una acción que una regla de negocio existente prohíbe para ese cargo, por ejemplo un encargado de bodega creando o aprobando reposiciones? → A: Las reglas de negocio existentes prevalecen siempre; la matriz solo puede restringir el acceso, nunca otorgarlo.

### Session 2026-11-23 — HU-09

- Q: ¿Qué información debe contener cada orden además de su identificador y del movimiento que la origina? → A: Solo producto, bodega, cantidad, fecha y usuario del movimiento; sin importes ni estados.
- Q: ¿Cómo deben generarse los identificadores OC-0001 y OV-0001? → A: Dos secuencias independientes por tipo de orden, correlativas, persistentes entre sesiones y sin reutilizar identificadores.
- Q: ¿Deben generar órdenes las transferencias confirmadas entre bodegas, además de las entradas y salidas normales? → A: No; solo las entradas y salidas normales generan órdenes.
- Q: ¿Qué ocurre si falla la generación de la orden al guardar un movimiento? → A: Se rechaza toda la operación: no se guarda el movimiento, no se modifica el stock y se muestra un error.
- Q: ¿Dónde deben consultarse las órdenes y qué roles pueden verlas? → A: Opción A; se conserva un panel de órdenes dentro de Movimientos, visible para todo rol con acceso a Movimientos, sin nueva vista ni permisos.
- Q: ¿Qué roles pueden actualizar manualmente el estado de un envío al comprador? → A: Los tres roles definidos (`administrador`, `supervisor_inventario` y `encargado_bodega`) pueden actualizarlo; la matriz de HU-08 solo puede restringir ese acceso, nunca otorgarlo (FR-124).
- Q: ¿Una orden de venta puede tener varios envíos con seguimiento independiente? → A: No; cada orden de venta tiene como máximo un envío y cada envío pertenece a una sola orden de venta (relación uno a uno).
- Q: ¿Los estados de seguimiento pueden avanzar solo en orden o se puede retroceder a una etapa anterior? → A: Solo avance secuencial: En bodega → En tránsito → En reparto → Entregado; Entregado es final y no admite retrocesos.
- Q: ¿Dónde deben registrarse y consultarse los envíos con su historial de estados? → A: En una vista dedicada "Seguimiento de envíos", con una entrada en la matriz de permisos de HU-08.
- Q: ¿La búsqueda de transferencias debe exigir coincidencia exacta o aceptar coincidencias parciales sin distinguir mayúsculas? → A: Coincidencia parcial e insensible a mayúsculas para nombre de producto e identificador de transferencia.

### Session 2026-11-25 — Rediseño de la interfaz de secciones

- Q: ¿Qué ocurre con los requisitos y criterios heredados del módulo base que describen Entidades, Documentos y Búsqueda? → A: Se conservan como contexto de la base y como capacidades de datos, pero quedan sustituidos en la interfaz de 002 por HU-12 a HU-14; no se muestran como secciones, botones ni accesos.
- Q: ¿Deben eliminarse los buscadores y filtros internos ya definidos en Stock, Alertas, Transferencias y Seguimiento de envíos? → A: No. Se mantienen dentro de su sección; se elimina únicamente el módulo global "Búsqueda" y su acceso rápido desde el panel.
- Q: ¿El menú lateral incluye una entrada "Panel" además de las seis secciones? → A: No. El menú lateral muestra exclusivamente Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas. El panel principal se alcanza como página de inicio configurada de HU-08 y desde la identidad de marca de la aplicación, sin aparecer como una sección más ni duplicar accesos.
- Q: ¿Dónde quedan las reposiciones y el seguimiento de envíos si no son secciones del menú? → A: Las reposiciones se gestionan desde Alertas y las órdenes y el seguimiento de envíos desde Movimientos, conservando sus permisos actuales, sin crear nuevas secciones de primer nivel.
- Q: ¿Son obligatorias las pestañas en todas las secciones? → A: No. Cada sección PUEDE organizarse en pestañas; cuando las use, muestra una pestaña activa por defecto y permanece dentro de la misma sección. En Movimientos, las pestañas mínimas son Entradas, Salidas e Historial.
- Q: ¿Qué significa el indicador de "stock total" del panel principal? → A: La suma de `quantity_available` de todos los registros vigentes de `STOCK`, incluidos los de productos o bodegas inactivos que se conservan para consulta; se recalcula cada vez que se muestra el panel.
- Q: ¿Las pestañas pueden otorgar accesos que la matriz de permisos de HU-08 prohíbe? → A: No. Las pestañas respetan FR-124: una pestaña no autorizada se oculta o deshabilita sin bloquear el resto de la sección permitida.
- Q: ¿Las landing pages de supervisor y encargado que abren Alertas o Movimientos contradicen el acceso único desde el menú? → A: No. Son páginas de inicio configuradas de HU-08, no controles de navegación duplicados; el menú lateral sigue siendo el único punto de acceso visible para esas secciones.
- Q: ¿"Panel general" y "panel principal" son la misma vista? → A: Sí. "Panel general" es el nombre usado en HU-08 para la vista de indicadores del panel principal; el contenido de ambos es exclusivamente el definido en HU-14.

### Session 2026-11-26 — HU-15

- Q: ¿Qué identidades deben usar los cuatro usuarios del catálogo semilla y en qué orden? → A: `user_id` 1: Millaray Antileo, `administrador`, `millaray.antileo@empresa.cl`; `user_id` 2: Tomás Wiegand, `encargado_bodega`, `tomas.wiegand@empresa.cl`; `user_id` 3: Yasmina Haddad, `supervisor_inventario`, `yasmina.haddad@empresa.cl`; `user_id` 4: Sebastián Quispe, `encargado_bodega`, `sebastian.quispe@empresa.cl`. El orden, los identificadores y los roles son los mismos de la semilla anterior; solo cambian nombre y correo.
- Q: ¿Qué restricción deben cumplir los nombres y correos ficticios? → A: Ningún nombre debe corresponder a una persona real o pública, no se repiten entre sí y los correos usan el patrón `nombre.apellido@empresa.cl` sin tildes en la parte local.
- Q: ¿Qué ocurre con los registros ya guardados en el navegador? → A: El catálogo sigue sembrándose solo cuando está vacío, pero al cargar se migran automáticamente únicamente los usuarios que coinciden exactamente con la semilla anterior en `user_id`, nombre y correo (`Ana Torres`, `Carlos Pérez`, `María López` y `Jorge Soto`). Un usuario modificado o distinto se conserva sin cambios; la operación es idempotente y no elimina ni altera otros registros.
- Q: ¿La migración cambia el usuario activo, la bodega asignada o los vínculos operativos? → A: No. Se conserva el usuario activo guardado, la bodega asignada y las referencias desde movimientos, transferencias, reposiciones y envíos; tampoco cambian `STOCK`, los permisos ni la matriz de HU-08.
- Q: ¿Cómo se asignan las bodegas en los datos de demostración después del cambio de nombres? → A: Por el rol y la posición del usuario en el catálogo, nunca por comparar su nombre; por eso el renombrado no reasigna responsabilidades de bodega.
- Q: ¿Se crea una nueva historia, carpeta o rama para este cambio? → A: No. Se documenta como HU-15 dentro del mismo artefacto `specs/002-logistica-inventario/spec.md`, sin crear una carpeta ni una rama nueva.

### Session 2026-11-27

- Q: ¿HU-15 debe considerarse parte del MVP vigente y documentarse como implementada, o debe permanecer fuera del MVP como trabajo pendiente? → A: Implementada: HU-15 pasa a formar parte del MVP y spec/plan/tasks se alinean.
- Q: ¿Cómo debe exponerse el seguimiento de envíos en la interfaz vigente? → A: Pestaña en Movimientos: `shipments` sigue siendo recurso de permiso y ruta lógica, pero sin `nav-shipments`; `#/shipments` redirige a la pestaña.
- Q: ¿Qué debe ocurrir inmediatamente cuando cambia el cargo del usuario activo y la vista actual sigue permitida? → A: Abrir de inmediato la landing page del nuevo rol.
- Q: ¿Qué conjunto de datos de demostración debe considerarse canónico para reconstruir el MVP desde los specs? → A: Dataset `logistics-demo-v1`: 5 categorías, 4 bodegas, 10 productos, movimientos, transferencias y mínimos documentados.
- Q: Al confirmar una transferencia pendiente, si el stock disponible en origen ya no cubre la cantidad, ¿qué debe hacer el sistema? → A: Rechazar la confirmación sin cambios en stock ni estado; la transferencia sigue pendiente con error claro.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Registro y Modificación de Productos (Prioridad: P1)

Como administrador del sistema, quiero registrar nuevos productos y modificar los existentes, para mantener la información del inventario actualizada, precisa y disponible para las operaciones de venta y logística.

**Por qué es prioridad**: El catálogo de productos es la entidad fundacional de todo el sistema. Sin productos registrados y correctamente tipificados, es imposible ejecutar módulos dependientes como las entradas/salidas de bodega (HU-03), el control de existencias, reportes o ventas. Esta historia desbloquea el flujo operativo principal.

**Prueba Independiente**: Se puede probar creando un producto de prueba en un entorno aislado, proporcionando todos los campos requeridos (Nombre, SKU, Precio, Categoría), validando su correcto registro en el catálogo, luego modificando su precio y confirmando que la fecha de actualización cambia sin afectar el histórico de otros registros.

**Nota de vigencia (2026-11-25)**: El formulario de producto NO muestra un selector manual de "Usuario que registra". Los campos `created_by`, `updated_by` y el actor de los cambios de estado se toman del usuario activo seleccionado en la cabecera del ERP; si no existe un usuario activo válido, la operación se rechaza con un error claro y no persiste cambios. Esta nota resuelve la contradicción observada en T017 sin eliminar la validación de usuario definida en el modelo de datos.

**Escenarios de Aceptación**:

1. **Dado que** el administrador se encuentra en la pantalla de "Nuevo Producto", **Cuando** ingresa todos los campos obligatorios válidos (Nombre, SKU único, Precio de Venta, Categoría) y guarda, **Entonces** el sistema almacena el producto, muestra un mensaje de éxito ("Producto registrado correctamente") y lo lista en el inventario con estado activo.
2. **Dado que** el administrador intenta registrar un producto nuevo o editar uno existente, **Cuando** ingresa un SKU que ya está en uso por otro producto, **Entonces** el sistema impide la acción, conserva los datos en el formulario y muestra un mensaje de error: "El SKU ingresado ya existe".
3. **Dado que** el administrador está editando un producto existente, **Cuando** modifica atributos permitidos (como Precio de Venta o Descripción) y guarda, **Entonces** los cambios se reflejan inmediatamente en el listado y el sistema actualiza de manera automática la "Fecha de última modificación".
4. **Dado que** el administrador está en el formulario de creación/edición, **Cuando** intenta guardar dejando campos obligatorios en blanco, **Entonces** el sistema bloquea el envío y resalta visualmente los campos faltantes requiriendo su llenado.

---

### Historia de Usuario 2 - Control de Stock (Prioridad: P2)

Como supervisor de inventario, quiero consultar las existencias de cada producto, para conocer las cantidades disponibles en las bodegas.

**Por qué es prioridad**: Es una funcionalidad de solo lectura que da visibilidad sobre las existencias registradas en la tabla `STOCK` (`quantity_available`). Depende de HU-01 (productos), HU-04 (bodegas), HU-03 (entradas y salidas) y HU-05 (transferencias confirmadas); las existencias se derivan de los movimientos de HU-03 y de las transferencias confirmadas de HU-05, que también actualizan `STOCK` y pueden crear el registro en la bodega destino. Habilita la consulta operativa del inventario sin alterar los datos. Las alertas de stock mínimo se abordan en la HU-06.

**Prueba Independiente**: Se puede probar con un conjunto de datos de prueba (productos, bodegas y movimientos), consultando las existencias de un producto y verificando que la cantidad por bodega coincide con `quantity_available` de `STOCK`, que el total corresponde a la suma entre bodegas y que los filtros por producto y bodega devuelven los registros esperados, sin modificar ningún dato.

**Escenarios de Aceptación**:

1. **Dado que** el supervisor de inventario se encuentra en la pantalla de "Control de Stock" y existen registros en `STOCK`, **Cuando** consulta un producto, **Entonces** el sistema muestra la cantidad disponible de ese producto en cada bodega.
2. **Dado que** un producto tiene existencias en más de una bodega, **Cuando** el supervisor consulta su detalle, **Entonces** el sistema muestra el total de existencias sumando `quantity_available` de todas las bodegas.
3. **Dado que** el supervisor se encuentra en la pantalla de "Control de Stock", **Cuando** aplica un filtro o búsqueda por producto o por bodega, **Entonces** el sistema muestra únicamente los registros de stock que coinciden con el criterio.
4. **Dado que** se aplica un filtro o búsqueda, **Cuando** no existe ningún registro que coincida, **Entonces** el sistema muestra un estado vacío indicando que no se encontraron resultados.

---

### Historia de Usuario 3 - Registrar entradas y salidas de inventario (Prioridad: P1)

Como encargado de bodega, quiero registrar las entradas y salidas de productos, indicando el producto, la bodega y la cantidad correspondiente, para mantener actualizado el stock disponible y conservar un historial de los movimientos realizados.

**Por qué es prioridad**: Los movimientos de inventario son la operación central del módulo: son los que modifican `STOCK.quantity_available` y generan el historial en `INVENTORY_TRANSACTIONS`. Sin esta historia, los productos y bodegas quedarían registrados pero no reflejarían existencias reales, y no podrían funcionar las alertas de stock mínimo ni las transferencias entre bodegas. Por ello es la base operativa del MVP.

**Prueba Independiente**: Con productos, bodegas y usuarios de ejemplo cargados, registrar una entrada crea o incrementa el stock de la combinación producto+bodega; registrar una salida con existencias lo disminuye; una salida sin stock suficiente se rechaza sin alterar el inventario; y el historial muestra el movimiento con su usuario y fecha automática, sin acciones de edición ni eliminación.

**Escenarios de Aceptación**:

1. **Dado que** el encargado de bodega está en el formulario de movimiento, **cuando** registra una entrada seleccionando un producto, una bodega y una cantidad mayor que cero, usando automáticamente el usuario activo del ERP, **entonces** el sistema crea o incrementa `quantity_available` en `STOCK` para esa combinación producto+bodega, guarda el movimiento en `INVENTORY_TRANSACTIONS` con `transaction_type` "entrada", `user_id` y `transaction_date` automática, y muestra un mensaje de éxito.
2. **Dado que** existe stock disponible para un producto en una bodega, **cuando** el encargado registra una salida con una cantidad menor o igual al stock disponible, **entonces** el sistema descuenta inmediatamente esa cantidad de `quantity_available` y guarda el movimiento con `transaction_type` "salida" en el historial.
3. **Dado que** no existe stock para la combinación producto+bodega o que la cantidad solicitada supera `quantity_available`, **cuando** el encargado intenta registrar una salida, **entonces** el sistema rechaza la operación con un mensaje claro, no crea el movimiento y no modifica el stock.
4. **Dado que** un movimiento ya fue registrado, **cuando** el encargado intenta editarlo o eliminarlo, **entonces** el sistema no ofrece esas acciones y solo permite corregir la situación mediante un nuevo movimiento de ajuste (`ajuste_entrada` o `ajuste_salida`) que queda registrado en el historial.

---

### Historia de Usuario 4 - Registro y Administración de Bodegas (Prioridad: P1)

Como administrador, quiero registrar y administrar bodegas, para organizar los lugares donde se almacenan los productos.

**Por qué es prioridad**: Es la funcionalidad central requerida para habilitar la estructura física del sistema de inventario. Sin bodegas registradas, no es posible asociar existencias, registrar entradas/salidas ni realizar transferencias entre ubicaciones.

**Prueba Independiente**: Se puede probar registrando una nueva bodega con su información básica, modificando sus datos y cambiando su estado (activo/inactivo), verificando que cada cambio se refleje correctamente en el sistema.

**Escenarios de Aceptación**:

1. **Dado que** el administrador se encuentra en el módulo de configuración de bodegas, **Cuando** ingresa los datos de una nueva bodega (nombre y ubicación obligatorios, descripción opcional) y guarda los cambios, **Entonces** el sistema registra la bodega exitosamente y la muestra en el listado general con estado activo.
2. **Dado que** una bodega ya se encuentra registrada en el sistema, **Cuando** el administrador edita sus detalles (por ejemplo, cambia el nombre o la ubicación) y confirma la actualización, **Entonces** el sistema guarda los nuevos datos de manera correcta.
3. **Dado que** una bodega existe en el sistema, **Cuando** el administrador cambia su estado a inactivo, **Entonces** el sistema actualiza su disponibilidad y restringe la selección de esta bodega para nuevos movimientos operativos.

---

### Historia de Usuario 5 - Transferencias de Productos entre Bodegas (Prioridad: P2)

Como encargado de bodega, quiero registrar transferencias de productos entre distintas bodegas, para controlar los traslados de mercadería, evitar pérdidas de stock y mantener la trazabilidad de los envíos.

**Por qué es prioridad**: Las transferencias permiten balancear existencias entre distintas ubicaciones físicas sin alterar el balance global de inventario. Esta historia es clave para la operación multi-bodega y conecta directamente las entidades `WAREHOUSES`, `PRODUCTS` y la tabla transaccional `STOCK_TRANSFERS`.

**Prueba Independiente**: Se puede probar generando una solicitud de traslado de 10 unidades del Producto A desde Bodega Origen hacia Bodega Destino. Se verifica que la orden quede en estado `"pendiente"` con el usuario creador registrado, que no permita seleccionar la misma bodega como origen y destino, y que al confirmarse registre el usuario que recibe y actualice de forma simultánea el stock acumulado en la tabla `STOCK` de ambas ubicaciones.

**Escenarios de Aceptación**:

1. **Dado que** el encargado de bodega se encuentra en el formulario de "Nueva Transferencia", **Cuando** selecciona un producto válido, una bodega de origen con stock suficiente, una bodega de destino diferente y una cantidad mayor a cero, usando automáticamente el usuario activo del ERP, **Entonces** el sistema genera el registro con estado `"pendiente"`, asigna la fecha del día (`transfer_date`) y guarda `created_by`.
2. **Dado que** existe una transferencia registrada en estado `"pendiente"`, **Cuando** el usuario confirma la recepción en la bodega de destino con el usuario activo del ERP, **Entonces** el sistema cambia el estado a `"confirmada"`, registra `confirmed_by`, descuenta las unidades de la bodega origen e incrementa el stock en la bodega destino.
3. **Dado que** un usuario intenta registrar una transferencia, **Cuando** selecciona la misma bodega como origen y destino, **Entonces** el sistema bloquea el envío y muestra el mensaje de error: "La bodega de destino debe ser diferente a la bodega de origen".
4. **Dado que** la cantidad a transferir supera el stock disponible en la bodega de origen (`quantity_available`), **Cuando** el usuario intenta guardar la solicitud, **Entonces** el sistema rechaza la transacción informando falta de existencias.
5. **Dado que** existe una transferencia en estado `"pendiente"`, **Cuando** un usuario del catálogo `USERS` la cancela, **Entonces** el sistema cambia el estado a `"cancelada"`, registra `cancelled_by` y no modifica `STOCK` en ninguna de las dos bodegas; si la transferencia ya está `"confirmada"` o `"cancelada"`, el sistema bloquea la acción.
6. **Dado que** existe una transferencia `"pendiente"` cuyo stock en origen bajó después de solicitarla, **Cuando** se intenta confirmar y el disponible vigente es menor que la cantidad, **Entonces** el sistema rechaza la confirmación con error de existencias insuficientes, mantiene el estado `"pendiente"` y deja `STOCK` y `confirmed_by` sin cambios.

---

### Historia de Usuario 6 - Alertas de Stock Mínimo (Prioridad: P2)

Como supervisor de inventario, quiero recibir alertas cuando las existencias de un producto en una bodega caigan en o por debajo del nivel mínimo configurado, para reabastecer a tiempo y evitar quiebres de stock.

**Por qué es prioridad**: Las alertas convierten el control de existencias de HU-02 en una herramienta de reposición proactiva. Dependen de HU-01 (productos), HU-03 (movimientos), HU-04 (bodegas) y HU-05 (transferencias confirmadas), y se derivan de comparar `STOCK.quantity_available` con `STOCK.min_stock_level`; no crean ni modifican registros y no bloquean operaciones. Sin esta historia, el nivel mínimo queda como un dato sin efecto operativo.

**Prueba Independiente**: Se puede probar configurando un `min_stock_level` para una combinación producto+bodega, registrando movimientos hasta que `quantity_available` sea menor o igual al mínimo, verificando que la alerta aparece en la pantalla dedicada y en el indicador de Control de Stock, y confirmando que desaparece automáticamente al reponer el stock por encima del mínimo.

**Escenarios de Aceptación**:

1. **Dado que** el administrador se encuentra en la configuración de existencias de un producto en una bodega, **Cuando** establece o modifica `min_stock_level` con un valor mayor o igual a cero y guarda, **Entonces** el sistema persiste el mínimo en `STOCK` y lo usa para evaluar las alertas.
2. **Dado que** existe un registro de `STOCK` con `min_stock_level` mayor que cero, **Cuando** `quantity_available` es menor o igual a `min_stock_level`, **Entonces** el sistema muestra una alerta en la pantalla dedicada indicando producto, bodega, cantidad actual, mínimo configurado y déficit.
3. **Dado que** existe una alerta activa, **Cuando** el supervisor consulta la pantalla de Control de Stock (HU-02), **Entonces** el sistema resalta o indica visualmente el registro en alerta junto con sus existencias.
4. **Dado que** una combinación producto+bodega está en alerta, **Cuando** se registra una entrada, un ajuste de entrada o una transferencia confirmada que deja `quantity_available` por encima de `min_stock_level`, **Entonces** la alerta desaparece automáticamente sin requerir una acción manual.
5. **Dado que** el supervisor se encuentra en la pantalla de alertas, **Cuando** aplica un filtro por producto o por bodega, **Entonces** el sistema muestra solo las alertas que coinciden; si no hay coincidencias, muestra un estado vacío indicando que no se encontraron alertas.

---

### Historia de Usuario 7 - Solicitudes de Reposición (Prioridad: P2)

Como supervisor de inventario, quiero solicitar, autorizar y recibir reposiciones de productos con trazabilidad, para reponer stock sin duplicar movimientos ni perder el historial de quién gestionó cada solicitud.

**Por qué es prioridad**: Convierte las alertas de HU-06 en un flujo operativo: la alerta sugiere el déficit, el supervisor o administrador crea la solicitud, el administrador la autoriza y el encargado de bodega registra la recepción. Depende de HU-01 (productos), HU-03 (movimientos inmutables), HU-04 (bodegas activas) y HU-06 (alertas derivadas).

**Prueba Independiente**: Configurar una alerta, presionar "Solicitar" desde la pantalla de alertas, verificar que se preseleccionan producto, bodega y déficit; crear la solicitud, comprobar que el stock no cambia; aprobarla como administrador; recibirla como encargado y verificar que se crea exactamente una entrada de HU-03, que el stock aumenta una sola vez y que la alerta se recalcula.

**Escenarios de Aceptación**:

1. **Dado que** un supervisor o administrador está en la pantalla de reposiciones, **Cuando** crea una solicitud indicando producto, bodega activa y cantidad entera mayor que cero, **Entonces** se registra en estado "pendiente" con `created_by`, `request_date` y `source` automáticos, sin modificar `STOCK` ni crear movimientos.
2. **Dado que** existe una alerta activa de HU-06, **Cuando** el usuario presiona "Solicitar" en esa alerta, **Entonces** el formulario de reposición se abre con producto, bodega y déficit preseleccionados y `source = "alert"`.
3. **Dado que** existe una solicitud "pendiente", **Cuando** el administrador la aprueba, **Entonces** cambia a "aprobada" y registra `approved_by` y `approved_at`; el stock permanece sin cambios.
4. **Dado que** existe una solicitud "aprobada", **Cuando** el encargado de bodega registra la recepción, **Entonces** el sistema crea un movimiento de entrada inmutable de HU-03, guarda su `movement_id` en la solicitud, marca la solicitud como "recibida" con `received_by`/`received_at` y aumenta `STOCK.quantity_available` una sola vez.
5. **Dado que** una solicitud está "pendiente" o "aprobada", **Cuando** el administrador la cancela, **Entonces** cambia a "cancelada" y registra `cancelled_by`/`cancelled_at` sin modificar `STOCK`; una solicitud "recibida" o "cancelada" no puede cancelarse ni aprobarse.
6. **Dado que** el perfil activo es encargado de bodega, **Cuando** consulta reposiciones, **Entonces** solo ve solicitudes "aprobadas", no ve el formulario de creación y no puede aprobar ni cancelar.
7. **Dado que** hay solicitudes en varios estados, **Cuando** se aplican filtros por estado, producto o bodega, **Entonces** el listado y el contador de filas reflejan los resultados mientras las tarjetas de indicadores muestran los totales globales por estado.

---

### Historia de Usuario 8 - Gestión de Roles, Redirección Inicial y Control de Visibilidad (Prioridad: P1)

Como administrador del sistema, quiero asignar y cambiar el cargo de los usuarios, definir una página de inicio por rol y decidir qué módulos, vistas y secciones puede ver cada rol o usuario, para que cada persona acceda de entrada a lo que necesita y no pueda ver ni abrir funciones que no le corresponden.

**Por qué es prioridad**: Es una capacidad transversal que gobierna el acceso a todos los módulos construidos en HU-01 a HU-07. Sin ella, cualquier usuario vería la misma navegación y podría abrir directamente vistas de otros roles, lo que invalida la separación de responsabilidades ya descrita para reposiciones (HU-07) y la distinción entre administrador, supervisor y encargado. Además, define la primera pantalla que ve cada usuario, que es la puerta de entrada a todo el sistema.

**Prueba Independiente**: Se puede probar con usuarios de ejemplo de los tres cargos: cambiar el cargo a uno de ellos, verificar que al cargar la aplicación y al cambiar el usuario activo en la cabecera se abre la landing page del cargo correspondiente, comprobar que la barra lateral y los botones muestran solo las secciones permitidas, intentar abrir por URL una vista no autorizada y confirmar que se bloquea con un mensaje claro, y validar que una excepción individual prevalece sobre el permiso del cargo sin alterar ningún dato de inventario.

**Escenarios de Aceptación**:

1. **Dado que** el administrador está en el panel de administración de usuarios, **cuando** asigna o cambia el cargo de un usuario a uno de los roles definidos y guarda, **entonces** el sistema persiste el nuevo cargo y lo aplica de inmediato a la sesión de ese usuario.
2. **Dado que** un usuario tiene asignado un cargo con una landing page configurada, **cuando** se carga la aplicación con ese usuario activo o se le selecciona en la cabecera del ERP, **entonces** el sistema abre automáticamente esa página de inicio sin mostrar primero una pantalla genérica.
3. **Dado que** el administrador redefinió la landing page de un cargo, **cuando** se carga la aplicación o cambia el usuario activo con ese cargo, **entonces** el sistema abre la nueva página configurada.
4. **Dado que** el administrador está en la matriz de permisos, **cuando** marca o desmarca el acceso de un rol a un módulo, vista o sección y guarda, **entonces** la configuración queda registrada y se aplica a todos los usuarios con ese rol que no tengan una excepción individual.
5. **Dado que** un usuario tiene una excepción individual configurada para una sección, **cuando** su rol permite o niega esa misma sección, **entonces** el sistema aplica la excepción individual y la navegación y las acciones reflejan ese valor.
6. **Dado que** el usuario activo carece de permiso para ciertos módulos o secciones, **cuando** consulta la barra lateral, los menús y los botones de una vista permitida, **entonces** el sistema oculta o deshabilita únicamente los elementos no autorizados y conserva visibles los permitidos.
7. **Dado que** un usuario intenta abrir directamente por URL una vista para la que no tiene permiso, **cuando** carga esa ruta, **entonces** el sistema bloquea el acceso, muestra un mensaje claro de falta de permiso y lo devuelve a su página de inicio o a una vista permitida.
8. **Dado que** cambia el cargo del usuario activo, **cuando** se confirma el cambio, **entonces** el sistema recalcula permisos y navegación y abre de inmediato la landing page del nuevo rol, aunque la vista actual siga autorizada.
9. **Dado que** el administrador intenta desactivar su propio acceso al panel de permisos, **cuando** guarda la matriz, **entonces** el sistema conserva ese acceso y muestra una advertencia, de modo que la configuración no quede irreversible.
10. **Dado que** se modifican roles, landing pages o permisos, **cuando** se consultan productos, bodegas, stock, movimientos, transferencias o reposiciones, **entonces** esos datos permanecen intactos y el usuario activo que registra operaciones no cambia.
11. **Dado que** el administrador configura la matriz para otorgar al encargado de bodega acceso a crear o aprobar reposiciones, **cuando** el encargado consulta esa sección, **entonces** el sistema mantiene las restricciones de FR-099 y no le muestra el formulario de creación ni las acciones de aprobación o cancelación.

### Historia de Usuario 9 - Gestión de órdenes de adquisición y venta (Prioridad: P2)

Como encargado de bodega o supervisor de inventario, quiero que cada entrada y salida normal genere automáticamente una orden de adquisición o venta con identificador único, para mantener la trazabilidad de los movimientos.

**Por qué es prioridad**: Cada entrada o salida normal ya altera `STOCK` y queda registrada como movimiento inmutable; la orden que asocia ese movimiento con un identificador de adquisición o venta hace verificable la trazabilidad sin introducir un flujo de aprobación ni importes que hoy no están en alcance.

**Prueba independiente**: Registrar una entrada y una salida, comprobar que se generen OC-0001 y OV-0001 y que aparezcan vinculadas a sus movimientos.

**Escenarios de aceptación**:
1. Una entrada normal genera una orden OC.
2. Una salida normal genera una orden OV.
3. Cada orden tiene un identificador único y correlativo con formato `OC-0001`/`OV-0001`: OC y OV usan secuencias independientes, persisten entre sesiones y no reutilizan identificadores mientras se conserve el historial persistido en `logistics:orders`.
4. Las órdenes aparecen en un panel dentro de la vista Movimientos, visible para todo rol con acceso a Movimientos, sin nueva vista ni permisos.
5. Los ajustes, las reposiciones y las transferencias confirmadas no generan órdenes.
6. El stock se actualiza una sola vez y, si falla la generación de la orden, se rechaza el movimiento completo sin modificar el stock, sin dejar registros parciales y mostrando el error de almacenamiento en el formulario de movimientos.
7. Cada orden queda vinculada a su movimiento y registra producto, bodega, cantidad, fecha y usuario del movimiento, sin importes ni estados.

**Definición operativa HU-09**: una entrada o salida normal es un movimiento registrado directamente desde Movimientos; quedan excluidos los ajustes, la recepción de reposiciones y las transferencias confirmadas, que conservan su trazabilidad en sus propias entidades.

### Historia de Usuario 10 - Buscador y filtros para transferencias entre bodegas (Prioridad: P2)

Como encargado de bodega o supervisor de inventario, quiero buscar y filtrar las transferencias registradas por producto, bodegas y estado, para encontrar rápidamente la información que necesito sin revisar manualmente todo el historial.

**Por qué es prioridad**: El sistema ya permite registrar y gestionar transferencias entre bodegas. Sin embargo, cuando aumenta la cantidad de registros, resulta difícil localizar una transferencia específica. Incorporar búsquedas y filtros mejora la consulta sin alterar las operaciones existentes.

**Prueba independiente**: Registrar varias transferencias con diferentes productos, bodegas y estados. Aplicar búsquedas y filtros individualmente y combinados, comprobando que se muestran únicamente los registros correspondientes.

**Escenarios de aceptación**:

1. El usuario puede buscar transferencias por nombre del producto o identificador de transferencia, aceptando coincidencias parciales e insensibles a mayúsculas.
2. El usuario puede filtrar las transferencias por bodega de origen y bodega de destino.
3. El usuario puede filtrar las transferencias según su estado: pendiente, confirmada o cancelada.
4. El sistema permite combinar el buscador con varios filtros simultáneamente.
5. El usuario puede limpiar los filtros para volver a visualizar todas las transferencias.
6. Cuando no existen coincidencias, el sistema muestra un mensaje indicando que no se encontraron resultados.
7. Las búsquedas y los filtros no modifican los registros de transferencias ni las existencias del inventario.

---

### Historia de Usuario 11 - Seguimiento de envíos al comprador (Prioridad: P2)

Como encargado de bodega o supervisor de inventario, quiero registrar y consultar el seguimiento de los productos enviados al comprador, para conocer la etapa en que se encuentra cada entrega y mantener su trazabilidad.

**Por qué es prioridad**: Actualmente, el sistema genera órdenes de venta cuando los productos salen de la bodega, pero estas órdenes no permiten conocer el avance del envío hasta el comprador. Incorporar un seguimiento vinculado a las órdenes de venta permite consultar el estado de las entregas y conservar un historial de sus cambios.

**Prueba independiente**: Registrar una salida de inventario que genere una orden de venta, asociarle un envío con empresa transportista y código de seguimiento, actualizar sus estados y comprobar que el historial conserva cada modificación.

**Escenarios de aceptación**:

1. El usuario puede asociar un envío a una orden de venta (OV) existente, sin generar un movimiento adicional de inventario.
2. Cada envío permite registrar una empresa transportista, como Blue Express, y su código de seguimiento.
3. El sistema muestra el estado actual del envío mediante las etapas secuenciales: En bodega, En tránsito, En reparto y Entregado; la última es final.
4. Cualquiera de los tres roles definidos (`administrador`, `supervisor_inventario` o `encargado_bodega`) puede actualizar manualmente el estado del envío solo a la etapa secuencial siguiente, sin retrocesos ni cambios desde Entregado, sujeto a las restricciones de la matriz de permisos de HU-08 (FR-124).
5. Cada cambio de estado queda registrado en un historial que incluye fecha, hora y usuario responsable.
6. El usuario puede buscar envíos por identificador de orden de venta, código de seguimiento o estado.
7. El sistema conserva la relación uno a uno entre el envío y la orden de venta correspondiente: cada OV tiene como máximo un envío y cada envío pertenece a una sola OV.
8. Las órdenes de adquisición (OC) no generan seguimiento de envíos al comprador.
9. La actualización de estados no modifica nuevamente el stock ni los movimientos de inventario.
10. En esta versión no se implementan conexiones automáticas con servicios de empresas transportistas; el seguimiento se actualiza manualmente dentro del ERP.
11. El registro, la consulta y la actualización de estados se realizan desde la pestaña "Seguimiento de envíos" dentro de Movimientos, cuya visibilidad se controla mediante `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status` en la matriz de permisos de HU-08; `#/shipments` redirige a la pestaña permitida y sin permiso se aplican FR-113 a FR-115.

---

### Historia de Usuario 12 - Navegación reducida a las secciones de logística (Prioridad: P1)

Como usuario del ERP, quiero que la navegación muestre únicamente las secciones de logística e inventario, para encontrar las operaciones del módulo sin tener que distinguir entre secciones genéricas de la plantilla base.

**Por qué es prioridad**: Define el conjunto completo de destinos de la interfaz y elimina la ambigüedad entre "Entidades/Documentos/Búsqueda" y los conceptos operativos reales del módulo. Sin este cambio, el usuario seguiría viendo accesos que no corresponden al dominio y que compiten con Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas.

**Prueba Independiente**: Se puede probar abriendo la aplicación con cada uno de los tres roles, revisando el menú lateral y comprobando que solo aparecen las seis secciones esperadas; después se intenta abrir una ruta antigua de Entidades, Documentos o Búsqueda y se verifica que no se muestra la sección y que el usuario vuelve a una vista permitida.

**Escenarios de Aceptación**:

1. **Dado que** un usuario con permisos abre la aplicación, **cuando** consulta el menú lateral, **entonces** el sistema muestra exclusivamente Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas, sin entradas para Entidades, Documentos ni Búsqueda.
2. **Dado que** un usuario guardó o teclea una ruta antigua de Entidades, Documentos o Búsqueda, **cuando** intenta abrirla directamente, **entonces** el sistema no muestra esa sección, aplica FR-115 y devuelve al usuario a su página de inicio o a una vista permitida con un mensaje claro.
3. **Dado que** un usuario necesita localizar una transferencia, **cuando** usa el buscador o los filtros dentro de Transferencias, **entonces** los resultados se muestran en esa sección y no aparece ningún módulo global "Búsqueda" ni un acceso rápido al mismo.
4. **Dado que** un usuario consulta reposiciones o seguimiento de envíos, **cuando** navega por la aplicación, **entonces** las reposiciones se gestionan desde Alertas y las órdenes y envíos desde Movimientos, sin que aparezcan como secciones adicionales del menú lateral.

---

### Historia de Usuario 13 - Organización opcional de secciones en pestañas (Prioridad: P2)

Como usuario de una sección del módulo, quiero que la sección pueda organizarse en pestañas, para alternar entre vistas relacionadas sin salir del contexto en el que estoy trabajando.

**Por qué es prioridad**: Reduce los cambios de contexto dentro de flujos que ya existen, como registrar entradas, registrar salidas y consultar el historial de movimientos, sin ampliar la navegación ni añadir nuevas secciones al menú.

**Prueba Independiente**: Se puede probar entrando en una sección con pestañas definidas, verificando que una está activa por defecto, cambiando entre ellas y comprobando que el contenido cambia dentro de la misma sección, que los datos no se modifican y que las pestañas no autorizadas permanecen ocultas o deshabilitadas.

**Escenarios de Aceptación**:

1. **Dado que** una sección tiene pestañas definidas, **cuando** el usuario entra en ella, **entonces** el sistema muestra una pestaña activa por defecto y las demás pestañas disponibles dentro de esa misma sección.
2. **Dado que** el usuario está en una sección con pestañas, **cuando** selecciona otra pestaña, **entonces** el sistema cambia el contenido mostrado sin abandonar la sección, sin duplicar accesos en el menú lateral y sin crear, editar ni eliminar datos.
3. **Dado que** el usuario abre Movimientos, **cuando** consulta sus pestañas, **entonces** encuentra al menos Entradas, Salidas e Historial, y el panel de órdenes de HU-09 y el seguimiento de envíos de HU-11 siguen accesibles desde esa sección sin convertirse en secciones nuevas.
4. **Dado que** una pestaña no está permitida para el usuario activo, **cuando** consulta la sección, **entonces** esa pestaña se oculta o deshabilita conforme a FR-113, FR-114 y FR-124, mientras el resto de la sección permitida sigue operativo.
5. **Dado que** un usuario accede directamente por URL a una sección permitida, **cuando** la sección carga, **entonces** el sistema abre su pestaña por defecto; si la sección no está permitida, se aplica FR-115.

---

### Historia de Usuario 14 - Acceso único desde el menú lateral y panel de indicadores (Prioridad: P1)

Como usuario del ERP, quiero que cada sección se abra solo desde el menú lateral y que el panel principal se limite a mostrar indicadores, para tener una puerta de entrada predecible y una visión rápida del estado del inventario sin accesos duplicados.

**Por qué es prioridad**: Evita que el panel principal compita con la navegación y garantiza que cualquier sección tenga un único punto de acceso. Además, convierte el panel en una vista de lectura útil con productos, bodegas, stock total y alertas, en lugar de una lista de botones heredada de la plantilla base.

**Prueba Independiente**: Se puede probar abriendo el panel principal y comprobando que solo muestra los cuatro indicadores y ningún botón o enlace hacia las seis secciones; después se verifica que cada sección se abre únicamente desde el menú lateral y que los indicadores coinciden con los datos vigentes tras registrar productos, bodegas, movimientos o alertas.

**Escenarios de Aceptación**:

1. **Dado que** el usuario ve el panel principal, **cuando** revisa su contenido, **entonces** el sistema muestra únicamente indicadores de número de productos, número de bodegas, stock total y alertas activas, sin formularios ni listados operativos.
2. **Dado que** el usuario ve el panel principal, **cuando** busca acciones rápidas o enlaces a Productos, Bodegas, Stock, Movimientos, Transferencias o Alertas, **entonces** no encuentra ninguno, porque esas secciones no se repiten fuera del menú lateral.
3. **Dado que** un usuario necesita abrir cualquiera de las seis secciones, **cuando** navega por la aplicación, **entonces** el menú lateral es el único punto de acceso disponible para esa sección, inclusive cuando la barra lateral está contraída conforme a FR-039.
4. **Dado que** cambia el número de productos, bodegas, registros de stock o alertas activas, **cuando** se vuelve a mostrar el panel principal, **entonces** los cuatro indicadores coinciden con los datos vigentes y el stock total es la suma de `quantity_available` de todos los registros de `STOCK`.
5. **Dado que** la página de inicio configurada para el cargo es el panel principal, **cuando** se carga la aplicación o cambia el usuario activo, **entonces** se abre ese panel de indicadores sin mostrar primero una pantalla genérica con accesos al menú.

---

### Historia de Usuario 15 - Datos de ejemplo con nombres ficticios variados (Prioridad: P3)

Como usuario del ERP, quiero que los datos de ejemplo usen nombres ficticios variados y no personales, para que las demostraciones sean representativas sin asociar el sistema con personas reales y sin perder el historial operativo ya registrado.

**Por qué es prioridad**: No bloquea las operaciones de HU-01 a HU-14, pero evita que las demostraciones y las pruebas muestren identidades personales y garantiza que un cambio de datos de ejemplo no rompa la continuidad de los usuarios que ya guardaron información en el navegador.

**Prueba Independiente**: Abrir la aplicación con almacenamiento vacío y comprobar los cuatro usuarios con sus nuevos nombres, correos, identificadores y roles; después preparar un navegador con la semilla anterior, cargar la aplicación y verificar que esos cuatro registros se actualizan una sola vez, que un usuario editado no se toca, que el usuario activo sigue seleccionado y que movimientos, transferencias, reposiciones, envíos, stock y permisos conservan sus valores.

**Escenarios de Aceptación**:

1. **Dado que** un navegador no tiene usuarios guardados, **cuando** carga la aplicación, **entonces** el catálogo semilla contiene, en este orden, `user_id` 1: Millaray Antileo (`administrador`, `millaray.antileo@empresa.cl`); `user_id` 2: Tomás Wiegand (`encargado_bodega`, `tomas.wiegand@empresa.cl`); `user_id` 3: Yasmina Haddad (`supervisor_inventario`, `yasmina.haddad@empresa.cl`); `user_id` 4: Sebastián Quispe (`encargado_bodega`, `sebastian.quispe@empresa.cl`).
2. **Dado que** se revisan los cuatro nombres semilla, **cuando** se comparan entre sí y con personas reales o públicas, **entonces** son distintos entre sí y no corresponden a personas reales ni públicas.
3. **Dado que** se revisan los cuatro correos semilla, **cuando** se valida su formato, **entonces** todos siguen `nombre.apellido@empresa.cl` y ninguno contiene tildes en la parte local.
4. **Dado que** un navegador ya guardó la semilla anterior, **cuando** carga la aplicación, **entonces** cada usuario se actualiza solo si coincide exactamente en `user_id`, nombre y correo con `Ana Torres`, `Carlos Pérez`, `María López` o `Jorge Soto`, conservando su identificador y su rol.
5. **Dado que** un usuario guardado tiene el mismo `user_id` de la semilla anterior pero otro nombre, otro correo o ambos, **cuando** carga la aplicación, **entonces** el sistema no lo modifica.
6. **Dado que** la aplicación se carga una y otra vez con la semilla ya migrada, **cuando** se repite la carga, **entonces** los nombres y correos permanecen iguales y no se generan usuarios duplicados.
7. **Dado que** los usuarios semilla tienen movimientos, transferencias, reposiciones o envíos asociados, **cuando** se actualizan sus nombres y correos, **entonces** se conservan la bodega asignada, el orden del catálogo y todas esas referencias por `user_id`.
8. **Dado que** se cargan los datos de demostración, **cuando** se asigna la bodega de cada usuario, **entonces** la asignación depende del rol y la posición del usuario en el catálogo y no del texto de su nombre.
9. **Dado que** se compara el estado antes y después del cambio, **cuando** se migran los usuarios, **entonces** no cambian existencias, movimientos, transferencias, reposiciones, envíos, roles, cargos, landing pages ni permisos.
10. **Dado que** hay un usuario activo guardado en el navegador, **cuando** se migran los usuarios semilla, **entonces** el mismo usuario sigue activo y sigue siendo quien registran las operaciones.

**Conjunto de datos de demostración canónico (`logistics-demo-v1`)**:

- El lote se identifica con `demo_batch = "logistics-demo-v1"` y la marca de carga `logistics:demo_data_loaded_v1`. La carga es manual, opcional, idempotente y nunca sobrescribe registros existentes; se inicia desde la barra superior del espacio de trabajo con el botón «Cargar datos de demostración», fuera del panel principal y del menú lateral, visible solo cuando `action:base.manage` esté concedida. Si el lote ya está cargado, devuelve `alreadyLoaded: true`, deshabilita el botón y no escribe; si falla la escritura, se restaura el estado anterior, se muestra un mensaje de error en `#demo-data-status` y la marca no queda activa.
- Categorías semilla, en orden: Electrónica, Alimentos y Bebidas, Ferretería, Insumos de Oficina, Limpieza y Aseo.
- Bodegas semilla:

| Nombre | Ubicación | Capacidad | Estado | Responsable |
|---|---|---:|---|---|
| Bodega Central Santiago | Av. Américo Vespucio 1234, Quilicura, Santiago | 5000 | activo | primer `encargado_bodega` del catálogo (`user_id` 2, Tomás Wiegand) |
| Bodega Valparaíso | Camino La Pólvora 880, Valparaíso | 2500 | activo | segundo `encargado_bodega` del catálogo (`user_id` 4, Sebastián Quispe) |
| Bodega Concepción | Ruta 150 Km 12, Concepción | 1800 | activo | segundo `encargado_bodega` del catálogo (`user_id` 4, Sebastián Quispe) |
| Bodega Maipú (inactiva) | Av. Pajaritos 4500, Maipú, Santiago | 800 | inactivo | segundo `encargado_bodega` del catálogo (`user_id` 4, Sebastián Quispe) |

- Regla de asignación de responsable: se usa el rol y la posición del usuario en el catálogo, nunca su nombre. La bodega central toma el primer `encargado_bodega`; las demás toman el segundo `encargado_bodega`. Si faltan, se usa el primero disponible y, en último caso, el primer usuario del catálogo.
- Productos semilla (todos con `created_by`/`updated_by` = `user_id` 1):

| SKU | Nombre | Categoría | Unidad | Proveedor | Precio venta | Precio costo | Peso | Estado |
|---|---|---|---|---|---:|---:|---:|---|
| DEMO-LAP-001 | Notebook Lenovo ThinkPad E14 | Electrónica | unidad | TecnoAndes SpA | 749990 | 620000 | 1.6 | activo |
| DEMO-MOU-002 | Mouse inalámbrico Logitech M240 | Electrónica | unidad | TecnoAndes SpA | 15990 | 10500 | 0.12 | activo |
| DEMO-CAF-003 | Café molido 1 kg | Alimentos y Bebidas | kg | Distribuidora Sur Ltda. | 12990 | 8500 | 1 | activo |
| DEMO-ARR-004 | Arroz grado 1 saco 5 kg | Alimentos y Bebidas | saco | Distribuidora Sur Ltda. | 6990 | 4200 | 5 | activo |
| DEMO-TAL-005 | Taladro percutor 650W | Ferretería | unidad | Ferretería Central SpA | 89990 | 62000 | 2.4 | activo |
| DEMO-GUA-006 | Guantes de seguridad anticorte | Ferretería | par | Ferretería Central SpA | 4990 | 2500 | 0.15 | activo |
| DEMO-PAP-007 | Resma papel A4 500 hojas | Insumos de Oficina | resma | Papelería Andina Ltda. | 4990 | 3200 | 2.3 | activo |
| DEMO-LIM-008 | Detergente industrial 5 L | Limpieza y Aseo | bidón | Química Limpia SpA | 14990 | 9800 | 5.2 | activo |
| DEMO-CAB-009 | Cable HDMI 2.1 de 2 metros | Electrónica | unidad | TecnoAndes SpA | 12990 | 7500 | 0.18 | inactivo |
| DEMO-TON-010 | Cartucho de tóner compatible | Insumos de Oficina | unidad | Papelería Andina Ltda. | 32990 | 22000 | 0.7 | activo |

- Stock semilla: 28 registros, uno por combinación producto/bodega con balance calculado. La fuente autoritativa de `quantity_available` es la secuencia de movimientos y transferencias confirmadas: suma movimientos de tipo `entrada` o `ajuste_entrada`, resta `salida` y `ajuste_salida`, resta transferencias `confirmada` del origen y las suma al destino; se persiste como `max(0, balance)` con `expiration_date` ausente y `update_date` = fecha de ayer. La tabla siguiente es derivada y NO es la fuente de los mínimos:

| SKU | Central | Valparaíso | Concepción |
|---|---:|---:|---:|
| DEMO-LAP-001 | 12 | 2 | 2 |
| DEMO-MOU-002 | 45 | 8 | — |
| DEMO-CAF-003 | 70 | 25 | 40 |
| DEMO-ARR-004 | 120 | 25 | 60 |
| DEMO-TAL-005 | 6 | 1 | 0 |
| DEMO-GUA-006 | 200 | 30 | 95 |
| DEMO-PAP-007 | 24 | 50 | 18 |
| DEMO-LIM-008 | 11 | 3 | 9 |
| DEMO-CAB-009 | 0 | 10 | — |
| DEMO-TON-010 | 5 | 2 | 7 |

- `min_stock_level` semilla, por combinación producto+bodega (`—` = no existe registro de stock):

| SKU | Central | Valparaíso | Concepción |
|---|---:|---:|---:|
| DEMO-LAP-001 | 5 | 4 | 2 |
| DEMO-MOU-002 | 10 | 10 | — |
| DEMO-CAF-003 | 20 | 20 | 10 |
| DEMO-ARR-004 | 30 | 10 | 20 |
| DEMO-TAL-005 | 3 | 2 | 1 |
| DEMO-GUA-006 | 50 | 20 | 40 |
| DEMO-PAP-007 | 30 | 15 | 20 |
| DEMO-LIM-008 | 10 | 5 | 4 |
| DEMO-CAB-009 | 0 | 0 | — |
| DEMO-TON-010 | 8 | 5 | 3 |

- Movimientos semilla (51 registros; formato SKU / bodega / tipo / cantidad / días atrás, con `user_id` resuelto por la regla de responsable y fechas ISO calculadas desde la carga):
  - DEMO-LAP-001: Central/entrada/15/21, Central/salida/3/13, Valparaíso/entrada/4/19, Valparaíso/salida/2/9, Concepción/entrada/2/11.
  - DEMO-MOU-002: Central/entrada/60/22, Central/salida/15/10, Valparaíso/entrada/20/20, Valparaíso/salida/12/8.
  - DEMO-CAF-003: Central/entrada/100/25, Central/salida/20/12, Valparaíso/entrada/30/21, Valparaíso/salida/15/7, Concepción/entrada/40/15.
  - DEMO-ARR-004: Central/entrada/150/26, Central/salida/30/14, Valparaíso/entrada/40/22, Valparaíso/salida/15/6, Concepción/entrada/60/16.
  - DEMO-TAL-005: Central/entrada/10/24, Central/salida/4/11, Valparaíso/entrada/3/18, Valparaíso/salida/2/5, Concepción/entrada/2/9, Concepción/salida/2/3.
  - DEMO-GUA-006: Central/entrada/250/23, Central/salida/50/11, Valparaíso/entrada/50/17, Valparaíso/salida/15/4, Concepción/entrada/100/13, Concepción/salida/10/2.
  - DEMO-PAP-007: Central/entrada/40/27, Central/salida/16/8, Valparaíso/entrada/60/19, Valparaíso/salida/10/3, Concepción/entrada/30/10, Concepción/salida/12/2.
  - DEMO-LIM-008: Central/entrada/20/22, Central/salida/6/7, Valparaíso/entrada/10/14, Valparaíso/salida/7/3, Concepción/entrada/10/6, Concepción/salida/4/1.
  - DEMO-CAB-009: Central/entrada/5/20, Central/salida/5/15, Valparaíso/entrada/10/19.
  - DEMO-TON-010: Central/entrada/12/20, Central/salida/7/9, Valparaíso/entrada/8/15, Valparaíso/salida/6/4, Concepción/entrada/7/7.
- Transferencias semilla (8 registros; formato SKU / origen → destino / cantidad / estado / días atrás): DEMO-CAF-003 Central→Valparaíso/10/confirmada/5; DEMO-LAP-001 Central→Valparaíso/3/pendiente/1; DEMO-GUA-006 Valparaíso→Concepción/5/confirmada/4; DEMO-ARR-004 Central→Concepción/20/pendiente/2; DEMO-LIM-008 Central→Concepción/3/confirmada/3; DEMO-MOU-002 Central→Valparaíso/5/cancelada/6; DEMO-GUA-006 Central→Valparaíso/40/pendiente/1; DEMO-CAB-009 Valparaíso→Central/2/cancelada/4. Las transferencias confirmadas llevan `confirmed_by` = `user_id` 1; las canceladas, `cancelled_by` = `user_id` 1; las pendientes no tienen esos campos.
- El resumen devuelto por la carga informa `products: 10`, `warehouses: 4`, `stock: 28`, `movements: 51` y `transfers: 8`; si los identificadores de demostración ya existen pero la marca no está activa, no se agrega nada y el mensaje lo explica sin modificar registros.

---

### Casos Límite

- ¿Qué ocurre cuando un usuario intenta guardar un producto o una bodega sin nombre, SKU o ubicación obligatorios?
- ¿Cómo gestiona el sistema una búsqueda o filtro dentro de una sección que no devuelve coincidencias? (Se muestra un estado vacío en esa sección, sin habilitar un módulo global "Búsqueda").
- ¿Qué ocurre si un usuario intenta editar un producto o una bodega que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha de movimiento o transferencia que no es válida? (Las fechas son automáticas; no se acepta entrada manual).
- ¿Qué ocurre con el stock y el historial de movimientos cuando una bodega se marca como inactiva? (Se conservan para consulta y se inhabilitan operaciones nuevas).
- ¿Qué ocurre si una transferencia pendiente se confirma cuando el stock de origen ya es insuficiente? (Se rechaza la confirmación, sigue pendiente y no cambia `STOCK` ni `confirmed_by`).
- ¿Qué ocurre cuando una fecha de vencimiento reservada es anterior a la fecha de movimiento? (El control de vencimientos queda fuera de esta iteración).
- **Heredado de la plantilla base (sección avanzada conservada, no historia de 002)**: ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base? (Se rechaza la configuración conflictiva; no afecta a los campos propios de productos, bodegas ni operaciones logísticas).
- **Heredado de la plantilla base (sección avanzada conservada, no historia de 002)**: ¿Qué ocurre cuando la configuración referencia un tipo de campo desconocido o una definición de transición de ciclo de vida inválida? (Se informa el error y se aplican valores predeterminados; las reglas de estado de logística no dependen de este ciclo genérico).
- **Heredado de la plantilla base (sección avanzada conservada, no historia de 002)**: ¿Qué ocurre cuando los registros almacenados contienen valores de campos personalizados que ya no están declarados en la configuración? (Los valores quedan como datos heredados sin mostrarlos en los formularios de logística).
- ¿Qué ocurre cuando un usuario abre directamente una sección permitida (p. ej., vía enlace profundo o recarga del navegador) sin pasar por el panel principal? (Se abre la sección con su pestaña por defecto conforme a FR-145; si no está permitida, se aplica FR-115).
- ¿Qué ocurre cuando un usuario pulsa el botón atrás del navegador estando en una sección con pestañas? (Vuelve a la vista o pestaña anterior conservando el contexto de la sección, sin modificar datos).
- ¿Qué ocurre si un usuario navega fuera de una sección mientras un formulario aún tiene cambios sin guardar? (Se muestra una advertencia antes de salir; los cambios no confirmados no se guardan).
- ¿Permanecen intactos los datos de productos, bodegas, stock, movimientos, transferencias y alertas al navegar entre secciones? (Sí, conforme a FR-022 y SC-007).
- ¿Qué ocurre cuando el panel principal se abre con cero productos, cero bodegas, stock total en cero o cero alertas? (Los indicadores muestran 0 y no aparecen accesos adicionales).
- **Heredado de la plantilla base**: ¿Qué ocurre cuando el color de acento configurado no es un valor de color válido? (Se aplica el color predeterminado del tema sin alterar los datos logísticos).
- ¿Cómo mantiene la barra lateral contraída las etiquetas de las seis secciones accesibles en ventanas gráficas estrechas?
- ¿Qué ocurre si un administrador intenta modificar el SKU de un producto que ya tiene historial de movimientos (entradas/salidas) asociados? (Se permite editarlo; los movimientos referencian `product_id`, no `sku`, y se revalida la unicidad del nuevo valor).
- ¿Cómo se advierte al usuario si ingresa un "Precio de Costo" superior al "Precio de Venta"? (Se permite guardar y se muestra una advertencia no bloqueante; no se impide el registro).
- ¿Qué sucede si un usuario intenta cambiar el estado de un producto a "Inactivo" pero este aún cuenta con stock físico en bodegas? (Se permite el cambio; el stock existente se conserva y se muestra solo para consulta).
- ¿Cómo maneja el sistema la importación o el copiado y pegado de texto que incluye espacios en blanco al inicio o final del SKU o el Nombre?
- ¿Qué ocurre si un producto no tiene registro de stock en una bodega? (No se asume stock cero como registro existente; se indica la ausencia de existencias en esa bodega).
- ¿Qué ocurre si un producto tiene registro de stock con `quantity_available` en 0? (Se muestra con cantidad 0, distinto de la ausencia de registro en esa bodega).
- ¿Qué ocurre con el stock de una bodega que pasó a estado inactivo? (Se muestra solo para consulta, sin habilitar operaciones sobre ella).
- ¿Qué ocurre si un producto está inactivo pero aún tiene existencias? (Se muestra su stock para consulta, indicando su estado).
- ¿Qué ocurre cuando una búsqueda no devuelve coincidencias? (Se muestra un mensaje de estado vacío).
- ¿Qué ocurre cuando se registra una salida sin stock disponible para el producto y la bodega?
- ¿Qué ocurre cuando se intenta editar o eliminar un movimiento de inventario ya registrado?
- ¿Qué ocurre cuando se intenta registrar un movimiento con un usuario que no existe?
- ¿Qué ocurre cuando se registra una entrada de un producto con fecha de vencimiento? (Se difiere a una historia posterior).
- ¿Qué ocurre si falla la generación de la orden al guardar una entrada o salida normal? (Se rechaza el movimiento completo, no se modifica `STOCK` y no quedan registros parciales).
- ¿Qué ocurre cuando se registra un ajuste (`ajuste_entrada` o `ajuste_salida`) sobre un movimiento ya registrado? (Se crea un nuevo movimiento inmutable; el original no se modifica).
- ¿Qué sucede si el administrador intenta registrar una nueva bodega utilizando un nombre o identificador que ya existe en el sistema?
- ¿Cómo maneja el sistema la desactivación o eliminación lógica de una bodega que aún contiene stock de productos o historial de movimientos activos?
- ¿Qué ocurre si un usuario intenta realizar una operación seleccionando una bodega que ha sido marcada como inactiva?
- ¿Qué ocurre si la bodega de origen o de destino pasa a estar inactiva mientras existe una transferencia en camino en estado 'pendiente'? (El sistema impide confirmarla mientras alguna de las dos esté inactiva; la solicitud permanece pendiente hasta que ambas estén activas o se cancele).
- ¿Qué sucede si un usuario intenta cancelar o editar una transferencia que ya fue marcada como 'confirmada'? (El sistema bloquea la acción; los traslados confirmados son inmutables).
- ¿Cómo reacciona el sistema si el registro de stock para el producto aún no existe en la bodega de destino al momento de confirmar la recepción? (El sistema crea automáticamente la entrada correspondiente en `STOCK`).
- ¿Qué ocurre si no hay categorías semilla cargadas al intentar registrar un producto? (Se impide el registro porque `category_id` es obligatorio).
- ¿Qué ocurre si no hay un usuario activo válido al crear, editar o cambiar el estado de un producto? (La operación se rechaza con un error claro y no persiste cambios en `created_by` ni `updated_by`).
- ¿Qué ocurre si no hay usuarios semilla cargados al intentar registrar un movimiento? (Se impide el registro porque `user_id` es obligatorio).
- ¿Qué ocurre cuando `quantity_available` es exactamente igual a `min_stock_level`? (Se genera la alerta; el umbral es inclusivo).
- ¿Qué ocurre cuando `min_stock_level` es cero o no está configurado? (No se genera alerta para ese registro de stock).
- ¿Qué ocurre cuando no existe registro de `STOCK` para una combinación producto+bodega? (No hay mínimo que evaluar; no se genera alerta).
- ¿Qué ocurre con las alertas de productos o bodegas inactivos? (Se muestran solo como información para consulta, sin habilitar operaciones).
- ¿Qué ocurre cuando se modifica `min_stock_level` o se repone el stock? (Las alertas se recalculan de inmediato; la alerta desaparece si el stock supera el mínimo).
- ¿Qué ocurre al consultar las alertas? (La consulta no modifica `STOCK`, productos, bodegas ni movimientos).
- ¿Qué ocurre si se crea una solicitud de reposición para una bodega inactiva? (Se rechaza; solo se permiten bodegas activas).
- ¿Qué ocurre si se intenta aprobar una solicitud que ya está aprobada, recibida o cancelada? (Se bloquea; solo se aprueban solicitudes pendientes).
- ¿Qué ocurre si se intenta recibir dos veces la misma solicitud? (La segunda recepción se rechaza; no se crea otro movimiento ni se vuelve a aumentar `STOCK`).
- ¿Qué ocurre si el usuario activo no existe al crear, aprobar, cancelar o recibir? (La operación se rechaza con un error claro y no persiste cambios).
- ¿Qué ocurre si el encargado de bodega cambia de perfil mientras consulta reposiciones? (La vista se recalcula con los permisos del nuevo perfil).
- ¿Qué ocurre si se asigna a un usuario un cargo que no está en la lista de roles definidos? (Se rechaza el cambio con un error claro y se conserva el cargo anterior).
- ¿Qué ocurre si el administrador cambia su propio cargo a uno sin acceso al panel de permisos? (Se conserva el acceso mínimo al panel para no perder la capacidad de configurar y se muestra una advertencia).
- ¿Qué ocurre si no hay una landing page configurada para un rol? (Se usa una página de inicio predeterminada común y la aplicación permanece operativa).
- ¿Qué ocurre si al cargar la aplicación o cambiar el usuario activo la landing page configurada dejó de estar disponible? (Se abre la página de inicio predeterminada y se muestra un aviso no bloqueante).
- ¿Qué ocurre si un usuario tiene excepciones individuales para varias secciones con valores contradictorios? (Se aplica la excepción más específica por sección; no se permite duplicar excepciones para la misma sección).
- ¿Qué ocurre cuando se elimina o deja de usar una sección de la matriz de permisos? (La regla queda inactiva y no bloquea el acceso a otras secciones).
- ¿Qué ocurre si un usuario intenta abrir por URL una vista cuya configuración de permiso aún no existe? (Se aplica el permiso por defecto del rol y, si tampoco existe, el acceso se considera no autorizado).
- ¿Qué ocurre cuando cambia el cargo de un usuario que tiene un formulario con cambios sin guardar? (Se recalculan permisos y navegación al confirmar el cambio y se le avisa de que esos cambios podrían no guardarse).
- ¿Qué ocurre si un usuario con permisos limitados consulta una vista permitida que contiene acciones de otras secciones? (Los botones no autorizados se ocultan o deshabilitan; el resto de la vista sigue operativa).
- ¿Qué ocurre si cambia el cargo del usuario activo mientras tiene seleccionada una bodega operativa? (La bodega asignada no cambia; solo cambian permisos y navegación).
- ¿Qué ocurre si la matriz de permisos intenta otorgar a un cargo una acción prohibida por una regla de negocio? (La regla de negocio prevalece; la configuración no concede ese acceso).
- ¿Qué ocurre si un usuario sin acceso a Movimientos intenta consultar las órdenes? (No existe una vista propia de órdenes; se aplica el bloqueo de Movimientos de HU-08 y no se muestra el panel).
- ¿Qué ocurre si se elimina o se intenta editar un movimiento que ya generó una orden? (El movimiento sigue siendo inmutable y la orden conserva el vínculo con él).
- ¿Qué ocurre si se intenta retroceder el estado de un envío o modificar uno ya entregado? (Se rechaza el cambio; solo se permite avanzar a la etapa secuencial siguiente y Entregado es final).
- ¿Qué ocurre si un usuario abre una URL antigua de Entidades, Documentos o Búsqueda? (La sección no se muestra, se aplica FR-115 y se devuelve al usuario a una vista permitida).
- ¿Qué ocurre si un usuario abre `#/shipments` o `#/replenishments`? (Si el módulo subyacente está permitido, la ruta redirige a la pestaña correspondiente dentro de Movimientos o Alertas; si no está permitido, se aplica FR-115).
- ¿Qué ocurre si una sección define una sola pestaña o ninguna? (Se muestra sin pestañas o con esa única pestaña activa, sin afectar al menú lateral).
- ¿Qué ocurre si una pestaña no tiene registros que mostrar? (Se muestra un estado vacío dentro de la sección, sin crear accesos adicionales).
- ¿Qué ocurre si la matriz de permisos oculta todas las pestañas de una sección permitida? (La sección se abre con un estado vacío y un mensaje claro, sin bloquear otras secciones).
- ¿Qué ocurre si cambian productos, bodegas, stock o alertas mientras el panel principal está abierto? (Los indicadores se recalculan cuando el panel vuelve a mostrarse; la consulta no modifica datos).
- ¿Qué ocurre si el stock total del panel incluye productos o bodegas inactivos? (Se incluyen porque sus registros de `STOCK` siguen vigentes para consulta, coherente con FR-052 y FR-090).

- ¿Qué ocurre si un usuario guardado conserva el `user_id` de la semilla anterior pero cambió solo el nombre o solo el correo? (No se migra; se considera un dato modificado por el usuario y se conserva tal cual).
- ¿Qué ocurre si otro usuario del catálogo ya tiene el nombre o el correo nuevo antes de la migración? (La migración no duplica registros ni sobrescribe al usuario ajeno a la semilla anterior; se requiere que los cuatro nombres semilla sean únicos).
- ¿Qué ocurre si se recarga la aplicación varias veces después de la migración? (La actualización es idempotente: no hay cambios adicionales ni correos repetidos).
- ¿Qué ocurre si el usuario activo guardado corresponde a uno de los cuatro usuarios migrados? (Conserva su identidad por `user_id`, sigue activo y no cambian sus permisos ni su bodega asignada).
- ¿Qué ocurre si los datos de demostración ya fueron cargados con los nombres anteriores? (No se recalcula ni se reasigna nada; las bodegas de demostración se derivan de rol y posición, no del nombre).
- ¿Qué ocurre si el catálogo de usuarios está vacío pero existen movimientos u otros registros? (Se siembran los cuatro usuarios nuevos sin borrar ni alterar los registros existentes).
- ¿Qué ocurre si un correo semilla contiene una tilde en la parte local? (No cumple la regla; el correo debe expresarse sin tildes aunque el nombre completo las lleve).
- ¿Qué ocurre si falla la escritura durante la migración de HU-15? (Se restaura íntegramente el catálogo `logistics:users` y `logistics:active_user_id`, no se marca la migración como aplicada y se muestra un error claro; no quedan usuarios a medias ni duplicados).

### Session 2026-11-27

- Q: ¿Qué conjunto de historias debe considerarse el MVP canónico que una persona o agente debe reconstruir leyendo solo estos archivos? → A: Todas las historias `HU-01`–`HU-15`.
- Q: ¿Qué fuente debe considerarse autoritativa para `quantity_available` en `logistics-demo-v1` cuando la tabla publicada no coincide con los movimientos y transferencias listados? → A: Recalcular `quantity_available` desde movimientos y transferencias confirmadas.
- Q: ¿Deben considerarse bloqueantes para aceptar el MVP las tareas pendientes `T031`, `T036`, `T048`, `T065`, `T067`, `T107`, `T136` y `T145`? → A: Sí, bloqueantes; documentar evidencia requerida para cerrarlas.
- Q: ¿Deben incorporar `spec.md`, `plan.md` y `tasks.md` la matriz completa de permisos semilla y las acciones prohibidas por regla de negocio tal como están implementadas? → A: Sí, documentar la matriz completa y las reglas prohibidas desde la implementación actual.
- Q: ¿Cómo debe resolverse la contradicción entre la constitución del proyecto, que exige linting, formato y análisis estático, y el plan actual, que solo verifica `npm test` y `npm run build`? → A: Añadir tareas obligatorias de linting, formato y análisis estático antes de cerrar el MVP.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

> **Nota de alcance 002 (verificación 2026-11-25)**: FR-001–FR-024 conservan su numeración y se clasifican así: **`(Heredado adaptado)`** = capacidad de la plantilla base aplicada al dominio de logística, sin CRUD genérico; **`(Interfaz vigente de 002)`** = requisito de interfaz que sustituye a la plantilla según HU-12 a HU-14 y FR-135–FR-147; **`(Propio de 002)`** = regla del módulo de Logística e Inventario. El alcance funcional propio continúa en FR-040; las reglas detalladas de HU-06 y HU-07 permanecen en sus historias, `data-model.md` y `contracts/`. FR-085–FR-092 existen y son citados por `tasks.md` (T012, T014, T017, T020, T039, T041 y T045) sin necesidad de renumeración; la cancelación de transferencias usa el usuario activo como `cancelled_by` conforme a FR-085.

- **Alcance canónico del MVP**: El MVP de 002 comprende íntegramente `HU-01`–`HU-15`; las menciones históricas a `US1`, `US8` o a un MVP reducido quedan subordinadas a este alcance y NO definen criterios de aceptación.

- **FR-001** *(Heredado adaptado)*: La base DEBE almacenar registros con al menos un nombre y un código; en 002 esa capacidad se aplica a productos, bodegas y catálogos del dominio, sin una sección "Entidades".
- **FR-002** *(Heredado adaptado)*: La base DEBE permitir modificar registros existentes; en 002 las modificaciones visibles se realizan desde las secciones Productos, Bodegas, Transferencias y Reposiciones con las reglas de su dominio.
- **FR-003** *(Heredado adaptado)*: La base DEBE permitir dar de baja registros; en 002 las bajas se gestionan mediante estados propios (`activo`/`inactivo`, `pendiente`/`confirmada`/`cancelada`, etc.), sin eliminación genérica de entidades ni documentos.
- **FR-004** *(Heredado adaptado)*: El sistema DEBE buscar registros dentro de la sección correspondiente por nombre, SKU/código, categoría u otras palabras clave propias del dominio, sin habilitar una búsqueda global.
- **FR-005** *(Heredado adaptado)*: El sistema DEBE mostrar listas claras y estados vacíos por sección, sin una lista genérica de entidades ni documentos.
- **FR-006** *(Heredado adaptado)*: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria, falla una validación o no se puede completar una operación logística.
- **FR-007** *(Heredado adaptado)*: El sistema DEBE mantener consistentes productos, bodegas, stock, movimientos, transferencias, reposiciones, órdenes y envíos tras cada operación.
- **FR-008** *(Heredado adaptado)*: La base DEBE permitir gestionar detalles transaccionales como capacidad de datos; en 002 NO se expone una sección "Documentos": esos datos se consultan y gestionan desde Movimientos, Transferencias, Reposiciones, Seguimiento de envíos y Alertas.
- **FR-009** *(Heredado adaptado)*: La base DEBE conservar la integridad entre registros relacionados; en 002 esa capacidad se manifiesta en las FK de productos, bodegas, stock, movimientos, transferencias, reposiciones, órdenes y envíos, sin una sección genérica.
- **FR-010** *(Interfaz vigente de 002)*: El panel principal DEBE contener exclusivamente los indicadores de productos, bodegas, stock total y alertas activas, sin botones de acción rápida ni enlaces a las seis secciones; se usa como página de inicio cuando HU-08 lo configura para el rol, sin imponerse a todos los perfiles.
- **FR-011** *(Heredado adaptado)*: El sistema DEBE envolver cada pantalla en el marco persistente del ERP: barra superior con marca, selector de usuario activo y barra lateral de navegación.
- **FR-012** *(Interfaz vigente de 002)*: La barra lateral DEBE mostrar exclusivamente Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas, y NO DEBE mostrar Entidades, Documentos ni Búsqueda.
- **FR-013** *(Interfaz vigente de 002)*: La interfaz NO DEBE ofrecer acciones para crear, editar ni eliminar entidades genéricas; las capacidades heredadas de la base quedan fuera de la navegación de 002.
- **FR-014** *(Interfaz vigente de 002)*: La interfaz NO DEBE ofrecer gestiones de documentos genéricos; las operaciones operativas permanecen en sus secciones de logística.
- **FR-015** *(Interfaz vigente de 002)*: El acceso al panel principal NO DEBE realizarse desde un botón de la barra lateral; se alcanza como página de inicio configurada de HU-08 y desde la identidad de marca de la aplicación.
- **FR-016** *(Interfaz vigente de 002)*: La interfaz NO DEBE incluir una pantalla de gestión genérica de entidades ni documentos.
- **FR-017** *(Propio de 002)*: El alta, la edición y el cambio de estado de productos y bodegas DEBEN realizarse desde las secciones Productos y Bodegas del menú lateral, conforme a HU-01 y HU-04, con auditoría del usuario activo cuando el dominio lo exige.
- **FR-018** *(Propio de 002)*: Las operaciones antes agrupadas como documentos DEBEN consultarse y gestionarse desde Movimientos, Transferencias, Reposiciones, Seguimiento de envíos y Alertas, sin una sección "Documentos".
- **FR-019** *(Interfaz vigente de 002)*: El sistema NO DEBE incluir una pantalla de búsqueda dedicada ni un botón "Buscar" en el menú lateral.
- **FR-020** *(Propio de 002)*: La búsqueda y los filtros DEBEN permanecer integrados en las secciones que los definen —Stock, Alertas, Transferencias, Movimientos y Seguimiento de envíos— sin constituir una sección propia.
- **FR-021** *(Interfaz vigente de 002)*: El acceso a cualquier búsqueda o filtro DEBE realizarse desde la sección a la que pertenece, sin accesos rápidos desde el panel principal.
- **FR-022** *(Heredado adaptado)*: El sistema DEBE mantener intactos y consistentes los datos de productos, bodegas, stock, movimientos, transferencias, reposiciones, órdenes y envíos durante la navegación entre secciones.
- **FR-023** *(Heredado adaptado)*: El sistema DEBE cargar la configuración del módulo al arrancar y aplicarla en todas las pantallas del marco ERP.
- **FR-024** *(Heredado adaptado)*: El sistema DEBE retroceder a los valores predeterminados integrados cuando no se proporciona configuración, sin reintroducir secciones Entidad, Documento ni Búsqueda en la navegación de 002.
- **FR-025**: El sistema DEBE informar claramente de una configuración inválida o conflictiva en lugar de fallar silenciosamente.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada que coincidan con sus tipos declarados.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar, usando la misma experiencia de retroalimentación que la validación base.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en los resultados de búsqueda de cada sección y mostrarlos en listas y vistas de detalle, sin habilitar una búsqueda global.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario de la configuración del módulo en lugar de texto fijo en el código.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas en los documentos independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener el estado del documento como texto libre cuando no hay ciclo de vida configurado.
- **FR-032**: El sistema DEBE mantener el renderizado de listas y la búsqueda ágiles y correctos para conjuntos de datos de al menos 500 registros por sección.
- **FR-033**: El panel principal NO DEBE ofrecer botones de acción rápida ni abrir formularios de ninguna de las seis secciones del menú lateral.
- **FR-034**: El panel principal NO DEBE enlazar con formularios vacíos ni con áreas de gestión de las secciones; su contenido se limita a la lectura de indicadores.
- **FR-035**: El panel principal DEBE mostrar indicadores de número de productos, número de bodegas, stock total y alertas activas, actualizados cada vez que se muestra el panel.
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral DEBE resaltar visualmente el módulo activo en cada pantalla.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente en todo el marco y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas gráficas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable.
- **FR-040**: El sistema DEBE permitir el registro de productos requiriendo como mínimo: Nombre, SKU (Código de Referencia Único), Precio de Venta y Categoría; el Estado se asigna automáticamente conforme a FR-091 y NO se solicita en el formulario de creación.
- **FR-041**: El sistema DEBE permitir añadir campos opcionales como: Descripción, Precio de Costo, Proveedor y Unidad de Medida.
- **FR-042**: El sistema DEBE garantizar que el campo SKU sea único en todo el catálogo de productos.
- **FR-043**: El sistema DEBE validar que los valores numéricos ingresados en "Precio de Venta" y "Precio de Costo" sean mayores o iguales a 0.
- **FR-044**: El sistema DEBE registrar automáticamente el usuario que crea/modifica el producto, así como las marcas de tiempo de creación y actualización.
- **FR-045**: El sistema DEBE permitir alternar el estado del producto (Activo/Inactivo) para controlar su disponibilidad en los módulos operativos.
- **FR-046**: El sistema DEBE tratar todos los campos de texto ingresados para prevenir la ejecución de contenido no deseado antes de mostrarlos.
- **FR-047**: El sistema DEBE permitir consultar las existencias de cada producto mostrando `quantity_available` por producto y bodega desde la tabla `STOCK`.
- **FR-048**: El sistema DEBE calcular y mostrar el total de existencias de un producto sumando `quantity_available` de todas sus bodegas.
- **FR-049**: El sistema DEBE permitir filtrar y buscar los registros de stock por producto y por bodega.
- **FR-050**: El sistema DEBE mostrar un estado vacío claro cuando la búsqueda o el filtro no devuelvan resultados.
- **FR-051**: El sistema DEBE tratar la consulta de stock como solo lectura, sin crear, modificar ni eliminar registros de `STOCK`, `PRODUCTS`, `WAREHOUSES` ni `INVENTORY_TRANSACTIONS`.
- **FR-052**: El sistema DEBE mostrar el estado (Activo/Inactivo) del producto y de la bodega junto con sus existencias cuando corresponda.
- **FR-053**: Al guardar un movimiento de inventario, el sistema DEBE actualizar inmediatamente `quantity_available` del registro de stock correspondiente al producto y la bodega.
- **FR-054**: Si no existe un registro de stock para la combinación producto+bodega, una entrada DEBE crear el registro; una salida DEBE rechazarse.
- **FR-055**: Una salida cuya cantidad supere el stock disponible DEBE rechazarse sin modificar el stock.
- **FR-056**: El sistema DEBE impedir la edición y eliminación de movimientos de inventario ya registrados.
- **FR-057**: El sistema DEBE permitir corregir un movimiento mediante un nuevo movimiento de ajuste registrado con `transaction_type` "ajuste_entrada" o "ajuste_salida" que quede en el historial.
- **FR-058**: El sistema DEBE usar automáticamente el usuario activo seleccionado en la parte superior del ERP para el movimiento y guardar su `user_id`; DEBE impedir registrar el movimiento y mostrar un error si no existe un usuario activo válido.
- **FR-059**: El sistema DEBE asignar automáticamente la fecha y hora del movimiento al guardarlo y NO DEBE permitir que el usuario la modifique.
- **FR-060**: El sistema DEBE permitir registrar nuevas bodegas indicando nombre único, ubicación física y detalles opcionales.
- **FR-061**: El sistema DEBE permitir al administrador modificar la información descriptiva y de ubicación de las bodegas existentes.
- **FR-062**: El sistema DEBE permitir cambiar el estado de una bodega entre activo e inactivo.
- **FR-063**: El sistema DEBE impedir la selección de bodegas inactivas para la realización de nuevos movimientos de inventario o transferencias.
- **FR-064**: El sistema DEBE validar que no se dupliquen los nombres de las bodegas.
- **FR-065**: El sistema DEBE permitir registrar solicitudes de transferencia entre bodegas requiriendo: Producto (`product_id`), Bodega Origen (`source_warehouse_id`), Bodega Destino (`target_warehouse_id`) y Cantidad (`quantity`), registrando automáticamente en `created_by` el usuario activo del ERP.
- **FR-066**: El sistema DEBE validar que la Bodega Origen y la Bodega Destino sean entidades distintas.
- **FR-067**: El sistema DEBE verificar que la Bodega Origen disponga de `quantity_available` suficiente en `STOCK` antes de autorizar el registro.
- **FR-068**: El sistema DEBE gestionar el estado de la transferencia permitiendo únicamente los valores: 'pendiente', 'confirmada' y 'cancelada'.
- **FR-069**: El sistema DEBE actualizar los niveles de `STOCK` en origen y destino únicamente cuando la transferencia cambie a estado 'confirmada'.
- **FR-070**: El sistema DEBE registrar la fecha de la transacción (`transfer_date`) de forma automática.
- **FR-071**: El sistema DEBE disponer de catálogos semilla de categorías de producto y usuarios para que `PRODUCTS` e `INVENTORY_TRANSACTIONS` puedan referenciarlos; no se requieren pantallas de administración en esta iteración.
- **FR-072**: El sistema DEBE registrar los ajustes de inventario con `transaction_type` "ajuste_entrada" o "ajuste_salida", manteniendo la cantidad positiva y actualizando `STOCK` según la dirección del ajuste.
- **FR-073**: El sistema NO DEBE implementar autenticación real en esta iteración. Los roles `administrador`, `supervisor_inventario` y `encargado_bodega` determinan permisos simulados; el usuario activo se selecciona desde la interfaz y los movimientos y transferencias utilizan automáticamente su `user_id`. Al utilizar `localStorage`, este control no constituye seguridad real.
- **FR-074**: El sistema DEBE registrar automáticamente en `created_by` el usuario activo que crea la solicitud de transferencia y DEBE rechazarla si no existe un usuario activo válido.
- **FR-075**: El sistema DEBE registrar automáticamente en `confirmed_by` el usuario activo que confirma la recepción y DEBE rechazar la confirmación si no existe un usuario activo válido.
- **FR-076**: El sistema DEBE permitir al administrador configurar y editar `min_stock_level` (mayor o igual a cero) por cada combinación producto+bodega en `STOCK`.
- **FR-077**: El sistema DEBE generar una alerta cuando `quantity_available` sea menor o igual a `min_stock_level` y `min_stock_level` sea mayor que cero.
- **FR-078**: El sistema DEBE mostrar las alertas en una pantalla dedicada indicando producto, bodega, cantidad disponible, mínimo configurado y déficit.
- **FR-079**: El sistema DEBE resaltar o indicar visualmente en la pantalla de Control de Stock los registros de `STOCK` que se encuentren en alerta.
- **FR-080**: El sistema DEBE recalcular las alertas automáticamente tras cada movimiento de inventario, transferencia confirmada o cambio de `min_stock_level`, sin requerir una acción manual.
- **FR-081**: El sistema DEBE retirar la alerta cuando `quantity_available` supere `min_stock_level`.
- **FR-082**: El sistema DEBE permitir filtrar y buscar las alertas por producto y por bodega, y mostrar un estado vacío cuando no haya coincidencias.
- **FR-083**: El sistema DEBE tratar las alertas como informativas: NO DEBEN bloquear movimientos ni transferencias, ni modificar `STOCK`, `PRODUCTS`, `WAREHOUSES` o `INVENTORY_TRANSACTIONS`.
- **FR-084**: El sistema NO DEBE generar alertas para registros de `STOCK` sin mínimo configurado o con `min_stock_level` igual a cero.
- **FR-085**: El sistema DEBE permitir cancelar una transferencia en estado "pendiente", registrando automáticamente en `cancelled_by` el usuario activo válido y sin modificar `STOCK` en ninguna bodega.
- **FR-086**: El sistema DEBE rechazar la cancelación de una transferencia que no se encuentre en estado "pendiente".
- **FR-087**: El sistema DEBE impedir confirmar una transferencia "pendiente" si la bodega de origen o la bodega de destino se encuentra inactiva en el momento de la confirmación.
- **FR-088**: El sistema DEBE permitir modificar el SKU de un producto aunque tenga movimientos de inventario asociados, revalidando su unicidad; los movimientos conservan la referencia por `product_id`.
- **FR-089**: El sistema DEBE permitir guardar un producto cuando el Precio de Costo sea mayor al Precio de Venta, mostrando una advertencia no bloqueante.
- **FR-090**: El sistema DEBE permitir cambiar el estado de un producto a "Inactivo" aunque tenga stock físico registrado en una o más bodegas; el stock existente se conserva y se muestra solo para consulta.
- **FR-091**: El sistema DEBE asignar automáticamente el Estado "activo" al crear un producto sin solicitarlo en el formulario de creación.
- **FR-092**: El sistema DEBE tratar los campos de texto de productos, bodegas, movimientos y transferencias de la misma forma que FR-046, escapando su contenido antes de mostrarlo en listados y formularios.
- **FR-093**: El sistema DEBE permitir al administrador y al supervisor de inventario crear solicitudes de reposición con producto existente, bodega activa y cantidad entera mayor que cero, registrando automáticamente `created_by`, `request_date` y `source`.
- **FR-094**: El sistema DEBE mantener el estado de una solicitud dentro de "pendiente", "aprobada", "recibida" o "cancelada", permitiendo aprobar únicamente solicitudes pendientes.
- **FR-095**: El sistema DEBE registrar automáticamente `approved_by` y `approved_at` al aprobar una solicitud de reposición, sin modificar `STOCK`.
- **FR-096**: El sistema DEBE permitir al encargado de bodega registrar la recepción de solicitudes aprobadas creando un movimiento de entrada inmutable de HU-03, guardando `movement_id`, `received_by` y `received_at`, y aumentando `STOCK.quantity_available` una sola vez.
- **FR-097**: El sistema DEBE impedir una segunda recepción de la misma solicitud y no duplicar el movimiento ni el stock.
- **FR-098**: El sistema DEBE permitir cancelar solicitudes "pendientes" o "aprobadas", registrando `cancelled_by` y `cancelled_at` sin modificar `STOCK`; las solicitudes "recibidas" o "canceladas" son inmutables.
- **FR-099**: El sistema DEBE mostrar a los encargados de bodega únicamente las solicitudes aprobadas y ocultarles el formulario de creación, las acciones de aprobación y cancelación.
- **FR-100**: El sistema DEBE permitir preseleccionar producto, bodega y déficit desde una alerta activa de HU-06, marcando `source = "alert"`.
- **FR-101**: El sistema DEBE mostrar indicadores globales de solicitudes pendientes, aprobadas y recibidas, además de filtros por estado, producto y bodega que actualicen el listado y su contador de filas.
- **FR-102**: El sistema DEBE recalcular las alertas de HU-06 después de recepcionar una reposición, sin persistir una tabla de alertas.
- **FR-103**: El sistema DEBE tratar observaciones y cualquier texto ingresado en reposiciones de la misma forma que FR-046 y FR-092, escapándolo antes de mostrarlo.
- **FR-104**: El sistema DEBE permitir al administrador asignar y cambiar el cargo (`role`) de cualquier usuario del catálogo `USERS`, usando solo roles definidos.
- **FR-105**: El sistema DEBE rechazar un cargo no reconocido, conservar el cargo anterior y mostrar un mensaje de error claro.
- **FR-106**: El sistema DEBE asociar a cada rol una página de inicio (landing page) configurable.
- **FR-107**: El sistema DEBE abrir automáticamente la página de inicio configurada para el cargo del usuario activo al cargar la aplicación con el usuario activo por defecto y cada vez que cambie el usuario activo en la cabecera del ERP, sin mostrar primero una pantalla genérica.
- **FR-108**: El sistema DEBE permitir al administrador definir o redefinir la página de inicio de cada rol desde el panel de administración.
- **FR-109**: El sistema DEBE ofrecer un panel de administración con una matriz de permisos por rol para módulos, vistas y secciones.
- **FR-110**: El sistema DEBE permitir al administrador marcar o desmarcar, por rol, el acceso a cada módulo, vista o sección y conservar esa configuración.
- **FR-111**: El sistema DEBE permitir al administrador definir excepciones de permiso individuales por usuario para un módulo, vista o sección concreta.
- **FR-112**: El sistema DEBE aplicar la excepción individual cuando exista y, en caso contrario, el permiso configurado para el cargo del usuario, siempre dentro de los límites de FR-124.
- **FR-113**: El sistema DEBE mostrar u ocultar dinámicamente los elementos de navegación —barra lateral, menús y botones— según los permisos vigentes del usuario activo.
- **FR-114**: El sistema DEBE ocultar o deshabilitar en las vistas permitidas las acciones y los botones cuyo permiso no esté concedido al usuario activo.
- **FR-115**: El sistema DEBE bloquear el acceso directo por URL o ruta a vistas no autorizadas, mostrar un mensaje claro de falta de permiso y devolver al usuario a su página de inicio o a una vista permitida.
- **FR-116**: El sistema DEBE recalcular de inmediato los permisos y la navegación vigentes cuando cambia el cargo del usuario activo.
- **FR-117**: Cuando cambia el cargo del usuario activo, el sistema DEBE abrir de inmediato la landing page del nuevo rol, incluso si la vista actual continúa autorizada.
- **FR-118**: El sistema DEBE conservar siempre para el administrador el acceso al panel de administración de permisos y mostrar una advertencia si intenta desactivarlo.
- **FR-119**: El sistema DEBE usar una página de inicio predeterminada y mostrar un aviso no bloqueante cuando la landing page configurada no esté disponible.
- **FR-120**: El sistema NO DEBE modificar productos, bodegas, `STOCK`, movimientos, transferencias ni reposiciones como consecuencia de cambios de cargo, landing page o permisos.
- **FR-121**: El sistema NO DEBE alterar el usuario activo usado para registrar operaciones (FR-058, FR-073) cuando cambian el cargo o los permisos.
- **FR-122**: El sistema DEBE conservar la configuración de cargos, landing pages y permisos entre sesiones dentro del mismo navegador.
- **FR-123**: El sistema DEBE tratar los nombres de roles, módulos y secciones introducidos en la configuración de la misma forma que FR-046, FR-092 y FR-103 antes de mostrarlos.
- **FR-124**: El sistema DEBE aplicar la matriz de permisos y las excepciones individuales solo para restringir el acceso permitido por las reglas de negocio vigentes, incluida FR-099; la configuración NO DEBE otorgar a un cargo acciones que esas reglas le prohíban.

  **Matriz semilla canónica de permisos**:

  | Rol | Landing por defecto | Módulos/vistas permitidos | Secciones permitidas | Acciones permitidas | Panel |
  |---|---|---|---|---|---|
  | `administrador` | `dashboard` | `dashboard`, `products`, `warehouses`, `stock`, `movements`, `transfers`, `shipments`, `alerts`, `replenishments`, `entities`, `documents`, `search` | `product-form`, `warehouse-form`, `movement-form`, `transfer-form`, `shipment-form`, `replenishment-form`, `base-module-card`, `entity-form`, `document-form` | `products.manage`, `warehouses.manage`, `stock.configure_min`, `movements.register`, `movements.adjust`, `transfers.create`, `transfers.confirm`, `transfers.cancel`, `shipments.create`, `shipments.update_status`, `replenishments.create`, `replenishments.approve`, `replenishments.cancel`, `base.manage` | `admin:permissions` |
  | `supervisor_inventario` | `alerts` | `dashboard`, `products`, `warehouses`, `stock`, `movements`, `transfers`, `shipments`, `alerts`, `replenishments` | `movement-form`, `transfer-form`, `shipment-form`, `replenishment-form` | `shipments.create`, `shipments.update_status`, `replenishments.create` | — |
  | `encargado_bodega` | `movements` | `dashboard`, `products`, `warehouses`, `stock`, `movements`, `transfers`, `shipments`, `alerts`, `replenishments` | `movement-form`, `transfer-form`, `shipment-form`, `replenishment-form` | `movements.register`, `movements.adjust`, `transfers.create`, `transfers.confirm`, `transfers.cancel`, `shipments.create`, `shipments.update_status`, `replenishments.receive` | — |

  Los permisos de módulo y vista se siembran con `module:<nombre>` y `view:<nombre>` en `true` para los valores listados; las secciones no listadas y el panel no listado se siembran en `false`. Las claves `module:entities`, `module:documents`, `module:search` y sus vistas correspondientes pueden existir internamente para `administrador`, pero FR-136 las mantiene fuera de la navegación.

  **Acciones prohibidas por regla de negocio**: `administrador` → `action:replenishments.receive`; `supervisor_inventario` → `action:replenishments.approve`, `action:replenishments.cancel`, `action:replenishments.receive`, `action:base.manage`; `encargado_bodega` → `action:replenishments.create`, `action:replenishments.approve`, `action:replenishments.cancel`, `action:base.manage`. Una excepción individual NO puede conceder ninguna de esas acciones, y `admin:permissions` NO puede desactivarse para `administrador`.

  **Claves de persistencia canónicas**: `logistics:product_categories` (categorías), `logistics:products` (productos), `logistics:warehouses` (bodegas), `logistics:users` (usuarios), `logistics:stock` (existencias), `logistics:inventory_transactions` (movimientos), `logistics:orders` (órdenes), `logistics:shipments` (envíos), `logistics:stock_transfers` (transferencias), `logistics:replenishment_requests` (reposiciones), `logistics:roles` (cargos), `logistics:role_permissions` (matriz por cargo), `logistics:user_permission_overrides` (excepciones), `logistics:active_user_id` (usuario activo) y `logistics:demo_data_loaded_v1` (marca `"true"` del lote `logistics-demo-v1`). Las claves base `erp_base_module:entities` y `erp_base_module:documents` se conservan como capacidades internas, sin sección ni acceso visible. Cada clave de entidad almacena una lista completa con identificador único; las reglas de campos obligatorios, unicidad, referencias y estados se definen en `data-model.md`. Los cambios de permisos y el renombrado HU-15 NO DEBEN alterar existencias, movimientos, transferencias, reposiciones, órdenes ni envíos.

- **FR-125**: Cada orden generada DEBE registrar su identificador, el movimiento de origen y, tomados de ese movimiento, producto, bodega, cantidad, fecha y usuario; NO DEBE incluir importes ni estados.
- **FR-126**: El sistema DEBE asignar los identificadores de orden desde dos secuencias independientes por tipo (`OC` y `OV`), con formato `OC-0001`/`OV-0001`, correlativas y persistentes entre sesiones; NO DEBE reutilizar valores mientras se conserve el historial persistido en `logistics:orders`.
- **FR-127**: El sistema SOLO DEBE generar órdenes para movimientos con `transaction_type` "entrada" o "salida"; NO DEBE generarlas para ajustes, recepciones de reposición ni transferencias confirmadas.
- **FR-128**: Si no se puede generar la orden de un movimiento normal, el sistema DEBE rechazar toda la operación, no DEBE persistir el movimiento, NO DEBE modificar `STOCK` y DEBE mostrar el error de almacenamiento en el formulario de movimientos.
- **FR-129**: El sistema DEBE mostrar las órdenes en un panel dentro de la vista Movimientos para todo rol con acceso a Movimientos, sin crear una vista independiente ni un permiso nuevo en la matriz de HU-08.
- **FR-130**: El sistema DEBE permitir a los roles `administrador`, `supervisor_inventario` y `encargado_bodega` actualizar manualmente el estado de un envío, sujeto a lo dispuesto en FR-124.
- **FR-131**: El sistema DEBE asociar como máximo un envío a cada orden de venta y DEBE asociar cada envío a una sola orden de venta.
- **FR-132**: El sistema DEBE permitir actualizar el estado de un envío solo a la etapa secuencial siguiente (En bodega → En tránsito → En reparto → Entregado) y DEBE rechazar retrocesos o cambios posteriores al estado Entregado.
- **FR-133**: El sistema DEBE ofrecer una vista lógica "Seguimiento de envíos" para registrar, consultar y actualizar envíos y su historial, presentada como pestaña dentro de Movimientos, sin `nav-shipments` ni sección de primer nivel, con entradas `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status` en la matriz de permisos de HU-08, sujetas a FR-113, FR-114, FR-115 y FR-124; la ruta `#/shipments` DEBE redirigir a esa pestaña cuando esté permitida.
- **FR-134**: El sistema DEBE buscar transferencias por nombre de producto o identificador de transferencia usando coincidencia parcial e insensible a mayúsculas.
- **FR-135**: El menú lateral DEBE mostrar exclusivamente las secciones Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas como conjunto completo de destinos de navegación del menú lateral; el panel principal y el panel de administración de permisos quedan fuera de ese conjunto. El panel de administración de permisos DEBE abrirse desde un ícono en la barra superior, visible solo para el rol `administrador`.
- **FR-136**: El sistema NO DEBE exponer Entidades, Documentos ni Búsqueda como sección, botón, acción rápida ni ruta utilizable en la interfaz de 002; las capacidades de datos de la plantilla base permanecen fuera de la navegación.
- **FR-137**: Los buscadores y filtros definidos en Stock, Alertas, Transferencias, Movimientos y Seguimiento de envíos DEBEN operar dentro de su sección y NO DEBEN constituir un módulo global "Búsqueda".
- **FR-138**: Cada una de las seis secciones DEBE tener un único punto de acceso: el menú lateral; ningún otro elemento de la interfaz DEBE abrir esas secciones por duplicado.
- **FR-139**: El panel principal DEBE contener solo indicadores de número de productos, número de bodegas, stock total y alertas activas; NO DEBE incluir botones, enlaces ni tarjetas que dirijan a las secciones del menú.
- **FR-140**: El indicador de stock total del panel DEBE corresponder a la suma de `quantity_available` de todos los registros vigentes de `STOCK` y DEBE recalcularse cada vez que se muestra el panel, sin modificar los datos consultados.
- **FR-141**: El sistema DEBE permitir organizar cada sección en pestañas; cuando una sección las utilice, DEBE mostrar una pestaña activa por defecto y permitir cambiar de pestaña sin salir de la sección ni alterar datos.
- **FR-142**: La sección Movimientos DEBE ofrecer al menos las pestañas Entradas, Salidas, Historial, Órdenes y Seguimiento de envíos; el panel de órdenes de HU-09 y el seguimiento de envíos de HU-11 DEBEN mostrarse como pestañas dentro de Movimientos, sin crear secciones nuevas en el menú lateral.
- **FR-143**: Las pestañas NO DEBEN crear puntos de acceso adicionales a otras secciones ni repetir las entradas del menú lateral.
- **FR-144**: La visibilidad de las pestañas DEBE respetar la matriz de permisos de HU-08 y FR-124; una pestaña no autorizada se oculta o deshabilita sin bloquear el resto de la sección permitida.
- **FR-145**: El acceso directo por URL a una sección permitida DEBE abrir su pestaña por defecto sin constituir un acceso visible en la interfaz ni sustituir al menú lateral; el acceso a una sección no autorizada se rige por FR-115.
- **FR-146**: Cuando la barra lateral se contraiga conforme a FR-039, las seis secciones DEBEN seguir accesibles desde ella y el panel principal NO DEBE compensar con accesos adicionales.
- **FR-147**: Las solicitudes de reposición de HU-07 DEBEN gestionarse desde Alertas y el seguimiento de envíos de HU-11 desde Movimientos, conservando sus permisos vigentes y sin aparecer como secciones de primer nivel.

- **FR-148**: El catálogo semilla DEBE contener cuatro usuarios, en este orden y con estos valores: `user_id` 1, Millaray Antileo, `administrador`, `millaray.antileo@empresa.cl`; `user_id` 2, Tomás Wiegand, `encargado_bodega`, `tomas.wiegand@empresa.cl`; `user_id` 3, Yasmina Haddad, `supervisor_inventario`, `yasmina.haddad@empresa.cl`; `user_id` 4, Sebastián Quispe, `encargado_bodega`, `sebastian.quispe@empresa.cl`.
- **FR-149**: Los cuatro nombres semilla DEBEN ser ficticios, distintos entre sí y NO DEBEN corresponder a personas reales o públicas; los correos DEBEN seguir el patrón `nombre.apellido@empresa.cl` con la parte local sin tildes.
- **FR-150**: El cambio de datos de ejemplo DEBE conservar el orden de los usuarios, sus `user_id`, sus roles, la bodega asignada y los vínculos con movimientos, transferencias, reposiciones y envíos; SOLO DEBE modificar nombre y correo.
- **FR-151**: La asignación de bodegas en los datos de demostración DEBE determinarse por el rol y la posición del usuario en el catálogo y NO DEBE depender de la coincidencia con un nombre concreto; DEBE aplicarse al conjunto canónico `logistics-demo-v1` definido en HU-15, donde la bodega central usa el primer `encargado_bodega` y las demás usan el segundo.
- **FR-152**: El sistema DEBE actualizar automáticamente, al cargar, un usuario guardado SOLO si coincide exactamente con la semilla anterior en `user_id`, nombre y correo (`1`/`Ana Torres`/`ana.torres@empresa.cl`, `2`/`Carlos Pérez`/`carlos.perez@empresa.cl`, `3`/`María López`/`maria.lopez@empresa.cl` y `4`/`Jorge Soto`/`jorge.soto@empresa.cl`), pasándolo al nombre y correo definidos en FR-148; cualquier usuario modificado o distinto NO DEBE alterarse.
- **FR-153**: La migración DEBE ser idempotente, NO DEBE crear usuarios duplicados ni eliminar o modificar movimientos, stock, transferencias, reposiciones, envíos, roles, permisos ni bodegas asignadas, y DEBE conservar el usuario activo guardado. Si falla la escritura, DEBE restaurar el catálogo y el usuario activo a su estado previo y mostrar un error claro, sin marcar la migración como aplicada. El catálogo semilla DEBE seguir aplicándose únicamente cuando el catálogo de usuarios esté vacío.
- **FR-154**: El conjunto de datos de demostración canónico DEBE ser `logistics-demo-v1` con 5 categorías, 4 bodegas, 10 productos, 28 registros de stock derivados, 51 movimientos y 8 transferencias, según los valores y reglas definidos en HU-15.
- **FR-155**: Al confirmar una transferencia pendiente, el sistema DEBE revalidar que el `quantity_available` vigente en la bodega de origen cubre la cantidad solicitada; si no la cubre, DEBE rechazar la confirmación, conservar el estado `"pendiente"`, no modificar `STOCK` ni `confirmed_by` y mostrar un error claro de existencias insuficientes.
- **FR-156**: El cargador de `logistics-demo-v1` DEBE exponerse como acción utilitaria en la barra superior del espacio de trabajo, fuera del panel principal y del menú lateral; SOLO DEBE verse cuando `action:base.manage` esté concedida; DEBE publicar su resultado en `#demo-data-status`; con `alreadyLoaded: true` NO DEBE escribir y DEBE deshabilitar el botón; si falla la escritura DEBE restaurar el estado anterior, NO DEBE activar `logistics:demo_data_loaded_v1` y DEBE mostrar un error claro.

**Correspondencia de campos HU-09**: `movement_id` en esta especificación equivale a `transaction_id` en la persistencia; los valores `OC`/`OV` se expresan en `order_id` y `order_type` adopta `adquisicion`/`venta` en la implementación, sin renombrar campos persistidos.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

> Nota 2026-11-25: "Entidad" y "Documento" NO SON secciones ni conceptos visibles en la interfaz de 002 (HU-12). Permanecen como términos del módulo base en XR-001–XR-005 y en `ModuleConfig`; las entidades listadas a continuación sustentan las seis secciones visibles del menú lateral.

- **Producto (`PRODUCTS`)**: Artículo físico o bien gestionado en el inventario. Atributos clave: `product_id`, `sku` (único), `product_name`, `description`, `category_id` (FK a `PRODUCT_CATEGORIES`), `sale_price`, `cost_price`, `unit_of_measure`, `status` (activo/inactivo), `supplier`, dimensiones, `weight`, `created_at`, `updated_at`, `created_by` y `updated_by` para auditoría. `unit_price` se conserva solo como campo de compatibilidad con la plantilla base, sin reglas de negocio.
- **Categoría de Producto (`PRODUCT_CATEGORIES`)**: Catálogo semilla que clasifica los productos. Atributos clave: `category_id` y `category_name` (obligatorio, no vacío).
- **Bodega (`WAREHOUSES`)**: Ubicación física donde se almacenan los productos. Atributos clave: `warehouse_id`, `name` (único y obligatorio), `location` (obligatorio), `description` (opcional), `capacity` (mayor o igual a cero), `status` (activo/inactivo) y `responsable_id` (FK opcional a `USERS`; identifica al responsable principal de la bodega).
- **Stock (`STOCK`)**: Existencias disponibles de cada producto por bodega. Atributos clave: `stock_id`, `product_id`, `warehouse_id`, `quantity_available` (mayor o igual a cero), `min_stock_level` (nivel mínimo configurable por producto+bodega; genera alerta cuando `quantity_available` es menor o igual a `min_stock_level` y `min_stock_level` es mayor que cero), `expiration_date` (reservado para control de vencimientos futuro; opcional) y `update_date` (obligatorio). La combinación `product_id` + `warehouse_id` es única.
- **Movimiento de Inventario (`INVENTORY_TRANSACTIONS`)**: Registro histórico e inmutable de entradas, salidas y ajustes. Atributos clave: `transaction_id`, `product_id`, `warehouse_id`, `transaction_type` ("entrada", "salida", "ajuste_entrada" o "ajuste_salida"), `quantity` (mayor que cero), `user_id` (FK obligatoria a `USERS`) y `transaction_date` (automática). Cada movimiento actualiza de inmediato `STOCK.quantity_available`; no se edita ni se elimina.
- **Orden de Adquisición o Venta (`PURCHASE_SALES_ORDERS`)**: Registro informativo generado automáticamente desde un movimiento de entrada o salida normal. Atributos clave: `order_id` (identificador único y correlativo con formato `OC-0001`/`OV-0001`, con secuencias independientes y persistentes por tipo), `order_type` ("adquisicion" para OC y "venta" para OV; "OC"/"OV" en la documentación funcional), `transaction_id` (`movement_id` en esta especificación; FK obligatoria y única a `INVENTORY_TRANSACTIONS`) y, replicados del movimiento, `product_id`, `warehouse_id`, `quantity`, `order_date` y `user_id`. No incluye importes ni estados; es informativa e inmutable y no se elimina de forma independiente.
- **Envío al Comprador (`SHIPMENTS`)**: Seguimiento de una orden de venta (OV). Atributos clave: `shipment_id`, `order_id` (FK obligatoria y única a `PURCHASE_SALES_ORDERS`, limitada a órdenes `OV`), `carrier`, `tracking_code`, `status` ("En bodega", "En tránsito", "En reparto" o "Entregado") e historial de cambios con fecha, hora y usuario responsable. No genera movimientos de inventario ni modifica `STOCK`.
- **Transferencia de Stock (`STOCK_TRANSFERS`)**: Documento transaccional que traslada productos entre bodegas. Atributos clave: `transfer_id`, `product_id`, `source_warehouse_id`, `target_warehouse_id`, `quantity` (mayor que cero), `status` ("pendiente", "confirmada" o "cancelada"), `transfer_date` (automática), `created_by` (FK obligatoria a `USERS`; usuario que registra la solicitud), `confirmed_by` (FK a `USERS`; obligatoria al confirmar la recepción) y `cancelled_by` (FK a `USERS`; obligatoria al cancelar una transferencia pendiente).
- **Solicitud de Reposición (`REPLENISHMENT_REQUESTS`)**: Documento que solicita reponer un producto en una bodega. Atributos clave: `request_id`, `product_id` (FK a `PRODUCTS`), `warehouse_id` (FK a `WAREHOUSES`, solo activas), `quantity` (entera mayor que cero), `observation` (opcional), `status` ("pendiente", "aprobada", "recibida" o "cancelada"), `request_date` (automática), `created_by` (FK a `USERS`), `approved_by`/`approved_at`, `received_by`/`received_at`, `cancelled_by`/`cancelled_at`, `movement_id` (FK a `INVENTORY_TRANSACTIONS`; presente al recibir) y `source` ("manual" o "alert").
- **Usuario (`USERS`)**: Persona que opera el sistema y registra movimientos y transferencias. Atributos clave: `user_id`, `user_name`, `role`, `email` y `assigned_warehouse_id` (FK opcional a `WAREHOUSES`; identifica la bodega operativa asignada al usuario).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados y el ciclo de vida de estados de documentos. Consulte `specs/001-erp-base-module/data-model.md` para su forma completa.
- **Cargo/Rol (`ROLES`)**: Catálogo de cargos del sistema (`administrador`, `supervisor_inventario`, `encargado_bodega`). Atributos clave: identificador del rol, nombre visible y página de inicio asignada. Cada usuario de `USERS` tiene exactamente un cargo vigente.
- **Matriz de Permisos por Rol (`ROLE_PERMISSIONS`)**: Configuración que indica, para cada cargo, qué módulos, vistas y secciones son visibles. Atributos clave: cargo, módulo/vista/sección y estado de visibilidad (permitido o denegado). Se administra desde el panel de administración.
- **Excepción de Permiso por Usuario (`USER_PERMISSION_OVERRIDES`)**: Regla individual que ajusta la visibilidad de un módulo, vista o sección para un usuario específico. Atributos clave: usuario, módulo/vista/sección y estado de visibilidad; prevalece sobre la matriz del cargo y no se duplica para la misma sección.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden identificar y abrir cada una de las seis secciones desde el menú lateral en menos de 5 segundos en el primer uso.
- **SC-002**: El 100% de las revisiones de la interfaz confirma que no aparecen Entidades, Documentos ni Búsqueda como sección, botón ni acceso rápido.
- **SC-003**: Al menos el 90% de los usuarios de prueba encuentra la sección correcta usando solo el menú lateral, sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 registros por sección sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar cualquier sección desde el menú lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad operativa existente de productos, bodegas, stock, movimientos, transferencias, alertas, reposiciones, órdenes y envíos sigue operativa tras el rediseño de la interfaz (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las seis secciones sin perder ningún dato de productos, bodegas, stock, movimientos, transferencias ni alertas.
- **SC-008**: Un desarrollador puede producir un módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Los indicadores del panel siempre coinciden con los registros vigentes de productos, bodegas, stock total y alertas activas cada vez que se muestra el panel.
- **SC-011**: Los usuarios administradores pueden registrar un nuevo producto sin errores de navegación en menos de 1 minuto.
- **SC-012**: El sistema detecta y bloquea los intentos de duplicación de SKU en menos de 1 segundo tras la solicitud de guardado, manteniendo la sesión operativa.
- **SC-013**: Las modificaciones realizadas a un producto se reflejan en el listado general inmediatamente, sin acciones adicionales del usuario.
- **SC-014**: El 100% de los intentos de guardado con datos obligatorios faltantes se rechazan con un mensaje claro sin registrar ningún dato.
- **SC-015**: Los supervisores pueden consultar las existencias de un producto en todas sus bodegas en menos de 10 segundos.
- **SC-016**: El total mostrado coincide con la suma de `quantity_available` de las bodegas del producto en el 100% de las consultas.
- **SC-017**: Los filtros y búsquedas por producto y bodega devuelven resultados correctos en menos de 2 segundos para hasta 500 registros de stock.
- **SC-018**: La consulta de stock no modifica existencias ni movimientos en el 100% de las operaciones.
- **SC-019**: Un movimiento de entrada, salida o ajuste se registra en menos de 30 segundos.
- **SC-020**: El 100% de las salidas sin stock suficiente son rechazadas sin alterar `STOCK`.
- **SC-021**: El 100% de los movimientos registrados conservan su usuario y fecha automática, sin opciones de edición ni eliminación.
- **SC-022**: El stock mostrado coincide con el historial de movimientos en el 100% de las consultas.
- **SC-023**: Los administradores pueden registrar una nueva bodega completa en menos de 1 minuto.
- **SC-024**: El listado y la actualización de los datos de las bodegas se reflejan en la interfaz de usuario en menos de 2 segundos.
- **SC-025**: El 100% de los intentos de realizar operaciones sobre bodegas inactivas son bloqueados correctamente por el sistema.
- **SC-026**: El 100% de los registros de bodegas nuevas validan y previenen duplicidades de nombres o identificadores.
- **SC-027**: Los usuarios pueden registrar una solicitud de transferencia en menos de 45 segundos.
- **SC-028**: El 100% de los intentos de transferencia entre bodegas idénticas o sin stock suficiente son bloqueados por las validaciones.
- **SC-029**: El stock de ambas bodegas se actualiza en la interfaz de forma inmediata al confirmar la recepción.
- **SC-030**: El administrador puede configurar o actualizar `min_stock_level` de un producto en una bodega en menos de 30 segundos.
- **SC-031**: El 100% de los registros de `STOCK` con `quantity_available` menor o igual a `min_stock_level` (y mínimo mayor que cero) aparecen como alerta.
- **SC-032**: El 100% de las alertas desaparecen automáticamente en menos de 2 segundos después de que el stock supere el mínimo.
- **SC-033**: Los filtros de alertas por producto y bodega devuelven resultados correctos en menos de 2 segundos para hasta 500 registros de stock.
- **SC-034**: El 0% de las consultas de alertas modifica existencias o movimientos.
- **SC-035**: Un usuario puede crear una solicitud de reposición desde una alerta en menos de 30 segundos, con producto, bodega y déficit preseleccionados.
- **SC-036**: El 100% de las solicitudes creadas permanecen "pendientes" sin modificar `STOCK` ni generar movimientos.
- **SC-037**: El 100% de las recepciones generan un único movimiento de entrada y aumentan el stock exactamente en la cantidad solicitada.
- **SC-038**: El 0% de las recepciones duplicadas modifica el stock o el historial de movimientos.
- **SC-039**: El encargado de bodega solo visualiza solicitudes aprobadas en el 100% de los casos y no puede crear, aprobar ni cancelar.
- **SC-040**: El 100% de las cargas de la aplicación y de los cambios de usuario activo abren la página de inicio configurada para el cargo correspondiente.
- **SC-041**: El administrador puede asignar o cambiar el cargo de un usuario en menos de 30 segundos.
- **SC-042**: El 100% de los cambios de cargo y de permisos se reflejan en la navegación en menos de 2 segundos.
- **SC-043**: El 100% de los intentos de acceso directo por URL a vistas no autorizadas son bloqueados con un mensaje claro.
- **SC-044**: El 0% de los elementos de navegación no autorizados se muestran al usuario activo en los tres roles definidos.
- **SC-045**: El 100% de las excepciones individuales prevalecen sobre el permiso del cargo en casos de conflicto.
- **SC-046**: Al menos el 95% de los usuarios de prueba comprende por qué no puede acceder a una vista a partir del mensaje mostrado.
- **SC-047**: El 0% de los cambios de cargo o permisos modifica datos de productos, bodegas, stock, movimientos, transferencias ni reposiciones.
- **SC-048**: El administrador conserva acceso al panel de permisos en el 100% de los casos, incluso si intenta desactivarlo.
- **SC-049**: La aplicación permanece operativa en el 100% de los casos cuando falta una landing page configurada o esta deja de estar disponible.
- **SC-050**: El 100% de los intentos de la matriz por otorgar una acción prohibida por una regla de negocio mantienen la restricción vigente y no conceden el acceso.
- **SC-051**: El 100% de los movimientos nuevos de entrada o salida normales registrados desde Movimientos genera exactamente una orden vinculada por `transaction_id`, con `OC-0001`/`OV-0001` visible en el historial y en el panel, sin permisos adicionales para todo rol con acceso a Movimientos; se verifica con `tests/unit/orders.test.js` y `tests/integration/orders.test.js`, sin backfill de movimientos legacy.
- **SC-052**: El 100% de las búsquedas HU-10 por nombre de producto o identificador de transferencia devuelve solo coincidencias parciales e insensibles a mayúsculas, conservando la ordenación por `transfer_id` descendente y los nombres enriquecidos; se verifica con `tests/unit/transfers.test.js`.
- **SC-053**: El 100% de los filtros HU-10 por estado, producto, bodega de origen y bodega de destino, aplicados por separado y en combinación con el buscador, devuelve la intersección correcta y actualiza el contador; se verifica con `tests/unit/transfers.test.js` y `tests/integration/transfers.test.js`.
- **SC-054**: El 100% de las combinaciones de búsqueda y filtros HU-10 sin coincidencias muestra `transfer-list-empty`, y el 100% de las limpiezas restaura el listado completo por defecto; se verifica con `tests/integration/transfers.test.js`.
- **SC-055**: El 0% de las consultas HU-10 modifica transferencias, stock, movimientos o catálogos, y la sección Transferencias conserva el listado sin filtros al limpiarlos; se verifica con `tests/unit/transfers.test.js` y `tests/integration/transfers.test.js`.
- **SC-056**: El 100% de las órdenes `OV` existentes puede registrar como máximo un envío HU-11, el 100% de los intentos con `OC` o con una `OV` ya vinculada se rechaza y el 0% de estos registros crea movimientos de inventario; se verifica con `tests/unit/shipments.test.js`.
- **SC-057**: El 100% de los envíos HU-11 rechaza transportista, código de seguimiento, usuario creador o actor vacíos o inválidos y estados fuera de `en_bodega`, `en_transito`, `en_reparto` o `entregado`, sin persistir registros parciales; se verifica con `tests/unit/storage.test.js` y `tests/unit/shipments.test.js`.
- **SC-058**: El 100% de los avances HU-11 permitidos agrega un evento `history` con `changed_at` ISO y `changed_by` válido, y el 100% de retrocesos, saltos, repeticiones y cambios desde `entregado` se rechaza; se verifica con `tests/unit/shipments.test.js` y `tests/integration/shipments.test.js`.
- **SC-059**: El 100% de las búsquedas HU-11 por identificador de OV, código de seguimiento o estado devuelve los envíos correctos, con etiquetas visibles para los cuatro estados y su historial; se verifica con `tests/unit/shipments.test.js` y `tests/integration/shipments.test.js`.
- **SC-060**: El 100% de la navegación, acceso directo `#/shipments` y acciones de registro o avance HU-11 respeta `module:shipments`, `view:shipments`, `action:shipments.create` y `action:shipments.update_status` bajo FR-113, FR-114, FR-115 y FR-124; se verifica con `tests/unit/permissions.test.js`, `tests/integration/permissions.test.js` y `tests/integration/workspace-shell.test.js`.
- **SC-061**: El 100% de las operaciones HU-11 persiste envíos e historial bajo `logistics:shipments` tras recarga, sin modificar stock, movimientos ni órdenes, y sin conexiones automáticas con servicios de transportistas; se verifica con `tests/integration/shipments.test.js` y la validación manual de `quickstart.md`.
- **SC-062**: El 100% de las sesiones de los tres roles muestra exactamente las seis secciones Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas en el menú lateral, con 0% de apariciones de Entidades, Documentos o Búsqueda.
- **SC-063**: El 100% de las aperturas de sección se realiza desde el menú lateral y el panel principal contiene 0 enlaces o botones hacia esas secciones.
- **SC-064**: Al menos 19 de 20 usuarios de prueba localizan la sección requerida sin ayuda y en menos de 5 segundos usando únicamente el menú lateral; el método es una prueba manual registrada en T067/T145 con las seis secciones solicitadas por rol y cronómetro desde que se muestra la pantalla hasta que se abre la sección correcta.
- **SC-065**: El 100% de las veces que se muestra el panel principal, sus cuatro indicadores coinciden con los datos vigentes y el stock total es exactamente la suma de `quantity_available` de todos los registros de `STOCK`.
- **SC-066**: El 100% de los cambios de pestaña dentro de una sección modifica solo el contenido mostrado, sin salir de la sección, sin duplicar accesos y sin alterar datos; el 0% de los cambios genera registros nuevos.
- **SC-067**: El 100% de las visitas a Movimientos muestra las pestañas Entradas, Salidas, Historial, Órdenes y Seguimiento de envíos, con las órdenes y el seguimiento de envíos dentro de Movimientos y sin que aparezcan secciones nuevas en el menú lateral.
- **SC-068**: El 100% de las pestañas no autorizadas permanece oculto o deshabilitado mientras el resto de la sección permitida sigue operativo.
- **SC-069**: El 0% de los accesos directos por URL a secciones no autorizadas se abre; el 100% se bloquea con mensaje claro conforme a FR-115.
- **SC-070**: Con la barra lateral contraída, el 100% de las seis secciones sigue siendo accesible y el panel principal mantiene 0 accesos adicionales.

- **SC-071**: El 100% de las instalaciones con catálogo vacío muestra los cuatro usuarios semilla con los nombres, correos, identificadores, roles y orden definidos, y el 100% de los correos no contiene tildes en la parte local.
- **SC-072**: El 100% de los usuarios guardados que coincide exactamente con la semilla anterior se actualiza en la primera carga, mientras el 0% de los usuarios modificados o distintos se altera; cargas posteriores producen 0 cambios adicionales.
- **SC-073**: El 0% de los registros de stock, movimientos, transferencias, reposiciones, envíos, bodegas asignadas, roles y permisos cambia como consecuencia del renombrado, y el 100% de las sesiones conserva el usuario activo guardado.
- **SC-074**: El 100% de las cargas de datos de demostración asigna las bodegas según el rol y la posición del usuario, sin que el cambio de nombre modifique esa asignación.
- **SC-075**: El 100% de los cuatro nombres semilla es único y no corresponde a personas reales o públicas según revisión manual, y no aparece ningún usuario duplicado tras la migración.
- **SC-076**: El 100% de las cargas del conjunto canónico `logistics-demo-v1` produce exactamente 5 categorías, 4 bodegas, 10 productos, 28 registros de stock, 51 movimientos y 8 transferencias, y cargas posteriores producen 0 escrituras adicionales.
- **SC-077**: El 100% de las confirmaciones de transferencia con stock insuficiente en origen se rechaza sin cambios en `STOCK`, estado ni `confirmed_by`, y el 100% de las confirmaciones con stock suficiente descuenta y incrementa una sola vez cada bodega.
- **SC-078**: El 100% de las sesiones sin `action:base.manage` no muestra el botón «Cargar datos de demostración»; el 100% de las cargas con permiso publica el resultado en `#demo-data-status`, deshabilita el botón ante `alreadyLoaded: true` sin escribir, y ante un fallo de escritura restaura el estado previo sin activar `logistics:demo_data_loaded_v1`; se verifica con `tests/unit/demo-data.test.js` y una prueba de integración de la barra superior.
- **Criterio de terminado del MVP**: Las tareas `T031`, `T036`, `T048`, `T065`, `T067`, `T107`, `T136` y `T145` son bloqueantes; cada una debe cerrarse con evidencia automatizada o revisión manual registrada antes de declarar terminado el MVP canónico `HU-01`–`HU-15`.
- **Criterio de calidad obligatorio**: Antes de cerrar el MVP DEBEN configurarse y ejecutarse `npm run lint` (ESLint sobre `src/`, `tests/` y archivos JavaScript de la raíz, con `--max-warnings=0`), `npm run format:check` (Prettier en modo `--check` sobre código, configuración, HTML, CSS y Markdown de la feature), `npm run analyze` (análisis estático con el mismo conjunto ESLint y reglas estrictas de corrección/mantenibilidad), `npm test` y `npm run build`; todo debe terminar con código 0, sin errores ni advertencias sin resolver que afecten corrección o mantenibilidad. La ausencia de estas verificaciones impide declarar conformidad con la constitución del proyecto.

## Trazabilidad de Implementación

| Historia | Estado documentado | Dominio | Pruebas | Tareas |
|---|---|---|---|---|
| HU-01 Registro y Modificación de Productos | Implementada | `src/domain/products.js` | `tests/unit/products.test.js`, `tests/integration/products.test.js` | T014–T022 |
| HU-02 Control de Stock | Implementada | `src/domain/stock.js` | `tests/unit/stock.test.js`, `tests/integration/stock.test.js` | T047–T053 |
| HU-03 Entradas y Salidas de Inventario | Implementada; atomicidad cerrada en T081; T031 y T036 con evidencia parcial | `src/domain/movements.js` | `tests/unit/movements.test.js`, `tests/integration/movements.test.js` | T031–T038, T081 |
| HU-04 Registro y Administración de Bodegas | Implementada | `src/domain/warehouses.js` | `tests/unit/warehouses.test.js`, `tests/integration/warehouses.test.js` | T023–T030 |
| HU-05 Transferencias entre Bodegas | Implementada; atomicidad cerrada en T082 | `src/domain/transfers.js` | `tests/unit/transfers.test.js`, `tests/integration/transfers.test.js` | T039–T046, T082 |
| HU-06 Alertas de Stock Mínimo | Implementada | `src/domain/alerts.js` | `tests/unit/alerts.test.js`, `tests/integration/alerts.test.js` | T054–T062 |
| HU-07 Solicitudes de Reposición | Implementada; atomicidad cerrada en T083 | `src/domain/replenishments.js`, `src/domain/permissions.js` | `tests/unit/replenishments.test.js`, `tests/integration/replenishments.test.js` | T069–T080, T083 |
| HU-08 Gestión de Roles, Redirección Inicial y Control de Visibilidad | Implementada; matriz y panel verificados por pruebas automatizadas; T085–T094 completados, T067 pendiente de validación manual general | `src/domain/permissions.js`, `src/components/permissions-panel.js` | `tests/unit/permissions.test.js`, `tests/integration/permissions.test.js` | T085–T094 |
| HU-09 Gestión de órdenes de adquisición y venta | Implementada y verificada por pruebas automatizadas; T104–T106 y T108–T110 completos, T107 diferida | `src/domain/orders.js`, `src/domain/movements.js`, `src/storage.js`, `src/components/order-list.js`, `src/components/movement-form.js`, `src/app.js`, `index.html` | `tests/unit/orders.test.js`, `tests/unit/storage.test.js`, `tests/integration/orders.test.js` | T095–T110 (T107 diferida) |
| HU-10 Buscador y filtros para transferencias entre bodegas | Implementada; T111–T118 completos, T136 con confirmación manual parcial de buscador/filtros y criterios pendientes | `src/domain/transfers.js`, `src/components/transfer-list.js`, `src/app.js` | `tests/unit/transfers.test.js`, `tests/integration/transfers.test.js` | T111–T118 |
| HU-11 Seguimiento de envíos al comprador | Implementada; T119–T135 y T137 completos, T136 con confirmación manual parcial de la pestaña Envíos y criterios pendientes | `src/storage.js`, `src/domain/shipments.js`, `src/domain/seed.js`, `src/domain/permissions.js`, `src/components/shipment-form.js`, `src/components/shipment-list.js`, `src/app.js` | `tests/unit/storage.test.js`, `tests/unit/shipments.test.js`, `tests/unit/permissions.test.js`, `tests/integration/shipments.test.js`, `tests/integration/permissions.test.js`, `tests/integration/workspace-shell.test.js` | T119–T137 |
| HU-12 Navegación reducida a las secciones de logística | Implementada y verificada; accesos base/alias ocultos sin borrar funciones | `index.html`, `src/app.js`, `src/components/shell.js`, `src/styles.css` | `tests/integration/workspace-shell.test.js`, `tests/integration/permissions.test.js` | T146, T148, T150–T152 |
| HU-13 Organización opcional de secciones en pestañas | Implementada y verificada; Movimientos y Alertas con pestañas y guard por permiso | `index.html`, `src/app.js`, `src/styles.css` | `tests/integration/workspace-shell.test.js`, `tests/integration/dashboard.test.js` | T147–T152 |
| HU-14 Acceso único desde el menú lateral y panel de indicadores | Implementada; panel con cuatro indicadores y sin accesos rápidos visibles, verificado por pruebas automatizadas; T145 con confirmación manual parcial de menú/pestañas y revisión visual pendiente de dashboard/panel de permisos | `index.html`, `src/components/dashboard.js`, `src/app.js` | `tests/integration/dashboard.test.js`, `tests/integration/workspace-shell.test.js` | T147, T148, T150–T152 |
| HU-15 Datos de ejemplo con nombres ficticios variados | Implementada y verificada; T153–T158 completos con 34 archivos/308 pruebas y build correcto el 2026-11-26 | `src/domain/seed.js`, `src/domain/demo-data.js`, `src/storage.js` | `tests/integration/shipments.test.js`, `tests/unit/demo-data.test.js`, `tests/unit/storage.test.js` | T153–T158 |

La ejecución completa de la suite quedó registrada como T110; T066 conserva su evidencia histórica de 2026-11-22 y la verificación de 2026-11-25: `npx vitest run` con 34 archivos/302 pruebas y `npm run build` correcto. La verificación final de HU-12 a HU-14 se registró en T152: 34 archivos/304 pruebas OK y build correcto el mismo día. La verificación vigente de HU-15 se registró en T158: 34 archivos/308 pruebas OK y build correcto el 2026-11-26.

**Resolución de la contradicción (2026-11-25)**: HU-12 a HU-14 se implementaron sin borrar funcionalidad: Entidades, Documentos, Búsqueda, Reposiciones y Envíos conservan sus vistas, formularios y acciones internas, pero quedan ocultos y sin accesos visibles. El menú lateral expone seis secciones, el panel principal solo cuatro indicadores, y Órdenes/Envíos y Reposiciones viven como pestañas dentro de Movimientos y Alertas. T068 quedó reconciliado y T146–T152 verificados con suite completa y build correcto; no se crearon ramas, commits ni push adicionales durante esta corrección documental, conservando el historial previo del repositorio.

## REGISTRO INCREMENTAL (HU-09 a HU-14)

| Historia | Funcionalidad incorporada | Archivos modificados | Evidencia de verificación |
|---|---|---|---|
| HU-09 Gestión de órdenes de adquisición y venta | Generación automática de `OC`/`OV` desde entradas y salidas normales, secuencias independientes, persistencia en `logistics:orders`, rollback atómico y panel de órdenes dentro de Movimientos sin módulo ni permiso propio. | `src/domain/orders.js`, `src/domain/movements.js`, `src/storage.js`, `src/components/movement-form.js`, `src/components/order-list.js`, `src/app.js`, `index.html` | T095–T106, T108–T110; `tests/unit/orders.test.js`, `tests/unit/storage.test.js`, `tests/integration/orders.test.js`. T107 permanece diferida. |
| HU-10 Buscador y filtros para transferencias entre bodegas | Búsqueda parcial y filtros combinados por producto, bodegas y estado sobre el listado de transferencias existente. | `src/domain/transfers.js`, `src/components/transfer-list.js`, `src/app.js`, `index.html` | T111–T118, T134; `tests/unit/transfers.test.js`, `tests/integration/transfers.test.js`. T136 tiene confirmación manual parcial de buscador/filtros; faltan criterios detallados en T136. |
| HU-11 Seguimiento de envíos al comprador | Envío 1:1 por orden de venta, estados secuenciales, historial con fecha y usuario, restricciones por permiso y actualización manual sin clientes HTTP ni temporizadores externos. | `src/storage.js`, `src/domain/shipments.js`, `src/domain/seed.js`, `src/domain/permissions.js`, `src/components/shipment-form.js`, `src/components/shipment-list.js`, `src/app.js`, `index.html` | T119–T135, T137; `tests/unit/storage.test.js`, `tests/unit/shipments.test.js`, `tests/unit/permissions.test.js`, `tests/integration/shipments.test.js`, `tests/integration/permissions.test.js`, `tests/integration/workspace-shell.test.js`. T136 tiene confirmación manual parcial de la pestaña Envíos; faltan 1:1, transiciones, permisos, persistencia y ausencia de conexiones. |
| HU-12 Navegación reducida a las secciones de logística | Menú lateral limitado a Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas; accesos base/alias ocultados sin eliminar vistas, formularios, datos ni permisos. | `index.html`, `src/app.js`, `src/components/shell.js`, `src/styles.css` | T068, T146, T148, T150–T152; `tests/integration/workspace-shell.test.js`, `tests/integration/permissions.test.js`. |
| HU-13 Organización opcional de secciones en pestañas | Pestañas de Movimientos (Entradas, Salidas, Historial, Órdenes, Seguimiento de envíos) y Alertas (Alertas, Reposiciones), con alias de rutas y guard por permiso; el cambio de pestaña no altera datos. | `index.html`, `src/app.js`, `src/styles.css` | T147–T152; `tests/integration/workspace-shell.test.js`, `tests/integration/dashboard.test.js`, `tests/integration/permissions.test.js`. |
| HU-14 Acceso único desde el menú lateral y panel de indicadores | Panel principal reducido a cuatro indicadores, sin accesos rápidos ni enlaces a secciones; navegación única desde la barra lateral. | `index.html`, `src/components/dashboard.js`, `src/app.js` | T147, T148, T150–T152; `tests/integration/dashboard.test.js`, `tests/integration/workspace-shell.test.js`. T145 tiene confirmación manual parcial de menú/pestañas; falta revisión visual de dashboard y panel de permisos. |

Los ajustes visuales intermedios de Fase 16 se conservan: T138–T144 completos; T145 mantiene `[ ]` con confirmación manual parcial del usuario y revisión visual pendiente de dashboard, panel de permisos y estilos globales.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de la sección en la que se aplica, no sobre un índice global de entidades.
- Los formularios de alta y edición se integran en las secciones Productos, Bodegas, Movimientos, Transferencias y Alertas según corresponda; no existe una pantalla de gestión genérica.
- La navegación entre áreas ocurre mediante una barra lateral persistente con las seis secciones de logística; el panel principal solo muestra indicadores y no aloja formularios ni listados operativos.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos permanecen disponibles entre sesiones dentro del mismo navegador y no se ven afectados por la navegación entre pantallas.
- El contenido introducido por el usuario (nombres, descripciones, notas) DEBE tratarse de forma segura antes de mostrarse para evitar la ejecución de contenido no deseado.
- `PRODUCT_CATEGORIES` y `USERS` se precargan como catálogos semilla; no hay pantallas de administración de categorías ni de usuarios en esta iteración.
- El módulo no requiere autenticación en esta iteración; los usuarios que registran movimientos, transferencias y reposiciones se toman del usuario activo del ERP seleccionado en la cabecera, sin selector manual en los formularios. La afirmación histórica de que los roles de `USERS` eran solo informativos quedó superada por HU-08 y FR-073/FR-104–FR-124: los roles gobiernan permisos simulados sin autenticación real.
- Los usuarios con rol administrador cuentan con los privilegios de seguridad necesarios para crear, editar y cambiar el estado de productos y bodegas.
- El SKU es un código alfanumérico estandarizado por la empresa; no se genera automáticamente en esta versión (el usuario lo digita).
- No se contempla el manejo de imágenes múltiples de productos en esta iteración inicial; se trabajará únicamente con datos alfanuméricos.
- La gestión de impuestos sobre el producto se considerará resuelta de manera global o en una capa de facturación posterior; el módulo almacena el valor neto.
- Las existencias se derivan de los movimientos de HU-03 y de las transferencias confirmadas de HU-05, que también actualizan `STOCK` y pueden crear el registro en la bodega destino; la HU-02 no genera ni corrige stock.
- Las alertas de stock mínimo (HU-06) se derivan al consultar `STOCK` comparando `quantity_available` con `min_stock_level`; no se persiste una tabla de alertas.
- La reposición (HU-07) persiste solicitudes en su propia clave de `localStorage`; la recepción delega en la lógica de movimientos inmutables de HU-03 y nunca edita un movimiento existente.
- `min_stock_level` se configura por combinación producto+bodega y solo el administrador puede modificarlo.
- El umbral de alerta es inclusivo: se genera alerta cuando `quantity_available` es igual o menor que `min_stock_level`.
- Las alertas son informativas y no bloquean movimientos ni transferencias; no se envían notificaciones externas en esta iteración.
- Un registro de `STOCK` sin mínimo configurado o con `min_stock_level` igual a cero no genera alerta.
- Los productos y bodegas provienen de HU-01 y HU-04 respectivamente; la consulta de stock no crea ni edita esas entidades.
- Las bodegas y productos inactivos se muestran solo para consulta de sus existencias, sin permitir operaciones sobre ellos.
- El estado (Activo/Inactivo) de productos y bodegas proviene de HU-01 y HU-04; el modelo de datos incluye ese campo en `PRODUCTS` y `WAREHOUSES`.
- La fecha de vencimiento y el control por lotes quedan fuera de HU-03; se abordarán en una historia posterior.
- Una bodega representa una ubicación física real dentro de la operación logística de la organización.
- Las validaciones de duplicidad de nombres de bodegas se realizan a nivel del catálogo de bodegas o de la lógica de negocio central.
- Ambas bodegas participantes deben estar en estado activo al momento de crear la solicitud de transferencia.
- Las transferencias confirmadas no vuelven a actualizar el stock para evitar duplicaciones.
- Una transferencia solo puede cancelarse mientras está en estado "pendiente"; al cancelarse no se modifica `STOCK` porque los descuentos solo ocurren al confirmar.
- Confirmar una transferencia requiere que tanto la bodega de origen como la de destino estén activas en ese momento.
- El SKU de un producto puede modificarse en cualquier momento, incluso con movimientos asociados, porque estos referencian `product_id` y no `sku`.
- Un producto puede desactivarse aunque tenga stock físico; el stock se conserva y se muestra solo para consulta, igual que para una bodega inactiva.
- El catálogo `USERS` existente es la fuente de usuarios y su campo `role` es editable por el administrador; los roles disponibles son `administrador`, `supervisor_inventario` y `encargado_bodega`, coherentes con FR-073.
- Cada rol tiene una página de inicio por defecto (administrador → Panel general, supervisor_inventario → Alertas/Control de Stock, encargado_bodega → Movimientos/Control de Stock) que el administrador puede redefinir.
- La visibilidad por módulo, vista o sección se configura con una matriz por rol y se ajusta con excepciones individuales por usuario, que prevalecen sobre el rol.
- El control de visibilidad, el ocultamiento de navegación y el bloqueo de acceso directo por URL son mecanismos de interfaz dentro del modelo de roles simulados; no constituyen seguridad real y la autenticación/autorización reales quedan fuera de alcance (FR-073).
- El panel de administración de permisos es accesible solo para el rol administrador, se abre desde un ícono en la barra superior y conserva siempre ese acceso para evitar una configuración irreversible.
- Cambiar el cargo de un usuario no altera su bodega asignada ni el usuario activo que registran movimientos, transferencias y reposiciones (FR-058, FR-073).
- Solo los movimientos normales de entrada y salida generan órdenes; las transferencias confirmadas ya quedan trazadas en `STOCK_TRANSFERS` y no producen órdenes adicionales (FR-127).
- La restricción a seis secciones se refiere únicamente al menú lateral; el panel general sigue siendo la página de inicio configurable de HU-08 y el panel de administración de permisos permanece fuera del menú de secciones.
- Las búsquedas y filtros internos de Stock, Alertas, Transferencias, Movimientos y Seguimiento de envíos no son el módulo "Búsqueda" eliminado; continúan dentro de su sección.
- Las reposiciones se gestionan desde Alertas y las órdenes y el seguimiento de envíos desde Movimientos, sin crear secciones adicionales de primer nivel (FR-147).
- El menú lateral no incluye una entrada "Panel"; el panel principal se alcanza como página de inicio configurada y desde la identidad de marca de la aplicación, sin convertirse en una sección más ni duplicar accesos.
- El stock total del panel es la suma de `quantity_available` de todos los registros vigentes de `STOCK`, incluidos los de productos o bodegas inactivos que se conservan para consulta, y se recalcula cada vez que se muestra el panel.
- El panel principal es de solo lectura: no contiene formularios, acciones rápidas ni enlaces a las seis secciones.
- Las landing pages configuradas para supervisor y encargado pueden abrir Alertas o Movimientos como página de inicio sin añadir controles de navegación duplicados; el menú lateral conserva el único punto de acceso visible a esas secciones.
- "Panel general" (HU-08), "panel principal" (HU-14) y "panel de inicio" del módulo base designan la misma vista de solo indicadores cuando el rol del usuario la tiene configurada como página de inicio.
- Las pestañas son opcionales por sección; cuando se usen, conservan el contexto de la sección, respetan HU-08/FR-124 y no alteran los permisos ni los datos.
- Los cuatro usuarios semilla son identidades ficticias de demostración; el cambio de sus nombres y correos no cambia su identidad persistente representada por `user_id`.
- La migración de la semilla anterior se limita a los registros que coinciden exactamente con ella; cualquier edición previa del usuario se considera intencional y se conserva.
