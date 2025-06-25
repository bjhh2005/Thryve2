import React, { useState, useRef, useEffect } from 'react';

const SimpleTaskDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('等待开始...');
  const [progress, setProgress] = useState(0);
  const eventSourceRef = useRef(null);

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleButtonClick = async () => {
    if (isRunning) {
      // 停止任务
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setIsRunning(false);
      setStatus('已停止');
      return;
    }

    try {
      setIsRunning(true);
      setStatus('正在启动...');
      setProgress(0);

      const response = await fetch(`${API_BASE}/start-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('启动失败');
      }

      const data = await response.json();
      
      // 开始监听状态
      const eventSource = new EventSource(`${API_BASE}/task-status/${data.task_id}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const taskData = JSON.parse(event.data);
          
          setStatus(taskData.message || '处理中...');
          setProgress(taskData.progress || 0);

          if (['completed', 'error', 'cancelled'].includes(taskData.status)) {
            setIsRunning(false);
            eventSource.close();
          }
        } catch (err) {
          setStatus('数据解析错误');
        }
      };

      eventSource.onerror = () => {
        setStatus('连接错误');
        setIsRunning(false);
        eventSource.close();
      };

    } catch (err) {
      setStatus('启动失败: ' + err.message);
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <button
        onClick={handleButtonClick}
        style={{
          padding: '15px 30px',
          fontSize: '18px',
          backgroundColor: isRunning ? '#dc3545' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '30px'
        }}
      >
        {isRunning ? '停止' : '开始'}
      </button>

      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ 
          marginBottom: '15px',
          fontSize: '16px',
          color: '#333'
        }}>
          {status}
        </div>

        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#e0e0e0',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#007bff',
            transition: 'width 0.3s ease'
          }} />
        </div>

        <div style={{ 
          marginTop: '10px',
          fontSize: '14px',
          color: '#666'
        }}>
          {progress}%
        </div>
      </div>
    </div>
  );
};

export default SimpleTaskDemo;