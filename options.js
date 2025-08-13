// Opciones de auto refresco
const DEFAULTS = {
  autoRefreshEnabled: true,
  autoRefreshIntervalSeconds: 45,
  translationEnabled: true
};

const els = {
  enabled: document.getElementById('enabled'),
  translationEnabled: document.getElementById('translationEnabled'),
  interval: document.getElementById('interval'),
  reset: document.getElementById('reset'),
  status: document.getElementById('status')
};

function showStatus(msg, timeout = 2200) {
  els.status.textContent = msg;
  if (timeout) setTimeout(() => { if (els.status.textContent === msg) els.status.textContent = ''; }, timeout);
}

function load() {
  if (!chrome?.storage?.sync) {
  els.enabled.checked = DEFAULTS.autoRefreshEnabled;
  els.translationEnabled.checked = DEFAULTS.translationEnabled;
    els.interval.value = DEFAULTS.autoRefreshIntervalSeconds;
    showStatus('Storage no disponible: usando valores por defecto');
    return;
  }
  chrome.storage.sync.get(DEFAULTS, (res) => {
  els.enabled.checked = !!res.autoRefreshEnabled;
  els.translationEnabled.checked = !!res.translationEnabled;
    els.interval.value = Number(res.autoRefreshIntervalSeconds) || DEFAULTS.autoRefreshIntervalSeconds;
  });
}

function clampInterval(v) {
  let n = Number(v);
  if (!Number.isFinite(n) || n <= 0) n = DEFAULTS.autoRefreshIntervalSeconds;
  if (n < 10) n = 10;
  return n;
}

function save() {
  const enabled = els.enabled.checked;
  const translationEnabled = els.translationEnabled.checked;
  const interval = clampInterval(els.interval.value);
  els.interval.value = interval;
  chrome.storage.sync.set({
    autoRefreshEnabled: enabled,
    autoRefreshIntervalSeconds: interval,
    translationEnabled
  }, () => {
    showStatus('Cambios guardados');
  });
}

let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(save, 500);
}

function resetDefaults() {
  els.enabled.checked = DEFAULTS.autoRefreshEnabled;
  els.translationEnabled.checked = DEFAULTS.translationEnabled;
  els.interval.value = DEFAULTS.autoRefreshIntervalSeconds;
  save();
}

els.reset.addEventListener('click', resetDefaults);

// Auto-guardado con debounce
els.enabled.addEventListener('change', scheduleSave);
els.translationEnabled.addEventListener('change', scheduleSave);
els.interval.addEventListener('input', scheduleSave);

document.addEventListener('DOMContentLoaded', load);
