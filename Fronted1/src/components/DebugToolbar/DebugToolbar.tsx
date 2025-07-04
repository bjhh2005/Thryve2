// src/components/DebugToolbar.tsx (功能完整、交互友好的最终版)

import React from 'react';
import { Button, ButtonGroup, Popover, Notification } from '@douyinfe/semi-ui';
import {
    IconPlay,
    IconCode,
    IconPause,
    IconForward,
    IconStop,
    IconHelpCircle,
    IconClear
} from '@douyinfe/semi-icons';
import { useExecution } from '../../context/ExecutionProvider';
import { useBreakpoints } from '../../context/BreakpointProvider';
import { useClientContext } from '@flowgram.ai/free-layout-editor'; // 1. 导入获取编辑器上下文的 Hook

export const DebugToolbar = () => {
    const {
        isRunning,
        isPaused,
        startExecution,
        startDebug,
        resumeExecution,
        pauseExecution,
        stepOver,
        terminateExecution
    } = useExecution();

    const { breakpoints, clearBreakpoints } = useBreakpoints();
    const clientContext = useClientContext(); // 2. 获取编辑器上下文实例

    const handleDebugRun = () => {
        // 3. 从上下文中获取最新的、真实的工作流数据
        const documentData = clientContext.document.toJSON();
        const breakpointArray = Array.from(breakpoints);

        if (breakpointArray.length === 0) {
            Notification.info({
                title: '调试运行提示',
                content: '您正在以调试模式运行，但当前未设置任何断点。',
                duration: 3,
            });
        }

        console.log('Starting debug run with breakpoints:', breakpointArray);
        startDebug(documentData, breakpointArray);
    };

    const handleNormalRun = () => {
        // 普通运行时，主动清空所有断点，避免用户混淆
        if (breakpoints.size > 0) {
            clearBreakpoints();
        }
        const documentData = clientContext.document.toJSON();
        startExecution(documentData);
    }

    // 根据当前是否在运行，来决定显示哪个按钮组
    if (isRunning) {
        // --- 运行中显示的按钮 ---
        return (
            <ButtonGroup>
                <Popover content="继续执行，直到下一个断点或结束">
                    <Button title="Resume" icon={<IconPlay />} onClick={resumeExecution} disabled={!isPaused} />
                </Popover>
                <Popover content="在当前节点暂停执行">
                    <Button title="Pause" icon={<IconPause />} onClick={pauseExecution} disabled={isPaused} />
                </Popover>
                <Popover content="执行当前节点，并在下一个节点处暂停">
                    <Button title="Step Over" icon={<IconForward />} onClick={stepOver} disabled={!isPaused} />
                </Popover>
                <Popover content="立即终止本次执行">
                    <Button title="Terminate" icon={<IconStop />} type="danger" onClick={terminateExecution} />
                </Popover>
            </ButtonGroup>
        );
    }

    // --- 未运行时显示的按钮 ---
    return (
        <ButtonGroup>
            <Popover content="一次性运行到底，忽略所有断点">
                <Button icon={<IconPlay />} onClick={handleNormalRun} type="primary">Run</Button>
            </Popover>
            <Popover content="以调试模式运行，工作流会在断点处暂停">
                <Button icon={<IconCode />} type="secondary" onClick={handleDebugRun}>Debug Run</Button>
            </Popover>
            <Popover content="清空所有已设置的断点">
                <Button icon={<IconClear />} onClick={clearBreakpoints} type="tertiary" disabled={breakpoints.size === 0} />
            </Popover>
            <Popover content={<div><b>Run:</b> 快速执行，忽略断点。<br /><b>Debug Run:</b> 在断点处暂停。<br />在节点左上角点击可设置断点。</div>} position="bottomLeft">
                <IconHelpCircle style={{ marginLeft: '12px', color: '#888', cursor: 'help' }} />
            </Popover>
        </ButtonGroup>
    );
};