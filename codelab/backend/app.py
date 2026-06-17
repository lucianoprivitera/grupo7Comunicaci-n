from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, heapq, json, os, math
from datetime import datetime

app = Flask(__name__, static_folder="../frontend/static", template_folder="../frontend/templates")
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "codelab.db")

# ─── Base de datos ────────────────────────────────────────────────────────────

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS historial (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha     TEXT NOT NULL,
            texto     TEXT NOT NULL,
            algoritmo TEXT NOT NULL,
            bits_orig INTEGER NOT NULL,
            bits_comp INTEGER NOT NULL,
            tasa      REAL NOT NULL,
            eficiencia REAL NOT NULL,
            long_prom REAL NOT NULL,
            tabla     TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ─── Huffman ──────────────────────────────────────────────────────────────────

class NodoHuffman:
    def __init__(self, simbolo, freq):
        self.simbolo = simbolo
        self.freq    = freq
        self.izq     = None
        self.der     = None

    def __lt__(self, otro):
        return self.freq < otro.freq

def construir_arbol_huffman(frecuencias):
    heap = [NodoHuffman(s, f) for s, f in frecuencias.items()]
    heapq.heapify(heap)
    pasos = []
    while len(heap) > 1:
        izq = heapq.heappop(heap)
        der = heapq.heappop(heap)
        padre = NodoHuffman(None, izq.freq + der.freq)
        padre.izq = izq
        padre.der = der
        heapq.heappush(heap, padre)
        pasos.append({
            "izq": izq.simbolo or f"({izq.freq})",
            "der": der.simbolo or f"({der.freq})",
            "suma": padre.freq
        })
    return heap[0] if heap else None, pasos

def generar_codigos_huffman(nodo, prefijo="", tabla=None):
    if tabla is None:
        tabla = {}
    if nodo is None:
        return tabla
    if nodo.simbolo is not None:
        tabla[nodo.simbolo] = prefijo if prefijo else "0"
        return tabla
    generar_codigos_huffman(nodo.izq, prefijo + "0", tabla)
    generar_codigos_huffman(nodo.der, prefijo + "1", tabla)
    return tabla

def serializar_arbol(nodo):
    if nodo is None:
        return None
    return {
        "simbolo": nodo.simbolo,
        "freq": nodo.freq,
        "izq": serializar_arbol(nodo.izq),
        "der": serializar_arbol(nodo.der)
    }

# ─── Shannon-Fano ─────────────────────────────────────────────────────────────

def shannon_fano(simbolos_freq, prefijo="", tabla=None):
    if tabla is None:
        tabla = {}
    if len(simbolos_freq) == 1:
        tabla[simbolos_freq[0][0]] = prefijo if prefijo else "0"
        return tabla
    if len(simbolos_freq) == 0:
        return tabla
    total = sum(f for _, f in simbolos_freq)
    acum, mejor_idx, mejor_diff = 0, 0, float("inf")
    for i, (_, f) in enumerate(simbolos_freq[:-1]):
        acum += f
        diff = abs(total - 2 * acum)
        if diff < mejor_diff:
            mejor_diff = diff
            mejor_idx = i
    izq = simbolos_freq[:mejor_idx + 1]
    der = simbolos_freq[mejor_idx + 1:]
    shannon_fano(izq, prefijo + "0", tabla)
    shannon_fano(der, prefijo + "1", tabla)
    return tabla

# ─── Métricas ─────────────────────────────────────────────────────────────────

def calcular_metricas(texto, frecuencias, tabla):
    total_chars = len(texto)
    bits_orig   = total_chars * 8
    bits_comp   = sum(frecuencias[s] * len(tabla[s]) for s in frecuencias if s in tabla)
    long_prom   = bits_comp / total_chars if total_chars else 0
    entropia    = -sum((f / total_chars) * math.log2(f / total_chars)
                       for f in frecuencias.values() if f > 0)
    eficiencia  = (entropia / long_prom * 100) if long_prom > 0 else 0
    tasa        = ((bits_orig - bits_comp) / bits_orig * 100) if bits_orig > 0 else 0
    return {
        "bits_orig":  bits_orig,
        "bits_comp":  bits_comp,
        "long_prom":  round(long_prom, 4),
        "entropia":   round(entropia, 4),
        "eficiencia": round(eficiencia, 2),
        "tasa":       round(tasa, 2)
    }

# ─── Rutas ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("../frontend/templates", "index.html")

@app.route("/api/codificar", methods=["POST"])
def codificar():
    data      = request.get_json()
    texto     = data.get("texto", "").strip()
    algoritmo = data.get("algoritmo", "huffman")

    if not texto:
        return jsonify({"error": "El texto no puede estar vacío"}), 400

    frecuencias = {}
    for c in texto:
        frecuencias[c] = frecuencias.get(c, 0) + 1

    simbolos_freq = sorted(frecuencias.items(), key=lambda x: x[1], reverse=True)

    resultado = {"algoritmo": algoritmo, "frecuencias": frecuencias}

    if algoritmo in ("huffman", "ambos"):
        raiz, pasos = construir_arbol_huffman(frecuencias)
        tabla_h     = generar_codigos_huffman(raiz)
        metricas_h  = calcular_metricas(texto, frecuencias, tabla_h)
        codificado_h = "".join(tabla_h.get(c, "") for c in texto)
        resultado["huffman"] = {
            "tabla":     tabla_h,
            "arbol":     serializar_arbol(raiz),
            "pasos":     pasos,
            "codificado": codificado_h,
            **metricas_h
        }
        # guardar en historial
        db = get_db()
        db.execute(
            "INSERT INTO historial VALUES (NULL,?,?,?,?,?,?,?,?,?)",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), texto[:200],
             "huffman", metricas_h["bits_orig"], metricas_h["bits_comp"],
             metricas_h["tasa"], metricas_h["eficiencia"], metricas_h["long_prom"],
             json.dumps(tabla_h))
        )
        db.commit()
        db.close()

    if algoritmo in ("shannon_fano", "ambos"):
        tabla_sf    = shannon_fano(simbolos_freq)
        metricas_sf = calcular_metricas(texto, frecuencias, tabla_sf)
        codificado_sf = "".join(tabla_sf.get(c, "") for c in texto)
        resultado["shannon_fano"] = {
            "tabla":     tabla_sf,
            "codificado": codificado_sf,
            **metricas_sf
        }
        db = get_db()
        db.execute(
            "INSERT INTO historial VALUES (NULL,?,?,?,?,?,?,?,?,?)",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), texto[:200],
             "shannon_fano", metricas_sf["bits_orig"], metricas_sf["bits_comp"],
             metricas_sf["tasa"], metricas_sf["eficiencia"], metricas_sf["long_prom"],
             json.dumps(tabla_sf))
        )
        db.commit()
        db.close()

    return jsonify(resultado)

@app.route("/api/decodificar", methods=["POST"])
def decodificar():
    data      = request.get_json()
    binario   = data.get("binario", "").strip()
    tabla     = data.get("tabla", {})
    if not binario or not tabla:
        return jsonify({"error": "Faltan datos"}), 400
    tabla_inv = {v: k for k, v in tabla.items()}
    resultado, buffer = [], ""
    for bit in binario:
        buffer += bit
        if buffer in tabla_inv:
            resultado.append(tabla_inv[buffer])
            buffer = ""
    if buffer:
        return jsonify({"error": "Secuencia binaria inválida o tabla incorrecta"}), 400
    return jsonify({"texto": "".join(resultado)})

@app.route("/api/historial", methods=["GET"])
def historial():
    db   = get_db()
    rows = db.execute("SELECT * FROM historial ORDER BY id DESC LIMIT 20").fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/historial/<int:id>", methods=["DELETE"])
def eliminar_historial(id):
    db = get_db()
    db.execute("DELETE FROM historial WHERE id=?", (id,))
    db.commit()
    db.close()
    return jsonify({"ok": True})

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
