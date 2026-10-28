/**
 * main.js
 * Electron main process: window lifecycle, system tray, dynamic tray icon, IPC, and monitoring coordination.
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, nativeTheme } = require('electron');
const path = require('path');
const { SettingsService } = require('./settings/settings-service');
const { AdapterMonitor } = require('./network/adapter-monitor');
const { LatencyMonitor } = require('./network/latency-monitor');
const { createTraySpeedIcon } = require('./utils/tray-icon-generator');

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.exit(0);
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

let mainWindow = null;
let tray = null;
let settingsService = null;
let adapterMonitor = null;
let latencyMonitor = null;
let isQuitting = false;
let latestLatency = '--';

function bringToTop(forceFocus = false) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  const isDocked = settingsService.get('widgetMode') === 'docked';
  const alwaysOnTop = Boolean(settingsService.get('alwaysOnTop'));
  const shouldBeTopmost = isDocked || alwaysOnTop;
  const level = shouldBeTopmost ? 'screen-saver' : 'normal';

  mainWindow.setAlwaysOnTop(false);
  mainWindow.setAlwaysOnTop(shouldBeTopmost, level);
  if (shouldBeTopmost) {
    mainWindow.moveTop();
  }
  if (forceFocus) {
    mainWindow.focus();
  }
}

function createWindow() {
  const settings = settingsService.getAll();
  const savedBounds = settings.windowBounds;
  const isDocked = settings.widgetMode === 'docked';
  const width = isDocked ? 240 : 250;
  const height = isDocked ? 30 : 145;

  const primaryDisplay = screen.getPrimaryDisplay();
  const screenBounds = primaryDisplay.bounds;
  const workArea = primaryDisplay.workArea;
  const taskbarHeight = Math.max(40, screenBounds.height - workArea.height);
  const taskbarY = screenBounds.height - taskbarHeight;
  const defaultTaskbarY = taskbarY + Math.max(0, Math.round((taskbarHeight - height) / 2));
  const defaultTaskbarX = screenBounds.width - width - 260;

  let windowX = isDocked ? defaultTaskbarX : undefined;
  let windowY = isDocked ? defaultTaskbarY : undefined;

  // Restore saved position if valid
  if (savedBounds && typeof savedBounds.x === 'number' && typeof savedBounds.y === 'number') {
    if (isDocked) {
      // In docked mode, keep Y locked inside the taskbar, allow horizontal movement
      windowX = savedBounds.x;
      windowY = defaultTaskbarY;
    } else {
      windowX = savedBounds.x;
      windowY = savedBounds.y;
    }
  }

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: isDocked ? 180 : 220,
    minHeight: isDocked ? 28 : 130,
    x: windowX,
    y: windowY,
    icon: path.join(__dirname, 'assets/icon.png'),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: isDocked,
    resizable: true,
    opacity: typeof settings.windowOpacity === 'number' ? settings.windowOpacity : 1.0,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  // Security: deny new window creation and remote navigation
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  mainWindow.webContents.on('console-message', (_e, _level, msg) => {
    console.log('[Renderer]:', msg);
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (settings.alwaysOnTop) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  // Re-assert topmost above Windows taskbar whenever focus shifts
  mainWindow.on('blur', () => {
    const isDocked = settingsService.get('widgetMode') === 'docked';
    const alwaysOnTop = Boolean(settingsService.get('alwaysOnTop'));
    if (isDocked || alwaysOnTop) {
      setTimeout(() => {
        bringToTop(false);
      }, 80);
    }
  });

  const saveBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const bounds = mainWindow.getBounds();
    settingsService.save({ windowBounds: bounds });
  };
  mainWindow.on('moved', saveBounds);
  mainWindow.on('resized', saveBounds);

  mainWindow.on('close', (event) => {
    if (!isQuitting && settingsService.get('minimizeToTray')) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets/icon.ico');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('NetMeter — Initializing...');

  const updateContextMenu = () => {
    const currentMode = settingsService.get('widgetMode');
    const isDocked = currentMode === 'docked';

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show / Bring to Front',
        click: () => {
          bringToTop(true);
        }
      },
      {
        label: 'Taskbar Mini-Bar Mode',
        type: 'checkbox',
        checked: isDocked,
        click: (item) => {
          const newMode = item.checked ? 'docked' : 'floating';
          settingsService.save({ widgetMode: newMode });
          applyWidgetMode(newMode);
          if (mainWindow) {
            mainWindow.webContents.send('settings-changed', settingsService.getAll());
          }
        }
      },
      {
        label: 'Always on Top',
        type: 'checkbox',
        checked: Boolean(settingsService.get('alwaysOnTop')),
        click: (item) => {
          settingsService.save({ alwaysOnTop: item.checked });
          if (mainWindow) {
            mainWindow.setAlwaysOnTop(item.checked, item.checked ? 'screen-saver' : 'normal');
            if (item.checked) mainWindow.moveTop();
            mainWindow.webContents.send('settings-changed', settingsService.getAll());
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateContextMenu();

  tray.on('click', () => {
    bringToTop(true);
  });

  tray.on('double-click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      bringToTop(true);
    }
  });
}

function applyWidgetMode(mode) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const isDocked = mode === 'docked';
  const width = isDocked ? 240 : 250;
  const height = isDocked ? 30 : 145;

  const primaryDisplay = screen.getPrimaryDisplay();
  const screenBounds = primaryDisplay.bounds;
  const workArea = primaryDisplay.workArea;

  mainWindow.setMinimumSize(isDocked ? 180 : 220, isDocked ? 28 : 130);
  mainWindow.setSize(width, height);
  mainWindow.setSkipTaskbar(isDocked);

  if (isDocked) {
    const taskbarHeight = Math.max(40, screenBounds.height - workArea.height);
    const taskbarY = screenBounds.height - taskbarHeight;
    const y = taskbarY + Math.max(0, Math.round((taskbarHeight - height) / 2));
    const x = screenBounds.width - width - 260;
    mainWindow.setPosition(x, y);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.moveTop();
  } else {
    const alwaysOnTop = Boolean(settingsService.get('alwaysOnTop'));
    mainWindow.setAlwaysOnTop(alwaysOnTop, alwaysOnTop ? 'screen-saver' : 'normal');
    if (alwaysOnTop) mainWindow.moveTop();
  }
}

function isDarkTheme() {
  const current = settingsService ? settingsService.get('theme') : 'system';
  if (current === 'dark') return true;
  if (current === 'light') return false;
  return nativeTheme.shouldUseDarkColors;
}

function setupMonitors() {
  const settings = settingsService.getAll();

  adapterMonitor = new AdapterMonitor({
    adapter: settings.adapter,
    speedUnit: settings.speedUnit,
    interval: settings.refreshInterval
  });

  adapterMonitor.start((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('network-update', data);
      if (settingsService.get('widgetMode') === 'docked') {
        mainWindow.moveTop();
      }
    }

    // Update tray tooltip with real-time stats
    if (tray) {
      try {
        const vpnNotice = data.isVpnActive ? ` [VPN: ${data.vpnName || 'Active'}]` : '';
        tray.setToolTip(`NetMeter${vpnNotice}\n↓ ${data.download.formatted}\n↑ ${data.upload.formatted}\n◷ ${latestLatency}`);
      } catch (e) {
        console.error('Tray tooltip update error:', e);
      }
    }
  });

  latencyMonitor = new LatencyMonitor({
    target: settings.pingTarget,
    interval: settings.latencyInterval
  });

  latencyMonitor.start((data) => {
    latestLatency = data.status === 'success' ? `${data.latencyMs} ms` : (data.status === 'timeout' ? 'Timeout' : '-- ms');

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('latency-update', data);
    }
  });
}

function registerIpcHandlers() {
  const isTrustedSender = (event) => Boolean(mainWindow && event.sender && event.sender.id === mainWindow.webContents.id);

  ipcMain.handle('get-settings', (event) => {
    if (!isTrustedSender(event)) return null;
    return settingsService.getAll();
  });

  ipcMain.handle('save-settings', (event, newSettings) => {
    if (!isTrustedSender(event)) return settingsService.getAll();
    if (!newSettings || typeof newSettings !== 'object' || Array.isArray(newSettings)) {
      return settingsService.getAll();
    }

    const sanitized = {};

    if (typeof newSettings.widgetMode === 'string' && ['docked', 'floating'].includes(newSettings.widgetMode)) {
      sanitized.widgetMode = newSettings.widgetMode;
      applyWidgetMode(newSettings.widgetMode);
    }
    if (newSettings.alwaysOnTop !== undefined) {
      sanitized.alwaysOnTop = Boolean(newSettings.alwaysOnTop);
      if (mainWindow) {
        mainWindow.setAlwaysOnTop(sanitized.alwaysOnTop, sanitized.alwaysOnTop ? 'screen-saver' : 'normal');
        if (sanitized.alwaysOnTop) mainWindow.moveTop();
      }
    }
    if (newSettings.windowOpacity !== undefined) {
      const op = Number(newSettings.windowOpacity);
      if (!isNaN(op)) {
        sanitized.windowOpacity = Math.max(0.2, Math.min(1.0, op));
        if (mainWindow) mainWindow.setOpacity(sanitized.windowOpacity);
      }
    }
    if (newSettings.startWithWindows !== undefined) {
      sanitized.startWithWindows = Boolean(newSettings.startWithWindows);
      app.setLoginItemSettings({
        openAtLogin: sanitized.startWithWindows,
        path: process.execPath
      });
    }
    if (typeof newSettings.speedUnit === 'string' && ['Auto', 'auto-bits', 'Mbps', 'MB/s', 'KB/s', 'B/s'].includes(newSettings.speedUnit)) {
      sanitized.speedUnit = newSettings.speedUnit;
      if (adapterMonitor) adapterMonitor.setSpeedUnit(sanitized.speedUnit);
    }
    if (typeof newSettings.adapter === 'string') {
      sanitized.adapter = newSettings.adapter.slice(0, 100);
      if (adapterMonitor) adapterMonitor.setSelectedAdapter(sanitized.adapter);
    }
    if (typeof newSettings.theme === 'string' && ['system', 'dark', 'light'].includes(newSettings.theme)) {
      sanitized.theme = newSettings.theme;
    }
    if (newSettings.dynamicTrayIcon !== undefined) {
      sanitized.dynamicTrayIcon = Boolean(newSettings.dynamicTrayIcon);
    }
    if (newSettings.minimizeToTray !== undefined) {
      sanitized.minimizeToTray = Boolean(newSettings.minimizeToTray);
    }
    if (typeof newSettings.pingTarget === 'string') {
      const trimmed = newSettings.pingTarget.trim();
      // Validate safe hostname / IPv4 / IPv6 string (no shell metacharacters)
      if (/^[a-zA-Z0-9.-]{1,100}$/.test(trimmed)) {
        sanitized.pingTarget = trimmed;
        if (latencyMonitor) latencyMonitor.setTarget(trimmed);
      }
    }

    settingsService.save(sanitized);
    return settingsService.getAll();
  });

  ipcMain.handle('get-adapters', async (event) => {
    if (!isTrustedSender(event)) return [];
    if (!adapterMonitor) return [];
    return await adapterMonitor.getAdapterList();
  });

  ipcMain.handle('window-action', (event, action, payload) => {
    if (!isTrustedSender(event)) return;
    if (!mainWindow) return;

    const ALLOWED_ACTIONS = ['minimize', 'close', 'toggle-pin', 'set-opacity', 'set-widget-mode', 'bring-to-top'];
    if (!ALLOWED_ACTIONS.includes(action)) return;

    if (action === 'bring-to-top') {
      bringToTop(true);
    } else if (action === 'minimize') {
      mainWindow.minimize();
    } else if (action === 'close') {
      if (settingsService.get('minimizeToTray')) {
        mainWindow.hide();
      } else {
        isQuitting = true;
        mainWindow.close();
      }
    } else if (action === 'toggle-pin') {
      const current = mainWindow.isAlwaysOnTop();
      const updated = !current;
      mainWindow.setAlwaysOnTop(updated, updated ? 'screen-saver' : 'normal');
      if (updated) mainWindow.moveTop();
      settingsService.save({ alwaysOnTop: updated });
      return updated;
    } else if (action === 'set-opacity') {
      const opacity = Math.max(0.2, Math.min(1.0, Number(payload)));
      mainWindow.setOpacity(opacity);
      settingsService.save({ windowOpacity: opacity });
    } else if (action === 'set-widget-mode' && ['docked', 'floating'].includes(payload)) {
      settingsService.save({ widgetMode: payload });
      applyWidgetMode(payload);
    }
  });
}

app.whenReady().then(() => {
  settingsService = new SettingsService();

  // Sync Windows login startup setting
  if (settingsService.get('startWithWindows')) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: Boolean(settingsService.get('launchMinimized')),
      path: process.execPath
    });
  }

  createWindow();
  createTray();
  setupMonitors();
  registerIpcHandlers();

  // Auto adjust theme when Windows switches between Dark and Light mode
  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('system-theme-changed', nativeTheme.shouldUseDarkColors);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (adapterMonitor) adapterMonitor.stop();
  if (latencyMonitor) latencyMonitor.stop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !settingsService.get('minimizeToTray')) {
    app.quit();
  }
});
