/**
 * tray-icon-generator.js
 * Generates dynamic sharp SVG tray icons for Windows taskbar system tray.
 */

function createTraySpeedIcon(downText, upText, isVpnActive = false, isDarkMode = true) {
  const bg = isDarkMode ? '#111827' : '#f8fafc';
  const border = isDarkMode ? '#374151' : '#cbd5e1';
  const downColor = isDarkMode ? '#10b981' : '#059669';
  const upColor = isDarkMode ? '#38bdf8' : '#0284c7';
  const vpnBadge = isVpnActive ? `<circle cx="28" cy="4" r="3" fill="#a855f7" />` : '';

  // Clean strings (e.g. "12.4M", "500K")
  const dStr = (downText || '0K').trim().slice(0, 5);
  const uStr = (upText || '0K').trim().slice(0, 5);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect x="0.5" y="0.5" width="31" height="31" rx="4" fill="${bg}" stroke="${border}" stroke-width="1"/>
    ${vpnBadge}
    <text x="2" y="13" fill="${downColor}" font-size="10" font-family="-apple-system, Segoe UI, Arial" font-weight="bold">↓${dStr}</text>
    <text x="2" y="27" fill="${upColor}" font-size="10" font-family="-apple-system, Segoe UI, Arial" font-weight="bold">↑${uStr}</text>
  </svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

module.exports = { createTraySpeedIcon };
