# Test App — Full Documentation

## Overview

This is a minimal Electron desktop app (macOS only) built to test the full distribution pipeline:
build → distribute → install. The app has a single button that toggles between dark and light themes.

**Framework:** Electron (v41) with Electron Forge + Webpack
**Target:** macOS (Apple Silicon arm64)
**Output:** `.dmg` disk image for drag-to-Applications install

---

## Project Structure

```
test-app/
├── src/
│   ├── main.js           # Electron main process — creates the app window
│   ├── preload.js        # Security bridge between main and renderer processes
│   ├── renderer.js       # UI logic — theme toggle button handler
│   ├── index.html        # App HTML — heading + toggle button
│   └── index.css         # Styles — light/dark themes, transitions
├── forge.config.js       # Electron Forge config — build targets, makers, plugins
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

**`src/renderer.js`** — The "frontend" JavaScript. It:
- Imports the CSS
- Attaches a click listener to the toggle button that adds/removes the `dark` class on `<body>`

**`src/index.html`** — The app UI. Contains only a heading and a button.

**`src/index.css`** — Defines two states:
- Default (light): white background, dark text
- `.dark` class: dark background (#1e1e1e), white text
- 0.3s CSS transition between states

**`forge.config.js`** — Controls how the app is built and packaged:
- `packagerConfig.asar: true` — bundles app source into an ASAR archive (faster loading, source protection)
- `makers` array — defines output formats (DMG, ZIP, etc.)
- `plugins` — webpack bundling, security fuses

---

## Prerequisites

| Requirement | How to install |
|---|---|
| macOS (Apple Silicon or Intel) | N/A |
| Homebrew | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| Node.js | `brew install node` |

Verify installation:
```bash
node --version   # Should show v25.x.x or similar
npm --version    # Should show v11.x.x or similar
```

---

## Commands Reference

All commands are run from inside the `test-app/` directory.

### Install dependencies (first time only)
```bash
npm install
```
Downloads all packages listed in `package.json` into `node_modules/`.

### Run in development mode
```bash
npm start
```
Opens the app in a window with hot-reload. Changes to `src/` files will auto-refresh.
To enable DevTools, uncomment line 23 in `src/main.js`.

### Build the .dmg
```bash
npm run make
```
**What this does:**
1. Webpack bundles all source files
2. Electron Packager creates the `.app` bundle with Electron runtime
3. The DMG maker wraps it in a `.dmg` disk image

**Output location:**
```
out/make/test-app-1.0.0-arm64.dmg     # The DMG file
out/make/zip/darwin/arm64/...          # Also produces a ZIP
```

### Package only (no DMG, just the .app)
```bash
npm run package
```
Output: `out/test-app-darwin-arm64/test-app.app`

---

## How to Install the Built App

1. Double-click `test-app-1.0.0-arm64.dmg` to mount it
2. Drag `test-app.app` into the Applications folder
3. Open from Applications (or Spotlight search "test-app")
4. **First launch:** macOS will show "test-app is from an unidentified developer"
   - Right-click the app → "Open" → click "Open" in the dialog
   - This only happens once. After that it opens normally.

---

## How to Update the App (Phase 2 — GitHub Releases)

This section is for AFTER you set up GitHub publishing. Not needed for local testing.

### One-time setup

1. **Create a GitHub repo** (public or private)

2. **Generate a GitHub Personal Access Token:**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Save the token securely

3. **Install the GitHub publisher:**
   ```bash
   npm install --save-dev @electron-forge/publisher-github
   ```

4. **Add publisher config to `forge.config.js`:**
   ```js
   // Add this after the `makers` array:
   publishers: [
     {
       name: '@electron-forge/publisher-github',
       config: {
         repository: {
           owner: 'YOUR_GITHUB_USERNAME',
           name: 'YOUR_REPO_NAME'
         },
         prerelease: false,
         draft: true
       }
     }
   ]
   ```

5. **Install the auto-updater:**
   ```bash
   npm install electron-updater
   ```

6. **Add update check to `src/main.js`:**
   ```js
   const { autoUpdater } = require('electron-updater');

   // Add inside app.whenReady().then(() => { ... }):
   autoUpdater.checkForUpdatesAndNotify();
   ```

### Publishing a release

```bash
export GITHUB_TOKEN=your_token_here
npm run publish
```

This builds the app AND uploads it to a GitHub Release (as a draft).
Then go to GitHub → Releases → edit the draft → click "Publish release".

### Publishing an update

1. Bump the version in `package.json` (e.g., `"version": "1.1.0"`)
2. Make your code changes
3. Run `npm run publish` again
4. Publish the new draft release on GitHub
5. When the user opens the app, it will detect the new version and prompt to update

### How the user gets the app

Send them the URL to your GitHub Releases page:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/releases
```
They click the `.dmg` file to download, then follow the install steps above.

---

## macOS Code Signing (Optional)

Without code signing, macOS shows a warning on first launch. The user can bypass it (right-click → Open), but signing removes the warning entirely.

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

This is optional and can be added later. The app works fine without it.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `node: command not found` | Run `brew install node` |
| `npm run make` fails | Delete `node_modules/` and `out/`, then run `npm install` and `npm run make` again |
| DMG won't open on another Mac | The DMG is built for arm64 (Apple Silicon). Intel Macs need a separate build — add `--arch=x64` to the make command |
| "App is damaged" error | Right-click → Open → Open. Or: `xattr -cr /Applications/test-app.app` in Terminal |
| App window is blank | Check that `src/index.html` and `src/renderer.js` exist and webpack config points to them |

---

## File-by-File Changelog (What We Changed from Scaffold)

| File | What changed | Why |
|---|---|---|
| `src/index.html` | Replaced default "Hello World" with heading + toggle button | App functionality |
| `src/index.css` | Rewrote styles for light/dark theme with CSS transitions | App functionality |
| `src/renderer.js` | Replaced console.log with toggle button click handler | App functionality |
| `src/main.js` | Commented out `openDevTools()` | Don't show dev tools in production |
| `forge.config.js` | Added `@electron-forge/maker-dmg` to makers array | Produce a `.dmg` instead of just a `.zip` |
| `package.json` | (auto-updated by npm install) Added `@electron-forge/maker-dmg` to devDependencies | Required for DMG builds |
