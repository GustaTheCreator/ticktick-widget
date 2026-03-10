const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
const POS_FILE = path.join(app.getPath('userData'), 'window-pos.json');

function loadSettings() {
  try {
    const settingsPath = path.join(__dirname, 'settings.json');
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);

    const width = Number(parsed.width);
    const height = Number(parsed.height);
    const startupDelayMs = Number(parsed.startupDelayMs);

    const hasDefaultX = Number.isFinite(Number(parsed.defaultX));
    const hasDefaultY = Number.isFinite(Number(parsed.defaultY));

    return {
      width: Number.isFinite(width) && width >= 220 ? Math.round(width) : 320,
      height: Number.isFinite(height) && height >= 300 ? Math.round(height) : 600,
      alwaysOnTop: Boolean(parsed.alwaysOnTop),
      startupDelayMs: Number.isFinite(startupDelayMs) && startupDelayMs >= 0
        ? Math.round(startupDelayMs)
        : 0,
      defaultX: hasDefaultX ? Math.round(Number(parsed.defaultX)) : null,
      defaultY: hasDefaultY ? Math.round(Number(parsed.defaultY)) : null
    };
  } catch (_) {
    return {
      width: 320,
      height: 600,
      alwaysOnTop: false,
      startupDelayMs: 0,
      defaultX: null,
      defaultY: null
    };
  }
}

function loadPos() {
  try {
    return JSON.parse(fs.readFileSync(POS_FILE, 'utf8'));
  } catch (_) {
    return null;
  }
}

function savePos() {
  if (!win) return;
  const [x, y] = win.getPosition();
  fs.writeFileSync(POS_FILE, JSON.stringify({ x, y }), 'utf8');
}

app.dock?.hide(); // macOS

app.whenReady().then(() => {
  const settings = loadSettings();
  const widgetWidth = settings.width;
  const widgetHeight = settings.height;

  // Posição guardada, ou top-left do monitor principal
  const saved = loadPos();
  let startX, startY;

  if (saved) {
    startX = saved.x;
    startY = saved.y;
  } else if (settings.defaultX !== null && settings.defaultY !== null) {
    startX = settings.defaultX;
    startY = settings.defaultY;
  } else {
    const primary = screen.getPrimaryDisplay();
    const { x, y, width } = primary.workArea;
    startX = x + width - widgetWidth - 20;
    startY = y + 20;
  }

  win = new BrowserWindow({
    width: widgetWidth,
    height: widgetHeight,
    x: startX, y: startY,
    frame: false,
    transparent: true,
    alwaysOnTop: settings.alwaysOnTop,
    show: false,
    skipTaskbar: true,
    focusable: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: __dirname + '/preload.js'
    }
  });

  win.loadFile('index.html');
  setTimeout(() => {
    if (win && !win.isDestroyed()) win.show();
  }, settings.startupDelayMs);

  // Guardar posição sempre que a janela é movida
  win.on('minimize', () => win.restore()); // manter visível no Super+D
  win.on('moved', savePos);
  win.on('close', savePos);
});

ipcMain.on('close-window', () => win && win.close());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
