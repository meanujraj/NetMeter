# Security & Stability Policy

NetMeter follows a security-first, standard-user architecture designed for long-term compatibility across Windows 10 and 11.

---

## 1. Core Windows Stability Principles

### 1. Zero Kernel Drivers
NetMeter never loads custom kernel drivers, filter drivers, or packet-sniffing libraries (e.g., WinPcap, Npcap, WinDivert). All metrics use documented user-mode interfaces. This minimizes driver crashes, signature failures, and conflicts with anti-cheat software.

### 2. Zero DLL Injection or Explorer Hooking
NetMeter does not inject DLLs into `explorer.exe` or hook private `Shell_TrayWnd` routines. It renders as an isolated, frameless topmost window. This approach avoids breakage from Windows shell updates.

### 3. Standard User Execution (No UAC Elevation)
The application runs under standard non-administrator privileges. It requires no UAC elevation prompts during installation or daily operation:
- **Executable path**: `%LOCALAPPDATA%\Programs\netmeter`
- **Settings path**: `%APPDATA%\NetMeter\netmeter-settings.json`

### 4. Zero Inbound Listening Ports
All network activity is outbound-only (ICMP echoes and TCP port 53 fallback probes). NetMeter never opens inbound listening ports and never triggers Windows Firewall inbound access prompts.

### 5. Bound Subprocess Lifecycle
All subprocess invocations (`netstat`, `ping`, `powershell`) enforce strict execution locks, single-flight guards, and hard termination timeouts. Timed-out children are killed immediately to prevent zombie handles.

### 6. Chromium Context Isolation & IPC Security
NetMeter runs on Electron with standard hardening:
- `contextIsolation: true`
- `nodeIntegration: false`
- `webSecurity: true`
- Navigation and new window creation locked (`will-navigate` blocked, `setWindowOpenHandler` denies popup creation)
- All IPC channels validate input boundaries before execution

### 7. Transparent, User-Controlled Updates
NetMeter never performs silent background self-updates or installs executable payloads without user confirmation. All releases publish to GitHub Releases with verifiable SHA-256 checksums. Uninstallation is standard via Windows Installed Apps.

---

## 2. Supported Operating Systems

| Operating System | Architecture | Support Status |
|:---|:---|:---|
| Windows 11 (21H2, 22H2, 23H2, 24H2) | x64 | Fully Supported |
| Windows 10 (21H2, 22H2) | x64 | Supported |
| Windows 7 / 8 / 8.1 | x86 / x64 | Unsupported (Electron 34+ requirement) |

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability in NetMeter, please do not disclose it publicly via GitHub issues.

1. Submit a private advisory via **GitHub Security Advisories** at `https://github.com/meanujraj/NetMeter/security/advisories/new`.
2. Provide vulnerability details, affected component, and reproduction steps.
3. Vulnerabilities are reviewed within 48 hours. A patch is released alongside an advisory notice.

