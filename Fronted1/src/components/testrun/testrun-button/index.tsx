// /testrun-button/index.tsx (兼容 Console 和 WorkflowState 的最终版本)

import { useCallback } from 'react';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Button } from '@douyinfe/semi-ui';
import { IconPlay, IconStop } from '@douyinfe/semi-icons';
import { useConsole } from '../../../context/ConsoleProvider';
import { useWorkflowState } from '../../../context/WorkflowStateProvider';
import { v4 as uuidv4 } from 'uuid';

export function TestRunButton(props: { disabled: boolean }) {
  const clientContext = useClientContext();

  // 1. 分别从两个 Context 中获取各自的状态和方法
  const { isRunning: isConsoleRunning, startExecution } = useConsole();
  const { isRunning: isVisRunning, startWorkflow, cancelWorkflow } = useWorkflowState();

  // 2. 定义总体的运行状态：只要有一个系统在运行，就认为工作流正在运行
  const isOverallRunning = isConsoleRunning || isVisRunning;

  // 3. 创建一个统一的点击事件处理器
  const handleTestRun = useCallback(() => {
    const clickId = uuidv4();
    console.log(`%c[ButtonClick] Click event fired with ID: ${clickId}`, 'color: blue; font-weight: bold;');
    // 如果当前是运行状态，按钮扮演“停止”的角色
    if (isOverallRunning) {
      // 调用可视化系统的停止方法
      cancelWorkflow();
      // 注意：您原有的 ConsoleProvider 没有提供停止方法，所以日志会继续运行直到自然结束
    } else {
      // 如果当前是停止状态，按钮扮演“开始”的角色
      const documentData = clientContext.document.toJSON();
      // 同时启动两个系统
      startExecution(documentData, clickId); // 启动日志系统
      startWorkflow(documentData);  // 启动画布可视化系统
    }
  }, [
    isOverallRunning,
    clientContext,
    startExecution,
    startWorkflow,
    cancelWorkflow,
  ]);

  return (
    <Button
      // 4. 使用总体的运行状态来决定按钮是否被禁用
      disabled={props.disabled || isOverallRunning}
      onClick={handleTestRun}
      // 根据总体状态切换“播放”和“停止”图标
      icon={isOverallRunning ? <IconStop size="small" /> : <IconPlay size="small" />}
      style={{
        backgroundColor: isOverallRunning ? 'rgba(255,115,0, 1)' : 'rgba(0,178,60,1)',
        borderRadius: '8px',
        color: '#fff'
      }}
      type={isOverallRunning ? 'danger' : 'primary'}
    >
      {/* 5. 根据总体状态显示不同的按钮文本 */}
      {isOverallRunning ? 'Running / Stop' : 'Test Run'}
    </Button>
  );
}