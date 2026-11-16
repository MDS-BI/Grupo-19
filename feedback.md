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
