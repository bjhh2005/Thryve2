// 管理工作流任务的执行状态，包括启动、取消任务，定时同步任务执行报告，维护运行节点状态。
import {
  IReport,
  NodeReport,
  WorkflowInputs,
  WorkflowOutputs,
  WorkflowStatus,
} from '@flowgram.ai/runtime-interface';
import {
  injectable,
  inject,
  WorkflowDocument,
  Playground,
  WorkflowLineEntity,
  WorkflowNodeEntity,
  WorkflowNodeLinesData,
  Emitter,
  getNodeForm,
} from '@flowgram.ai/free-layout-editor';

import { WorkflowRuntimeClient } from '../browser-client';

const SYNC_TASK_REPORT_INTERVAL = 500;

interface NodeRunningStatus {
  nodeID: string;
  status: WorkflowStatus;
  nodeResultLength: number;
}

@injectable()
export class WorkflowRuntimeService {
  @inject(Playground) playground: Playground;

  @inject(WorkflowDocument) document: WorkflowDocument;

  @inject(WorkflowRuntimeClient) runtimeClient: WorkflowRuntimeClient;

  private runningNodes: WorkflowNodeEntity[] = [];

  private taskID?: string;

  private syncTaskReportIntervalID?: ReturnType<typeof setInterval>;

  private reportEmitter = new Emitter<NodeReport>();

  private resetEmitter = new Emitter<{}>();

  public terminatedEmitter = new Emitter<{
    result?: {
      inputs: WorkflowInputs;
      outputs: WorkflowOutputs;
    };
  }>();

  private nodeRunningStatus: Map<string, NodeRunningStatus>;

  public onNodeReportChange = this.reportEmitter.event;

  public onReset = this.resetEmitter.event;

  public onTerminated = this.terminatedEmitter.event;

  // 判断连线是否在运行中
  public isFlowingLine(line: WorkflowLineEntity) {
    return this.runningNodes.some((node) =>
      node.getData(WorkflowNodeLinesData).inputLines.includes(line)
    );
  }

  // 启动新任务，接收流程图数据和输入参数，返回任务 ID
  public async taskRun(inputsString: string): Promise<void> {
    // 如果存在任务，则取消任务
    if (this.taskID) {
      await this.taskCancel();
    }
    // 验证流程图数据是否有效
    if (!this.validate()) {
      return;
    }
    // 重置运行状态
    this.reset();
    // 启动新任务
    const output = await this.runtimeClient.TaskRun({
      schema: JSON.stringify(this.document.toJSON()),
      inputs: JSON.parse(inputsString) as WorkflowInputs,
    });
    // 如果任务启动失败，则终止任务
    if (!output) {
      this.terminatedEmitter.fire({});
      return;
    }
    // 设置任务 ID
    this.taskID = output.taskID;
    // 设置任务报告同步间隔
    this.syncTaskReportIntervalID = setInterval(() => {
      this.syncTaskReport();
    }, SYNC_TASK_REPORT_INTERVAL);
  }

  // 取消任务，接收任务 ID，返回任务状态
  public async taskCancel(): Promise<void> {
    if (!this.taskID) {
      return;
    }
    await this.runtimeClient.TaskCancel({
      taskID: this.taskID,
    });
  }

  // 验证流程图数据是否有效
  private async validate(): Promise<boolean> {
    // 获取所有节点的表单
    const allForms = this.document.getAllNodes().map((node) => getNodeForm(node));
    // 验证所有表单
    const formValidations = await Promise.all(allForms.map(async (form) => form?.validate()));
    // 过滤出验证结果
    const validations = formValidations.filter((validation) => validation !== undefined);
    // 如果所有表单都有效，则返回 true
    const isValid = validations.every((validation) => validation);
    return isValid;
  }

  // 重置运行状态
  private reset(): void {
    this.taskID = undefined;
    this.nodeRunningStatus = new Map();
    this.runningNodes = [];
    if (this.syncTaskReportIntervalID) {
      clearInterval(this.syncTaskReportIntervalID);
    }
    this.resetEmitter.fire({});
  }

  // 同步任务报告
  private async syncTaskReport(): Promise<void> {
    if (!this.taskID) {
      return;
    }
    // 同步任务报告
    const output = await this.runtimeClient.TaskReport({
      taskID: this.taskID,
    });
    // 如果同步任务报告失败，则清除任务报告同步间隔
    if (!output) {
      clearInterval(this.syncTaskReportIntervalID);
      console.error('Sync task report failed');
      return;
    }
    // 获取任务报告
    const { workflowStatus, inputs, outputs } = output;
    // 如果任务报告终止，则清除任务报告同步间隔
    if (workflowStatus.terminated) {
      clearInterval(this.syncTaskReportIntervalID);
      // 如果任务报告有输出，则触发终止事件
      if (Object.keys(outputs).length > 0) {
        this.terminatedEmitter.fire({ result: { inputs, outputs } });
      } else {
        // 如果任务报告没有输出，则触发终止事件
        this.terminatedEmitter.fire({});
      }
    }
    this.updateReport(output);
  }

  // 更新任务报告
  private updateReport(report: IReport): void {
    const { reports } = report;
    this.runningNodes = [];
    this.document.getAllNodes().forEach((node) => {
      const nodeID = node.id;
      const nodeReport = reports[nodeID];
      if (!nodeReport) {
        return;
      }
      // 如果节点报告状态为处理中，则将节点添加到运行节点列表
      if (nodeReport.status === WorkflowStatus.Processing) {
        this.runningNodes.push(node);
      }
      // 获取节点运行状态
      const runningStatus = this.nodeRunningStatus.get(nodeID);
      // 如果节点运行状态不匹配，则更新节点运行状态
      if (
        !runningStatus ||
        nodeReport.status !== runningStatus.status ||
        nodeReport.snapshots.length !== runningStatus.nodeResultLength
      ) {
        this.nodeRunningStatus.set(nodeID, {
          nodeID,
          status: nodeReport.status,
          nodeResultLength: nodeReport.snapshots.length,
        });
        this.reportEmitter.fire(nodeReport);
        this.document.linesManager.forceUpdate();
      } else if (nodeReport.status === WorkflowStatus.Processing) {
        this.reportEmitter.fire(nodeReport);
      }
    });
  }
}
