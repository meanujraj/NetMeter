/**
 * preload.js
 * Exposes a secure, restricted bridge between Electron main and the renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('netMeterAPI', {
  // Listen for real-time network measurements
  onNetworkUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('network-update', handler);
    return () => ipcRenderer.removeListener('network-update', handler);
  },

  // Listen for latency measurements
  onLatencyUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('latency-update', handler);
    return () => ipcRenderer.removeListener('latency-update', handler);
  },

  // Listen for Windows system theme changes (Light/Dark mode)
  onSystemThemeChanged: (callback) => {
    const handler = (_event, isDark) => callback(isDark);
    ipcRenderer.on('system-theme-changed', handler);
    return () => ipcRenderer.removeListener('system-theme-changed', handler);
  },

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Network adapters list
  getAdapters: () => ipcRenderer.invoke('get-adapters'),

  // Window controls
  windowAction: (action, payload) => ipcRenderer.invoke('window-action', action, payload)
});
