import { FC, useEffect, useState } from 'react';
import { WorkflowInputs, WorkflowOutputs, WorkflowStatus } from '@flowgram.ai/runtime-interface'; // 引入 WorkflowStatus
import { useService } from '@flowgram.ai/free-layout-editor';
import { Button, JsonViewer, SideSheet, Toast } from '@douyinfe/semi-ui'; // 引入 Toast
import { IconPlay, IconSpin, IconStop } from '@douyinfe/semi-icons';

import { NodeStatusGroup } from '../node-status-bar/group';
import { WorkflowRuntimeService } from '../../../plugins/runtime-plugin/runtime-service';

interface TestRunSideSheetProps {
  visible: boolean;
  onCancel: () => void;
}

export const TestRunSideSheet: FC<TestRunSideSheetProps> = ({ visible, onCancel }) => {
  const runtimeService = useService(WorkflowRuntimeService);
  const [isRunning, setRunning] = useState(false);
  const [value, setValue] = useState<string>(`{}`);
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<
    | {
      inputs: WorkflowInputs;
      outputs: WorkflowOutputs;
    }
    | undefined
  >();

  const onTestRun = async () => {
    if (isRunning) {
      await runtimeService.taskCancel();
      return;
    }
    setResult(undefined);
    setError(undefined);
    setRunning(true);
    try {
      await runtimeService.taskRun(value);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onClose = async () => {
    await runtimeService.taskCancel();
    setValue(`{}`);
    setRunning(false);
    onCancel();
  };

  useEffect(() => {
    // 这个回调现在可以正确地接收到 status 和 message
    const disposer = runtimeService.onTerminated(({ status, message, result }) => {
      setRunning(false);
      if (result) {
        setResult(result);
      }

      if (status === WorkflowStatus.Succeeded) {
        Toast.success(message || 'Workflow executed successfully!');
      } else if (status === WorkflowStatus.Failed) {
        const errorMessage = message || 'Workflow execution failed.';
        Toast.error(errorMessage);
        setError(errorMessage);
      }
    });
    return () => disposer.dispose();
  }, [runtimeService]);

  const renderRunning = (
    <div
      style={{
        width: '100%',
        height: '80%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <IconSpin spin size="large" />
      <div
        style={{
          fontSize: '18px',
        }}
      >
        Running...
      </div>
    </div>
  );

  const renderForm = (
    <div>
      <div
        style={{
          fontSize: '15px',
          fontWeight: '500',
          marginBottom: '10px',
          color: '#333',
        }}
      >
        Input
      </div>
      <JsonViewer showSearch={false} height={300} value={value} onChange={setValue} />
      <div
        style={{
          color: 'red',
          fontSize: '14px',
          marginTop: '30px',
        }}
      >
        {error}
      </div>

      <NodeStatusGroup title="Inputs" data={result?.inputs} optional disableCollapse />
      <NodeStatusGroup title="Outputs" data={result?.outputs} optional disableCollapse />
    </div>
  );

  const renderButton = (
    <Button
      onClick={onTestRun}
      icon={isRunning ? <IconStop size="small" /> : <IconPlay size="small" />}
      style={{
        backgroundColor: isRunning ? 'rgba(87,104,161,0.08)' : 'rgba(0,178,60,1)',
        borderRadius: '8px',
        color: isRunning ? 'rgba(15,21,40,0.82)' : '#fff',
        marginBottom: '16px',
        width: '100%',
        height: '40px',
      }}
    >
      {isRunning ? 'Cancel' : 'Test Run'}
    </Button>
  );

  return (
    <SideSheet
      title="Test Run"
      visible={visible}
      mask={false}
      onCancel={onClose}
      footer={renderButton}
    >
      {isRunning ? renderRunning : renderForm}
    </SideSheet>
  );
};
