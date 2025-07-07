// /testrun-button/index.tsx (兼容 Console 和 WorkflowState 的最终版本)

import { useCallback } from 'react';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Button, ButtonGroup, Popover, Tooltip } from '@douyinfe/semi-ui';
import {
  IconPlay,
  IconPause,
  IconForward,
  IconStop,
  IconClear
} from '@douyinfe/semi-icons';
import { useExecution } from '../../../context/ExecutionProvider';
import { useBreakpoints } from '../../../context/BreakpointProvider';
import { useLeftSidebar } from '../../sidebar-left/SidebarProvider';
import './testrun-button.less';

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
  const { setActiveTab, toggleSidebar, isCollapsed } = useLeftSidebar();

  const handleRun = useCallback(() => {
    setActiveTab('console');
    // 如果侧边栏是折叠的，就展开它
    if (isCollapsed) {
      toggleSidebar();
    }
    const documentData = clientContext.document.toJSON();
    const breakpointArray = Array.from(breakpoints);
    // 调用统一的启动方法，它会根据是否存在断点自动选择模式
    startExecution(documentData, breakpointArray);
  }, [clientContext, breakpoints, startExecution, setActiveTab, toggleSidebar, isCollapsed]);


  // --- UI 渲染逻辑 ---

  // 1. 如果工作流正在运行中
  if (isRunning) {
    return (
      <ButtonGroup className="run-controls-group">
        {isPaused ? (
          <Tooltip content="继续执行" position="bottom">
            <Button icon={<IconPlay />} onClick={resumeExecution} />
          </Tooltip>
        ) : (
          <Tooltip content="暂停执行" position="bottom">
            <Button icon={<IconPause />} onClick={pauseExecution} />
          </Tooltip>
        )}
        <Tooltip content="单步执行" position="bottom">
          <Button icon={<IconForward />} onClick={stepOver} disabled={!isPaused} />
        </Tooltip>
        <Tooltip content="终止执行" position="bottom">
          <Button icon={<IconStop />} type="danger" onClick={terminateExecution} />
        </Tooltip>
      </ButtonGroup>
    );
  }

  // 2. 如果工作流未运行
  return (
    <ButtonGroup className='run-group'>
      <Button icon={<IconPlay />} onClick={handleRun} className="run-button-primary">
        {/* 如果设置了断点，按钮文本提示为 Debug Run */}
        {breakpoints.size > 0 ? 'Debug Run' : 'Run'}
      </Button>
      <Tooltip content="清除所有断点" position="bottom">
        <Button icon={<IconClear />} onClick={clearBreakpoints} className="run-button-primary" disabled={breakpoints.size === 0} />
      </Tooltip>
    </ButtonGroup>
  );
};