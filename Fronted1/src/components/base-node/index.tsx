// base-node/index.tsx (支持暂停状态高亮)

import React, { useCallback } from 'react';
import { FlowNodeEntity, useNodeRender } from '@flowgram.ai/free-layout-editor';
import { ConfigProvider } from '@douyinfe/semi-ui';
import { useExecution } from '../../context/ExecutionProvider';
import { NodeResultDisplay } from '../NodeResultDisplay/NodeResultDisplay'; // 确保路径正确
import { NodeWrapper } from './node-wrapper';
import { ErrorIcon } from './styles';
import { NodeRenderContext } from '../../context';
import { BreakpointToggle } from '../BreakpointToggle/BreakpointToggle'; // 1. 引入断点开关组件

export const BaseNode = ({ node }: { node: FlowNodeEntity }) => {
  const nodeRender = useNodeRender();
  const form = nodeRender.form;

  // 2. 获取所有调试相关的状态
  const { nodeStates, isPaused, pausedOnNodeId } = useExecution();

  const currentNodeState = nodeStates[node.id];
  let currentNodeStatus = currentNodeState?.status || 'IDLE';

  // 3. 关键逻辑：如果当前工作流已暂停，并且暂停点就是当前节点，
  //    那么无论它之前的状态是什么，都将其状态覆盖为 'PAUSED'，以应用特殊高亮样式。
  if (isPaused && pausedOnNodeId === node.id) {
    currentNodeStatus = 'PAUSED';
  }

  const getPopupContainer = useCallback(() => node.renderData.node || document.body, [node.renderData.node]);

  return (
    <>
      <ConfigProvider getPopupContainer={getPopupContainer}>
        <NodeRenderContext.Provider value={nodeRender}>
          <NodeWrapper reportStatus={currentNodeStatus}>
            {/* 在节点上层添加断点开关 */}
            <BreakpointToggle nodeId={node.id} />
            {form?.state.invalid && <ErrorIcon />}
            {form?.render()}
          </NodeWrapper>
        </NodeRenderContext.Provider>
      </ConfigProvider>

      <NodeResultDisplay nodeState={currentNodeState} />
    </>
  );
};