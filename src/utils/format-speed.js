/**
 * format-speed.js
 * Formats byte rates into human-readable units.
 * Supports dynamic auto-scaling between B/s, KB/s, MB/s, GB/s and bps, Kbps, Mbps, Gbps.
 */

function formatSpeed(bytesPerSec, preferredUnit = 'Auto') {
  if (typeof bytesPerSec !== 'number' || isNaN(bytesPerSec) || bytesPerSec < 0) {
    bytesPerSec = 0;
  }

  const unit = (preferredUnit || 'Auto').toLowerCase();

  // 1. Auto-scaling Bytes: B/s -> KB/s -> MB/s -> GB/s (Task Manager style)
  if (unit === 'auto' || unit === 'auto-bytes' || unit === 'bytes') {
    if (bytesPerSec >= 1024 * 1024 * 1024) {
      const gb = bytesPerSec / (1024 * 1024 * 1024);
      return { value: gb.toFixed(2), unit: 'GB/s', display: `${gb.toFixed(2)} GB/s` };
    }
    if (bytesPerSec >= 1024 * 1024) {
      const mb = bytesPerSec / (1024 * 1024);
      return { value: mb.toFixed(2), unit: 'MB/s', display: `${mb.toFixed(2)} MB/s` };
    }
    if (bytesPerSec >= 1024) {
      const kb = bytesPerSec / 1024;
      return { value: kb.toFixed(kb >= 100 ? 1 : 2), unit: 'KB/s', display: `${kb.toFixed(kb >= 100 ? 1 : 2)} KB/s` };
    }
    return { value: bytesPerSec.toFixed(0), unit: 'B/s', display: `${bytesPerSec.toFixed(0)} B/s` };
  }

  // 2. Auto-scaling Bits: bps -> Kbps -> Mbps -> Gbps
  if (unit === 'auto-bits' || unit === 'bits') {
    const bitsPerSec = bytesPerSec * 8;
    if (bitsPerSec >= 1000000000) {
      const gbps = bitsPerSec / 1000000000;
      return { value: gbps.toFixed(2), unit: 'Gbps', display: `${gbps.toFixed(2)} Gbps` };
    }
    if (bitsPerSec >= 1000000) {
      const mbps = bitsPerSec / 1000000;
      return { value: mbps.toFixed(2), unit: 'Mbps', display: `${mbps.toFixed(2)} Mbps` };
    }
    if (bitsPerSec >= 1000) {
      const kbps = bitsPerSec / 1000;
      return { value: kbps.toFixed(1), unit: 'Kbps', display: `${kbps.toFixed(1)} Kbps` };
    }
    return { value: bitsPerSec.toFixed(0), unit: 'bps', display: `${bitsPerSec.toFixed(0)} bps` };
  }

  // 3. Fixed unit: MB/s
  if (unit === 'mb/s') {
    const mb = bytesPerSec / (1024 * 1024);
    return { value: mb.toFixed(2), unit: 'MB/s', display: `${mb.toFixed(2)} MB/s` };
  }

  // 4. Fixed unit: KB/s
  if (unit === 'kb/s') {
    const kb = bytesPerSec / 1024;
    return { value: kb.toFixed(kb >= 100 ? 1 : 2), unit: 'KB/s', display: `${kb.toFixed(kb >= 100 ? 1 : 2)} KB/s` };
  }

  // 5. Fixed unit: B/s
  if (unit === 'b/s') {
    return { value: bytesPerSec.toFixed(0), unit: 'B/s', display: `${bytesPerSec.toFixed(0)} B/s` };
  }

  // 6. Fixed unit: Mbps (Default PRD standard)
  const mbps = (bytesPerSec * 8) / 1000000;
  return { value: mbps.toFixed(2), unit: 'Mbps', display: `${mbps.toFixed(2)} Mbps` };
}

module.exports = { formatSpeed };
