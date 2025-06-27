const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 选择文件
    selectFile: () => ipcRenderer.invoke('select-file'),
    
    // 读取文件内容
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    
    // 获取文件信息
    getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath)
}); 