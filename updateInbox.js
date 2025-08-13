(function () {
  // Evita múltiples inicializaciones si el content script se inyecta más de una vez
  if (window.__ymt_refresh_initialized) return;
  window.__ymt_refresh_initialized = true;

  const DEFAULT_INTERVAL_MS = 45000; // 45 segundos por defecto
  const STORAGE_KEYS = {
    enabled: 'autoRefreshEnabled',
    interval: 'autoRefreshIntervalSeconds'
  };

  let refreshTimer = null;

  function log(msg) {
    // Comentar esta línea si no se desea logging en consola
    // console.debug('[Yahoo Mail Translator]', msg);
  }

  function updateInbox() {
    const targetDiv = document.querySelector('span[data-test-id="folder-label"]');
    if (targetDiv) {
      targetDiv.click();
      log('Inbox actualizado (click en folder-label)');
    } else {
      log('Elemento folder-label no encontrado');
    }
  }

  function clearTimer() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function validIntervalMs(seconds) {
    const s = Number(seconds);
    if (!Number.isFinite(s) || s <= 0) return DEFAULT_INTERVAL_MS;
    // Limita a mínimo 5s y máximo 10min para evitar abusos
    return Math.min(Math.max(s, 5), 600) * 1000;
  }

  function isOnInbox() {
    const currentUrl = window.location.href;
    const baseUrl = 'https://mail.yahoo.com/d/folders/1';
    const urlWithoutParams = currentUrl.split('?')[0];
    return urlWithoutParams === baseUrl;
  }

  function schedule(intervalMs) {
    clearTimer();
    refreshTimer = setInterval(() => {
      if (isOnInbox()) {
        updateInbox();
      }
    }, intervalMs);
    log(`Temporizador configurado cada ${intervalMs} ms`);
  }

  function applySettings(settings) {
    const enabled = settings[STORAGE_KEYS.enabled];
    const intervalSeconds = settings[STORAGE_KEYS.interval];
    if (enabled === false) {
      clearTimer();
      log('Auto refresh desactivado');
      return;
    }
    const intervalMs = validIntervalMs(intervalSeconds ?? (DEFAULT_INTERVAL_MS / 1000));
    schedule(intervalMs);
  }

  function init() {
    if (!chrome?.storage?.sync) {
      // Fallback si no hay storage: usar defaults
      schedule(DEFAULT_INTERVAL_MS);
      return;
    }
    chrome.storage.sync.get({
      [STORAGE_KEYS.enabled]: true,
      [STORAGE_KEYS.interval]: DEFAULT_INTERVAL_MS / 1000
    }, applySettings);

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (changes[STORAGE_KEYS.enabled] || changes[STORAGE_KEYS.interval]) {
        chrome.storage.sync.get({
          [STORAGE_KEYS.enabled]: true,
          [STORAGE_KEYS.interval]: DEFAULT_INTERVAL_MS / 1000
        }, applySettings);
      }
    });
  }

  init();
})();
