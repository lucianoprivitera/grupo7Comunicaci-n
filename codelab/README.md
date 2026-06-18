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

