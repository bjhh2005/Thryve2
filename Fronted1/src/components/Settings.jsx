import { useState, useEffect } from 'react';

/**
 * 设置组件，允许用户配置应用程序设置
 */
export default function Settings() {
  const [downloadPath, setDownloadPath] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  
  // 组件加载时获取当前下载路径
  useEffect(() => {
    const loadDownloadPath = async () => {
      try {
        const result = await window.electronAPI.getDownloadPath();
        if (result.path) {
          setDownloadPath(result.path);
        }
      } catch (err) {
        console.error('获取下载路径失败:', err);
        setError('获取下载路径失败');
      }
    };
    
    loadDownloadPath();
  }, []);
  
  // 选择下载路径
  const handleSelectPath = async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (!result.canceled && result.folderPath) {
        setDownloadPath(result.folderPath);
      }
    } catch (err) {
      console.error('选择文件夹失败:', err);
      setError('选择文件夹失败');
    }
  };
  
  // 保存设置
  const handleSave = async () => {
    try {
      const result = await window.electronAPI.setDownloadPath(downloadPath);
      if (result.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        setError('保存设置失败');
      }
    } catch (err) {
      console.error('保存设置失败:', err);
      setError('保存设置失败');
    }
  };
  
  return (
    <div className="settings-container">
      <h2>应用程序设置</h2>
      
      <div className="setting-group">
        <h3>后端设置</h3>
        
        <div className="setting-item">
          <label htmlFor="downloadPath">后端下载路径：</label>
          <div className="path-selector">
            <input
              type="text"
              id="downloadPath"
              value={downloadPath}
              onChange={(e) => setDownloadPath(e.target.value)}
              placeholder="选择或输入下载路径"
            />
            <button onClick={handleSelectPath}>浏览...</button>
          </div>
          <p className="setting-description">
            设置后端可执行文件的下载位置。应用程序将在此路径中查找后端文件。
          </p>
        </div>
      </div>
      
      <div className="settings-actions">
        <button onClick={handleSave} className="save-button">
          保存设置
        </button>
        {isSaved && <span className="save-success">设置已保存！</span>}
        {error && <span className="save-error">{error}</span>}
      </div>
      
      <style jsx>{`
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .setting-group {
          margin-bottom: 30px;
          border: 1px solid #eee;
          border-radius: 5px;
          padding: 15px;
        }
        
        .setting-item {
          margin-bottom: 15px;
        }
        
        .path-selector {
          display: flex;
          gap: 10px;
          margin: 8px 0;
        }
        
        .path-selector input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        button {
          padding: 8px 16px;
          background: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background: #3a5ce5;
        }
        
        .setting-description {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        
        .settings-actions {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .save-button {
          background: #28a745;
        }
        
        .save-button:hover {
          background: #218838;
        }
        
        .save-success {
          color: #28a745;
        }
        
        .save-error {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
} 