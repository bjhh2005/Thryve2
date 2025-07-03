// /testrun-button/index.tsx (兼容 Console 和 WorkflowState 的最终版本)

import { useCallback } from 'react';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Button } from '@douyinfe/semi-ui';
import { IconPlay, IconStop } from '@douyinfe/semi-icons';
// import { useConsole } from '../../../context/ConsoleProvider';
// import { useWorkflowState } from '../../../context/WorkflowStateProvider';
import { useExecution } from '../../../context/ExecutionProvider';
import { v4 as uuidv4 } from 'uuid';

export function TestRunButton(props: { disabled: boolean }) {
  const clientContext = useClientContext();

  const { isRunning, startExecution } = useExecution();

  const handleTestRun = useCallback(() => {
    const documentData = clientContext.document.toJSON();
    startExecution(documentData);
  }, [clientContext, startExecution]);

  return (
    <Button
      // 4. 使用总体的运行状态来决定按钮是否被禁用
      disabled={props.disabled || isRunning}
      onClick={handleTestRun}
      // 根据总体状态切换“播放”和“停止”图标
      icon={isRunning ? <IconStop size="small" /> : <IconPlay size="small" />}
      style={{
        backgroundColor: isRunning ? 'rgba(255,115,0, 1)' : 'rgba(0,178,60,1)',
        borderRadius: '8px',
        color: '#fff'
      }}
      type={isRunning ? 'danger' : 'primary'}
    >
      {/* 5. 根据总体状态显示不同的按钮文本 */}
      {isRunning ? 'Running / Stop' : 'Test Run'}
    </Button>
  );
}