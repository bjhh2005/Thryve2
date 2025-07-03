// base-node/index.tsx

import { useCallback, useEffect, useState } from 'react'; // 引入 hooks
import { FlowNodeEntity, useNodeRender, useService, useCurrentEntity } from '@flowgram.ai/free-layout-editor'; // 引入 hooks
import { ConfigProvider, Toast } from '@douyinfe/semi-ui'; // 引入 Toast
import { NodeReport } from '@flowgram.ai/runtime-interface'; // 引入类型
import { WorkflowRuntimeService } from '../../plugins/runtime-plugin/runtime-service';

import { NodeStatusBar } from '../testrun/node-status-bar';
import { NodeRenderContext } from '../../context';
import { ErrorIcon } from './styles';
import { NodeWrapper } from './node-wrapper';


// --- 新增 useNodeReport hook ---
// 这个 hook 从 'testrun/node-status-bar/index.tsx' 移动到这里
const useNodeReport = () => {
  const node = useCurrentEntity();
  const [report, setReport] = useState<NodeReport>();
  const runtimeService = useService(WorkflowRuntimeService);

  useEffect(() => {
    // 监听单个节点的状态报告变化
    const reportDisposer = runtimeService.onNodeReportChange((nodeReport) => {
      if (nodeReport.id !== node.id) {
        return;
      }
      setReport(nodeReport);
    });

    // 监听重置事件，清除所有状态
    const resetDisposer = runtimeService.onReset(() => {
      setReport(undefined);
    });

    return () => {
      reportDisposer.dispose();
      resetDisposer.dispose();
    };
  }, [node.id, runtimeService]); // 依赖项中加入 node.id 和 runtimeService

  return report;
};
// --- 结束新增 ---


export const BaseNode = ({ node }: { node: FlowNodeEntity }) => {
  const nodeRender = useNodeRender();
  const form = nodeRender.form;

  // --- 新增 ---
  // 在 BaseNode 中调用 hook，获取当前节点的运行报告
  const report = useNodeReport();
  // --- 结束新增 ---

  const getPopupContainer = useCallback(() => node.renderData.node || document.body, [node.renderData.node]);

  return (
    <ConfigProvider getPopupContainer={getPopupContainer}>
      <NodeRenderContext.Provider value={nodeRender}>
        {/* --- 修改 NodeWrapper --- */}
        {/* 将获取到的 report 传递给 NodeWrapper */}
        <NodeWrapper report={report}>
          {form?.state.invalid && <ErrorIcon />}
          {form?.render()}
        </NodeWrapper>
        {/* --- 结束修改 --- */}

        {/* --- 修改 NodeStatusBar --- */}
        {/* 将获取到的 report 传递给 NodeStatusBar */}
        <NodeStatusBar report={report} />
        {/* --- 结束修改 --- */}
      </NodeRenderContext.Provider>
    </ConfigProvider>
  );
};