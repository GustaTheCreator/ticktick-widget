const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
const POS_FILE = path.join(app.getPath('userData'), 'window-pos.json');

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
  // Posição guardada, ou top-left do monitor principal
  const saved = loadPos();
  let startX, startY;

  if (saved) {
    startX = saved.x;
    startY = saved.y;
  } else {
    const primary = screen.getPrimaryDisplay();
    const { x, y, width } = primary.workArea;
    startX = x + width - 320 - 20;
    startY = y + 20;
  }

  win = new BrowserWindow({
    width: 320, height: 600,
    x: startX, y: startY,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
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

  // Guardar posição sempre que a janela é movida
  win.on('moved', savePos);
  win.on('close', savePos);
});

ipcMain.on('close-window', () => win && win.close());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
