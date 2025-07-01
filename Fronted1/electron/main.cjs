const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let backendProcess = null;

function startBackend() {
    if (isDev) {
        // 开发环境下启动 Python 脚本
        backendProcess = spawn('python', ['../Backend/app.py'], {
            stdio: 'inherit'
        });
    } else {
        // 生产环境下启动打包后的后端程序
        const backendExePath = path.join(process.resourcesPath, 'backend', 'thryve_backend.exe');
        
        // 检查后端程序是否存在
        if (!fs.existsSync(backendExePath)) {
            console.error(`Backend executable not found at: ${backendExePath}`);
            dialog.showErrorBox('启动错误', `找不到后端程序: ${backendExePath}`);
            return;
        }

        console.log('Starting backend from:', backendExePath);
        
        backendProcess = spawn(backendExePath, [], {
            stdio: 'inherit',
            cwd: path.dirname(backendExePath) // 设置工作目录为后端程序所在目录
        });
    }

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
        dialog.showErrorBox('后端启动错误', `启动失败: ${err.message}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
        if (code !== 0) {
            dialog.showErrorBox('后端异常退出', `后端程序异常退出，退出码: ${code}`);
        }
    });
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '../public/icons/icon.ico'),
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
    startBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (backendProcess) {
            backendProcess.kill();
        }
        app.quit();
    }
});

// 处理文件选择
ipcMain.handle('select-file', async () => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile']
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const stats = fs.statSync(filePath);
            let mimeType = 'application/octet-stream';

            try {
                // 尝试使用 mime-types 模块
                const mimeTypes = require('mime-types');
                mimeType = mimeTypes.lookup(filePath) || 'application/octet-stream';
            } catch (error) {
                console.warn('mime-types module not available, using default mime type');
                // 基于文件扩展名的简单 MIME 类型检测
                const ext = path.extname(filePath).toLowerCase();
                const mimeMap = {
                    '.txt': 'text/plain',
                    '.json': 'application/json',
                    '.csv': 'text/csv',
                    '.md': 'text/markdown',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.pdf': 'application/pdf'
                };
                mimeType = mimeMap[ext] || 'application/octet-stream';
            }

            return {
                canceled: false,
                filePath: filePath,
                fileName: path.basename(filePath),
                fileSize: stats.size,
                mimeType: mimeType
            };
        }

        return { canceled: true };
    } catch (error) {
        console.error('Error in select-file:', error);
        throw error;
    }
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