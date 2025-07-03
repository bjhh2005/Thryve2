// browser-client/index.ts

import { injectable } from '@flowgram.ai/free-layout-editor';
import {
  // 修正1: 导入正确的类型定义
  FlowGramAPIName,
  IReport,
  IRuntimeClient,
  TaskRunInput,
  TaskRunOutput,
  TaskReportInput,
  TaskReportOutput,
  TaskCancelInput,
  TaskCancelOutput,
  TaskResultInput,
  TaskResultOutput,
} from '@flowgram.ai/runtime-interface';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:4000';
const WORKFLOW_NAMESPACE = '/workflow';

@injectable()
export class WorkflowRuntimeClient implements IRuntimeClient {
  private socket: Socket;

  constructor() {
    this.socket = io(`${BACKEND_URL}${WORKFLOW_NAMESPACE}`);

    this.socket.on('connect', () => {
      console.log(`[Socket.IO] Connected to server: ${this.socket.id}`);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection Error:', err.message);
    });

    // 你可以在这里统一监听所有后端事件，用于调试或实时更新
    this.socket.onAny((eventName, ...args) => {
      console.log(`[Socket.IO] Received event '${eventName}':`, args);
    });
  }

  /**
   * 启动新任务
   */
  public [FlowGramAPIName.TaskRun] = (input: TaskRunInput): Promise<TaskRunOutput | undefined> => {
    return new Promise((resolve) => {
      // 你的后端 'start_process' 事件需要接收一个包含 nodes, edges, inputs 的对象
      // 我们从 input.schema (它是一个JSON字符串) 中解析出需要的数据
      const schemaData = JSON.parse(input.schema);
      const payload = {
        nodes: schemaData.nodes,
        edges: schemaData.edges,
        inputs: input.inputs,
      };

      console.log('[Socket.IO] Emitting "start_process" with payload:', payload);
      this.socket.emit('start_process', payload);

      // 按照接口定义，TaskRun 需要返回一个包含 taskID 的对象
      // 由于你的后端没有明确返回 taskID，我们这里模拟一个，以满足前端 service 的需要
      const mockTaskID = `task-${this.socket.id}-${Date.now()}`;
      resolve({ taskID: mockTaskID });
    });
  };

  /**
   * 获取任务报告（由 runtime-service 轮询调用）
   * 注意：此实现是为适配轮询，而去监听一个事件驱动的后端，是一个简化的桥接方案。
   */
  public [FlowGramAPIName.TaskReport] = (input: TaskReportInput): Promise<TaskReportOutput> => {
    return new Promise((resolve) => {
      // 我们不实际向后端发送请求，而是设置一个监听器来捕获下一次的 'over' 或其他报告性事件
      // 这是一个一次性监听器
      const handleReport = (reportData: any) => {
        // 这里的 reportData 结构需要与后端 emit 的数据结构对齐
        // IReport 包含了 workflowStatus, inputs, outputs, reports
        // 你的 'over' 事件包含了 message, data, status
        // 我们需要将它们适配成 IReport 结构

        // 这是一个简化的适配，实际应用中可能需要更精细的处理
        const finalReport: IReport = {
          id: input.taskID,
          inputs: reportData.result?.inputs || {}, // 假设 result 在 over 事件中
          outputs: reportData.result?.outputs || {},
          workflowStatus: {
            status: reportData.status,
            terminated: true,
            startTime: 0, // 理想中应由后端提供
            timeCost: 0,  // 理想中应由后端提供
          },
          reports: reportData.reports || {}, // 理想中应由后端提供
        };

        resolve(finalReport);
      };

      this.socket.once('over', handleReport);
      this.socket.once('report_update', handleReport); // 假设一个用于中途报告的事件
    });
  };

  /**
   * 取消任务
   */
  public [FlowGramAPIName.TaskCancel] = (input: TaskCancelInput): Promise<TaskCancelOutput | undefined> => {
    return new Promise((resolve) => {
      console.log(`[Socket.IO] Emitting "task_cancel" for task: ${input.taskID}`);
      // 后端目前没有实现 cancel ----------------------------------------------------
      this.socket.emit('task_cancel', { taskID: input.taskID });

      // 修正2: 返回符合接口的 `{ success: boolean }` 对象
      resolve({ success: true });
    });
  };

  /**
   * 获取任务结果
   */
  public [FlowGramAPIName.TaskResult] = async (
    input: TaskResultInput
  ): Promise<TaskResultOutput> => {
    console.warn('TaskResult API is not implemented yet.');
    return undefined;
  };
}