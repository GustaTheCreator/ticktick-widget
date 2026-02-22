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

const env = loadEnv();

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.send('close-window'),
  apiToken:    env.API_TOKEN || ''
});
