const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

// 获取额外的启动参数
const extraLaunchArgs = process.env.ELECTRON_EXTRA_LAUNCH_ARGS ? process.env.ELECTRON_EXTRA_LAUNCH_ARGS.split(' ') : [];
if (extraLaunchArgs.length > 0) {
    console.log('使用额外的启动参数:', extraLaunchArgs);
    // 将额外参数添加到命令行
    extraLaunchArgs.forEach(arg => {
        app.commandLine.appendSwitch(arg.replace('--', ''));
    });
}

// 禁用GPU沙箱
app.commandLine.appendSwitch('disable-gpu-sandbox');

// 存储 Python 后端进程引用
let pythonProcess = null;
let backendPort = 4000;
// 用户自定义下载路径
let userDownloadPath = null;

// 规范化路径，处理Windows路径问题
function normalizePath(pathStr) {
    if (!pathStr) return pathStr;
    
    // 确保路径使用正确的分隔符
    let normalized = path.normalize(pathStr);
    
    // 打印调试信息
    console.log(`规范化路径: ${pathStr} -> ${normalized}`);
    
    return normalized;
}

// 启动 Python 后端函数
function startPythonBackend() {
    console.log('Starting Python backend...');
    
    try {
        // 确定后端可执行文件路径
        let backendPath;
        let args = [];
        let processOptions = {
            windowsHide: false,
            stdio: 'pipe',
            env: { ...process.env } // 复制当前环境变量，而不是修改它
        };
        
        if (isDev) {
            // 开发环境：使用 Python 解释器运行脚本
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
            backendPath = pythonCommand;
            
            // 使用绝对路径，避免相对路径的问题
            const backendLauncherPath = path.resolve(process.cwd(), '..', 'Backend', 'backend_launcher.py');
            args = [backendLauncherPath, backendPort];
            
            console.log(`Running backend in dev mode: ${backendPath} ${args.join(' ')}`);
            
            // 开发模式下不设置Python相关环境变量，让Python使用自己的环境
            delete processOptions.env.PYTHONHOME;
            delete processOptions.env.PYTHONPATH;
            
            // 设置PYTHONIOENCODING确保正确处理中文
            processOptions.env.PYTHONIOENCODING = 'utf-8';
        } else {
            // 生产环境：使用打包后的可执行文件
            if (process.platform === 'win32') {
                // 检查多个可能的路径
                let possiblePaths = [
                    // 首先检查与前端EXE同级目录
                    path.join(path.dirname(app.getPath('exe')), 'Thryve_back.exe'),
                    // 然后检查resources/backend目录
                    path.join(process.resourcesPath, 'backend', 'Thryve_back.exe'),
                    // 再检查其他可能的位置
                    path.join(process.resourcesPath, 'backend', '_internal', 'Thryve_back.exe'),
                    path.join(app.getAppPath(), '..', 'backend', 'Thryve_back.exe'),
                    path.join(__dirname, '..', '..', 'Backend', 'dist', 'Thryve_back', 'Thryve_back.exe'),
                    path.join(app.getPath('exe'), '..', 'Thryve_back.exe')
                ];

                // 如果用户指定了下载路径，添加到可能的路径列表中
                if (userDownloadPath) {
                    // 添加用户下载路径的多种可能组合
                    possiblePaths.unshift(path.join(normalizePath(userDownloadPath), 'Thryve_back.exe'));
                    possiblePaths.unshift(path.join(normalizePath(userDownloadPath), 'backend', 'Thryve_back.exe'));
                }

                console.log('检查可能的后端路径:');
                possiblePaths.forEach(p => console.log(`- ${p}`));

                // 查找第一个存在的路径
                backendPath = possiblePaths.find(p => {
                    try {
                        const exists = fs.existsSync(p);
                        console.log(`Checking path: ${p}, exists: ${exists}`);
                        return exists;
                    } catch (err) {
                        console.error(`检查路径出错: ${p}`, err);
                        return false;
                    }
                });

                if (!backendPath) {
                    // 如果找不到，尝试搜索exe所在目录及其子目录
                    const exeDir = path.dirname(app.getPath('exe'));
                    console.log(`尝试在执行目录中查找: ${exeDir}`);
                    
                    // 定义一个简单的搜索函数
                    const findFileInDir = (dir, filename, depth = 0) => {
                        if (depth > 3) return null; // 限制搜索深度
                        
                        try {
                            const entries = fs.readdirSync(dir);
                            for (const entry of entries) {
                                const fullPath = path.join(dir, entry);
                                try {
                                    const stat = fs.statSync(fullPath);
                                    if (stat.isFile() && entry === filename) {
                                        return fullPath;
                                    } else if (stat.isDirectory()) {
                                        const found = findFileInDir(fullPath, filename, depth + 1);
                                        if (found) return found;
                                    }
                                } catch (err) {
                                    console.warn(`无法访问: ${fullPath}`);
                                }
                            }
                        } catch (err) {
                            console.warn(`无法读取目录: ${dir}`);
                        }
                        return null;
                    };
                    
                    const foundPath = findFileInDir(exeDir, 'Thryve_back.exe');
                    if (foundPath) {
                        console.log(`在执行目录中找到后端: ${foundPath}`);
                        backendPath = foundPath;
                    } else {
                        // 如果找不到，使用默认路径并记录警告
                        backendPath = possiblePaths[0];
                        console.warn(`Warning: Backend executable not found in any expected location. Using default: ${backendPath}`);
                    }
                }
            } else {
                backendPath = path.join(process.resourcesPath, 'backend', 'Thryve_back');
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

        // 检查Python DLL是否存在
        const backendDir = path.dirname(backendPath);
        const internalDir = path.join(backendDir, '_internal');
        const pythonDll = path.join(internalDir, 'python311.dll');
        
        console.log('检查Python DLL路径:');
        console.log(`- 内部目录: ${internalDir}`);
        console.log(`- Python DLL路径: ${pythonDll}`);
        console.log(`- Python DLL存在: ${fs.existsSync(pythonDll)}`);
        
        // 如果_internal目录不存在，尝试创建
        if (!fs.existsSync(internalDir)) {
            console.log(`_internal目录不存在，尝试创建: ${internalDir}`);
            try {
                fs.mkdirSync(internalDir, { recursive: true });
            } catch (err) {
                console.error(`创建_internal目录失败: ${err.message}`);
            }
        }
        
        // 如果Python DLL不存在，尝试查找和复制
        if (!fs.existsSync(pythonDll)) {
            console.log('Python DLL不存在，尝试查找...');
            
            // 可能的DLL位置
            const possibleDllPaths = [
                path.join(backendDir, 'python311.dll'),
                path.join(process.resourcesPath, 'backend', '_internal', 'python311.dll'),
                path.join(process.resourcesPath, 'python311.dll'),
                path.join(app.getAppPath(), 'python311.dll')
            ];
            
            // 查找存在的DLL
            const foundDll = possibleDllPaths.find(p => fs.existsSync(p));
            
            if (foundDll) {
                console.log(`找到Python DLL: ${foundDll}，复制到: ${pythonDll}`);
                try {
                    // 确保目标目录存在
                    fs.mkdirSync(path.dirname(pythonDll), { recursive: true });
                    // 复制DLL
                    fs.copyFileSync(foundDll, pythonDll);
                    console.log('Python DLL复制成功');
                } catch (err) {
                    console.error(`复制Python DLL失败: ${err.message}`);
                }
            } else {
                console.warn('未找到Python DLL，后端可能无法启动');
            }
        }
        
        // 在启动后端进程前，记录环境变量
        console.log('Starting backend process with environment:');
        console.log(`- PYTHONIOENCODING: ${processOptions.env.PYTHONIOENCODING || 'not set'}`);
        console.log(`- PYTHONHOME: ${processOptions.env.PYTHONHOME || 'not set'}`);
        console.log(`- PYTHONPATH: ${processOptions.env.PYTHONPATH || 'not set'}`);
        console.log(`Command: ${backendPath} ${args.join(' ')}`);
        
        // 启动后端进程
        pythonProcess = spawn(backendPath, args, processOptions);
        
        // 监听后端输出
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Backend stdout: ${data}`);
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Backend stderr: ${data}`);
            
            // 检查是否是Python DLL错误
            const output = data.toString();
            if (output.includes('Failed to load Python DLL') || output.includes('python311.dll')) {
                console.error('检测到Python DLL加载错误，尝试修复...');
                
                // 尝试复制DLL到多个位置
                const exeDir = path.dirname(app.getPath('exe'));
                const possibleSourceDlls = [
                    path.join(process.resourcesPath, 'backend', '_internal', 'python311.dll'),
                    path.join(process.resourcesPath, 'python311.dll'),
                    path.join(exeDir, '_internal', 'python311.dll')
                ];
                
                const targetDirs = [
                    exeDir,
                    path.join(exeDir, '_internal'),
                    process.resourcesPath
                ];
                
                // 查找存在的DLL
                const sourceDll = possibleSourceDlls.find(p => {
                    try {
                        return fs.existsSync(p);
                    } catch (e) {
                        return false;
                    }
                });
                
                if (sourceDll) {
                    console.log(`找到源DLL: ${sourceDll}，尝试复制到多个位置`);
                    
                    // 复制到所有目标目录
                    targetDirs.forEach(dir => {
                        try {
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            
                            const targetDll = path.join(dir, 'python311.dll');
                            fs.copyFileSync(sourceDll, targetDll);
                            console.log(`复制DLL到: ${targetDll}`);
                        } catch (err) {
                            console.error(`复制到 ${dir} 失败: ${err.message}`);
                        }
                    });
                    
                    console.log('尝试重启后端进程...');
                    // 关闭当前进程
                    if (pythonProcess) {
                        pythonProcess.kill();
                    }
                    
                    // 延迟重启
                    setTimeout(() => {
                        startPythonBackend().catch(err => {
                            console.error('重启后端失败:', err);
                        });
                    }, 1000);
                } else {
                    console.error('未找到源DLL文件，无法修复');
                }
            }
        });
        
        pythonProcess.on('error', (err) => {
            console.error(`Backend process error: ${err.message}`);
            pythonProcess = null;
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
const { Menu } = require('electron');

function createWindow() {
    const mainWindow = new BrowserWindow({
        menu: null,
        width: 1200,
        height: 800,
        title: 'Thryve',
        icon: path.join(__dirname, '../logo/icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
            disableGpuSandbox: true
        }
    });

    Menu.setApplicationMenu(null);

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
            let files = [];
            
            try {
                // 递归扫描函数
                const scanDirectory = (dir, recursive = false, fileList = []) => {
                    try {
                        const entries = fs.readdirSync(dir, { withFileTypes: true });
                        
                        for (const entry of entries) {
                            const fullPath = path.join(dir, entry.name);
                            
                            try {
                                if (entry.isFile()) {
                                    fileList.push(fullPath);
                                } else if (entry.isDirectory() && recursive) {
                                    scanDirectory(fullPath, recursive, fileList);
                                }
                            } catch (err) {
                                console.error(`Error processing ${fullPath}:`, err);
                            }
                        }
                        
                        return fileList;
                    } catch (err) {
                        console.error(`Error reading directory ${dir}:`, err);
                        return fileList;
                    }
                };
                
                // 仅扫描顶层文件
                files = scanDirectory(folderPath, false);
                
                // 记录文件数量
                console.log(`Found ${files.length} files in folder: ${folderPath}`);
            } catch (err) {
                console.error('Error reading folder contents:', err);
                // 即使读取文件列表失败，仍然返回文件夹信息
                files = [];
            }
            
            return {
                canceled: false,
                folderPath: folderPath,
                folderName: path.basename(folderPath),
                files: files
            };
        }

        return { canceled: true };
    } catch (error) {
        console.error('Error selecting folder:', error);
        return { canceled: true, error: error.message };
    }
});

// 添加新的递归文件夹扫描功能
ipcMain.handle('scan-folder', async (event, { folderPath, recursive = false }) => {
    try {
        if (!folderPath) {
            throw new Error('Folder path is required');
        }
        
        const scanDirectory = (dir, recursive = false, fileList = []) => {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    try {
                        if (entry.isFile()) {
                            fileList.push(fullPath);
                        } else if (entry.isDirectory() && recursive) {
                            scanDirectory(fullPath, recursive, fileList);
                        }
                    } catch (err) {
                        console.error(`Error processing ${fullPath}:`, err);
                    }
                }
                
                return fileList;
            } catch (err) {
                console.error(`Error reading directory ${dir}:`, err);
                return fileList;
            }
        };
        
        // 执行扫描
        const files = scanDirectory(folderPath, recursive);
        
        console.log(`Scanned folder ${folderPath}, recursive=${recursive}, found ${files.length} files`);
        
        return {
            success: true,
            folderPath: folderPath,
            folderName: path.basename(folderPath),
            files: files,
            count: files.length
        };
    } catch (error) {
        console.error('Error scanning folder:', error);
        return { 
            success: false, 
            error: error.message,
            files: [],
            count: 0
        };
    }
});

// 设置后端下载路径
ipcMain.handle('set-download-path', async (event, path) => {
    try {
        userDownloadPath = path;
        // 保存路径到配置文件
        const configPath = path.join(app.getPath('userData'), 'config.json');
        const config = {
            downloadPath: userDownloadPath,
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        return { success: true, path: userDownloadPath };
    } catch (error) {
        console.error('Error setting download path:', error);
        return { success: false, error: error.message };
    }
});

// 获取后端下载路径
ipcMain.handle('get-download-path', async () => {
    try {
        // 如果内存中没有，尝试从配置文件读取
        if (!userDownloadPath) {
            const configPath = path.join(app.getPath('userData'), 'config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                userDownloadPath = config.downloadPath;
            }
        }
        
        return { path: userDownloadPath || '' };
    } catch (error) {
        console.error('Error getting download path:', error);
        return { path: '', error: error.message };
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