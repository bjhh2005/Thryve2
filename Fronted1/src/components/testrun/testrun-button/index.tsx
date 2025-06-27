import { useCallback } from 'react';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Button } from '@douyinfe/semi-ui';
import { IconPlay } from '@douyinfe/semi-icons';
import { useConsole } from '../../../context/ConsoleProvider'; // 导入我们新建的Hook

export function TestRunButton(props: { disabled: boolean }) {
  const clientContext = useClientContext();
  // 从 Context 中获取运行状态和启动函数
  const { isRunning, startExecution } = useConsole();

  const handleTestRun = useCallback(() => {
    const documentData = clientContext.document.toJSON();
    startExecution(documentData);
  }, [clientContext, startExecution]);

  return (
    <Button
      disabled={props.disabled || isRunning} // 运行时也禁用按钮
      onClick={handleTestRun}
      icon={<IconPlay size="small" />}
      style={{
        backgroundColor: isRunning ? 'rgba(255,115,0, 1)' : 'rgba(0,178,60,1)',
        borderRadius: '8px',
        color: '#fff'
      }}
    >
      {isRunning ? 'Running...' : 'Test Run'}
    </Button>
  );
}