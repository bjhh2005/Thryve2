// src/App.js
import React, { useState } from 'react';

function App() {
  const [requestData, setRequestData] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendJson = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. 读取 public 中的 dada.json
      const res = await fetch('/data.json');
      const jsonData = await res.json();
      setRequestData(jsonData); // 显示发送的数据

      // 2. 发送给后端
      const response = await fetch('http://localhost:5000/api/workflow/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      // 3. 获取后端响应
      if (!response.ok) {
        throw new Error('后端响应失败');
      }
      const result = await response.json();
      setResponseData(result);
    } catch (err) {
      setError(err.message);
      setResponseData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>JSON Sender to Backend</h1>
      <button onClick={handleSendJson} disabled={loading}>
        {loading ? '处理中...' : '发送 dada.json 到后端'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          错误：{error}
        </div>
      )}

      {requestData && (
        <div style={{ marginTop: '20px' }}>
          <h2>发送的 JSON 数据：</h2>
          <pre>{JSON.stringify(requestData, null, 2)}</pre>
        </div>
      )}

      {responseData && (
        <div style={{ marginTop: '20px' }}>
          <h2>后端返回的数据：</h2>
          <pre>{JSON.stringify(responseData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
