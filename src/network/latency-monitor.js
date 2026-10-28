/**
 * latency-monitor.js
 * Measures round-trip network latency to a target host on Windows.
 */

const { execFile } = require('child_process');
const net = require('net');

class LatencyMonitor {
  constructor(options = {}) {
    this.target = options.target || '8.8.8.8';
    this.interval = options.interval || 2000;
    this.timeout = options.timeout || 1200;
    this.timer = null;
    this.isRunning = false;
    this.isProbing = false;
    this.onUpdateCallback = null;
    this.lastResult = {
      latencyMs: null,
      status: 'pending', // 'success', 'timeout', 'unavailable', 'pending'
      target: this.target,
      timestamp: Date.now()
    };
  }

  setTarget(target) {
    if (target && typeof target === 'string') {
      this.target = target.trim();
      this.lastResult.target = this.target;
    }
  }

  setIntervalMs(interval) {
    const val = parseInt(interval, 10);
    if (!isNaN(val) && val >= 500) {
      this.interval = val;
      if (this.isRunning) {
        this.stop();
        this.start(this.onUpdateCallback);
      }
    }
  }

  start(callback) {
    this.onUpdateCallback = callback;
    this.isRunning = true;
    this.probe();
    this.timer = setInterval(() => {
      this.probe();
    }, this.interval);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async probe() {
    if (this.isProbing || !this.isRunning) return;
    this.isProbing = true;

    try {
      const result = await this._pingIcmp(this.target, this.timeout);
      this.lastResult = {
        latencyMs: result.latencyMs,
        status: result.status,
        target: this.target,
        timestamp: Date.now()
      };
    } catch {
      this.lastResult = {
        latencyMs: null,
        status: 'unavailable',
        target: this.target,
        timestamp: Date.now()
      };
    } finally {
      this.isProbing = false;
      if (this.onUpdateCallback) {
        this.onUpdateCallback(this.lastResult);
      }
    }
  }

  _pingIcmp(host, timeoutMs) {
    return new Promise((resolve) => {
      // Windows ping command: ping -n 1 -w <timeoutMs> <host>
      // Windows ping timeout is in milliseconds
      execFile('ping', ['-n', '1', '-w', String(timeoutMs), host], { windowsHide: true }, (err, stdout) => {
        if (err || !stdout) {
          // If ping command returned error or timeout
          if (stdout && stdout.toLowerCase().includes('timed out')) {
            return resolve({ status: 'timeout', latencyMs: null });
          }
          // Fallback probe via TCP socket port 53 (DNS) for high reliability if ICMP restricted
          return this._probeTcp(host, 53, timeoutMs).then(resolve);
        }

        const out = stdout.toString();
        // Match: time=24ms or time<1ms
        const match = out.match(/time(?:=|<)(\d+)ms/i);
        if (match && match[1] !== undefined) {
          const ms = parseInt(match[1], 10);
          return resolve({ status: 'success', latencyMs: ms });
        }

        if (out.toLowerCase().includes('timed out') || out.toLowerCase().includes('unreachable')) {
          return resolve({ status: 'timeout', latencyMs: null });
        }

        // Try TCP socket fallback
        this._probeTcp(host, 53, timeoutMs).then(resolve);
      });
    });
  }

  _probeTcp(host, port, timeoutMs) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();

      let resolved = false;
      const cleanup = () => {
        socket.removeAllListeners();
        socket.destroy();
      };

      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          const latency = Date.now() - startTime;
          cleanup();
          resolve({ status: 'success', latencyMs: latency });
        }
      });

      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ status: 'timeout', latencyMs: null });
        }
      });

      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ status: 'unavailable', latencyMs: null });
        }
      });

      try {
        socket.connect(port, host);
      } catch {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({ status: 'unavailable', latencyMs: null });
        }
      }
    });
  }
}

module.exports = { LatencyMonitor };
