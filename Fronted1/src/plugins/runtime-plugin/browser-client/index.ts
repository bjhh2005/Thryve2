// 实现了工作流相关任务的核心 API 接口，封装调用底层运行时接口（TaskRun、TaskReport、TaskResult、TaskCancel）

/* eslint-disable no-console */
import { TaskCancelAPI, TaskReportAPI, TaskResultAPI, TaskRunAPI } from '@flowgram.ai/runtime-js';
import { FlowGramAPIName, IRuntimeClient } from '@flowgram.ai/runtime-interface';
import { injectable } from '@flowgram.ai/free-layout-editor';

@injectable()
export class WorkflowRuntimeClient implements IRuntimeClient {
  constructor() { }

  public [FlowGramAPIName.TaskRun]: IRuntimeClient[FlowGramAPIName.TaskRun] = TaskRunAPI;

  public [FlowGramAPIName.TaskReport]: IRuntimeClient[FlowGramAPIName.TaskReport] = TaskReportAPI;

  public [FlowGramAPIName.TaskResult]: IRuntimeClient[FlowGramAPIName.TaskResult] = TaskResultAPI;

  public [FlowGramAPIName.TaskCancel]: IRuntimeClient[FlowGramAPIName.TaskCancel] = TaskCancelAPI;
}
