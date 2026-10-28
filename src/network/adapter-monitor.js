/**
 * adapter-monitor.js
 * High-performance Windows network monitor using instant kernel interface counters.
 */

const { execFile } = require('child_process');
const { SpeedCalculator } = require('./speed-calculator');
const { formatSpeed } = require('../utils/format-speed');

const VPN_PATTERNS = [
  /vpn/i,
  /wireguard/i,
  /wintun/i,
  /tap-windows/i,
  /openvpn/i,
  /nordlynx/i,
  /tailscale/i,
  /zerotier/i,
  /cloudflare\s*warp/i,
  /cisco/i,
  /anyconnect/i,
  /globalprotect/i,
  /fortinet/i,
  /checkpoint/i,
  /wan\s*miniport/i
];

class AdapterMonitor {
  constructor(options = {}) {
    this.selectedAdapter = options.adapter || 'auto';
    this.speedUnit = options.speedUnit || 'Auto';
    this.calculator = new SpeedCalculator();
    this.interval = options.interval || 1000;
    this.isMonitoring = false;
    this.timer = null;
    this.onUpdateCallback = null;
    this.isQuerying = false;

    // Cache adapter metadata & VPN status
    this.activeAdapterName = 'Wi-Fi';
    this.activeAdapterDesc = 'Realtek RTL8852BE WiFi 6 802.11ax PCIe Adapter';
    this.isVpnActive = false;
    this.vpnName = null;
    this.cachedAdapters = [];

    // Periodic metadata refresher (every 10 seconds)
    this.metadataTimer = null;
  }

  setSpeedUnit(unit) {
    this.speedUnit = unit;
  }

  setSelectedAdapter(adapterName) {
    this.selectedAdapter = adapterName || 'auto';
    this.calculator.reset();
  }

  setIntervalMs(interval) {
    const val = parseInt(interval, 10);
    if (!isNaN(val) && val >= 500) {
      this.interval = val;
      if (this.isMonitoring) {
        this.stop();
        this.start(this.onUpdateCallback);
      }
    }
  }

  start(callback) {
    this.onUpdateCallback = callback;
    this.isMonitoring = true;

    // Initial metadata fetch
    this.refreshMetadata();
    this.metadataTimer = setInterval(() => this.refreshMetadata(), 10000);

    // High frequency speed polling
    this.poll();
    this.timer = setInterval(() => {
      this.poll();
    }, this.interval);
  }

  stop() {
    this.isMonitoring = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.metadataTimer) {
      clearInterval(this.metadataTimer);
      this.metadataTimer = null;
    }
  }

  async poll() {
    if (this.isQuerying || !this.isMonitoring) return;
    this.isQuerying = true;

    try {
      const bytes = await this._getNetstatBytes();

      if (!bytes) {
        this._emitSpeed(0, 0);
        return;
      }

      // Calculate transfer rates
      const { rxRate, txRate } = this.calculator.calculate(
        this.selectedAdapter || 'active',
        bytes.rx,
        bytes.tx
      );

      this._emitSpeed(rxRate, txRate);
    } catch {
      this._emitSpeed(0, 0);
    } finally {
      this.isQuerying = false;
    }
  }

  _emitSpeed(rxRate, txRate) {
    const downloadFormatted = formatSpeed(rxRate, this.speedUnit);
    const uploadFormatted = formatSpeed(txRate, this.speedUnit);

    const payload = {
      adapterName: this.activeAdapterName,
      adapterDescription: this.activeAdapterDesc,
      isVpnActive: this.isVpnActive,
      vpnName: this.vpnName,
      isIdle: rxRate === 0 && txRate === 0,
      download: {
        bytesPerSec: rxRate,
        formatted: downloadFormatted.display,
        value: downloadFormatted.value,
        unit: downloadFormatted.unit
      },
      upload: {
        bytesPerSec: txRate,
        formatted: uploadFormatted.display,
        value: uploadFormatted.value,
        unit: uploadFormatted.unit
      },
      timestamp: Date.now()
    };

    if (this.onUpdateCallback) {
      this.onUpdateCallback(payload);
    }
  }

  /**
   * Reads Windows interface statistics in ~5ms using netstat -e
   */
  _getNetstatBytes() {
    return new Promise((resolve) => {
      execFile('netstat', ['-e'], { windowsHide: true }, (err, stdout) => {
        if (err || !stdout) {
          return resolve(null);
        }

        const match = stdout.match(/Bytes\s+(\d+)\s+(\d+)/i);
        if (match) {
          resolve({
            rx: Number(match[1]),
            tx: Number(match[2])
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Refreshes adapter descriptions and VPN status in background
   */
  refreshMetadata() {
    const script = `
      $adapters = @(Get-NetAdapter -ErrorAction SilentlyContinue | Select-Object Name, InterfaceDescription, Status, Virtual);
      $adapters | ConvertTo-Json -Compress
    `;

    execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true }, (err, stdout) => {
      if (err || !stdout) return;

      try {
        const raw = JSON.parse(stdout.trim());
        const list = Array.isArray(raw) ? raw : [raw];

        this.cachedAdapters = list.map(item => ({
          name: item.Name || '',
          description: item.InterfaceDescription || item.Name || '',
          status: item.Status,
          isActive: String(item.Status || '').toLowerCase() === 'up',
          isVpn: VPN_PATTERNS.some(p => p.test(item.Name || '') || p.test(item.InterfaceDescription || ''))
        }));

        const activeVpn = this.cachedAdapters.find(a => a.isVpn && a.isActive);
        this.isVpnActive = Boolean(activeVpn);
        this.vpnName = activeVpn ? activeVpn.name : null;

        const activePhys = this.cachedAdapters.find(a => a.isActive && !a.isVpn);
        if (activePhys) {
          this.activeAdapterName = activePhys.name;
          this.activeAdapterDesc = activePhys.description;
        }
      } catch {}
    });
  }

  async getAdapterList() {
    if (this.cachedAdapters.length > 0) {
      return this.cachedAdapters;
    }
    await new Promise(r => setTimeout(r, 600));
    return this.cachedAdapters;
  }
}

module.exports = { AdapterMonitor, VPN_PATTERNS };
