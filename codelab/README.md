# CodeLab — Codificación de Datos
**Huffman & Shannon-Fano | UTN FRLP — Comunicación de Datos**

---

## Integrantes del Grupo 7

Taini Santino - Privitera Luciano - Tiziano Hurst - Nahuel Almeyda

---

## Descripción

Aplicación web interactiva que permite comprimir y descomprimir mensajes de texto
utilizando los algoritmos de Huffman y Shannon-Fano. Muestra gráficamente el proceso
de codificación, el árbol binario, la tabla de códigos y los resultados comparativos.

---

## Arquitectura

```
codelab/
├── backend/
│   └── app.py          ← Servidor Flask (Python) + SQLite
├── frontend/
│   ├── templates/
│   │   └── index.html  ← Interfaz HTML
│   └── static/
│       ├── css/style.css
│       └── js/main.js
├── requirements.txt
└── README.md
```

- **Arquitectura:** Cliente-Servidor (Frontend + Backend separados)
- **Backend:** Python + Flask + SQLite
- **Frontend:** HTML5 + CSS3 + JavaScript + Chart.js
- **Base de datos:** SQLite (historial de codificaciones)
- **Comunicación:** API REST (JSON)

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.10+, Flask, Flask-CORS |
| Base de datos | SQLite3 (integrado en Python) |
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Gráficos | Chart.js 4.4 |
| Herramientas | Visual Studio Code, Git |

---

## Requisitos previos

- Python 3.10 o superior
- pip
- Navegador web moderno (Chrome, Firefox, Edge)

---

## Instalación y ejecución

### 1. Clonar o descomprimir el proyecto

```bash
git clone https://github.com/lucianoprivitera/grupo7Comunicaci-n
cd codelab
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Ejecutar el servidor

```bash
cd backend
python app.py
```

El servidor inicia en `http://localhost:5000`

### 4. Abrir la aplicación

Abrí el navegador y navegá a:
```
http://localhost:5000
```

---

## Funcionalidades

1. **Carga de texto** — escritura directa o carga de archivo .txt
2. **Cálculo de frecuencias** — tabla con barras proporcionales
3. **Árbol de codificación** — árbol SVG interactivo con pasos de construcción
4. **Tabla de códigos** — símbolo, código binario y longitud por algoritmo
5. **Codificación** — mensaje convertido a secuencia binaria
6. **Decodificación** — reconstrucción del texto original desde binario
7. **Gráficos** — frecuencias y longitudes de código con Chart.js
8. **Comparación** — métricas lado a lado: tasa de compresión, eficiencia, longitud promedio
9. **Historial** — base de datos SQLite con las últimas 20 codificaciones

---

## API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/codificar | Codifica texto con Huffman y/o Shannon-Fano |
| POST | /api/decodificar | Decodifica binario con tabla dada |
| GET | /api/historial | Lista las últimas 20 codificaciones |
| DELETE | /api/historial/:id | Elimina un registro del historial |

### Ejemplo de request — codificar

```json
POST /api/codificar
{
  "texto": "hola mundo",
  "algoritmo": "ambos"
}
```

### Ejemplo de response

```json
{
  "algoritmo": "ambos",
  "frecuencias": { "o": 2, "h": 1, "l": 1, ... },
  "huffman": {
    "tabla": { "o": "0", "l": "100", ... },
    "codificado": "101001100...",
    "bits_orig": 80,
    "bits_comp": 26,
    "tasa": 67.5,
    "eficiencia": 96.1,
    "long_prom": 2.6,
    "entropia": 2.97
  },
  "shannon_fano": { ... }
}
```

---

## Estructura de la base de datos

Tabla `historial`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| fecha | TEXT | Fecha y hora |
| texto | TEXT | Texto de entrada (truncado a 200 chars) |
| algoritmo | TEXT | huffman / shannon_fano |
| bits_orig | INTEGER | Bits sin comprimir |
| bits_comp | INTEGER | Bits comprimidos |
| tasa | REAL | Tasa de compresión (%) |
| eficiencia | REAL | Eficiencia (%) |
| long_prom | REAL | Longitud promedio de código |
| tabla | TEXT | Tabla de códigos en JSON |

---

## Guión para el video de demo (≤ 6 minutos)

1. (0:00) Mostrar la estructura del proyecto en VS Code
2. (0:30) Ejecutar `python app.py` y abrir `localhost:5000`
3. (1:00) Escribir un texto de ejemplo y seleccionar Huffman
4. (1:30) Mostrar el árbol SVG y los pasos de construcción
5. (2:15) Mostrar la tabla de códigos y la salida binaria
6. (2:45) Mostrar el gráfico de frecuencias y longitudes
7. (3:15) Decodificar la salida para recuperar el texto original
8. (3:45) Repetir con Shannon-Fano
9. (4:30) Seleccionar "Ambos" y mostrar la comparación
10. (5:00) Cargar un archivo .txt externo
11. (5:30) Mostrar el historial en la base de datos SQLite
