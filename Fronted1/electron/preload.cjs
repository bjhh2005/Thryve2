const { contextBridge, ipcRenderer } = require('electron');

// 存储后端端口
let backendPort = 4000;
// 存储后端状态
let backendStatus = { running: false, port: backendPort };

// 监听后端端口信息
ipcRenderer.on('backend-port', (_, port) => {
    console.log(`Received backend port: ${port}`);
    backendPort = port;
});

// 监听后端状态信息
ipcRenderer.on('backend-status', (_, status) => {
    console.log(`Received backend status:`, status);
    backendStatus = status;
});

// 监听后端不可用消息
ipcRenderer.on('backend-unavailable', (_, data) => {
    console.warn(`Backend unavailable:`, data.message);
    backendStatus = { running: false, port: backendPort };
    // 将消息存储在sessionStorage中，让前端页面可以访问
    if (window && window.sessionStorage) {
        window.sessionStorage.setItem('backend-error', data.message);
    }
});

contextBridge.exposeInMainWorld('electronAPI', {
    // 选择文件
    selectFile: () => ipcRenderer.invoke('select-file'),
    
    // 读取文件内容
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    
    // 获取文件信息
    getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),

    // 选择文件夹
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    
    // 获取后端端口
    getBackendPort: () => backendPort,
    
    // 获取后端状态
    getBackendStatus: () => backendStatus,
    
    // 检查后端是否运行
    isBackendRunning: () => backendStatus.running
}); 