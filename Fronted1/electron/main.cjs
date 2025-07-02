const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

// 存储 Python 后端进程引用
let pythonProcess = null;
let backendPort = 4000;

// 启动 Python 后端函数
function startPythonBackend() {
    console.log('Starting Python backend...');
    
    try {
        // 确定后端可执行文件路径
        let backendPath;
        let args = [];
        
        if (isDev) {
            // 开发环境：使用 Python 解释器运行脚本
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
            backendPath = pythonCommand;
            args = [path.join(process.cwd(), '..', 'Backend', 'backend_launcher.py'), backendPort];
            
            console.log(`Running backend in dev mode: ${backendPath} ${args.join(' ')}`);
        } else {
            // 生产环境：使用打包后的可执行文件
            if (process.platform === 'win32') {
                // 检查多个可能的路径
                const possiblePaths = [
                    path.join(process.resourcesPath, 'backend', 'backend.exe'),
                    path.join(process.resourcesPath, 'backend', '_internal', 'backend.exe'),
                    path.join(app.getAppPath(), '..', 'backend', 'backend.exe'),
                    path.join(__dirname, '..', '..', 'Backend', 'dist', 'backend', 'backend.exe')
                ];

                // 查找第一个存在的路径
                backendPath = possiblePaths.find(p => {
                    const exists = fs.existsSync(p);
                    console.log(`Checking path: ${p}, exists: ${exists}`);
                    return exists;
                });

                if (!backendPath) {
                    // 如果找不到，使用默认路径并记录警告
                    backendPath = possiblePaths[0];
                    console.warn(`Warning: Backend executable not found in any expected location. Using default: ${backendPath}`);
                }
            } else {
                backendPath = path.join(process.resourcesPath, 'backend', 'backend');
            }
            args = [backendPort.toString()];
            
            console.log(`Running backend in production mode: ${backendPath} ${args.join(' ')}`);
        }
        
        // 在启动后端进程前添加
        console.log('Backend resources path:', process.resourcesPath);
        console.log('Backend file path:', backendPath);
        console.log('Backend file exists:', fs.existsSync(backendPath));
        
        // 检查文件是否存在
        if (!fs.existsSync(backendPath) && !isDev) {
            throw new Error(`Backend executable not found at ${backendPath}`);
        }
        
        // 启动后端进程
        pythonProcess = spawn(backendPath, args);
        
        // 监听后端输出
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Backend stdout: ${data}`);
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Backend stderr: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
            console.log(`Backend process exited with code ${code}`);
            pythonProcess = null;
        });
        
        // 等待后端启动
        return new Promise((resolve) => {
            // 简单等待 2 秒确保后端启动
            setTimeout(() => {
                resolve();
            }, 2000);
        });
    } catch (error) {
        console.error('Failed to start Python backend:', error);
        throw error;
    }
}

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
        // 发送后端端口信息到渲染进程
        mainWindow.webContents.send('backend-port', backendPort);
        
        // 发送后端状态
        mainWindow.webContents.send('backend-status', {
            running: pythonProcess !== null,
            port: backendPort
        });
    });

    // 监听页面加载失败事件
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Page failed to load:', errorCode, errorDescription);
    });
    
    return mainWindow;
}

// 用于启动前端但无后端的情况
function createWindowWithoutBackend() {
    console.warn('Creating window without backend service...');
    const mainWindow = createWindow();
    
    // 通知渲染进程后端不可用
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('backend-unavailable', {
            message: '后端服务启动失败。某些功能可能不可用。'
        });
    });
}

app.whenReady().then(async () => {
    // 先启动后端，再创建窗口
    try {
        await startPythonBackend();
        createWindow();
    } catch (error) {
        console.error('Failed to initialize backend:', error);
        
        // 显示对话框询问用户是否继续
        const { dialog } = require('electron');
        const result = await dialog.showMessageBox({
            type: 'warning',
            title: '后端启动失败',
            message: '后端服务启动失败。你想要继续吗？',
            detail: '如果继续，某些功能可能不可用。' + error.toString(),
            buttons: ['退出应用', '继续但无后端'],
            defaultId: 0
        });
        
        if (result.response === 1) {
            // 用户选择继续，但没有后端
            createWindowWithoutBackend();
        } else {
            // 用户选择退出
            app.quit();
        }
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            if (pythonProcess) {
                createWindow();
            } else {
                createWindowWithoutBackend();
            }
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // 关闭 Python 后端进程
    if (pythonProcess) {
        console.log('Terminating Python backend process...');
        if (process.platform === 'win32') {
            // Windows 需要强制结束进程树
            spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
        } else {
            // Unix 系统可以直接发送信号
            pythonProcess.kill('SIGTERM');
        }
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