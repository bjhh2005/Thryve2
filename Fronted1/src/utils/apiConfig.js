/**
 * API配置和连接管理
 */

// 默认后端端口
const DEFAULT_BACKEND_PORT = 4000;

// 尝试获取电子API
const electronAPI = window.electronAPI;

// 获取后端URL
export function getBackendUrl() {
  try {
    // 如果有电子API，优先使用它提供的端口
    if (electronAPI) {
      const port = electronAPI.getBackendPort() || DEFAULT_BACKEND_PORT;
      return `http://localhost:${port}`;
    }
    
    // 回退到默认端口
    return `http://localhost:${DEFAULT_BACKEND_PORT}`;
  } catch (error) {
    console.error('获取后端URL失败:', error);
    return `http://localhost:${DEFAULT_BACKEND_PORT}`;
  }
}

// 检查后端连接状态
export async function checkBackendConnection(retries = 3, delay = 1000) {
  const backendUrl = getBackendUrl();
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`尝试连接后端 (${i+1}/${retries}): ${backendUrl}`);
      
      const response = await fetch(`${backendUrl}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // 添加较短的超时以便快速失败
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('后端连接成功:', data);
        return { success: true, data };
      } else {
        console.warn(`后端返回错误状态: ${response.status}`);
      }
    } catch (error) {
      console.error(`后端连接失败 (${i+1}/${retries}):`, error);
      
      // 最后一次重试失败
      if (i === retries - 1) {
        return { 
          success: false, 
          error: `无法连接到后端服务 (${backendUrl}). 请确保后端服务已启动。`
        };
      }
      
      // 等待指定时间后重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { 
    success: false, 
    error: '后端连接超时，请检查后端服务是否正常运行。' 
  };
}

// 封装API请求，添加错误处理和重试逻辑
export async function apiRequest(endpoint, options = {}, retries = 2) {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${endpoint}`;
  
  // 默认请求配置
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000) // 10秒超时
  };
  
  // 合并选项
  const requestOptions = { ...defaultOptions, ...options };
  
  // 处理路径问题
  if (requestOptions.body && typeof requestOptions.body === 'object') {
    // 如果body中含有路径，确保路径格式正确
    if (requestOptions.body.path) {
      // 替换Windows反斜杠为正斜杠以便JSON格式化
      requestOptions.body.path = requestOptions.body.path.replace(/\\/g, '/');
    }
    
    // 序列化body
    requestOptions.body = JSON.stringify(requestOptions.body);
  }
  
  // 重试逻辑
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, requestOptions);
      
      // 处理非200响应
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`服务器返回错误状态 ${response.status}: ${errorText}`);
      }
      
      // 解析并返回数据
      return await response.json();
    } catch (error) {
      console.error(`API请求失败 (${i}/${retries}):`, error);
      
      // 如果还有重试次数，继续重试
      if (i < retries) {
        console.log(`将在 ${1000 * (i + 1)}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      // 抛出最终错误
      throw error;
    }
  }
}

// 导出后端状态检查函数
export function getBackendStatus() {
  try {
    if (electronAPI && electronAPI.getBackendStatus) {
      return electronAPI.getBackendStatus();
    }
    return { running: false, port: DEFAULT_BACKEND_PORT };
  } catch (error) {
    console.error('获取后端状态失败:', error);
    return { running: false, port: DEFAULT_BACKEND_PORT, error: error.message };
  }
}

// 获取后端可执行文件下载路径
export async function getBackendDownloadPath() {
  try {
    if (electronAPI && electronAPI.getDownloadPath) {
      return await electronAPI.getDownloadPath();
    }
    return { path: '' };
  } catch (error) {
    console.error('获取下载路径失败:', error);
    return { path: '', error: error.message };
  }
}

// 设置后端可执行文件下载路径
export async function setBackendDownloadPath(path) {
  try {
    if (electronAPI && electronAPI.setDownloadPath) {
      return await electronAPI.setDownloadPath(path);
    }
    return { success: false, error: '无法设置下载路径' };
  } catch (error) {
    console.error('设置下载路径失败:', error);
    return { success: false, error: error.message };
  }
} 