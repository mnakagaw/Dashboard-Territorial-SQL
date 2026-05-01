# Estado Actual y Alcance del Dashboard Territorial

Este documento presenta una síntesis del estado técnico actual de la plataforma "Tu Municipio Dashboard". Está dirigido a los equipos directivos y técnicos de la Oficina Nacional de Estadística (ONE) para establecer una línea base clara sobre lo que está implementado hoy, y cuáles son los próximos pasos lógicos para la adopción total.

---

## 1. ¿Qué está implementado hoy? (Arquitectura Canónica Completa)

Actualmente, el sistema opera bajo una **arquitectura canónica de datos** finalizada, diseñada para la máxima integridad estadística y escalabilidad.

*   **Fuente de Verdad (Capa Canónica):** Los datos maestros residen en un esquema relacional normalizado (Esquema en Estrella) que soporta agregaciones directas, desgloses demográficos (*breakdowns*) y geolocalización de entidades (*entities*).
*   **Capa de Entrega (Delivery Layer):** El Frontend consume objetos JSON regenerados automáticamente desde la base de datos. Esto garantiza un rendimiento instantáneo sin sacrificar la normalización de los datos fuente.
*   **Pipelines de Automatización:** Se han implementado scripts de regeneración íntegra que transforman los registros relacionales en los 36 activos JSON necesarios para el funcionamiento del dashboard.

---

## 2. Estado de los Conjuntos de Datos (Datasets)


1.  **Migración de Entorno:**
    *   Traspasar las tablas actuales (MariaDB) hacia la infraestructura de **SQL Server** de la ONE, utilizando los scripts de migración provistos (`create_canonical_tables_sqlserver.sql`).
2.  **Automatización de Entrega (Delivery):**
    *   Reemplazar los actuales scripts de generación en NodeJS/PHP por procedimientos almacenados (Stored Procedures) nativos utilizando `FOR JSON PATH` en SQL Server.
3.  **Expansión del Modelo (Fase 2b):**
    *   Implementar las "Dimensiones de Desglose" (`dim_breakdown_type`) en el esquema en estrella, lo que permitirá migrar los conjuntos de datos complejos (Salud, Educación, Condiciones de Vida) al esquema canónico relacional.
4.  **Integración Continua:**
    *   Conectar el Esquema Canónico como destino automatizado directamente desde los repositorios internos o registros administrativos del Censo de la ONE, eliminando los procesos manuales.
