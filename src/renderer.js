/**
 * renderer.js
 * Controls NetMeter UI, metric updates, settings overlay, and user actions.
 */

const api = window.netMeterAPI;

let currentSettings = {};

function init() {
  if (!api) {
    console.error('[NetMeter] preload API bridge not found.');
    return;
  }

  // 1. Immediately register real-time speed listener
  api.onNetworkUpdate((data) => {
    if (!data) return;

    const speedDownVal = document.getElementById('speed-down-val');
    const speedDownUnit = document.getElementById('speed-down-unit');
    const speedUpVal = document.getElementById('speed-up-val');
    const speedUpUnit = document.getElementById('speed-up-unit');
    const adapterLabel = document.getElementById('adapter-label');
    const vpnBadge = document.getElementById('vpn-badge');

    if (speedDownVal) speedDownVal.textContent = data.download.value;
    if (speedDownUnit) speedDownUnit.textContent = data.download.unit;
    if (speedUpVal) speedUpVal.textContent = data.upload.value;
    if (speedUpUnit) speedUpUnit.textContent = data.upload.unit;

    if (adapterLabel && data.adapterDescription) {
      adapterLabel.textContent = data.adapterDescription;
      adapterLabel.title = `${data.adapterName} - ${data.adapterDescription}`;
    }

    if (vpnBadge) {
      if (data.isVpnActive) {
        vpnBadge.classList.remove('hidden');
        if (data.vpnName) vpnBadge.title = `VPN Active: ${data.vpnName}`;
      } else {
        vpnBadge.classList.add('hidden');
      }
    }
  });

  // 2. Immediately register real-time latency listener
  api.onLatencyUpdate((data) => {
    if (!data) return;

    const latencyVal = document.getElementById('latency-val');
    const latencyUnit = document.getElementById('latency-unit');

    if (!latencyVal || !latencyUnit) return;

    if (data.status === 'success' && data.latencyMs !== null) {
      latencyVal.textContent = data.isSubMillisecond ? '<1' : data.latencyMs;
      latencyUnit.textContent = 'ms';
      latencyVal.style.color = '';
      latencyVal.title = data.protocol === 'tcp' ? 'Measured via TCP handshake (port 53 fallback)' : 'Measured via ICMP ping';
    } else if (data.status === 'timeout') {
      latencyVal.textContent = 'Timeout';
      latencyUnit.textContent = '';
      latencyVal.style.color = '#ef4444';
    } else if (data.status === 'unavailable') {
      latencyVal.textContent = 'N/A';
      latencyUnit.textContent = '';
      latencyVal.style.color = '#94a3b8';
    } else {
      latencyVal.textContent = '--';
      latencyUnit.textContent = 'ms';
      latencyVal.style.color = '';
    }
  });

  // 3. Listen for Windows system theme changes
  if (api.onSystemThemeChanged) {
    api.onSystemThemeChanged((isDark) => {
      if (currentSettings.theme === 'system' || !currentSettings.theme) {
        updateThemeClass('system', isDark);
      }
    });
  }

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkQuery.addEventListener('change', (e) => {
    if (currentSettings.theme === 'system' || !currentSettings.theme) {
      updateThemeClass('system', e.matches);
    }
  });

  // 4. Bind UI event listeners
  setupEventListeners();

  // 5. Load settings & adapters asynchronously
  loadSettingsAndAdapters();
}

async function loadSettingsAndAdapters() {
  try {
    currentSettings = await api.getSettings();
    applySettingsToUI(currentSettings);
  } catch (err) {
    console.error('[NetMeter] Error loading settings:', err);
  }

  try {
    await loadAdapters();
  } catch (err) {
    console.error('[NetMeter] Error loading adapters:', err);
  }
}

function updateThemeClass(theme, isSystemDark) {
  let isDark = true;
  if (theme === 'light') {
    isDark = false;
  } else if (theme === 'dark') {
    isDark = true;
  } else {
    if (typeof isSystemDark === 'boolean') {
      isDark = isSystemDark;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  const isDocked = currentSettings.widgetMode === 'docked';
  document.body.className = `${isDark ? 'theme-dark' : 'theme-light'} ${isDocked ? 'mode-docked' : 'mode-floating'}`;
}

function applySettingsToUI(settings) {
  updateThemeClass(settings.theme || 'system');

  const settingWidgetMode = document.getElementById('setting-widget-mode');
  const settingUnit = document.getElementById('setting-unit');
  const settingPingTarget = document.getElementById('setting-ping-target');
  const settingTheme = document.getElementById('setting-theme');
  const settingOpacity = document.getElementById('setting-opacity');
  const settingDynamicTray = document.getElementById('setting-dynamic-tray');
  const settingAlwaysOnTop = document.getElementById('setting-always-on-top');
  const settingStartWindows = document.getElementById('setting-start-windows');
  const settingMinimizeTray = document.getElementById('setting-minimize-tray');

  if (settingWidgetMode) settingWidgetMode.value = settings.widgetMode || 'docked';
  if (settingUnit) settingUnit.value = settings.speedUnit || 'Auto';
  if (settingPingTarget) settingPingTarget.value = settings.pingTarget || '8.8.8.8';
  if (settingTheme) settingTheme.value = settings.theme || 'system';
  if (settingOpacity) settingOpacity.value = settings.windowOpacity !== undefined ? settings.windowOpacity : 1.0;
  if (settingDynamicTray) settingDynamicTray.checked = settings.dynamicTrayIcon !== false;
  if (settingAlwaysOnTop) settingAlwaysOnTop.checked = Boolean(settings.alwaysOnTop);
  if (settingStartWindows) settingStartWindows.checked = Boolean(settings.startWithWindows);
  if (settingMinimizeTray) settingMinimizeTray.checked = Boolean(settings.minimizeToTray);
}

async function loadAdapters() {
  const settingAdapter = document.getElementById('setting-adapter');
  if (!settingAdapter) return;

  const list = await api.getAdapters();
  settingAdapter.innerHTML = '<option value="auto">Automatic</option>';

  list.forEach(adapter => {
    const opt = document.createElement('option');
    opt.value = adapter.name;
    const tag = adapter.isVpn ? ' [VPN]' : '';
    opt.textContent = `${adapter.name} (${adapter.description})${tag}`;
    if (currentSettings.adapter && currentSettings.adapter.toLowerCase() === adapter.name.toLowerCase()) {
      opt.selected = true;
    }
    settingAdapter.appendChild(opt);
  });
}

function setupEventListeners() {
  const btnMode = document.getElementById('btn-mode');
  const btnPin = document.getElementById('btn-pin');
  const btnSettings = document.getElementById('btn-settings');
  const btnMinimize = document.getElementById('btn-minimize');
  const btnClose = document.getElementById('btn-close');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const settingsPanel = document.getElementById('settings-panel');

  const settingWidgetMode = document.getElementById('setting-widget-mode');
  const settingUnit = document.getElementById('setting-unit');
  const settingAdapter = document.getElementById('setting-adapter');
  const settingPingTarget = document.getElementById('setting-ping-target');
  const settingTheme = document.getElementById('setting-theme');
  const settingOpacity = document.getElementById('setting-opacity');
  const settingDynamicTray = document.getElementById('setting-dynamic-tray');
  const settingAlwaysOnTop = document.getElementById('setting-always-on-top');
  const settingStartWindows = document.getElementById('setting-start-windows');
  const settingMinimizeTray = document.getElementById('setting-minimize-tray');

  if (btnMode) {
    btnMode.addEventListener('click', () => {
      const newMode = currentSettings.widgetMode === 'docked' ? 'floating' : 'docked';
      currentSettings.widgetMode = newMode;
      applySettingsToUI(currentSettings);
      api.windowAction('set-widget-mode', newMode);
      saveSetting({ widgetMode: newMode });
    });
  }

  if (btnMinimize) btnMinimize.addEventListener('click', () => api.windowAction('minimize'));
  if (btnClose) btnClose.addEventListener('click', () => api.windowAction('close'));

  if (btnSettings && settingsPanel) {
    btnSettings.addEventListener('click', () => {
      settingsPanel.classList.remove('hidden');
      loadAdapters();
    });
  }

  if (btnCloseSettings && settingsPanel) {
    btnCloseSettings.addEventListener('click', () => settingsPanel.classList.add('hidden'));
  }

  if (settingWidgetMode) {
    settingWidgetMode.addEventListener('change', () => {
      const mode = settingWidgetMode.value;
      currentSettings.widgetMode = mode;
      applySettingsToUI(currentSettings);
      api.windowAction('set-widget-mode', mode);
      saveSetting({ widgetMode: mode });
    });
  }

  if (settingUnit) {
    settingUnit.addEventListener('change', () => saveSetting({ speedUnit: settingUnit.value }));
  }

  if (settingAdapter) {
    settingAdapter.addEventListener('change', () => saveSetting({ adapter: settingAdapter.value }));
  }

  if (settingPingTarget) {
    settingPingTarget.addEventListener('change', () => {
      const target = settingPingTarget.value.trim();
      if (target) saveSetting({ pingTarget: target });
    });
  }

  if (settingTheme) {
    settingTheme.addEventListener('change', () => {
      const theme = settingTheme.value;
      currentSettings.theme = theme;
      applySettingsToUI(currentSettings);
      saveSetting({ theme });
    });
  }

  if (settingOpacity) {
    settingOpacity.addEventListener('input', () => {
      const opacity = parseFloat(settingOpacity.value);
      api.windowAction('set-opacity', opacity);
    });
  }

  if (settingDynamicTray) {
    settingDynamicTray.addEventListener('change', () => {
      saveSetting({ dynamicTrayIcon: settingDynamicTray.checked });
    });
  }

  if (settingAlwaysOnTop) {
    settingAlwaysOnTop.addEventListener('change', () => {
      saveSetting({ alwaysOnTop: settingAlwaysOnTop.checked });
    });
  }

  if (settingStartWindows) {
    settingStartWindows.addEventListener('change', () => {
      saveSetting({ startWithWindows: settingStartWindows.checked });
    });
  }

  if (settingMinimizeTray) {
    settingMinimizeTray.addEventListener('change', () => {
      saveSetting({ minimizeToTray: settingMinimizeTray.checked });
    });
  }

  // Right-click anywhere toggles settings
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (settingsPanel) {
      settingsPanel.classList.toggle('hidden');
      if (!settingsPanel.classList.contains('hidden')) loadAdapters();
    }
  });
}

async function saveSetting(delta) {
  currentSettings = { ...currentSettings, ...delta };
  await api.saveSettings(delta);
}

// Start immediately or on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
