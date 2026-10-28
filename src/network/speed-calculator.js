/**
 * speed-calculator.js
 * Calculates download/upload byte rates from consecutive counter measurements.
 */

class SpeedCalculator {
  constructor() {
    this.previousSamples = new Map(); // adapterKey -> { rxBytes, txBytes, timestamp }
  }

  /**
   * Calculate transfer rate for an adapter.
   * @param {string} adapterKey Unique identifier for the adapter
   * @param {number|BigInt} rxBytes Current total received bytes
   * @param {number|BigInt} txBytes Current total transmitted bytes
   * @param {number} timestamp Current timestamp in ms (default Date.now())
   * @returns {{ rxRate: number, txRate: number, isInitial: boolean }} Rates in Bytes/sec
   */
  calculate(adapterKey, rxBytes, txBytes, timestamp = Date.now()) {
    const rx = Number(rxBytes);
    const tx = Number(txBytes);

    const prev = this.previousSamples.get(adapterKey);

    // Save current sample
    this.previousSamples.set(adapterKey, { rxBytes: rx, txBytes: tx, timestamp });

    if (!prev) {
      return { rxRate: 0, txRate: 0, isInitial: true };
    }

    const elapsedMs = timestamp - prev.timestamp;
    if (elapsedMs <= 0) {
      return { rxRate: 0, txRate: 0, isInitial: false };
    }

    const elapsedSec = elapsedMs / 1000;

    // Detect counter overflow / reset
    if (rx < prev.rxBytes || tx < prev.txBytes) {
      return { rxRate: 0, txRate: 0, isInitial: false };
    }

    const rxDelta = rx - prev.rxBytes;
    const txDelta = tx - prev.txBytes;

    const rxRate = rxDelta / elapsedSec;
    const txRate = txDelta / elapsedSec;

    return {
      rxRate: Math.max(0, rxRate),
      txRate: Math.max(0, txRate),
      isInitial: false
    };
  }

  reset(adapterKey) {
    if (adapterKey) {
      this.previousSamples.delete(adapterKey);
    } else {
      this.previousSamples.clear();
    }
  }
}

module.exports = { SpeedCalculator };
