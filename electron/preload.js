const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  isElectron: true,

  // App version
  getVersion: () => {
    try {
      const { app } = require('@electron/remote');
      return app.getVersion();
    } catch {
      return '1.0.0';
    }
  },
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
