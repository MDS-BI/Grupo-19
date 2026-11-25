Feedback Avance 01 (26/10/26)

- muy buen avance, ojo si con las imagenes (para speckit deberian ser solo referenciales).
- faltan las tablas como texto en el data-model

Proximos pasos:
 
- rectificar puntos anteriores 
- trabajar en los specs (historias de usuario, US) para definir tareas
- dividirse las US y tareas para una siguiente iteracion (avances cada semana)
- ejecutar una version integrada de prueba

Feedback Avance 02 (2/11/26)

- Buen manejo integrado del repositorio
- Se insiste en el manejo de los specs (revisar video). Cada carpeta debe tener toda la estructura base (y editar sobre ella).
- Se observan historias de usuario por algunos miembro del grupo 
- Evitar trabajar con modelos de IA fuera de speckit en local, porque crean ramas nuevas y se pierde la integridad del proyecto

Proximos pasos:

- crear tareas a partir de los specs
- hacer primera implmentacion, registar modificaciones/incremental y volver al spec
- dividir el grupo entre modificaciones (ajustes previos) e incremental (nueva funcionalidad)
- integrar nueva version en 2 semanas

Feedback Avance 03 (16/11/26)

- Se amplió spec.md con sesiones de clarify (03/11 y 05/11), HU-02, HU-03, HU-05 y HU-06, y se cerraron los casos límite de HU-01. tasks.md es nuevo y está organizado por fases e historias (T001–T068); es coherente con la spec y cita los FR.
- Falta limpiar spec.md: los FR-001 a FR-024 y los Casos Límite genéricos ("entidad", "documento") siguen siendo los de la plantilla base. Además, la Clarification del 03/11 dice que se ordena como `001`, pero los FR que cita tasks.md (FR-085 a FR-092) no se pudieron verificar en el contenido recortado.

Consistencia sitio-especificación:

- Tareas implementadas pero sin marcar: T002 a T068 están en `[ ]`, pero `src/` contiene el código de productos, bodegas, movimientos, transferencias, stock y alertas, y existen sus tests. Solo T001 está marcada.
- HU-01 / T017 (`index.html`): el formulario de producto sí pide "Usuario que registra", cosa que la spec no menciona. Además, el cambio de estado en `src/app.js` exige que ese usuario esté elegido en el formulario.
- Funcionalidad fuera de spec: el sitio mantiene Entidades, Documentos y Búsqueda de la plantilla base en `index.html` y `src/app.js`, aunque la spec de logística no los usa como historias.
- hacer mejoras de funcionalidad e interfaz de usuario, incluir data simulada para probar campos, incluir mejoras de estilo, transicion, navegacion, etcetera.

Presentacion de MVP final en 2 semanas.

Correcciones registradas (25/11/26):

- `spec.md`: FR-001 a FR-024 reclasificados como heredados adaptados, interfaz vigente de 002 o propios de logística; casos límite genéricos etiquetados como heredados; conservadas HU-01 a HU-11 y sus aclaraciones.
- FR-085 a FR-092 verificados en `spec.md` y citados por `tasks.md` (T012, T014, T017, T020, T039, T041, T045) sin renumeración; la observación anterior quedó resuelta.
- `tasks.md`: auditoría T002–T068 contra `src/`, `tests/`, `index.html` y documentación. Permanecen `[ ]` T002, T004, T007, T008, T012, T013, T031, T036, T048, T065 y T067 por evidencia parcial o validación manual pendiente; T068 quedó reconciliado después. T136 y T145 también permanecen `[ ]`: el usuario confirmó manualmente pestañas, buscador/filtros y menú lateral, pero faltan criterios específicos de HU-10/HU-11 y la revisión visual de dashboard, panel de permisos y estilos globales. T066 quedó verificado con suite y build correctos.
- HU-01 / T017: eliminado el selector "Usuario que registra"; `created_by`, `updated_by` y el cambio de estado usan el usuario activo de la cabecera y se agregaron pruebas de integración.
- HU-12 a HU-14: no se eliminaron Entidades, Documentos ni Búsqueda porque la instrucción fue no eliminar funcionalidad existente; la contradicción se documentó primero en `spec.md`, `README.md` y `tasks.md` y se resolvió sin borrar funcionalidad en la corrección siguiente.
- Resolución 2026-11-25: la decisión fue ocultar esos accesos sin borrar vistas ni datos; `index.html`, `src/app.js`, `src/components/shell.js` y `src/styles.css` implementan seis secciones laterales, pestañas en Movimientos/Alertas y panel principal de cuatro indicadores.
- `tasks.md`: T068 reconciliado y T146–T152 completados; verificación final con 34 archivos/304 pruebas OK y `npm run build` correcto, sin crear ramas, commits ni push adicionales durante esta corrección documental y conservando el historial previo del repositorio.
