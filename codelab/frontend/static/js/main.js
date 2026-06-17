const API = "http://localhost:5000/api";
let ultimoResultado = null;
let chartFreq = null, chartLen = null;

// ─── Utilidades ──────────────────────────────────────────────────────────────

function mostrarError(msg) {
  const el = document.getElementById("error-msg");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 4000);
}

function copiarTexto(txt, btn) {
  navigator.clipboard.writeText(txt).then(() => {
    const orig = btn.textContent;
    btn.textContent = "✓ Copiado";
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

function simboloDisplay(s) {
  if (s === " ") return "ESPACIO";
  if (s === "\n") return "ENTER";
  if (s === "\t") return "TAB";
  return s;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

document.querySelectorAll(".top-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".top-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.style.display = "none");
    const view = document.getElementById("view-" + tab.dataset.view);
    view.style.display = "block";
    if (tab.dataset.view === "historial") cargarHistorial();
  });
});

document.querySelectorAll(".inner-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".inner-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
    document.getElementById("tab-" + tab.dataset.tab).style.display = "block";
    if (tab.dataset.tab === "grafico" && ultimoResultado) renderGraficos(ultimoResultado);
  });
});

// ─── Algoritmo activo ────────────────────────────────────────────────────────

document.querySelectorAll(".algo-opt").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".algo-opt").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
  });
});

// ─── Contador de caracteres ──────────────────────────────────────────────────

const txtInput = document.getElementById("txt-input");
txtInput.addEventListener("input", () => {
  document.getElementById("char-count").textContent = `${txtInput.value.length} caracteres`;
});

// ─── Carga de archivo ────────────────────────────────────────────────────────

document.getElementById("file-input").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    txtInput.value = ev.target.result;
    document.getElementById("char-count").textContent = `${txtInput.value.length} caracteres`;
  };
  reader.readAsText(file);
});

// ─── Codificar ───────────────────────────────────────────────────────────────

document.getElementById("btn-codificar").addEventListener("click", async () => {
  const texto = txtInput.value.trim();
  if (!texto) { mostrarError("Ingresá un texto antes de codificar."); return; }

  const algo = document.querySelector("input[name=algo]:checked").value;
  const btn  = document.getElementById("btn-codificar");
  btn.textContent = "Procesando...";
  btn.disabled = true;

  try {
    const res  = await fetch(`${API}/codificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, algoritmo: algo })
    });
    const data = await res.json();
    if (data.error) { mostrarError(data.error); return; }

    ultimoResultado = data;
    renderizarResultado(data);
  } catch (err) {
    mostrarError("No se pudo conectar con el servidor. ¿Está corriendo backend/app.py?");
  } finally {
    btn.textContent = "▶ Codificar";
    btn.disabled = false;
  }
});

// ─── Render principal ────────────────────────────────────────────────────────

function renderizarResultado(data) {
  document.getElementById("empty-state").style.display = "none";
  document.getElementById("inner-tabs").style.display  = "flex";

  // Activar primer tab
  document.querySelectorAll(".inner-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
  document.querySelector(".inner-tab[data-tab='arbol']").classList.add("active");
  document.getElementById("tab-arbol").style.display = "block";

  renderFrecuencias(data.frecuencias);
  renderMetricas(data);
  renderArbol(data);
  renderTabla(data);
  renderSalida(data);
  renderDecodificar(data);
}

// ─── Frecuencias ─────────────────────────────────────────────────────────────

function renderFrecuencias(frecuencias) {
  const total  = Object.values(frecuencias).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(frecuencias).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxF   = sorted[0][1];

  document.getElementById("freq-block").style.display = "block";
  document.getElementById("freq-list").innerHTML = sorted.map(([s, f]) => `
    <div class="freq-item">
      <span class="freq-sym">${simboloDisplay(s)}</span>
      <div class="freq-bar-bg"><div class="freq-bar-fill" style="width:${(f/maxF*100).toFixed(1)}%"></div></div>
      <span class="freq-pct">${(f/total*100).toFixed(1)}%</span>
    </div>
  `).join("");
}

// ─── Métricas ────────────────────────────────────────────────────────────────

function renderMetricas(data) {
  document.getElementById("metrics-block").style.display = "block";
  const src = data.huffman || data.shannon_fano;
  if (!src) return;
  document.getElementById("metrics-grid").innerHTML = `
    <div class="metric-card"><div class="metric-val">${src.bits_orig}</div><div class="metric-lbl">Bits originales</div></div>
    <div class="metric-card"><div class="metric-val metric-ok">${src.bits_comp}</div><div class="metric-lbl">Bits comprimidos</div></div>
    <div class="metric-card"><div class="metric-val metric-ok">${src.tasa}%</div><div class="metric-lbl">Tasa compresión</div></div>
    <div class="metric-card"><div class="metric-val">${src.entropia}</div><div class="metric-lbl">Entropía</div></div>
    <div class="metric-card"><div class="metric-val">${src.long_prom}</div><div class="metric-lbl">Long. promedio</div></div>
    <div class="metric-card"><div class="metric-val metric-ok">${src.eficiencia}%</div><div class="metric-lbl">Eficiencia</div></div>
  `;
}

// ─── Árbol SVG ───────────────────────────────────────────────────────────────

function renderArbol(data) {
  const cont = document.getElementById("arbol-container");
  cont.innerHTML = "";

  if (data.huffman) {
    const sec = document.createElement("div");
    sec.className = "arbol-section";
    sec.innerHTML = `<div class="arbol-title">Árbol de Huffman <span class="badge badge-h">Huffman</span></div>`;
    const scroll = document.createElement("div");
    scroll.className = "arbol-scroll";
    scroll.appendChild(dibujarArbol(data.huffman.arbol));
    sec.appendChild(scroll);

    if (data.huffman.pasos && data.huffman.pasos.length) {
      const pasosDiv = document.createElement("div");
      pasosDiv.innerHTML = `<div class="section-label" style="margin-top:12px;margin-bottom:6px">Pasos de construcción</div>`;
      const lista = document.createElement("div");
      lista.className = "pasos-list";
      data.huffman.pasos.forEach((p, i) => {
        lista.innerHTML += `<div class="paso-item"><div class="paso-n">${i+1}</div>Unir <b>${p.izq}</b> + <b>${p.der}</b> → nodo padre <b>${p.suma}</b></div>`;
      });
      pasosDiv.appendChild(lista);
      sec.appendChild(pasosDiv);
    }
    cont.appendChild(sec);
  }

  if (data.shannon_fano) {
    const sec = document.createElement("div");
    sec.className = "arbol-section";
    sec.innerHTML = `<div class="arbol-title">Shannon-Fano <span class="badge badge-sf">Shannon-Fano</span></div>
      <div style="font-size:13px;color:var(--muted);padding:10px;background:var(--bg);border-radius:var(--radius)">
        Shannon-Fano divide el conjunto de símbolos recursivamente por la mitad del peso acumulado. El árbol está implícito en la tabla de códigos.
      </div>`;
    cont.appendChild(sec);
  }
}

function dibujarArbol(raiz) {
  if (!raiz) return document.createTextNode("Sin árbol");

  // Calcular posiciones con BFS
  const nodos = [], aristas = [];
  const ANCHO_NODO = 50, ALTO_NIVEL = 60, PADDING = 30;

  function calcPos(nodo, nivel, offsetX, rangoX) {
    if (!nodo) return;
    const x = offsetX + rangoX / 2;
    const y = nivel * ALTO_NIVEL + PADDING;
    nodos.push({ ...nodo, x, y, nivel });
    if (nodo.izq) {
      aristas.push({ x1: x, y1: y, x2: offsetX + rangoX/4, y2: (nivel+1)*ALTO_NIVEL+PADDING, etiq: "0" });
      calcPos(nodo.izq, nivel + 1, offsetX, rangoX / 2);
    }
    if (nodo.der) {
      aristas.push({ x1: x, y1: y, x2: offsetX + rangoX*3/4, y2: (nivel+1)*ALTO_NIVEL+PADDING, etiq: "1" });
      calcPos(nodo.der, nivel + 1, offsetX + rangoX/2, rangoX / 2);
    }
  }

  function profundidad(n) { if (!n) return 0; return 1 + Math.max(profundidad(n.izq), profundidad(n.der)); }
  const prof = profundidad(raiz);
  const hojasMax = Math.pow(2, prof - 1);
  const svgW = Math.max(hojasMax * ANCHO_NODO + PADDING * 2, 400);
  const svgH = prof * ALTO_NIVEL + PADDING * 2;

  calcPos(raiz, 0, 0, svgW);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgW);
  svg.setAttribute("height", svgH);
  svg.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);

  // Aristas
  aristas.forEach(a => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", a.x1); line.setAttribute("y1", a.y1);
    line.setAttribute("x2", a.x2); line.setAttribute("y2", a.y2);
    line.setAttribute("stroke", "#d0cfc8"); line.setAttribute("stroke-width", "1.2");
    svg.appendChild(line);
    const mx = (a.x1 + a.x2) / 2, my = (a.y1 + a.y2) / 2;
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", mx); txt.setAttribute("y", my);
    txt.setAttribute("text-anchor", "middle"); txt.setAttribute("font-size", "11");
    txt.setAttribute("font-weight", "600");
    txt.setAttribute("fill", a.etiq === "0" ? "#1a3050" : "#1a5c3a");
    txt.textContent = a.etiq;
    svg.appendChild(txt);
  });

  // Nodos
  nodos.forEach(n => {
    const esHoja = !n.izq && !n.der;
    const r = 16;
    const circ = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circ.setAttribute("cx", n.x); circ.setAttribute("cy", n.y); circ.setAttribute("r", r);
    circ.setAttribute("fill", esHoja ? "#e6eef5" : "#f7f6f2");
    circ.setAttribute("stroke", esHoja ? "#1a3050" : "#d0cfc8");
    circ.setAttribute("stroke-width", "1.2");
    svg.appendChild(circ);
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", n.x); lbl.setAttribute("y", n.y + 4);
    lbl.setAttribute("text-anchor", "middle"); lbl.setAttribute("font-size", "10");
    lbl.setAttribute("fill", esHoja ? "#1a3050" : "#6b6a65");
    lbl.setAttribute("font-weight", esHoja ? "600" : "400");
    lbl.textContent = esHoja ? simboloDisplay(n.simbolo) : n.freq;
    svg.appendChild(lbl);
  });

  return svg;
}

// ─── Tabla de códigos ────────────────────────────────────────────────────────

function renderTabla(data) {
  const cont = document.getElementById("tabla-container");
  cont.innerHTML = "";

  const tieneH  = !!data.huffman;
  const tieneSF = !!data.shannon_fano;
  const tabla_h  = data.huffman?.tabla  || {};
  const tabla_sf = data.shannon_fano?.tabla || {};
  const simbolos = [...new Set([...Object.keys(tabla_h), ...Object.keys(tabla_sf)])].sort();

  const sec = document.createElement("div");
  sec.className = "tabla-section";
  sec.innerHTML = `<div class="tabla-head">Tabla de códigos</div>`;

  const tbl = document.createElement("table");
  tbl.innerHTML = `<thead><tr>
    <th>Símbolo</th>
    <th>Frecuencia</th>
    ${tieneH  ? '<th>Código Huffman</th><th>Long. H</th>' : ''}
    ${tieneSF ? '<th>Código S-F</th><th>Long. S-F</th>' : ''}
  </tr></thead>`;
  const tbody = document.createElement("tbody");
  simbolos.forEach(s => {
    const tr = document.createElement("tr");
    const freq = data.frecuencias[s] || 0;
    tr.innerHTML = `
      <td><b>${simboloDisplay(s)}</b></td>
      <td>${freq}</td>
      ${tieneH  ? `<td class="code-h">${tabla_h[s]  || '—'}</td><td>${tabla_h[s]?.length  || '—'}</td>` : ''}
      ${tieneSF ? `<td class="code-sf">${tabla_sf[s] || '—'}</td><td>${tabla_sf[s]?.length || '—'}</td>` : ''}
    `;
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  sec.appendChild(tbl);
  cont.appendChild(sec);

  // Comparación cuando hay ambos
  if (tieneH && tieneSF) {
    const cmp = document.createElement("div");
    cmp.className = "compare-grid";
    cmp.innerHTML = `
      <div class="compare-card">
        <div class="compare-header"><span class="compare-title">Huffman</span><span class="badge badge-h">óptimo</span></div>
        <div class="prog-row"><span class="prog-lbl">Compresión</span><div class="prog-bg"><div class="prog-fill-h" style="width:${data.huffman.tasa}%"></div></div><span class="prog-val">${data.huffman.tasa}%</span></div>
        <div class="prog-row"><span class="prog-lbl">Eficiencia</span><div class="prog-bg"><div class="prog-fill-h" style="width:${data.huffman.eficiencia}%"></div></div><span class="prog-val">${data.huffman.eficiencia}%</span></div>
        <div class="prog-row"><span class="prog-lbl">Long. prom.</span><div class="prog-bg"><div class="prog-fill-h" style="width:${Math.min(data.huffman.long_prom/8*100,100)}%"></div></div><span class="prog-val">${data.huffman.long_prom} bits</span></div>
        <div class="prog-row"><span class="prog-lbl">Bits totales</span><div class="prog-bg"><div class="prog-fill-h" style="width:${(data.huffman.bits_comp/data.huffman.bits_orig*100).toFixed(1)}%"></div></div><span class="prog-val">${data.huffman.bits_comp}</span></div>
      </div>
      <div class="compare-card">
        <div class="compare-header"><span class="compare-title">Shannon-Fano</span><span class="badge badge-sf">clásico</span></div>
        <div class="prog-row"><span class="prog-lbl">Compresión</span><div class="prog-bg"><div class="prog-fill-sf" style="width:${data.shannon_fano.tasa}%"></div></div><span class="prog-val">${data.shannon_fano.tasa}%</span></div>
        <div class="prog-row"><span class="prog-lbl">Eficiencia</span><div class="prog-bg"><div class="prog-fill-sf" style="width:${data.shannon_fano.eficiencia}%"></div></div><span class="prog-val">${data.shannon_fano.eficiencia}%</span></div>
        <div class="prog-row"><span class="prog-lbl">Long. prom.</span><div class="prog-bg"><div class="prog-fill-sf" style="width:${Math.min(data.shannon_fano.long_prom/8*100,100)}%"></div></div><span class="prog-val">${data.shannon_fano.long_prom} bits</span></div>
        <div class="prog-row"><span class="prog-lbl">Bits totales</span><div class="prog-bg"><div class="prog-fill-sf" style="width:${(data.shannon_fano.bits_comp/data.shannon_fano.bits_orig*100).toFixed(1)}%"></div></div><span class="prog-val">${data.shannon_fano.bits_comp}</span></div>
      </div>
    `;
    const mejor = data.huffman.bits_comp <= data.shannon_fano.bits_comp ? "Huffman" : "Shannon-Fano";
    const diff  = Math.abs(data.huffman.bits_comp - data.shannon_fano.bits_comp);
    const conclusion = document.createElement("div");
    conclusion.className = "conclusion";
    conclusion.innerHTML = `<b>${mejor}</b> genera ${diff} bits menos para este texto. La eficiencia de Huffman es ${data.huffman.eficiencia}% vs ${data.shannon_fano.eficiencia}% de Shannon-Fano. Huffman garantiza códigos óptimos; Shannon-Fano es más sencillo de implementar manualmente.`;
    cont.appendChild(cmp);
    cont.appendChild(conclusion);
  }
}

// ─── Salida binaria ──────────────────────────────────────────────────────────

function renderSalida(data) {
  const cont = document.getElementById("salida-container");
  cont.innerHTML = "";

  ["huffman", "shannon_fano"].forEach(alg => {
    if (!data[alg]) return;
    const d   = data[alg];
    const lbl = alg === "huffman" ? "Huffman" : "Shannon-Fano";
    const cls = alg === "huffman" ? "badge-h" : "badge-sf";
    const sec = document.createElement("div");
    sec.className = "salida-section";
    sec.innerHTML = `
      <div class="salida-title">Salida binaria <span class="badge ${cls}">${lbl}</span></div>
      <div class="bin-box" id="bin-${alg}">${d.codificado}</div>
      <div class="salida-actions">
        <button class="btn-secondary" onclick="copiarTexto('${d.codificado}', this)">⎘ Copiar binario</button>
        <span style="font-size:11px;color:var(--hint);align-self:center">${d.bits_comp} bits totales</span>
      </div>
    `;
    cont.appendChild(sec);
  });
}

// ─── Gráficos ────────────────────────────────────────────────────────────────

function renderGraficos(data) {
  const frecuencias = data.frecuencias;
  const labels      = Object.keys(frecuencias).map(simboloDisplay);
  const freqVals    = Object.values(frecuencias);

  if (chartFreq) chartFreq.destroy();
  const ctxF = document.getElementById("chart-freq").getContext("2d");
  chartFreq = new Chart(ctxF, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Frecuencia", data: freqVals, backgroundColor: "#1a3050cc", borderRadius: 4 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  const tieneH  = !!data.huffman;
  const tieneSF = !!data.shannon_fano;
  const wrapLen = document.getElementById("chart-len-wrap");

  if (tieneH || tieneSF) {
    wrapLen.style.display = "block";
    if (chartLen) chartLen.destroy();
    const ctxL = document.getElementById("chart-len").getContext("2d");
    const datasets = [];
    if (tieneH)  datasets.push({ label: "Huffman",       data: labels.map((_, i) => data.huffman.tabla[Object.keys(frecuencias)[i]]?.length || 0),       backgroundColor: "#1a3050bb", borderRadius: 4 });
    if (tieneSF) datasets.push({ label: "Shannon-Fano",  data: labels.map((_, i) => data.shannon_fano.tabla[Object.keys(frecuencias)[i]]?.length || 0),   backgroundColor: "#1a5c3abb", borderRadius: 4 });
    chartLen = new Chart(ctxL, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { legend: { display: tieneH && tieneSF } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }
}

// ─── Decodificar ─────────────────────────────────────────────────────────────

function renderDecodificar(data) {
  const cont = document.getElementById("decodificar-container");
  cont.innerHTML = "";

  ["huffman", "shannon_fano"].forEach(alg => {
    if (!data[alg]) return;
    const lbl = alg === "huffman" ? "Huffman" : "Shannon-Fano";
    const cls = alg === "huffman" ? "badge-h" : "badge-sf";
    const sec = document.createElement("div");
    sec.className = "decode-section";
    const inputId  = `dec-input-${alg}`;
    const resultId = `dec-result-${alg}`;
    sec.innerHTML = `
      <div class="decode-title">Decodificar con tabla <span class="badge ${cls}">${lbl}</span></div>
      <div class="decode-row">
        <input type="text" id="${inputId}" placeholder="Pegá la secuencia binaria aquí...">
        <button class="run-btn" style="width:auto;padding:8px 16px" onclick="decodificar('${alg}', '${inputId}', '${resultId}')">Decodificar</button>
        <button class="btn-secondary" onclick="document.getElementById('${inputId}').value='${data[alg].codificado}'">Usar salida</button>
      </div>
      <div class="decode-result" id="${resultId}">El resultado aparecerá aquí...</div>
    `;
    cont.appendChild(sec);
  });
}

async function decodificar(alg, inputId, resultId) {
  const binario = document.getElementById(inputId).value.trim();
  const tabla   = ultimoResultado?.[alg]?.tabla;
  const resEl   = document.getElementById(resultId);
  if (!binario || !tabla) { resEl.textContent = "Falta la secuencia o la tabla."; return; }
  try {
    const res  = await fetch(`${API}/decodificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ binario, tabla })
    });
    const data = await res.json();
    if (data.error) {
      resEl.textContent = data.error;
      resEl.className = "decode-result decode-err";
    } else {
      resEl.textContent = data.texto;
      resEl.className = "decode-result decode-ok";
    }
  } catch {
    resEl.textContent = "Error de conexión con el servidor.";
    resEl.className = "decode-result decode-err";
  }
}

// ─── Historial ───────────────────────────────────────────────────────────────

async function cargarHistorial() {
  const cont = document.getElementById("historial-list");
  cont.innerHTML = `<div class="hist-empty">Cargando...</div>`;
  try {
    const res  = await fetch(`${API}/historial`);
    const data = await res.json();
    if (!data.length) {
      cont.innerHTML = `<div class="hist-empty">No hay registros todavía. Codificá algún texto primero.</div>`;
      return;
    }
    cont.innerHTML = data.map(r => `
      <div class="hist-card" id="hist-${r.id}">
        <div class="hist-info">
          <div class="hist-text">${r.texto}</div>
          <div class="hist-meta">${r.fecha} · <b>${r.algoritmo}</b></div>
        </div>
        <div class="hist-stats">
          <div class="hist-stat"><div class="hist-stat-val">${r.tasa}%</div><div class="hist-stat-lbl">Compresión</div></div>
          <div class="hist-stat"><div class="hist-stat-val">${r.eficiencia}%</div><div class="hist-stat-lbl">Eficiencia</div></div>
          <div class="hist-stat"><div class="hist-stat-val">${r.long_prom}</div><div class="hist-stat-lbl">Long. prom.</div></div>
        </div>
        <button class="hist-del" onclick="eliminarHistorial(${r.id})">✕</button>
      </div>
    `).join("");
  } catch {
    cont.innerHTML = `<div class="hist-empty">No se pudo cargar el historial. ¿Está corriendo el servidor?</div>`;
  }
}

async function eliminarHistorial(id) {
  await fetch(`${API}/historial/${id}`, { method: "DELETE" });
  document.getElementById(`hist-${id}`)?.remove();
}
