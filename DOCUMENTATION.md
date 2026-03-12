# LogicMonkey — Full Documentation

## Overview

This is a minimal Electron desktop app (macOS only) built to test the full distribution pipeline:
build → distribute via GitHub Releases → install → auto-update. The app has a single button that toggles between dark and light themes.

**Framework:** Electron (v41) with Electron Forge + Webpack
**Target:** macOS (Apple Silicon arm64)
**Output:** `.dmg` disk image for drag-to-Applications install
**Repo:** https://github.com/george-aristides/LogicMonkey
**Download:** https://github.com/george-aristides/LogicMonkey/releases

---

## Project Structure

```
test-app/
├── src/
│   ├── main.js           # Electron main process — window, auto-updater, IPC
│   ├── preload.js        # Security bridge — exposes update API to renderer
│   ├── renderer.js       # UI logic — theme toggle + update banner
│   ├── index.html        # App HTML — heading + toggle button
│   └── index.css         # Styles — light/dark themes, update banner
├── forge.config.js       # Electron Forge config — makers, plugins, GitHub publisher
├── webpack.main.config.js      # Webpack config for main process
├── webpack.renderer.config.js  # Webpack config for renderer process
├── webpack.rules.js            # Shared webpack loader rules
├── package.json          # Dependencies, scripts, app metadata
└── DOCUMENTATION.md      # This file
```

### Key Files Explained

**`src/main.js`** — The "backend" of the Electron app. It:
- Creates the browser window (800x600)
- Loads the webpack-bundled HTML into it
- Handles macOS-specific behavior (keep app alive when windows close, re-create window on dock click)
- Checks GitHub Releases for updates on launch via `electron-updater`
- Sends `update-available` message to the renderer when a new version exists
- Listens for `open-releases` IPC message to open the download page in the browser

**`src/preload.js`** — Security bridge between main and renderer processes. Exposes:
- `electronAPI.onUpdateAvailable(callback)` — listen for update notifications
- `electronAPI.openReleases()` — open GitHub Releases page in browser

**`src/renderer.js`** — The "frontend" JavaScript. It:
- Imports the CSS
- Attaches a click listener to the toggle button that adds/removes the `dark` class on `<body>`
- Listens for update notifications and shows a blue banner with a "Download" link

**`src/index.html`** — The app UI. Contains only a heading and a button.

**`src/index.css`** — Defines:
- Light theme (default): white background, dark text
- Dark theme (`.dark` class): dark background (#1e1e1e), white text
- 0.3s CSS transition between states
- Update banner styling (fixed blue bar at top of window)

**`forge.config.js`** — Controls how the app is built, packaged, and published:
- `packagerConfig.asar: true` — bundles source into an ASAR archive
- `makers` — DMG and ZIP output formats
- `publishers` — GitHub Releases (george-aristides/LogicMonkey, publishes as draft)
- `plugins` — webpack bundling, security fuses

---

## Prerequisites (Developer Machine Only)

| Requirement | How to install |
|---|---|
| macOS (Apple Silicon or Intel) | N/A |
| Homebrew | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| Node.js | `brew install node` |
| GitHub CLI | `brew install gh` (then `gh auth login`) |

Verify installation:
```bash
node --version   # Should show v25.x.x or similar
npm --version    # Should show v11.x.x or similar
gh --version     # Should show v2.x.x or similar
```

---

## Commands Reference

All commands are run from inside the `test-app/` directory.

### Install dependencies (first time only)
```bash
npm install
```

### Run in development mode
```bash
npm start
```
Opens the app in a window with hot-reload. Changes to `src/` files will auto-refresh.
To enable DevTools, uncomment line 23 in `src/main.js`.

### Build the .dmg (local only, no upload)
```bash
npm run make
```
**Output:**
```
out/make/LogicMonkey-1.0.0-arm64.dmg   # The DMG file
out/make/zip/darwin/arm64/...           # Also produces a ZIP
```

### Build AND publish to GitHub Releases
```bash
GITHUB_TOKEN=$(gh auth token) npm run publish
```
This builds the app, then uploads the `.dmg` and `.zip` to a **draft** GitHub Release.

To make the release public:
```bash
gh release edit v1.0.0 --repo george-aristides/LogicMonkey --draft=false
```

### Package only (no DMG, just the .app)
```bash
npm run package
```
Output: `out/LogicMonkey-darwin-arm64/LogicMonkey.app`

---

## How to Send the App to Someone

### First time
1. Send them this link: https://github.com/george-aristides/LogicMonkey/releases
2. They click the `.dmg` file to download it
3. They double-click the `.dmg` to mount it
4. They drag `LogicMonkey.app` into the Applications folder
5. **First launch:** macOS will show "LogicMonkey is from an unidentified developer"
   - Right-click the app → "Open" → click "Open" in the dialog
   - This only happens once. After that it opens normally.

### Sending updates
1. Make your code changes
2. Bump the version in `package.json` (e.g., `"version": "1.1.0"`)
3. Run: `GITHUB_TOKEN=$(gh auth token) npm run publish`
4. Publish the draft: `gh release edit v1.1.0 --repo george-aristides/LogicMonkey --draft=false`
5. Next time the user opens the app while online, they'll see a blue banner:
   **"Update v1.1.0 available! Download"**
6. Clicking "Download" opens the GitHub Releases page in their browser
7. They download the new `.dmg` and drag it to Applications (replaces the old version)

---

## How the Auto-Updater Works

Since the app is **not code-signed**, the updater cannot silently install updates. Instead:

1. On app launch, `main.js` calls `autoUpdater.checkForUpdates()`
2. `electron-updater` checks the GitHub Releases API for a version newer than `package.json`'s version
3. If found, it sends the version number to the renderer via IPC
4. The renderer shows a blue banner at the top: "Update vX.X.X available! Download"
5. Clicking "Download" calls `shell.openExternal()` to open the Releases page
6. The user downloads and installs the new `.dmg` manually

**If offline:** The check silently fails (`.catch(() => {})`). The app works normally.

**If code-signed in the future:** You can switch to `autoUpdater.autoDownload = true` and `autoUpdater.quitAndInstall()` for fully silent updates.

---

## macOS Code Signing (Optional)

Without code signing, macOS shows a warning on first launch. The user can bypass it (right-click → Open), but signing removes the warning entirely and enables silent auto-updates.

**To sign the app:**
1. Get an Apple Developer account ($99/year) at developer.apple.com
2. Create a "Developer ID Application" certificate in Xcode
3. Add to `forge.config.js`:
   ```js
   packagerConfig: {
     asar: true,
     osxSign: {},
     osxNotarize: {
       appleId: 'your@email.com',
       appleIdPassword: 'app-specific-password',
       teamId: 'YOUR_TEAM_ID'
     }
   }
   ```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `node: command not found` | Run `brew install node` |
| `npm run make` fails | Delete `node_modules/` and `out/`, then `npm install && npm run make` |
| `GITHUB_TOKEN` error on publish | Use `GITHUB_TOKEN=$(gh auth token) npm run publish` |
| DMG won't open on another Mac | Built for arm64 (Apple Silicon). Intel Macs need `--arch=x64` |
| "App is damaged" error | This is macOS Gatekeeper blocking unsigned apps. **Fix:** Open Terminal, run `xattr -cr /Applications/LogicMonkey.app`, then open normally. Must be done before first launch. |
| App window is blank | Check `src/index.html` and `src/renderer.js` exist |
| Update banner doesn't appear | App must be installed from a built `.dmg` (not `npm start`). Also needs internet. |

---

## File-by-File Changelog (What We Changed from Scaffold)

| File | What changed | Why |
|---|---|---|
| `src/index.html` | Replaced "Hello World" with "LogicMonkey" heading + toggle button | App functionality |
| `src/index.css` | Light/dark theme styles + update banner CSS | App functionality + update UX |
| `src/renderer.js` | Toggle handler + update banner listener | App functionality + update UX |
| `src/main.js` | Added `electron-updater`, IPC for updates, `shell.openExternal` | Auto-update detection |
| `src/preload.js` | Added `contextBridge` exposing update API | Secure IPC bridge |
| `forge.config.js` | Added DMG maker + GitHub publisher | Distribution pipeline |
| `package.json` | Renamed to `logic-monkey`/`LogicMonkey`, added dependencies | Branding + features |
