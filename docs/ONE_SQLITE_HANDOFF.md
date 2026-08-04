# Entrega local SQLite — Dashboard Territorial

## Objetivo

Esta variante reproduce el dashboard sin MariaDB ni SQL Server. La base local
SQLite conserva dos capas:

1. **Capa canónica**: tablas `dim_*`, `fact_statistic`, instalaciones y lotes de
   importación. Su estructura sigue el modelo previsto para el SQL Server de ONE.
2. **Capa de entrega**: `dataset_assets`, con los mismos JSON que consume el
   dashboard actual. Esto permite migrar el frontend sin cambiar el contrato de
   datos.

Los mapas grandes `adm2.json` y `adm2.geojson` se sirven como archivos estáticos
y no se guardan en la base.

## Requisitos

- Windows 10/11.
- Python 3.10 o posterior.
- Para reconstruir el frontend desde el repositorio: Node.js 18 o posterior.

La carpeta de entrega generada ya contiene el frontend compilado y no requiere
Node.js para ejecutarse.

## Ejecución de la entrega

1. Descomprimir el ZIP en una ruta local corta.
2. Hacer doble clic en `START_SQLITE.bat`.
3. Abrir `http://127.0.0.1:8000/dbt/` si el navegador no se abre
   automáticamente.
4. Cerrar la ventana o pulsar `Ctrl+C` para detener el servidor.

La API de consulta queda disponible en:

- Catálogo: `GET http://127.0.0.1:8000/api/data`
- Dataset REST: `GET http://127.0.0.1:8000/api/data/{asset_key}`
- Compatibilidad PHP:
  `GET http://127.0.0.1:8000/api/data.php?key={asset_key}`
- Salud: `GET http://127.0.0.1:8000/api/health`

## Reconstrucción desde el repositorio

```powershell
npm install
npm run sqlite:init
npm run sqlite:verify
npm run build:sqlite
npm run sqlite:serve
```

Para crear una entrega fechada, autocontenida y con manifiesto SHA-256:

```powershell
npm run handoff:one
```

El resultado se guarda en `handoff/` como carpeta y archivo ZIP.

## Actualización de datos

1. Sustituir los JSON validados en `public/data/`.
2. Ejecutar `npm run sqlite:init`.
3. Ejecutar `npm run sqlite:verify`.
4. Revisar el dashboard local.
5. Ejecutar `npm run handoff:one`.

`sqlite:init` es idempotente: no crea una versión nueva si el SHA-256 no cambió.
Si un activo cambia, desactiva la versión anterior y registra una nueva versión
activa.

## Comprobaciones de aceptación

- `PRAGMA integrity_check` devuelve `ok`.
- `PRAGMA foreign_key_check` no devuelve filas.
- Todos los JSON de entrega, excepto los mapas estáticos, están activos.
- El contenido almacenado coincide por SHA-256 con `public/data/`.
- `/api/data` lista los activos.
- `/api/data/municipios_index` devuelve JSON válido.
- La pantalla carga regiones, provincias, municipios y mapas.

## Camino de migración a SQL Server de ONE

SQLite es el entorno reproducible de aceptación y transferencia. Para producción:

1. Crear el esquema SQL Server con
   `scripts/create_canonical_tables_sqlserver.sql`.
2. Transferir dimensiones, hechos y catálogo de fuentes mediante ETL/SSIS.
3. Transferir la versión activa de `dataset_assets`.
4. Conectar el backend ASP.NET Core incluido en `server/`.
5. Mantener los mapas grandes como archivos estáticos.

Los nombres de tablas y el contrato JSON se mantienen deliberadamente alineados
para reducir el riesgo de la migración.

## Publicación SQLite en CORESERVER

La publicación de prueba en `https://prodecare.net/ONE/` usa SQLite mediante
PHP. La base no se coloca dentro de `public_html`:

```text
/sqlite_data/dashboard_territorial.sqlite3
/public_html/prodecare.net/ONE/api/data.php
```

El directorio privado usa permiso `700` y la base `600`. El API es de solo
lectura, activa `PRAGMA query_only`, valida las claves solicitadas y publica
ETag SHA-256. Los únicos JSON estáticos del sitio son `adm2.json`,
`adm2.geojson` y `regions_index.json`, necesarios para los mapas y selectores.

Proceso de actualización:

```powershell
npm run sqlite:init
npm run sqlite:verify
npm run build:one
npm run deploy:one:sqlite
npm run verify:one:remote
```

La carga de la base se realiza con un nombre temporal y luego se renombra. Si
ya existe una base, se conserva una copia privada con sufijo `backup-*` para
facilitar la reversión.
