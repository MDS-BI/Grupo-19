# Plan de Implementación: Módulo de Logística e Inventario

## 1. Resumen

Para desarrollar nuestro módulo de Logística e Inventario utilizaremos la plantilla ERP entregada por el profesor, aprovechando las funciones que ya incluye para registrar, modificar y consultar información. La idea es adaptar estas herramientas para trabajar con productos y movimientos de inventario, incorporando también el control de las existencias y las transferencias entre bodegas.

El desarrollo se basará en el Modelo Entidad-Relación que diseñamos, donde se consideran productos, categorías, bodegas, usuarios, stock, movimientos y transferencias. A partir de esta estructura, buscaremos implementar las principales funciones del módulo, como registrar entradas y salidas, actualizar las cantidades disponibles y generar alertas cuando el stock sea bajo. Finalmente, realizaremos pruebas con datos de ejemplo para comprobar que el sistema funcione correctamente.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Interacciones responsivas para listas de hasta 500 registros; la búsqueda y las actualizaciones de la interfaz deben sentirse instantáneas  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y capacidades de navegación

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- Calidad: La implementación usará una estructura JavaScript pequeña y modular con límites de función claros y nomenclatura consistente, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas antes de completar.
- Experiencia de Usuario: La interfaz proporcionará mensajes de validación claros, estados vacíos y comportamiento de formulario consistente, presentados dentro de un marco de espacio de trabajo ERP con marca (barra superior + barra lateral) que se ve y se comporta idénticamente en todas las pantallas.
- Rendimiento: La búsqueda y el renderizado de listas se optimizarán para colecciones de hasta 500 registros usando actualizaciones ligeras del DOM.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/002-logistica-inventario/
├── plan.md
├── data-model.md
├── MER.md
├── contracts/
│   ├── entity-storage.md
│   └── logistics-storage.md
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
src/
├── main.js
├── styles.css
├── storage.js        (claves de almacenamiento, esquemas, helpers de repositorio, saneamiento/validación compartidos y carga de semillas)
├── app.js
├── module-config.js
├── components/
│   ├── shell.js          (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral con las pantallas base y logísticas, estado de módulo activo)
│   ├── dashboard.js      (vista de inicio: cuadrícula de acciones rápidas + tarjetas de estadísticas en vivo)
│   ├── entity-form.js    (formulario de creación/edición de entidades base, con campos personalizados)
│   ├── document-form.js  (formulario de creación/edición de documentos base, con campos personalizados y ciclo de vida de estados)
│   ├── product-form.js / product-list.js       (US1 — productos)
│   ├── warehouse-form.js / warehouse-list.js   (US4 — bodegas)
│   ├── movement-form.js / movement-list.js     (US3 — entradas, salidas y ajustes)
│   ├── transfer-form.js / transfer-list.js     (US5 — transferencias entre bodegas)
│   ├── stock-list.js / stock-config.js         (US2 — control de stock y configuración de mínimos)
│   └── alert-list.js                           (US6 — alertas de stock mínimo)
└── domain/
    ├── seed.js        (catálogos semilla de PRODUCT_CATEGORIES y USERS)
    ├── products.js    (US1 — reglas de negocio de productos)
    ├── warehouses.js  (US4 — reglas de negocio de bodegas)
    ├── movements.js   (US3 — entradas, salidas y ajustes con actualización atómica de STOCK)
    ├── transfers.js   (US5 — solicitud, confirmación y cancelación de transferencias)
    ├── stock.js       (US2 — consulta de existencias de solo lectura)
    └── alerts.js      (US6 — alertas derivadas de STOCK)

tests/
├── unit/
├── integration/
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. El módulo base (Entidad/Documento, `entity-form.js`/`document-form.js`) se conserva intacto para no introducir regresiones (ver FR-001–039), mientras que el dominio de Logística e Inventario se construye como una capa adicional: `src/storage.js` concentra los esquemas, la persistencia y los helpers de validación/saneamiento compartidos por las entidades logísticas (`PRODUCTS`, `PRODUCT_CATEGORIES`, `WAREHOUSES`, `USERS`, `STOCK`, `INVENTORY_TRANSACTIONS`, `STOCK_TRANSFERS`); `src/domain/` concentra las reglas de negocio de cada historia de usuario (productos, bodegas, movimientos, transferencias, stock y alertas) desacopladas de la interfaz; y `src/components/` añade un formulario y un listado por historia de usuario junto a los componentes base. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos (ahora incluyendo Productos, Bodegas, Stock, Movimientos, Transferencias y Alertas) — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución.

