const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Ler token do ficheiro .env (nunca expor o ficheiro em si)
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    const env = {};
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) env[key.trim()] = rest.join('=').trim();
    }
    return env;
  } catch (_) {
    return {};
  }
}

function loadSettings() {
  try {
    const settingsPath = path.join(__dirname, 'settings.json');
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);

    const transparency = Number(parsed.transparency);
    const width = Number(parsed.width);
    const height = Number(parsed.height);
    const syncIntervalMs = Number(parsed.syncIntervalMs);

    return {
      transparency: Number.isFinite(transparency) ? transparency : 0.1,
      width: Number.isFinite(width) ? width : 320,
      height: Number.isFinite(height) ? height : 600,
      syncIntervalMs: Number.isFinite(syncIntervalMs) ? syncIntervalMs : 30000
    };
  } catch (_) {
    return {
      transparency: 0.1,
      width: 320,
      height: 600,
      syncIntervalMs: 30000
    };
  }
}

const env = loadEnv();
const settings = loadSettings();

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.send('close-window'),
  apiToken:    env.API_TOKEN || '',
  settings
});
