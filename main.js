const { app, BrowserWindow } = require('electron');

require('./server.js');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 1000,
        webPreferences: {
            nodeIntegration: false
        }
    });

    win.setMenu(null);

    win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});