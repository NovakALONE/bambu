/* ============================================================
   BAMBU CALC — App Logic
   ============================================================ */

'use strict';

// ── Filament Database ──────────────────────────────────────────
const FILAMENT_DB = {
  'PLA':     { density: 1.24, nozzleMin: 190, nozzleMax: 230, bedMin: 25, bedMax: 60,  speed: 500, difficulty: 'Fácil',   difficulty_class: 'easy',   compat: 'yes',     price: 89.90  },
  'PLA+':    { density: 1.27, nozzleMin: 200, nozzleMax: 240, bedMin: 25, bedMax: 65,  speed: 400, difficulty: 'Fácil',   difficulty_class: 'easy',   compat: 'yes',     price: 99.90  },
  'PETG':    { density: 1.27, nozzleMin: 220, nozzleMax: 250, bedMin: 70, bedMax: 85,  speed: 300, difficulty: 'Médio',   difficulty_class: 'medium', compat: 'yes',     price: 109.90 },
  'ABS':     { density: 1.04, nozzleMin: 230, nozzleMax: 260, bedMin: 90, bedMax: 110, speed: 200, difficulty: 'Difícil', difficulty_class: 'hard',   compat: 'partial', price: 79.90  },
  'TPU':     { density: 1.20, nozzleMin: 210, nozzleMax: 230, bedMin: 40, bedMax: 60,  speed: 150, difficulty: 'Médio',   difficulty_class: 'medium', compat: 'yes',     price: 129.90 },
  'PETG-CF': { density: 1.35, nozzleMin: 240, nozzleMax: 270, bedMin: 70, bedMax: 90,  speed: 250, difficulty: 'Médio',   difficulty_class: 'medium', compat: 'yes',     price: 169.90 },
  'PA':      { density: 1.15, nozzleMin: 240, nozzleMax: 280, bedMin: 70, bedMax: 90,  speed: 200, difficulty: 'Difícil', difficulty_class: 'hard',   compat: 'partial', price: 189.90 },
  'ASA':     { density: 1.07, nozzleMin: 240, nozzleMax: 260, bedMin: 90, bedMax: 110, speed: 200, difficulty: 'Difícil', difficulty_class: 'hard',   compat: 'partial', price: 119.90 },
};

const ALL_FILAMENTS = Object.entries(FILAMENT_DB).map(([name, data]) => ({ name, ...data }));

// ── State ──────────────────────────────────────────────────────
let currentFilament = 'PLA';
let history = JSON.parse(localStorage.getItem('bambuCalcHistory') || '[]');

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  createParticles();
  buildFilamentTable();
  calculate();
  estimateTime();
  convertFilament();
  renderHistory();
  updateStats();
  updateSliders();
});

// ── Tab Navigation ─────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const btn = document.getElementById(`tab-${name}`);
  const panel = document.getElementById(`panel-${name}`);
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  panel.classList.add('active');
}

// ── Particles ─────────────────────────────────────────────────
function createParticles() {
  const container = document.getElementById('bgParticles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const dur = Math.random() * 15 + 8;
    const delay = Math.random() * 10;
    const colors = ['rgba(0,212,255,0.4)', 'rgba(123,47,255,0.4)', 'rgba(0,229,160,0.3)'];
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${x}%;
      bottom: -10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      --dur: ${dur}s;
      --delay: ${delay}s;
    `;
    container.appendChild(p);
  }
}

// ── Filament Selection ─────────────────────────────────────────
function selectFilament(type, el) {
  currentFilament = type;
  document.querySelectorAll('#filamentChips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  calculate();
}

// ── Slider Sync ───────────────────────────────────────────────
function syncSlider(inputId, val) {
  const input = document.getElementById(inputId);
  if (input) { input.value = val; calculate(); }
}
function syncInput(sliderId, val) {
  const slider = document.getElementById(sliderId);
  if (slider) slider.value = Math.min(slider.max, Math.max(slider.min, val));
}

function updateSliders() {
  syncInput('usedWeightSlider', document.getElementById('usedWeight').value);
  syncInput('profitMarginSlider', document.getElementById('profitMargin').value);
}

// ── Main Cost Calculator ───────────────────────────────────────
function calculate() {
  const filWeight  = parseFloat(document.getElementById('filamentWeight').value) || 1000;
  const filPrice   = parseFloat(document.getElementById('filamentPrice').value) || 0;
  const usedWeight = parseFloat(document.getElementById('usedWeight').value) || 0;
  const powerW     = parseFloat(document.getElementById('powerWatts').value) || 200;
  const kwPrice    = parseFloat(document.getElementById('kwPrice').value) || 0.85;
  const hours      = parseFloat(document.getElementById('printHours').value) || 0;
  const minutes    = parseFloat(document.getElementById('printMinutes').value) || 0;
  const labor      = parseFloat(document.getElementById('laborCost').value) || 0;
  const deprec     = parseFloat(document.getElementById('printerDepreciation').value) || 0;
  const margin     = parseFloat(document.getElementById('profitMargin').value) || 0;

  const totalTime = hours + minutes / 60; // in hours

  const filamentCost   = (filPrice / filWeight) * usedWeight;
  const energyKwh      = (powerW / 1000) * totalTime;
  const energyCost     = energyKwh * kwPrice;
  const laborCost      = labor * totalTime;
  const depreciCost    = deprec * totalTime;
  const totalCost      = filamentCost + energyCost + laborCost + depreciCost;
  const sellingPrice   = totalCost * (1 + margin / 100);
  const profit         = sellingPrice - totalCost;

  // Update DOM
  el('res-filament').textContent    = fmtBRL(filamentCost);
  el('res-energy').textContent      = fmtBRL(energyCost);
  el('res-labor').textContent       = fmtBRL(laborCost);
  el('res-depreciation').textContent = fmtBRL(depreciCost);
  el('res-total').textContent       = fmtBRL(totalCost);
  el('res-selling').textContent     = fmtBRL(sellingPrice);
  el('res-profit').textContent      = fmtBRL(profit);

  // Bar chart
  if (totalCost > 0) {
    const barFilament   = (filamentCost / totalCost) * 100;
    const barEnergy     = (energyCost / totalCost) * 100;
    const barLabor      = (laborCost / totalCost) * 100;
    const barDepreciation = (depreciCost / totalCost) * 100;
    el('bar-filament').style.width   = barFilament + '%';
    el('bar-energy').style.width     = barEnergy + '%';
    el('bar-labor').style.width      = barLabor + '%';
    el('bar-depreciation').style.width = barDepreciation + '%';
  } else {
    ['bar-filament','bar-energy','bar-labor','bar-depreciation'].forEach(id => el(id).style.width = '0%');
  }

  // Store computed for saving
  window._lastCalc = { filamentCost, energyCost, laborCost, depreciCost, totalCost, sellingPrice, profit, usedWeight, totalTime };
}

// ── Time Estimator ─────────────────────────────────────────────
function estimateTime() {
  const layerH  = parseFloat(document.getElementById('layerHeight').value) || 0.2;
  const speed   = parseFloat(document.getElementById('printSpeed').value) || 250;
  const vol     = parseFloat(document.getElementById('objectVolume').value) || 20; // cm³
  const infill  = parseFloat(document.getElementById('infillDensity').value) || 15;
  const support = document.getElementById('supportEnabled').checked;

  // Update toggle label
  document.getElementById('supportLabel').textContent = support ? 'Habilitado' : 'Desabilitado';

  const NOZZLE_DIAM = 0.4; // mm
  const LAYER_H_MM = layerH; // mm

  // Volume in mm³
  const volMm3 = vol * 1000;

  // Effective fill ratio (shell + infill)
  const fillRatio = 0.25 + (infill / 100) * 0.75;
  const effectiveVol = volMm3 * fillRatio * (support ? 1.25 : 1);

  // Cross section area per layer (mm²)
  const lineWidth = NOZZLE_DIAM;
  const lineLength = effectiveVol / (LAYER_H_MM * lineWidth);

  // Speed with correction factor
  const avgSpeed = speed * 0.6; // real average is ~60% of max
  const printTimeSec = lineLength / avgSpeed;

  const totalHours = Math.floor(printTimeSec / 3600);
  const totalMins = Math.floor((printTimeSec % 3600) / 60);

  // Filament used
  const filamentDb = FILAMENT_DB[currentFilament] || FILAMENT_DB['PLA'];
  const density = filamentDb.density;
  const filamentVol = effectiveVol / 1000; // cm³
  const filamentGrams = filamentVol * density;
  const filamentMeters = (lineLength / 1000).toFixed(1); // m

  // Layer count
  const objHeightMm = Math.cbrt(volMm3); // rough cube equivalent
  const layers = Math.ceil(objHeightMm / layerH);

  el('time-hours').textContent = totalHours;
  el('time-minutes').textContent = String(totalMins).padStart(2, '0');
  el('time-filament-use').textContent = `${filamentGrams.toFixed(1)}g / ${filamentMeters}m`;
  el('time-layers').textContent = `${layers.toLocaleString('pt-BR')} camadas`;

  // Store for transfer
  window._lastTime = { hours: totalHours, minutes: totalMins, grams: filamentGrams };
}

function useTimeInCalculator() {
  if (!window._lastTime) return;
  document.getElementById('printHours').value = window._lastTime.hours;
  document.getElementById('printMinutes').value = window._lastTime.minutes;
  document.getElementById('usedWeight').value = Math.round(window._lastTime.grams);
  document.getElementById('usedWeightSlider').value = Math.min(300, Math.round(window._lastTime.grams));
  calculate();
  switchTab('custo');
  showToast('⚡ Dados transferidos para calculadora de custo!');
}

// ── Layer / Speed chips ────────────────────────────────────────
function selectLayer(val, el_) {
  document.querySelectorAll('#layerChips .chip').forEach(c => c.classList.remove('active'));
  el_.classList.add('active');
  document.getElementById('layerHeight').value = val;
  estimateTime();
}
function selectSpeed(val, el_) {
  document.querySelectorAll('#speedChips .chip').forEach(c => c.classList.remove('active'));
  el_.classList.add('active');
  document.getElementById('printSpeed').value = val;
  estimateTime();
}

// ── Filament Table ─────────────────────────────────────────────
function buildFilamentTable() {
  const tbody = document.getElementById('filamentTableBody');
  const rows = ALL_FILAMENTS.map(f => {
    const compatHtml = f.compat === 'yes'
      ? `<span class="compat yes">✓ Sim</span>`
      : `<span class="compat partial">~ Parcial</span>`;

    return `<tr>
      <td><span class="filament-name">${f.name}</span></td>
      <td>${f.nozzleMin}–${f.nozzleMax} °C</td>
      <td>${f.bedMin}–${f.bedMax} °C</td>
      <td>até ${f.speed} mm/s</td>
      <td><span class="difficulty diff-${f.difficulty_class}">${f.difficulty}</span></td>
      <td>${f.density} g/cm³</td>
      <td>R$ ${f.price.toFixed(2).replace('.', ',')}/kg</td>
      <td>${compatHtml}</td>
    </tr>`;
  });
  tbody.innerHTML = rows.join('');
}

// ── Filament Converter ─────────────────────────────────────────
function convertFilament() {
  const density = parseFloat(document.getElementById('convFilament').value) || 1.24;
  const grams   = parseFloat(document.getElementById('convGrams').value) || 0;
  const NOZZLE_DIAM = 0.4; // mm
  const volume  = grams / density; // cm³
  const volMm3  = volume * 1000;
  const lineWidth = NOZZLE_DIAM;
  const layerH = 0.2;
  const meters  = (volMm3 / (lineWidth * layerH)) / 1000;
  const cost    = (grams / 1000) * 89.90;

  el('conv-meters').textContent = `${meters.toFixed(1)} m`;
  el('conv-volume').textContent = `${volume.toFixed(2)} cm³`;
  el('conv-cost').textContent   = fmtBRL(cost);
}

// ── History ───────────────────────────────────────────────────
function saveToHistory() {
  if (!window._lastCalc) { calculate(); }
  const calc = window._lastCalc;
  const name = document.getElementById('projectName').value.trim() || `Impressão #${history.length + 1}`;
  const entry = {
    id: Date.now(),
    name,
    filament: currentFilament,
    ...calc,
    date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  };
  history.unshift(entry);
  localStorage.setItem('bambuCalcHistory', JSON.stringify(history));
  renderHistory();
  updateStats();
  showToast('✅ Salvo no histórico!');
}

function renderHistory() {
  const list = document.getElementById('historyList');
  const empty = document.getElementById('emptyHistory');

  if (history.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.style.display = 'flex';
    return;
  }

  const FILAMENT_EMOJIS = { PLA:'🟢', 'PLA+':'💚', PETG:'🔵', ABS:'🟡', TPU:'🟣', 'PETG-CF':'⚫' };

  list.innerHTML = history.map(entry => `
    <div class="history-item" id="hist-${entry.id}">
      <div class="history-icon">${FILAMENT_EMOJIS[entry.filament] || '🖨️'}</div>
      <div class="history-info">
        <div class="history-name">${escHtml(entry.name)}</div>
        <div class="history-meta">${entry.filament} · ${entry.usedWeight?.toFixed(1) || 0}g · ${formatTime(entry.totalTime || 0)} · ${entry.date}</div>
      </div>
      <div>
        <div class="history-cost">${fmtBRL(entry.sellingPrice)}</div>
        <div class="history-cost-sub">custo: ${fmtBRL(entry.totalCost)}</div>
      </div>
      <button class="history-del" onclick="deleteHistory(${entry.id})" title="Remover">
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
  `).join('');
}

function deleteHistory(id) {
  history = history.filter(e => e.id !== id);
  localStorage.setItem('bambuCalcHistory', JSON.stringify(history));
  renderHistory();
  updateStats();
  showToast('🗑️ Removido do histórico');
}

function clearHistory() {
  if (history.length === 0) return;
  if (confirm('Limpar todo o histórico?')) {
    history = [];
    localStorage.setItem('bambuCalcHistory', JSON.stringify([]));
    renderHistory();
    updateStats();
    showToast('🗑️ Histórico limpo');
  }
}

function updateStats() {
  const totalPrints    = history.length;
  const totalCost      = history.reduce((s, e) => s + (e.totalCost || 0), 0);
  const totalFilament  = history.reduce((s, e) => s + (e.usedWeight || 0), 0);
  const avgCost        = totalPrints > 0 ? totalCost / totalPrints : 0;

  el('stat-total-prints').textContent   = totalPrints;
  el('stat-total-cost').textContent     = totalPrints > 0 ? fmtBRL(totalCost) : 'R$ 0';
  el('stat-total-filament').textContent = totalPrints > 0 ? `${totalFilament.toFixed(0)}g` : '0g';
  el('stat-avg-cost').textContent       = totalPrints > 0 ? fmtBRL(avgCost) : 'R$ 0';
}

// ── Copy Result ───────────────────────────────────────────────
function copyResult() {
  if (!window._lastCalc) return;
  const c = window._lastCalc;
  const name = document.getElementById('projectName').value.trim() || 'Impressão 3D';
  const text = `📦 ${name} — Bambu Lab A1 Mini
  
• Filamento (${currentFilament}): ${fmtBRL(c.filamentCost)}
• Energia: ${fmtBRL(c.energyCost)}
• Mão de Obra: ${fmtBRL(c.laborCost)}
• Depreciação: ${fmtBRL(c.depreciCost)}
────────────────────
• Custo Total: ${fmtBRL(c.totalCost)}
• Preço de Venda: ${fmtBRL(c.sellingPrice)}
• Lucro: ${fmtBRL(c.profit)}

Calculado em Bambu Calc A1 Mini`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Copiado para a área de transferência!');
  }).catch(() => {
    showToast('❌ Não foi possível copiar');
  });
}

// ── Reset ─────────────────────────────────────────────────────
function resetForm() {
  document.getElementById('filamentWeight').value = 1000;
  document.getElementById('filamentPrice').value = 89.90;
  document.getElementById('usedWeight').value = 50;
  document.getElementById('usedWeightSlider').value = 50;
  document.getElementById('powerWatts').value = 200;
  document.getElementById('kwPrice').value = 0.85;
  document.getElementById('printHours').value = 2;
  document.getElementById('printMinutes').value = 30;
  document.getElementById('laborCost').value = 0;
  document.getElementById('printerDepreciation').value = 1.50;
  document.getElementById('profitMargin').value = 30;
  document.getElementById('profitMarginSlider').value = 30;
  document.getElementById('projectName').value = '';
  currentFilament = 'PLA';
  document.querySelectorAll('#filamentChips .chip').forEach(c => c.classList.remove('active'));
  document.querySelector('#filamentChips [data-type="PLA"]').classList.add('active');
  calculate();
  showToast('🔄 Formulário limpo!');
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── Helpers ───────────────────────────────────────────────────
function el(id) { return document.getElementById(id); }

function fmtBRL(val) {
  if (isNaN(val)) val = 0;
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

function formatTime(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
