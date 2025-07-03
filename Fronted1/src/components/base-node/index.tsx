// base-node/index.tsx (支持高级可视化和结果展示的最终版)

import React, { useCallback } from 'react'; // 导入 React 以使用 Fragment
import { FlowNodeEntity, useNodeRender } from '@flowgram.ai/free-layout-editor';
import { ConfigProvider } from '@douyinfe/semi-ui';

// 1. 导入我们统一的 useExecution Hook
import { useExecution } from '../../context/ExecutionProvider';

// 2. 导入我们新创建的结果展示组件
import { NodeResultDisplay } from '../NodeResultDisplay/NodeResultDisplay';

import { NodeWrapper } from './node-wrapper';
import { ErrorIcon } from './styles';
import { NodeRenderContext } from '../../context';

export const BaseNode = ({ node }: { node: FlowNodeEntity }) => {
  const nodeRender = useNodeRender();
  const form = nodeRender.form;

  // 3. 从 Context 中获取包含 status 和 payload 的完整状态对象
  const { nodeStates } = useExecution();

  // 4. 获取当前节点对应的完整状态对象
  const currentNodeState = nodeStates[node.id];

  // 5. 从中提取出 status，用于驱动样式变化。如果状态不存在，默认为 'IDLE'
  const currentNodeStatus = currentNodeState?.status || 'IDLE';

  const getPopupContainer = useCallback(() => node.renderData.node || document.body, [node.renderData.node]);

  return (
    // 使用 React.Fragment (<> ... </>) 来包裹两个并列的组件
    <>
      {/* 节点主体部分 */}
      <ConfigProvider getPopupContainer={getPopupContainer}>
        <NodeRenderContext.Provider value={nodeRender}>
          <NodeWrapper reportStatus={currentNodeStatus}>
            {form?.state.invalid && <ErrorIcon />}
            {form?.render()}
          </NodeWrapper>
        </NodeRenderContext.Provider>
      </ConfigProvider>

      {/* 6. 在节点主体的下方，渲染新的结果展示组件 */}
      {/* 并将当前节点的完整状态(包括payload)传递给它 */}
      <NodeResultDisplay nodeState={currentNodeState} />
    </>
  );
};