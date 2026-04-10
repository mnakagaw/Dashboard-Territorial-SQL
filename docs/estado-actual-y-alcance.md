# Estado Actual y Alcance del Dashboard Territorial

Este documento presenta una síntesis del estado técnico actual de la plataforma "Tu Municipio Dashboard". Está dirigido a los equipos directivos y técnicos de la Oficina Nacional de Estadística (ONE) para establecer una línea base clara sobre lo que está implementado hoy, y cuáles son los próximos pasos lógicos para la adopción total.

---

## 1. ¿Qué está implementado hoy? (Arquitectura Híbrida)

Actualmente, el sistema opera bajo una **arquitectura híbrida** diseñada para equilibrar el rendimiento de la aplicación en producción con el rigor del análisis de datos. 

*   **El Frontend (React):** Funciona a través de una Capa de Entrega (*Delivery Layer*) que consume objetos JSON pre-compilados. Esto asegura que el sitio cargue de manera instantánea sin sobrecargar la base de datos con uniones (JOINs) complejas durante cada visita.
*   **El Backend (Base de Datos):** Opera sobre un **Esquema Canónico Normalizado (Phase 2)**. Los datos maestros residen en formato SQL normalizado (esquema en estrella) como única fuente de verdad. 
*   **El Puente:** Existe un canal (proceso ETL/Pipeline) que toma los datos del Esquema Canónico y regenera automáticamente los archivos de la Capa de Entrega para el frontend.

**En resumen:** Visualizamos información desde una memoria caché ultrarrápida (JSON), pero esos datos se alimentan y gobiernan desde un almacén de datos (Data Warehouse) relacional y normalizado.

---

## 2. Estado de los Conjuntos de Datos (Datasets)

Hemos iniciado la migración de los datos estáticos hacia el Esquema Canónico Normalizado. Actualmente, dividimos los conjuntos de datos en dos estados:

### 2.1. Integrados en el Esquema Canónico (Fase 2)
Estos datasets (indicadores planos) ya han sido normalizados y sus tablas en la base de datos están poblando activamente la capa de entrega del dashboard.

*   ✅ **Nivel Nacional (`national_basic`)**: Métricas agregadas a nivel país.
*   ✅ **Demografía y Población (`indicadores_basicos`)**: Habitantes, sexo, población en años anteriores y variaciones.
*   ✅ **Hogares y Vivienda (`hogares_resumen`)**: Total de hogares, tipo de viviendas ocupadas, y promedio de personas por hogar.
*   ✅ **Economía y Empleo (Totales)**: Cantidad de establecimientos y empleados obtenidos del Directorio de Empresas y Establecimientos (DEE).
*   ✅ **TIC (Totales)**: Usuarios y población base de internet, computadoras y celulares.

### 2.2. En Formato Puente / Fase 1 (Pendientes de Normalización)
Estos datasets poseen estructuras anidadas complejas (sub-categorías múltiples) o son datos transaccionales, por lo que temporalmente continúan funcionando directamente en formato JSON (Capa de Entrega) para no interrumpir el servicio, a la espera de la expansión de las dimensiones de desglose (Fase 2b).

*   ⏳ **Condiciones de Vida (`condicion_vida`)**: Desglose de servicios de agua, energía, basura, etc.
*   ⏳ **Establecimientos de Salud (`salud_establecimientos`)**: Fichas individuales de cada hospital/clínica (requiere modelo geoespacial).
*   ⏳ **Pirámides Poblacionales (`pyramids`)**: Datos transversales por edad y sexo.
*   ⏳ **Educación (`educacion`)**: Cruce de datos de asistencia escolar por rango etario y nivel académico.
*   ⏳ **Distribuciones Sectoriales**: Detalles del DEE por subsectores CIIU.

---

## 3. Siguientes Pasos (Hoja de Ruta para ONE)

Para que el equipo de la ONE adopte, mantenga y expanda esta plataforma de manera sostenible, sugerimos la siguiente hoja de ruta a mediano plazo:

1.  **Migración de Entorno:**
    *   Traspasar las tablas actuales (MariaDB) hacia la infraestructura de **SQL Server** de la ONE, utilizando los scripts de migración provistos (`create_canonical_tables_sqlserver.sql`).
2.  **Automatización de Entrega (Delivery):**
    *   Reemplazar los actuales scripts de generación en NodeJS/PHP por procedimientos almacenados (Stored Procedures) nativos utilizando `FOR JSON PATH` en SQL Server.
3.  **Expansión del Modelo (Fase 2b):**
    *   Implementar las "Dimensiones de Desglose" (`dim_breakdown_type`) en el esquema en estrella, lo que permitirá migrar los conjuntos de datos complejos (Salud, Educación, Condiciones de Vida) al esquema canónico relacional.
4.  **Integración Continua:**
    *   Conectar el Esquema Canónico como destino automatizado directamente desde los repositorios internos o registros administrativos del Censo de la ONE, eliminando los procesos manuales.
