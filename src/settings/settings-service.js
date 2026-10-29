/**
 * settings-service.js
 * Manages local persistent configuration in userData directory.
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_SETTINGS = {
  speedUnit: 'Auto',
  refreshInterval: 1000,
  latencyInterval: 2000,
  theme: 'system',
  widgetMode: 'docked', // 'docked' (taskbar mini-bar) or 'floating' (card widget)
  dynamicTrayIcon: true,
  alwaysOnTop: true,
  startWithWindows: true,
  adapter: 'auto',
  pingTarget: '8.8.8.8',
  launchMinimized: false,
  minimizeToTray: true,
  windowOpacity: 1.0,
  windowBounds: null
};

class SettingsService {
  constructor() {
    this.configPath = path.join(
      app ? app.getPath('userData') : process.cwd(),
      'netmeter-settings.json'
    );
    this.settings = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Error loading settings, falling back to defaults:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  save(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      const tmpPath = `${this.configPath}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.settings, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.configPath);
      return true;
    } catch (e) {
      console.error('Error saving settings:', e);
      return false;
    }
  }

  get(key) {
    return this.settings[key] !== undefined ? this.settings[key] : DEFAULT_SETTINGS[key];
  }

  getAll() {
    return { ...this.settings };
  }
}

module.exports = { SettingsService, DEFAULT_SETTINGS };
