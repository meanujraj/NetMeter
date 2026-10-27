# NetMeter — Product Requirements Document (PRD)

**Product:** NetMeter  
**Version:** 1.0  
**Platform:** Windows 10 and Windows 11 (64-bit)  
**Product Type:** Lightweight desktop network monitoring utility  
**Status:** Proposed — initial development  
**Distribution:** Public GitHub repository and GitHub Releases  
**Target Cost:** ₹0 for development, hosting, and basic distribution

---

## 1. Product Overview

NetMeter is a lightweight Windows desktop application that displays real-time internet/network download speed, upload speed, and latency in a compact visual interface.

The application should remain unobtrusive while the user works, studies, browses the internet, downloads files, or plays games.

The goal is to provide useful network information without opening Task Manager, Command Prompt, or a browser-based speed-testing website.

### Core concept

Build a tiny application that displays:

- Download speed: `12.40 Mbps`
- Upload speed: `2.80 Mbps`
- Latency: `24 ms`

All readings must be real measurements. The application must never display fabricated or simulated values in production.

## 2. Problem Statement

Windows provides network information through its system tools, but continuously monitoring download speed, upload speed, and latency requires additional steps or third-party software.

NetMeter solves this problem by keeping essential network measurements visible in a small desktop interface.

### Problems to solve

1. Users cannot easily see current transfer speeds at a glance.
2. Opening Task Manager repeatedly is inconvenient.
3. Internet connectivity and latency are difficult to monitor continuously.
4. Many network monitoring tools have unnecessarily complex interfaces.
5. Some utilities require subscriptions or additional online accounts.

## 3. Product Objectives

The product must:

- Display real-time download and upload speeds.
- Measure latency in milliseconds.
- Show zero speed when no measurable traffic is occurring.
- Use minimal CPU and memory resources.
- Run as a standalone Windows application.
- Support automatic startup after installation.
- Provide a simple installer and straightforward updates.
- Distribute source code and releases through GitHub.
- Operate without an account, database, or hosted backend.

### Non-goals for version 1.0

- Full internet speed tests measuring maximum bandwidth.
- Network packet inspection or content monitoring.
- User accounts and cloud synchronization.
- Centralized collection of user network activity.
- Android, iOS, macOS, or Linux support.
- Advanced enterprise network diagnostics.

## 4. Target Users

### Primary users

- Everyday Windows users.
- Developers and software testers.
- Students and remote workers.
- Users monitoring downloads and uploads.
- Users troubleshooting intermittent network problems.

### Secondary users

- Gamers checking latency.
- IT support personnel performing basic diagnostics.
- Developers who want an open-source desktop utility.

## 5. Supported Platforms

### Initial release

- Windows 11, 64-bit.
- Windows 10, 64-bit, subject to the target Windows version's support status and compatibility testing.

### Hardware requirements

- A modern Windows-compatible PC.
- Wi-Fi or Ethernet network adapter.
- No dedicated GPU.
- No administrator privileges for normal per-user installation or operation, unless a particular Windows configuration requires them.

The application should work on both Wi-Fi and Ethernet connections.

## 6. Core Features

### 6.1 Real-time download speed

Read cumulative bytes received from the selected network interface.

Calculate the difference between consecutive readings and divide by the elapsed time.

Display the result using appropriate units:

- B/s
- KB/s
- MB/s
- Mbps

Default display unit: Mbps.

### 6.2 Real-time upload speed

Read cumulative bytes sent from the selected network interface.

Calculate the change between readings and display the current upload rate.

Download and upload speeds must be calculated independently.

### 6.3 Latency monitoring

Measure round-trip latency using ICMP ping or another suitable lightweight connectivity probe.

Default configuration:

- Ping interval: 2 seconds.
- Display unit: milliseconds.
- Default target: a configurable public endpoint.
- Optional local-router ping for local-network diagnostics.

Display states:

- `24 ms` — successful measurement.
- `Timeout` — target did not respond within the configured limit.
- `N/A` — measurement unavailable.
- `-- ms` — initial measurement not yet available.

The application must not represent a timeout as zero milliseconds.

### 6.4 Zero-speed display

When there is no measurable network traffic, display:

`↓ 0.00 Mbps ↑ 0.00 Mbps`

The application must distinguish a genuine idle connection from unavailable or failed measurements.

### 6.5 Automatic refresh

- Read network counters approximately every second.
- Refresh the UI when new measurements arrive.
- Measure latency independently from network speed.
- Avoid overlapping latency requests.
- Handle missed or delayed polling cycles safely.

### 6.6 Network interface selection

Allow the user to select:

- Wi-Fi.
- Ethernet.
- Another available network adapter.

Provide an automatic mode that selects an appropriate active adapter.

Avoid double-counting traffic from multiple adapters. Document that VPNs, virtual adapters, and network bridges may affect measurements.

## 7. UI/UX Requirements

### 7.1 Primary widget

The default interface must be compact, readable, and visually minimal.

Example:

    NetMeter       ● LIVE

    ↓ 12.40 Mbps
    ↑  2.80 Mbps
    ◷ 24 ms

### 7.2 Visual design

- Dark theme by default.
- Optional light theme.
- Download indicator: green.
- Upload indicator: blue.
- Latency indicator: amber.
- Rounded corners and subtle borders.
- No unnecessary charts or large graphics.
- Clear typography and consistent spacing.
- Minimal animations.
- No advertisements.

### 7.3 Window behavior

The application must support:

- Compact window mode.
- Optional always-on-top mode.
- Dragging the widget around the desktop.
- Minimize and close controls.
- Optional start-minimized behavior.
- Configurable opacity where supported.
- Remembering window position and size.
- Preventing accidental off-screen placement after monitor changes.

Closing the window should follow the user's selected behavior: exit completely or minimize to the system tray.

### 7.4 Taskbar and system tray

The MVP should use a compact floating widget with an optional Windows system-tray icon.

A true inline speed meter beside the Windows clock is a separate advanced feature. Standard Electron windows cannot directly place arbitrary HTML content inside the native Windows taskbar.

Any future taskbar integration must be implemented and tested using a suitable Windows-specific approach.

## 8. Settings

Provide a small settings panel with the following options:

| Setting | Default |
|---|---|
| Speed unit | Mbps |
| Refresh interval | 1 second |
| Latency interval | 2 seconds |
| Theme | Dark |
| Always on top | Enabled |
| Start with Windows | Optional |
| Network adapter | Automatic |
| Ping target | Configurable |
| Launch minimized | Disabled |
| Minimize to tray | Optional |

The application should validate settings and use sensible fallback values if a configuration is invalid.

## 9. Technology Stack

### Frontend

- HTML5 for structure.
- CSS3 for styling.
- Vanilla JavaScript for rendering and interaction.

React is optional and is not required for the initial version.

### Desktop runtime

- Electron for the desktop window and application lifecycle.
- Node.js for network monitoring and operating-system integration.
- Electron preload scripts and IPC for secure communication.

### Network monitoring

Use Windows network interface statistics through a reliable Windows API or a carefully implemented PowerShell-based approach.

A Windows API-based approach is preferred for the production version if it can be implemented and maintained reliably.

Use an appropriate ping implementation for latency measurement.

### Packaging

- electron-builder.
- Windows NSIS installer.
- GitHub Releases for distribution.
- GitHub Actions for optional automated builds.

### Storage

Use local configuration storage only.

No database is required.

## 10. High-Level Architecture

The application consists of three main components.

### Main process

Responsibilities:

- Create and manage the Electron window.
- Coordinate network monitoring.
- Manage application lifecycle.
- Manage system-tray integration.
- Handle startup preferences.
- Validate requests from the renderer.

### Preload process

Responsibilities:

- Expose a limited, explicit API to the UI.
- Forward permitted network updates.
- Validate incoming data types.
- Avoid exposing unrestricted Node.js APIs.

### Renderer process

Responsibilities:

- Render download speed.
- Render upload speed.
- Render latency.
- Update the interface.
- Handle user settings and interactions.
- Show error and unavailable states.

### Data flow

Windows network statistics → Node.js monitoring service → Electron main process → secure preload bridge → HTML/CSS/JavaScript UI.

Latency measurements follow a separate monitoring path and are merged into the displayed state.

## 11. Suggested Project Structure

    netmeter/
    ├── src/
    │   ├── main.js
    │   ├── preload.js
    │   ├── renderer.js
    │   ├── index.html
    │   ├── styles.css
    │   ├── network/
    │   │   ├── adapter-monitor.js
    │   │   ├── speed-calculator.js
    │   │   └── latency-monitor.js
    │   ├── settings/
    │   │   └── settings-service.js
    │   └── utils/
    │       └── format-speed.js
    ├── assets/
    │   └── icons/
    ├── tests/
    ├── package.json
    ├── package-lock.json
    ├── .gitignore
    ├── README.md
    ├── LICENSE
    └── .github/
        └── workflows/
            └── build.yml

This is a proposed structure. It can be simplified while learning and expanded as the application grows.

## 12. Speed Calculation Requirements

For each selected network adapter, record:

- Previous received-byte counter.
- Previous sent-byte counter.
- Previous timestamp.
- Current received-byte counter.
- Current sent-byte counter.
- Current timestamp.

Calculate:

Download Mbps = received bytes difference × 8 ÷ elapsed seconds ÷ 1,000,000.

Upload Mbps = sent bytes difference × 8 ÷ elapsed seconds ÷ 1,000,000.

Use actual elapsed time rather than assuming that each polling cycle is exactly one second.

If counters reset, the adapter changes, or a measurement is invalid, reset the baseline rather than displaying a negative speed.

Clearly document that interface traffic may include local-network traffic, background processes, VPN traffic, and other adapter activity. These measurements are not necessarily identical to an ISP's billed or advertised internet bandwidth.

## 13. Performance Requirements

Initial targets:

- Target CPU usage: typically below 1% during idle monitoring on a modern PC.
- Target memory usage: under 100 MB for the MVP, where practical.
- Normal speed update interval: 1 second.
- Normal latency update interval: 2 seconds.
- No continuous high-frequency polling.
- No unnecessary network requests.
- No UI freezing during monitoring.
- No unbounded growth in memory usage.

These are engineering targets, not guaranteed measurements. They must be validated through profiling on supported Windows systems.

## 14. Security Requirements

Electron applications must be configured securely.

Required controls:

- Enable context isolation.
- Keep Node.js integration disabled in the renderer.
- Use a restricted preload bridge.
- Validate IPC messages and their arguments.
- Avoid executing arbitrary shell commands from renderer input.
- Avoid unrestricted navigation to remote websites.
- Do not load remote JavaScript into the application interface.
- Do not expose environment variables, filesystem access, or process execution unnecessarily.
- Use secure dependency versions and maintain the dependency lockfile.
- Do not request administrator access unless it is genuinely required.
- Do not collect or transmit personal network activity.

PowerShell execution, if used, must be implemented with controlled commands and safely handled output. User-controlled strings must never be interpolated into executable shell commands.

## 15. Privacy Requirements

NetMeter should be privacy-first.

- No account creation.
- No analytics by default.
- No telemetry by default.
- No collection of browsing history.
- No recording of visited websites.
- No upload of network traffic measurements.
- No remote backend.
- Local settings only.

Latency probes will send requests to the configured target. The application must explain this behavior and allow the user to change or disable latency monitoring.

## 16. Error Handling

The application must handle:

- No active network adapter.
- Wi-Fi disconnection.
- Ethernet cable removal.
- Network adapter disabled.
- Adapter changes while monitoring.
- VPN activation or disconnection.
- Latency timeout.
- Ping target unavailable.
- Invalid settings.
- Permission errors.
- Application startup failures.
- Missing or corrupted local configuration.
- Installer or update failures.

Errors should be informative but unobtrusive. The UI should recover automatically when the network becomes available again.

## 17. Installation and Distribution

### Installer format

Create a Windows installer using electron-builder and NSIS.

Expected artifact:

`NetMeter-Setup-1.0.0.exe`

The installer should:

- Bundle the Electron runtime and required dependencies.
- Install per user by default.
- Offer a desktop shortcut.
- Add a Start Menu shortcut.
- Support uninstalling the application.
- Avoid installing unrelated software.
- Preserve or safely migrate user settings during upgrades.

### Distribution

Use GitHub Releases to distribute stable versions.

Suggested release workflow:

1. Develop and test locally.
2. Commit source code to GitHub.
3. Tag a version such as `v1.0.0`.
4. Build the Windows installer.
5. Test installation and uninstallation on a clean Windows environment.
6. Attach the installer and release notes to GitHub Releases.
7. Publish the release.

GitHub repository hosting and release distribution can be free within applicable platform limits.

### One-click expectations

A normal installer download followed by a double-click and installation prompts is the default experience.

A silent installation option can be supported for advanced users, but should not be the default. Windows security warnings may appear for an unsigned executable.

Code signing is optional and may introduce costs. Do not claim the application is Microsoft-verified unless the required verification has actually been obtained.

## 18. Automatic Startup

Allow users to enable or disable launch at Windows login.

Requirements:

- Respect the user's setting.
- Do not silently add persistence without user awareness.
- Provide a visible setting to disable startup.
- Avoid launching multiple instances.
- Handle missing shortcuts or changed installation paths.
- Support starting minimized if configured.

## 19. Updates

For version 1.0, updates can be manual:

1. Publish a new GitHub Release.
2. Notify users in release notes.
3. Let users download and install the new version.

Automatic updates may be considered later, with signed releases, update integrity checks, and clear user consent.

Never execute an unverified downloaded update.

## 20. Testing Strategy

### Unit tests

Test:

- Speed calculations.
- Unit formatting.
- Counter reset handling.
- Invalid measurement handling.
- Settings validation.
- Latency result formatting.

### Integration tests

Test:

- Main-to-renderer communication.
- Adapter monitoring.
- Latency measurement.
- Application lifecycle.
- System-tray behavior.
- Startup configuration.

### Manual tests

Test on real Windows systems:

- Idle connection.
- Active downloads.
- Active uploads.
- Simultaneous download and upload.
- Wi-Fi disconnect and reconnect.
- Ethernet connection.
- VPN connection.
- Multiple adapters.
- Monitor resolution changes.
- Windows restart.
- Installation and uninstallation.
- Upgrade from an earlier version.

### Security tests

Verify:

- Renderer cannot directly access Node.js.
- IPC handlers reject invalid input.
- Shell execution cannot be controlled through UI input.
- No unexpected external network connections occur.
- Installer permissions are appropriate.

## 21. Acceptance Criteria

Version 1.0 is ready for release when:

1. The application installs successfully on supported Windows systems.
2. It shows live download speed.
3. It shows live upload speed.
4. It shows real latency measurements.
5. Idle speed is displayed as zero when appropriate.
6. Failed latency measurements are not represented as zero.
7. Network disconnects are handled gracefully.
8. The interface refreshes without freezing.
9. The application can run without an administrator account in normal supported configurations.
10. The user can configure startup behavior.
11. The installer can be uninstalled cleanly.
12. No backend or paid subscription is required.
13. Source code and releases are available through GitHub.
14. Security settings follow Electron's recommended practices.
15. The README explains installation, usage, privacy, and troubleshooting.

## 22. Development Roadmap

### Phase 1 — Environment setup

- Install Node.js LTS.
- Install VS Code.
- Create the project repository.
- Initialize Electron.
- Open a basic desktop window.

### Phase 2 — UI development

- Create the HTML layout.
- Style the compact widget.
- Add download and upload indicators.
- Add the latency display.
- Implement dark and light themes.

### Phase 3 — Network monitoring

- Read network adapter counters.
- Calculate transfer speeds.
- Implement latency measurements.
- Handle disconnected and unavailable states.
- Connect measurements to the UI.

### Phase 4 — Desktop behavior

- Add always-on-top mode.
- Implement window dragging.
- Add system-tray support.
- Add settings.
- Implement optional startup behavior.

### Phase 5 — Testing and optimization

- Test on Windows.
- Validate real measurements.
- Profile CPU and memory usage.
- Fix bugs and security issues.

### Phase 6 — Packaging

- Configure electron-builder.
- Create the NSIS installer.
- Test installation and uninstallation.
- Create icons and release notes.

### Phase 7 — Publishing

- Create a public GitHub repository.
- Write the README.
- Select an appropriate open-source license.
- Publish the first release.
- Share the release link.

## 23. Estimated Cost

| Item | Expected cost |
|---|---:|
| Node.js | ₹0 |
| VS Code | ₹0 |
| Electron | ₹0 |
| HTML, CSS and JavaScript | ₹0 |
| electron-builder | ₹0 |
| GitHub repository | ₹0 |
| GitHub Releases | ₹0 within applicable limits |
| Local application execution | ₹0 |
| Optional code signing | May cost money |
| Cloud hosting | Not required |

**Expected initial cost: ₹0**, excluding your existing computer, electricity, internet connection, and any optional paid services.

## 24. Risks and Limitations

- Windows may show warnings for an unsigned installer.
- Public ping targets may block or rate-limit probes.
- Interface counters may include non-internet traffic.
- VPNs and virtual adapters may complicate adapter selection.
- A floating widget is easier than integrating custom content directly into the native taskbar.
- Automatic updates require additional security and maintenance work.
- Resource usage depends on implementation and system conditions.
- Windows compatibility must be verified on actual supported systems.

## 25. Future Enhancements

Potential future features:

- Native Windows taskbar integration.
- Historical network-speed charts.
- Network usage totals per day.
- Download and upload alerts.
- Connection quality indicators.
- Packet loss monitoring.
- Multiple ping targets.
- Router versus internet latency comparison.
- Configurable speed units.
- Keyboard shortcuts.
- Portable edition.
- Automatic updates.
- Signed Windows releases.
- Installer localization.
- Optional per-application network monitoring, subject to additional permissions and technical complexity.

## 26. Success Metrics

Measure product quality using:

- Successful installation rate in user testing.
- Correctness of speed measurements against Windows network counters.
- Correctness of latency results against independent ping measurements.
- Startup reliability.
- Crash frequency.
- CPU and memory usage.
- Uninstallation success.
- Number of confirmed bugs per release.
- User feedback on readability and ease of installation.

Do not collect personal usage telemetry solely to calculate these metrics; use opt-in testing, local diagnostics, and voluntarily submitted feedback.

## 27. Documentation Requirements

The GitHub repository must include:

- Project overview.
- Screenshots.
- Feature list.
- Installation instructions.
- Development setup.
- Build instructions.
- Configuration instructions.
- Troubleshooting guide.
- Privacy statement.
- Known limitations.
- Version history.
- License.
- Contribution instructions.

## 28. Licensing

Choose an open-source license before publishing.

Suggested options:

- MIT License: permissive reuse with attribution and license preservation.
- Apache License 2.0: permissive reuse with additional explicit patent provisions.

Check the licenses of all dependencies and assets before distribution.

## 29. Definition of Done

NetMeter version 1.0 is complete when the application works on a supported Windows PC, displays genuine network speeds and latency, operates reliably in the background, installs through a tested Windows installer, and can be downloaded from GitHub without requiring users to install Node.js separately.

The product must remain free to build and use under its intended local-monitoring model, with no mandatory cloud infrastructure or subscription.

## 30. Final Product Vision

NetMeter should feel like a native Windows utility rather than a complicated web application.

It should start quickly, use minimal resources, display only useful information, and remain out of the user's way.

**Final goal:** A free, lightweight, open-source Windows network monitor with real-time download speed, upload speed, and latency — distributed through GitHub and installable using a simple Windows installer.
