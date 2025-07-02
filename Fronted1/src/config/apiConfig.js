// apiConfig.js - 前后端连接配置

// 获取环境变量
const isDevelopment = import.meta.env.DEV;

// 默认配置
const DEFAULT_CONFIG = {
  backendPort: 4000,
  backendHost: 'localhost',
  socketNamespace: '/workflow',
  maxRetries: 5,
  retryInterval: 2000, // 2秒
  connectionTimeout: 10000 // 10秒
};

/**
 * 获取后端 API URL
 */
export function getBackendUrl() {
  // 如果在 Electron 环境中
  if (window.electronAPI) {
    try {
      const port = window.electronAPI.getBackendPort();
      return `http://localhost:${port}`;
    } catch (error) {
      console.warn('Error getting backend port from Electron:', error);
    }
  }
  
  // 默认值
  return `http://${DEFAULT_CONFIG.backendHost}:${DEFAULT_CONFIG.backendPort}`;
}

/**
 * 获取 Socket.IO 连接 URL
 */
export function getSocketUrl() {
  return `${getBackendUrl()}${DEFAULT_CONFIG.socketNamespace}`;
}

/**
 * 获取 API 路径
 * @param {string} endpoint - API 端点
 */
export function getApiPath(endpoint) {
  return `${getBackendUrl()}/api/${endpoint}`;
}

/**
 * 测试后端连接
 * @returns {Promise<boolean>} 后端是否可连接
 */
export async function testBackendConnection() {
  const url = getBackendUrl();
  console.log(`Testing backend connection to ${url}...`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_CONFIG.connectionTimeout);
    
    const response = await fetch(`${url}/api/status`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('Backend connection successful');
      return true;
    } else {
      console.warn(`Backend responded with status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
}

/**
 * 带重试机制的后端连接
 * @param {Function} connectCallback - 连接成功时的回调函数
 * @param {Function} failCallback - 所有重试都失败时的回调函数
 */
export async function connectWithRetry(connectCallback, failCallback) {
  let retries = 0;
  
  const attemptConnection = async () => {
    const connected = await testBackendConnection();
    
    if (connected) {
      connectCallback();
      return;
    }
    
    retries++;
    
    if (retries < DEFAULT_CONFIG.maxRetries) {
      console.log(`Retrying backend connection (${retries}/${DEFAULT_CONFIG.maxRetries}) in ${DEFAULT_CONFIG.retryInterval}ms...`);
      setTimeout(attemptConnection, DEFAULT_CONFIG.retryInterval);
    } else {
      console.error(`Failed to connect to backend after ${DEFAULT_CONFIG.maxRetries} attempts`);
      failCallback();
    }
  };
  
  attemptConnection();
}

// 导出配置
export default {
  getBackendUrl,
  getSocketUrl,
  getApiPath,
  testBackendConnection,
  connectWithRetry,
  config: DEFAULT_CONFIG
}; 