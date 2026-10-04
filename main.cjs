const { app, dialog, Menu } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ONENOTE_URL = 'https://onenote.cloud.microsoft/en-us/';
const APP_PROFILE_DIR = 'helium-profile';
const LINK_ROUTER_VERSION = '1.3.0';
const CHROMIUM_BINARIES = [
  'helium-browser',
  'helium',
  'helium-chromium',
  'chromium',
  'google-chrome-stable',
  'google-chrome',
  'chromium-browser',
];
const FIREFOX_BINARIES = ['firefox', 'firefox-esr'];

function findOnPath(binary) {
  for (const directory of (process.env.PATH || '').split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, binary);
    try {
      const stats = fs.statSync(candidate);
      if (stats.isFile() && (stats.mode & 0o111)) return candidate;
    } catch {
      // Keep searching PATH.
    }
  }
  return null;
}

function findSupportedBrowser() {
  for (const name of CHROMIUM_BINARIES) {
    const executable = findOnPath(name);
    if (executable) return { executable, name, kind: 'chromium' };
  }
  for (const name of FIREFOX_BINARIES) {
    const executable = findOnPath(name);
    if (executable) return { executable, name, kind: 'firefox' };
  }
  return null;
}

function stageLinkRouter() {
  const bundled = path.join(process.resourcesPath, 'onenote-navigation-extension');
  const source = fs.existsSync(bundled)
    ? bundled
    : path.join(__dirname, 'assets', 'onenote-navigation-extension');
  const destination = path.join(
    app.getPath('userData'),
    `navigation-helper-${LINK_ROUTER_VERSION}`
  );

  if (!fs.existsSync(destination)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
  }
  return destination;
}

function runningOneNoteProfileState(profileDirectory, extensionDirectory) {
  let found = false;
  let hasRouter = false;
  let entries;
  try {
    entries = fs.readdirSync('/proc');
  } catch {
    return { found, hasRouter };
  }

  const profileNeedle = profileDirectory.toLowerCase();
  const extensionNeedle = extensionDirectory.toLowerCase();
  for (const entry of entries) {
    if (!/^\d+$/.test(entry) || Number(entry) === process.pid) continue;
    try {
      const commandLine = fs.readFileSync(path.join('/proc', entry, 'cmdline'), 'utf8')
        .replace(/\0/g, ' ')
        .toLowerCase();
      if (!commandLine.includes(profileNeedle)) continue;
      found = true;
      if (commandLine.includes(extensionNeedle)) hasRouter = true;
    } catch {
      // The process may have exited or be hidden by procfs permissions.
    }
  }
  return { found, hasRouter };
}

function launchOneNote(browser, extensionDirectory, profileDirectory) {
  let args;
  if (browser.kind === 'chromium') {
    args = [
      `--user-data-dir=${profileDirectory}`,
      `--app=${ONENOTE_URL}`,
      `--load-extension=${extensionDirectory}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--class=onenote-linux',
    ];
  } else {
    args = ['--kiosk', ONENOTE_URL];
  }

  const child = spawn(browser.executable, args, {
    detached: true,
    stdio: 'ignore',
  });

  child.once('error', (error) => {
    dialog.showErrorBox(
      'Could not launch OneNote',
      `Could not start ${browser.executable}: ${error.message}`
    );
    app.quit();
  });

  child.once('spawn', () => {
    child.unref();
    console.log(`ONENOTE_APP_WINDOW browser=${browser.name} profile=${profileDirectory}`);
    app.quit();
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const browser = findSupportedBrowser();
  if (!browser) {
    dialog.showErrorBox(
      'OneNote needs a Linux browser for passkey sign-in',
      'Electron on Linux does not provide the native passkey/security-key prompt required by this Microsoft sign-in. Install Helium, Chromium, or Firefox, then start OneNote again.\n\nOn Arch Linux: sudo pacman -S chromium\n\nOneNote will open in an app-style window without tabs or an address bar. The Chromium-based app uses a separate persistent profile so its browser flags and notebook helper do not get swallowed by an already-running browser.'
    );
    app.quit();
    return;
  }

  const appDataDirectory = app.getPath('userData');
  const profileDirectory = path.join(appDataDirectory, APP_PROFILE_DIR);
  const extensionDirectory = browser.kind === 'chromium' ? stageLinkRouter() : null;

  if (browser.kind === 'chromium') {
    fs.mkdirSync(profileDirectory, { recursive: true });
    const state = runningOneNoteProfileState(profileDirectory, extensionDirectory);
    if (state.found && !state.hasRouter) {
      dialog.showMessageBoxSync({
        type: 'info',
        title: 'Restart the OneNote app window',
        message: 'The OneNote-specific Helium profile is already running without the current notebook helper.',
        detail: 'Close all OneNote app windows and launch this AppImage again. Your regular Helium profile is separate and is not affected.',
        buttons: ['OK'],
        defaultId: 0,
      });
      app.quit();
      return;
    }
  }

  launchOneNote(browser, extensionDirectory, profileDirectory);
});
