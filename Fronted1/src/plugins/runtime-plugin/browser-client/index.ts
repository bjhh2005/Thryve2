// 实现了工作流相关任务的核心 API 接口，封装调用底层运行时接口（TaskRun、TaskReport、TaskResult、TaskCancel）

/* eslint-disable no-console */
import { TaskCancelAPI, TaskReportAPI, TaskResultAPI, TaskRunAPI } from '@flowgram.ai/runtime-js';
import { FlowGramAPIName, IRuntimeClient } from '@flowgram.ai/runtime-interface';
import { injectable } from '@flowgram.ai/free-layout-editor';

@injectable()
export class WorkflowRuntimeClient implements IRuntimeClient {
  constructor() { }

  // 启动新任务，接收流程图数据和输入参数，返回任务 ID
  public [FlowGramAPIName.TaskRun]: IRuntimeClient[FlowGramAPIName.TaskRun] = TaskRunAPI;

  // 报告任务进度，接收任务 ID 和进度信息，返回任务状态
  public [FlowGramAPIName.TaskReport]: IRuntimeClient[FlowGramAPIName.TaskReport] = TaskReportAPI;

  // 获取任务结果，接收任务 ID，返回任务结果
  public [FlowGramAPIName.TaskResult]: IRuntimeClient[FlowGramAPIName.TaskResult] = TaskResultAPI;

  // 取消任务，接收任务 ID，返回任务状态
  public [FlowGramAPIName.TaskCancel]: IRuntimeClient[FlowGramAPIName.TaskCancel] = TaskCancelAPI;
}
