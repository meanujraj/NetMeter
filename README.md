# NetMeter ⚡

A lightweight, unobtrusive Windows desktop network monitoring utility that displays real-time internet and local network download speed, upload speed, and latency in a compact desktop widget.

[![Platform](<https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-blue.svg>)](#supported-platforms)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Cost](<https://img.shields.io/badge/cost-₹0%20Free%20%26%20Open%20Source-brightgreen>)](#cost)

---

## 📌 Table of Contents

- [Overview](#overview)
- [Preview](#preview)
- [Key Features](#key-features)
- [Comparison with Alternatives](#comparison-with-alternatives)
- [Supported Platforms](#supported-platforms)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Build Instructions](#build-instructions)
- [Configuration &amp; Settings](#configuration--settings)
- [Troubleshooting](#troubleshooting)
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
- [Privacy &amp; Security Policy](#privacy--security-policy)
- [Known Limitations](#known-limitations)
- [Version History](#version-history)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 Overview

NetMeter solves the inconvenience of constantly opening Task Manager, running terminal commands, or loading ad-heavy browser speed-test pages just to check if your network connection is responsive or actively downloading.

It runs locally on your PC, reads genuine Windows network interface statistics, and displays transfer rates and round-trip ping in real-time with virtually zero CPU and memory overhead.

---

## 🖥️ Preview

```text
+------------------------------------+
|  NetMeter                   ● LIVE |
|                                    |
|  ↓  12.40 Mbps                     |
|  ↑   2.80 Mbps                     |
|  ◷  24 ms                          |
+------------------------------------+
```

- **↓ Download**: Real-time incoming throughput (Green indicator)
- **↑ Upload**: Real-time outgoing throughput (Blue indicator)
- **◷ Latency**: Real-time round-trip ping in milliseconds (Amber indicator)

---

## ✨ Key Features

- **Real-Time Speed Calculations**: Measures download and upload byte deltas divided by elapsed seconds for true rates.
- **Accurate Latency Monitoring**: Regular round-trip ICMP/TCP ping to configurable targets (e.g., `1.1.1.1` or local router) without UI blocking.
- **Accurate Zero-Traffic Display**: Shows `↓ 0.00 Mbps ↑ 0.00 Mbps` when connection is idle, distinguishing idle from disconnected states.
- **100% Local Measurement**: Directly queries local Windows network subsystem counters. No simulated or fabricated values.
- **Minimal Resource Footprint**: Engineered for sub-1% CPU usage and low memory consumption.
- **Customizable Appearance**: Dark mode (default) and Light mode, adjustable opacity, and compact drag-and-drop widget layout.
- **Window Controls**: Always-on-top toggle, drag anywhere, remembers window position, and optional minimize to system tray.
- **Flexible Units**: Supports `Mbps` (default), `MB/s`, `KB/s`, `B/s`, or `Auto`.
- **Zero Cost & Privacy-First**: 100% free, open-source, no accounts, no telemetry, no tracking.

---

## 📊 Comparison with Alternatives

| Feature / Metric | NetMeter ⚡ | DU Meter | NetWorx | Windows Task Manager |
|:---|:---:|:---:|:---:|:---:|
| **Cost** | **100% Free** | Paid ($29.95) | Paid ($29.00) | Free (Built-in) |
| **Open Source** | **Yes (MIT)** | No (Proprietary) | No (Proprietary) | No (Proprietary) |
| **Windows 11 Taskbar Strip** | **Yes** | Limited | Partial | No |
| **Real-time Latency (Ping)** | **Yes (Live ms)** | No | No | No |
| **Kernel Drivers Required** | **None (Safe)** | Yes (NDIS) | Yes (TDI/WFP) | None |
| **Anti-Cheat Safe** | **100% Safe** | Can trigger flags | Can trigger flags | Safe |
| **Resource Usage** | **< 1% CPU** | Low | Low | Moderate |
| **Zero Telemetry / Ads** | **Guaranteed** | No telemetry | No telemetry | Microsoft Telemetry |

---

## 💻 Supported Platforms

- **Windows 11** (64-bit)
- **Windows 10** (64-bit)
- Works with both **Wi-Fi** and **Ethernet** network adapters.
- Runs without administrator privileges for standard per-user usage.

---

## ⚙️ How It Works

NetMeter operates completely locally on your computer:

```text
Windows Kernel / Network Subsystem (NDIS)
                  ↓
IP Helper API / Performance Counters (Local)
                  ↓
Node.js Monitoring Service (Electron Main)
                  ↓
Secure Context Isolation Bridge (Preload IPC)
                  ↓
Compact Desktop Interface (HTML5 / CSS3 / Vanilla JS)
```

1. **Byte Counters**: Cumulative bytes received and sent are polled at user-defined intervals (default: 1s).
2. **Delta Rate Formula**:

   $$
   \text{Download Mbps} = \frac{\Delta\text{Bytes Received} \times 8}{\Delta\text{Seconds} \times 1,000,000}
   $$

   $$
   \text{Upload Mbps} = \frac{\Delta\text{Bytes Sent} \times 8}{\Delta\text{Seconds} \times 1,000,000}
   $$
3. **Latency Probe**: ICMP ping runs on an independent cycle (default: 2s) and records real millisecond response times. Timeouts are never reported as zero.

---

## 📥 Installation

### Option 1: Windows Installer (Recommended)

1. Download the latest `NetMeter-Setup-x.x.x.exe` from [GitHub Releases](https://github.com/meanujraj/NetMeter/releases).
2. Double-click the installer and follow the setup wizard.
3. Launch NetMeter from your desktop or Start Menu.

### Option 2: Portable Run

1. Download `NetMeter-Portable-x.x.x.exe` from [GitHub Releases](https://github.com/meanujraj/NetMeter/releases).
2. Run directly from any folder or USB drive without installation.

> [!NOTE]
> **Windows SmartScreen Prompt**: Because NetMeter is an open-source project without a paid commercial certificate, Windows SmartScreen may show *"Windows protected your PC"* on initial launch. Click **More info**, then click **Run anyway**.

---

## 🛠️ Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (Tested with Node.js v24.x LTS).
- Windows 10/11 64-bit.
- Git.

### Clone and Install

```powershell
# Clone the repository
git clone https://github.com/meanujraj/NetMeter.git

# Enter project directory
cd NetMeter

# Install dependencies locally
npm install
```

### Run Locally

```powershell
npm start
```

---

## 📦 Build Instructions

Build binaries locally using `electron-builder`:

```powershell
# Build both NSIS installer and portable executable
npm run build

# Or build only NSIS setup installer
npm run build:nsis

# Or build only portable executable
npm run build:portable
```

Generated packages will be in the `dist/` directory:

- `dist/NetMeter-Setup-1.0.0.exe` (Installer with Start Menu and Desktop shortcuts)
- `dist/NetMeter-Portable-1.0.0.exe` (Self-contained standalone executable)

---

## 🚀 Version Release Workflow

NetMeter uses automated GitHub Actions CI/CD to release new versions:

1. **Bump Version**:
   ```powershell
   npm version patch   # 1.0.0 -> 1.0.1
   # or: npm version minor (1.1.0) / npm version major (2.0.0)
   ```
2. **Push Commit & Tag**:
   ```powershell
   git push origin main --tags
   ```
3. **Automated Release**:
   GitHub Actions workflow in `.github/workflows/release.yml` triggers on tag push, compiles the Windows installer and portable `.exe`, and publishes the release on GitHub with release notes.

---

## 🎛️ Configuration & Settings

Click the settings gear icon in the widget to configure:

| Setting                      | Options / Default                                         | Description                                |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| **Speed Unit**         | `Mbps` (default), `MB/s`, `KB/s`, `B/s`, `Auto` | Unit for display values                    |
| **Refresh Interval**   | `1000 ms` (default), `500 ms`, `2000 ms`            | Interval between network counter reads     |
| **Latency Interval**   | `2000 ms` (default), `1000 ms`, `5000 ms`           | Interval between ping checks               |
| **Ping Target**        | `1.1.1.1` (default), `8.8.8.8`, or custom host/IP     | Destination for latency measurement        |
| **Theme**              | `Dark` (default), `Light`                             | Color scheme                               |
| **Always on Top**      | `Enabled` (default), `Disabled`                       | Pin widget above other windows             |
| **Start with Windows** | `Disabled` (default), `Enabled`                       | Launch automatically upon Windows login    |
| **Network Adapter**    | `Auto` (default) or select specific adapter             | Select interface to monitor                |
| **Minimize to Tray**   | `Enabled` (default), `Disabled`                       | Minimize to system tray instead of closing |
| **Widget Opacity**     | `50%` to `100%`                                       | Adjust transparency                        |

Settings are saved locally in `%APPDATA%/netmeter/netmeter-settings.json`.

---

## 🔧 Troubleshooting

### Speed displays `0.00 Mbps` continuously

- Check if the correct adapter is selected in Settings (e.g. your active Wi-Fi or Ethernet card instead of an inactive virtual adapter).
- Set adapter selection to **Auto** to automatically select active traffic.

### Latency shows `Timeout` or `-- ms`

- Verify your internet connectivity.
- Some corporate firewalls block ICMP ping. In settings, change the ping target to your local router (e.g. `192.168.1.1` or `10.0.0.1`) or a DNS host like `8.8.8.8`.

### VPN Traffic

- When connected to a VPN, Windows creates a virtual TAP/TUN adapter. If you want to monitor tunnel throughput, select the VPN adapter under Settings.

---

## ❓ Frequently Asked Questions (FAQ)

### How do I show internet speed on the Windows 11 taskbar?
Open NetMeter, right-click the system tray icon, and check **Taskbar Mini-Bar Mode** (or toggle the mode button on the widget). NetMeter docks neatly as an ultra-compact horizontal strip directly above your taskbar displaying live download, upload, and latency metrics.

### Is NetMeter safe to run while gaming with anti-cheat software (Vanguard, CS2, Easy Anti-Cheat)?
Yes. Unlike older network tools that install custom NDIS packet-filtering drivers, NetMeter uses 100% standard Windows user-mode statistics (`netstat -e` and `Get-NetAdapter`). It loads zero kernel-mode drivers and cannot trigger anti-cheat driver signature bans.

### Does NetMeter consume system resources or affect ping in games?
No. NetMeter operates on lightweight, bounded timer cycles using native Windows counters. Subprocess executions take less than 5ms with under 1% CPU utilization and low memory overhead.

### How does NetMeter measure real-time latency?
NetMeter executes lightweight ICMP ping packets to a reliable public DNS target (e.g. `8.8.8.8` or `1.1.1.1`) every 2 seconds. If ICMP is blocked by a corporate firewall, it automatically falls back to an outbound TCP handshake on port 53.

### Does NetMeter collect, store, or transmit my browsing data?
No. NetMeter is 100% local and open source under the MIT License. It contains zero analytics, zero crash telemetry, zero network tracking, and no external server dependencies.

---

## 🛡️ Privacy & Security Policy

NetMeter is strictly privacy-first and designed for long-term Windows stability:

- **No data collection**: No browsing history, URLs, packet contents, or IP addresses are logged.
- **No telemetry / analytics**: NetMeter does not phone home or transmit usage statistics.
- **No cloud backend**: Does not require user registration, accounts, or subscriptions.
- **Local only**: All calculations happen purely in memory on your local machine.
- **Windows Security Policy**: See [SECURITY.md](SECURITY.md) for details on zero-driver execution, standard user integrity, subprocess timeout limits, and vulnerability reporting.

---

## ⚠️ Known Limitations

- Standard Electron floating widget: Does not inject HTML into the native Windows taskbar tray clock area.
- Virtual network adapters and VPNs may report duplicate or re-encapsulated byte counts if multiple adapters are aggregated.
- Unsigned binaries may trigger Windows SmartScreen warning on initial download until community reputation builds.

---

## 📜 Version History

- **v1.0.0** (Initial Release)
  - Live download, upload, and latency monitoring.
  - Dark and Light themes.
  - Frameless floating widget with always-on-top and position memory.
  - Windows NSIS installer and local settings management.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feat/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to your branch (`git push origin feat/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
