import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

import { useClientContext, getNodeForm, FlowNodeEntity } from '@flowgram.ai/free-layout-editor';
import { Button, Badge, SideSheet } from '@douyinfe/semi-ui';
import { IconPlay } from '@douyinfe/semi-icons';

import { TestRunSideSheet } from '../testrun-sidesheet';

export function TestRunButton(props: { disabled: boolean }) {
  const [errorCount, setErrorCount] = useState(0);
  const clientContext = useClientContext();
  const [visible, setVisible] = useState(false);

  // 实现通讯新增
  const [isRunning, setIsRunning] = useState(false);

  /**
   * Validate all node and Save with WebSocket
   */
  const a = function(){
    console.log("1");
    
  }
  const onTestRun = useCallback(async () => {

    // 按钮变红色，开始运行
    setIsRunning(true);
    const socket = io('http://localhost:4000/workflow',{
          reconnection: true, // 允许重连
          reconnectionAttempts: 3, // 最多重连3次
          reconnectionDelay: 1000, // 重连延迟1秒
          timeout: 5000, // 连接超时5秒
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket连接成功');
      
      // 发送数据到后端
      const documentData = clientContext.document.toJSON();
      socket.emit('start_process', documentData);
    });

    // 监听info事件
    socket.on('info', (data) => {
      console.log('ℹ️ [INFO]:', data);
    });
    
    // 监听warning事件
    socket.on('warning', (data) => {
      console.log('⚠️ [WARNING]:', data);
    });
    
    // 监听error事件
    socket.on('error', (data) => {
      console.log('❌ [ERROR]:', data);
    });
    
    // 监听结束事件
    socket.on('over', (data) => {
      console.log('🏁 [OVER]:', data);
      
      // 按钮变回绿色，结束运行
      setIsRunning(false);
      
      // 断开连接
      socket.close();
    });

    socket.on('workflow', (data) =>{
      console.log(`当前执行的节点为${data}`);
      
    })

    // 监听连接错误
    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket连接失败:', error);
      setIsRunning(false);
    });

    socket.on('disconnect', (data) =>{
      setIsRunning(false);

    } )


  }, [clientContext]);

  


  const button =
     
      <Button
        disabled={props.disabled}
        onClick={onTestRun}
        icon={<IconPlay size="small" />}
        style={{ 
          backgroundColor: isRunning ? 'rgba(255,115,0, 1)' : 'rgba(0,178,60,1)', 
          borderRadius: '8px', 
          color: '#fff' 
        }}
      >
        {isRunning ? 'Running...' : 'Test Run'}
      </Button>
    

  return (
    <>
      {button}
      <TestRunSideSheet visible={visible} onCancel={() => setVisible((v) => !v)} />
    </>
  );
}
