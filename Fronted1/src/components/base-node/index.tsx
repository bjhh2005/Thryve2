// base-node/index.tsx (对接新 Provider)

import { useCallback } from 'react';
import { FlowNodeEntity, useNodeRender } from '@flowgram.ai/free-layout-editor';
import { ConfigProvider } from '@douyinfe/semi-ui';
// import { useWorkflowState } from '../../context/WorkflowStateProvider'; 
import { useExecution } from '../../context/ExecutionProvider';
import { NodeWrapper } from './node-wrapper';
import { ErrorIcon } from './styles';
// NodeStatusBar 和 NodeRenderContext 依然可以保留，用于显示节点的静态配置信息
import { NodeStatusBar } from '../testrun/node-status-bar';
import { NodeRenderContext } from '../../context';


export const BaseNode = ({ node }: { node: FlowNodeEntity }) => {
  const nodeRender = useNodeRender();
  const form = nodeRender.form;

  // 2. 从新的 Context 中获取所有节点的状态
  const { nodeStatuses } = useExecution();
  // 3. 找到当前节点对应的状态，如果没有则为 'IDLE'
  const currentNodeStatus = nodeStatuses[node.id] || 'IDLE';

  const getPopupContainer = useCallback(() => node.renderData.node || document.body, [node.renderData.node]);

  return (
    <ConfigProvider getPopupContainer={getPopupContainer}>
      <NodeRenderContext.Provider value={nodeRender}>
        {/* 4. 将状态传递给 NodeWrapper 用于改变样式 */}
        <NodeWrapper reportStatus={currentNodeStatus}>
          {form?.state.invalid && <ErrorIcon />}
          {form?.render()}
        </NodeWrapper>
        {/* 这里的 NodeStatusBar 是旧插件体系的，它将不再显示运行时信息。
          你可以保留它用于显示其他内容，或者之后创建一个新的组件来显示我们新系统的输入输出。
          暂时可以先注释掉或移除。
        */}
        {/* <NodeStatusBar /> */}
      </NodeRenderContext.Provider>
    </ConfigProvider>
  );
};