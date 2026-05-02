# Documento de Requisitos
## Dashboard para Diagnóstico Territorial - República Dominicana

**Versión:** 1.0  
**Fecha:** Febrero 2026

---

## 1. Requisitos Funcionales

### RF-01: Selección de Territorio
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-01.1 | El sistema debe permitir seleccionar una provincia de la lista de 32 provincias | Alta |
| RF-01.2 | El sistema debe mostrar los municipios correspondientes a la provincia seleccionada | Alta |
| RF-01.3 | El sistema debe permitir seleccionar "provincia completa" para ver datos agregados | Media |
| RF-01.4 | El mapa debe resaltar el municipio/provincia seleccionado | Alta |

### RF-02: Visualización de Indicadores
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-02.1 | Mostrar población total con variación respecto a 2010 | Alta |
| RF-02.2 | Mostrar pirámides de población (2022 y 2010) | Alta |
| RF-02.3 | Mostrar distribución por sexo con gráfico circular | Alta |
| RF-02.4 | Mostrar indicadores de hogares (total, tamaño promedio) | Media |
| RF-02.5 | Mostrar distribución urbana/rural | Media |

### RF-03: Condiciones de Vida
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-03.1 | Mostrar acceso a agua potable por tipo de fuente | Alta |
| RF-03.2 | Mostrar tipo de servicios sanitarios | Alta |
| RF-03.3 | Mostrar tipo de alumbrado | Media |
| RF-03.4 | Mostrar acceso a TIC (internet, computadora, celular) | Media |

### RF-04: Educación
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-04.1 | Mostrar nivel educativo por grupo de edad | Alta |
| RF-04.2 | Mostrar oferta educativa (centros, universidades) | Media |
| RF-04.3 | Comparar con promedio nacional | Alta |

### RF-05: Economía y Empleo
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-05.1 | Mostrar total de establecimientos y empleados (DEE 2024) | Alta |
| RF-05.2 | Mostrar distribución por tamaño de empresa | Alta |
| RF-05.3 | Mostrar principales sectores CIIU | Alta |
| RF-05.4 | Calcular y mostrar índice de especialización (LQ) | Media |

### RF-06: Salud
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-06.1 | Mostrar establecimientos de salud por tipo | Alta |
| RF-06.2 | Mostrar total de establecimientos en el municipio | Alta |

### RF-07: Comparaciones
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-07.1 | Mostrar tabla comparativa: Municipio vs Provincia vs Nacional | Alta |
| RF-07.2 | Indicar visualmente si el municipio está por encima/debajo del promedio | Media |

### RF-08: Exportación
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-08.1 | Permitir exportar el dashboard a PDF | Alta |
| RF-08.2 | El PDF debe tener formato optimizado para impresión A4 | Media |
| RF-08.3 | El PDF debe incluir todos los gráficos y tablas | Alta |

### RF-09: Resumen Narrativo (IA)
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-09.1 | Generar diagnóstico narrativo usando IA | Baja |
| RF-09.2 | El resumen debe ser específico para el municipio seleccionado | Baja |

---

## 2. Requisitos No Funcionales

### RNF-01: Rendimiento
| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-01.1 | Tiempo de carga inicial | < 3 segundos |
| RNF-01.2 | Cambio de municipio | < 500 ms |
| RNF-01.3 | Generación de PDF | < 10 segundos |

### RNF-02: Compatibilidad
| ID | Requisito |
|----|-----------|
| RNF-02.1 | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| RNF-02.2 | Diseño responsivo (móvil, tablet, desktop) |
| RNF-02.3 | Impresión compatible con Chrome y Firefox |

### RNF-03: Usabilidad
| ID | Requisito |
|----|-----------|
| RNF-03.1 | Interfaz en español |
| RNF-03.2 | Navegación intuitiva (máximo 2 clics para acceder a cualquier dato) |
| RNF-03.3 | Tooltips explicativos en gráficos |

### RNF-04: Mantenibilidad
| ID | Requisito |
|----|-----------|
| RNF-04.1 | Código documentado con comentarios en español |
| RNF-04.2 | Componentes React modulares y reutilizables |
| RNF-04.3 | Datos separados del código (archivos JSON) |

### RNF-05: Disponibilidad
| ID | Requisito |
|----|-----------|
| RNF-05.1 | Disponibilidad 99% (hosting GitHub Pages/FTP) |
| RNF-05.2 | Funciona sin conexión después de carga inicial |

---

## 3. Requisitos de Datos

### RD-01: Fuentes de Datos
| Fuente | Frecuencia de Actualización |
|--------|----------------------------|
| Censo 2022 | Cada 10 años (próximo: 2032) |
| DEE 2024 | Anual |
| MINERD Anuario | Anual |
| SNS Establecimientos | Continua |
| IGN / IDERD `RD_MUNICIPIOS` | Según actualización cartográfica oficial |

### RD-02: Formato de Datos
| Requisito |
|-----------|
| Todos los datos en formato JSON |
| Claves de municipio: código ADM2 de 5 dígitos |
| Números formateados con locale "es-DO" |

### RD-03: Integridad de Datos
| Requisito |
|-----------|
| Cada municipio debe tener al menos indicadores básicos |
| Datos nacionales disponibles para todas las métricas |
| GeoJSON con fronteras de 158 municipios |

---

## 4. Requisitos de Seguridad

| ID | Requisito |
|----|-----------|
| RS-01 | No almacenar credenciales en el código fuente (usar .env) |
| RS-02 | .env incluido en .gitignore |
| RS-03 | API de IA protegida en servidor backend |

---

## 5. Casos de Uso Principales

### CU-01: Consultar Indicadores de un Municipio
**Actor:** Usuario (funcionario, investigador, ciudadano)  
**Flujo:**
1. Usuario selecciona provincia del dropdown
2. Sistema muestra municipios de esa provincia
3. Usuario selecciona municipio
4. Sistema muestra todos los indicadores del municipio
5. Sistema resalta municipio en el mapa

### CU-02: Comparar Municipio con Promedios
**Actor:** Usuario  
**Flujo:**
1. Usuario selecciona municipio (CU-01)
2. Sistema muestra sección de comparación
3. Usuario visualiza tabla con valores: Municipio / Provincia / Nacional
4. Sistema indica visualmente diferencias significativas

### CU-03: Exportar Diagnóstico Municipal
**Actor:** Usuario  
**Flujo:**
1. Usuario selecciona municipio (CU-01)
2. Usuario hace clic en "Imprimir (exportar PDF)"
3. Sistema genera vista de impresión optimizada
4. Usuario guarda o imprime el documento

---

## 6. Glosario

| Término | Definición |
|---------|------------|
| ADM2 | División administrativa nivel 2 (municipio) |
| IDERD | Infraestructura de Datos Espaciales de la República Dominicana |
| IGN | Instituto Geográfico Nacional |
| DEE | Directorio de Establecimientos Económicos |
| CIIU | Clasificación Industrial Internacional Uniforme |
| LQ | Location Quotient (índice de especialización) |
| OFICIAL | Fuentes Oficiales de la República Dominicana |
| MINERD | Ministerio de Educación de la República Dominicana |
| SNS | Servicio Nacional de Salud |
| TIC | Tecnologías de Información y Comunicación |
