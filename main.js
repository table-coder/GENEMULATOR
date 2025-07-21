const { V4MAPPED } = require('dns');
const { app, BrowserWindow, Menu, ipcMain, dialog, ipcRenderer, contextBridge } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const express = require('express');
const server = express();
const { spawn } = require("child_process");




function clearDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        clearDirectory(curPath);
        fs.rmdirSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
  }
}

function createWindow () {
  const win = new BrowserWindow({
    width: 500,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  const tempAssetsDir = path.join(app.getPath('temp'), 'genemulator-assets');
  server.use(express.static(tempAssetsDir));

  server.listen(8000, () => {
    console.log('Serving files from:', tempAssetsDir);
    console.log('Server at http://localhost:8000/');
  });
  

  const menuTemplate = [
    {
        label: 'File',
        submenu: [
        {
            label: 'Load .GROM...',
            click: async () => {
              const { canceled, filePaths } = await dialog.showOpenDialog({
                filters: [{ name: 'GROM Files', extensions: ['grom', 'zip'] }],
                properties: ['openFile']
              });
              if (canceled || filePaths.length === 0) return;

              // Clear previous assets
              if (fs.existsSync(tempAssetsDir)) clearDirectory(tempAssetsDir);
              fs.mkdirSync(tempAssetsDir, { recursive: true });

              // Extract assets and .pmp from GROM
              const zip = new AdmZip(filePaths[0]);
              const entries = zip.getEntries();
              let pmpBuffer = null;
              entries.forEach(entry => {
                if (entry.entryName.startsWith('assets/')) {
                  const dest = path.join(tempAssetsDir, entry.entryName.replace('assets/', ''));
                  if (entry.isDirectory) {
                    fs.mkdirSync(dest, { recursive: true });
                  } else {
                    fs.mkdirSync(path.dirname(dest), { recursive: true });
                    fs.writeFileSync(dest, entry.getData());
                  }
                } else if (entry.entryName.endsWith('.pmp')) {
                  pmpBuffer = entry.getData();
                }
              });

              // Load the PMP into the VM (replace project)
              if (pmpBuffer) {
                // Convert to base64 Data URI for the VM, or save to temp and load from file
                const dataURI = `data:application/octet-stream;base64,${pmpBuffer.toString('base64')}`;
                win.webContents.executeJavaScript(
                  `window.vm && window.vm.runtime && (window.vm.runtime.variables['gromData'] = ${JSON.stringify(dataURI)})`
                ).catch(err => {
                  console.error('Failed to set gromData in VM:', err);
                });
                win.webContents.executeJavaScript(
                  `readygrom = true`
                ).catch(err => {
                  console.error('cant say that the asset path is ready to be loaded because ', err);
                });
                setTimeout(() => {
                  win.webContents.executeJavaScript(
                    `const gromAssetPath = "${tempAssetsDir.replace(/\\/g, '\\\\')}";
                    window.vm._assetPath = "http://localhost:8000/";
                    window.vm._isPMPPackaged = true;`
                  ).catch(err => {
                    console.error('Failed to set asset path:', err);
                  })
                }, 1);
                
                
                win.webContents.executeJavaScript(`console.log("Temp Assets Directory: ${tempAssetsDir}")`);
                win.webContents.send('tempassets-var', tempAssetsDir)
               
              }

              // Optionally, notify the renderer or VM about the new assets location
              win.webContents.send('assets-updated', tempAssetsDir);
              win.webContents.on('did-finish-load', () => {
                win.webContents.send('tempassets-var', tempAssetsDir.replace(/\\/g, '\\\\'));
              });
            },
        },
        {
            label: 'Load .KYR',
            click: () => {
              // Show the file selector
              dialog.showOpenDialog(win, {
                title: "Select a file",
                properties: ['openFile'],
                filters: [
                  {name: "KYR Roms", extensions: ['kyr']}
                ]
              }).then(result => {
                if (!result.canceled) {
                  spawn(result.filePaths, [], { detached: true });
                }
              });
            }
        },
        { type: 'separator' },
        {
            label: 'Exit',
            role: 'quit'
        }
        ]
    },
    {
        label: 'Help',
        submenu: [
        {
            label: 'About',
            click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
                title: 'About',
                message: 'GENEMULATOR v1.0.0 Made with HaxeFlixel, Node.JS and PenguinMod'
            });
            }
        },
        {
            label: 'Toggle DevTools',
            accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            click: () => {
                win.webContents.toggleDevTools();
            }
        }
        ]
    }
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
