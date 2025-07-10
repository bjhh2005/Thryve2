
import { useCallback } from 'react';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Button, ButtonGroup, Popover } from '@douyinfe/semi-ui';
import {
  IconPlay,
  IconPause,
  IconForward,
  IconStop,
  IconClear
} from '@douyinfe/semi-icons';
import { useExecution } from '../../../context/ExecutionProvider';
import { useBreakpoints } from '../../../context/BreakpointProvider';

export function TestRunButton() {
  const {
    isRunning,
    isPaused,
    startExecution,
    resumeExecution,
    pauseExecution,
    stepOver,
    terminateExecution
  } = useExecution();

  const { breakpoints, clearBreakpoints } = useBreakpoints();
  const clientContext = useClientContext();

  const handleRun = useCallback(() => {
    const documentData = clientContext.document.toJSON();
    const breakpointArray = Array.from(breakpoints);
    // 调用统一的启动方法，它会根据是否存在断点自动选择模式
    startExecution(documentData, breakpointArray);
  }, [clientContext, breakpoints, startExecution]);


  // --- UI 渲染逻辑 ---

  // 1. 如果工作流正在运行中
  if (isRunning) {
    return (
      <ButtonGroup>
        {isPaused ? (
<<<<<<< Updated upstream
          <Popover content="继续执行 (Resume)">
=======
          <Tooltip content="继续执行" position="top">
>>>>>>> Stashed changes
            <Button icon={<IconPlay />} onClick={resumeExecution} />
          </Popover>
        ) : (
<<<<<<< Updated upstream
          <Popover content="暂停执行 (Pause)">
=======
          <Tooltip content="暂停执行" position="top">
>>>>>>> Stashed changes
            <Button icon={<IconPause />} onClick={pauseExecution} />
          </Popover>
        )}
<<<<<<< Updated upstream
        <Popover content="单步执行 (Step Over)">
          <Button icon={<IconForward />} onClick={stepOver} disabled={!isPaused} />
        </Popover>
        <Popover content="终止执行 (Terminate)">
=======
        <Tooltip content="单步执行" position="top">
          <Button icon={<IconForward />} onClick={stepOver} disabled={!isPaused} />
        </Tooltip>
        <Tooltip content="终止执行" position="top">
>>>>>>> Stashed changes
          <Button icon={<IconStop />} type="danger" onClick={terminateExecution} />
        </Popover>
      </ButtonGroup>
    );
  }

  // 2. 如果工作流未运行
  return (
    <ButtonGroup>
      <Button icon={<IconPlay />} onClick={handleRun} type="primary">
        {/* 如果设置了断点，按钮文本提示为 Debug Run */}
        {breakpoints.size > 0 ? 'Debug Run' : 'Run'}
      </Button>
      <Popover content="清空所有断点">
        <Button icon={<IconClear />} onClick={clearBreakpoints} type="tertiary" disabled={breakpoints.size === 0} />
      </Popover>
    </ButtonGroup>
  );
};