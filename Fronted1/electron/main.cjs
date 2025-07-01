const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    // 在开发环境中加载 Vite 开发服务器
    if (isDev) {
        console.log('Running in development mode');
        // 等待一段时间确保开发服务器启动
        setTimeout(() => {
            mainWindow.loadURL('http://localhost:5173').catch(err => {
                console.error('Failed to load dev server:', err);
            });
            // 打开开发工具
            mainWindow.webContents.openDevTools();
        }, 1000);
    } else {
        // 在生产环境中加载打包后的文件
        const indexPath = path.join(__dirname, '../dist/index.html');
        console.log('Loading production file:', indexPath);
        mainWindow.loadFile(indexPath).catch(err => {
            console.error('Failed to load index.html:', err);
        });
    }

    // 监听页面加载完成事件
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully');
    });

    // 监听页面加载失败事件
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Page failed to load:', errorCode, errorDescription);
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 处理文件选择
ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const stats = fs.statSync(filePath);
        return {
            canceled: false,
            filePath: filePath,
            fileName: path.basename(filePath),
            fileSize: stats.size,
            mimeType: require('mime-types').lookup(filePath) || 'application/octet-stream'
        };
    }

    return { canceled: true };
});

// 处理文件夹选择
ipcMain.handle('select-folder', async () => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const folderPath = result.filePaths[0];
            const stats = fs.statSync(folderPath);
            
            // 读取文件夹中的所有内容（包括文件和文件夹）
            const files = fs.readdirSync(folderPath)
                .map(entry => {
                    try {
                        const fullPath = path.join(folderPath, entry);
                        const stats = fs.statSync(fullPath);
                        return {
                            path: fullPath,
                            name: entry,
                            isDirectory: stats.isDirectory()
                        };
                    } catch (err) {
                        console.warn(`Skip file ${entry}:`, err);
                        return null;
                    }
                })
                .filter(item => item !== null);

            return {
                canceled: false,
                folderPath: folderPath,
                folderName: path.basename(folderPath),
                files: files,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime
            };
        }

        return { canceled: true };
    } catch (error) {
        console.error('Error in select-folder:', error);
        throw error;
    }
});

// 读取文件内容
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath);
        return {
            success: true,
            content: content.toString('base64'),
            error: null
        };
    } catch (error) {
        return {
            success: false,
            content: null,
            error: error.message
        };
    }
});

// 获取文件信息
ipcMain.handle('get-file-info', async (event, filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return {
            success: true,
            info: {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime
            },
            error: null
        };
    } catch (error) {
        return {
            success: false,
            info: null,
            error: error.message
        };
    }
}); 