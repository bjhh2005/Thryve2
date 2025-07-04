import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import iconScheduler from '../../assets/icon-scheduler.svg';
import { formMeta } from './scheduler-form-meta';
import { WorkflowNodeType } from '../constants';

let index = 0;

export const SchedulerNodeRegistry: FlowNodeRegistry = {
  // 定义结点类型
  type: WorkflowNodeType.Scheduler,
  // 定义结点属性
  meta: {
    isStart: true,
    deleteDisable: false,
    copyDisable: false,
    defaultPorts: [{ type: 'input' },{ type: 'output' }],
    size: {
      width: 360,
      height: 211,
    },
  },
  // 定义结点UI展示
  info: {
    icon: iconScheduler,
    description:
      'The scheduler node is the starting point of the workflow.',
  },
  /**
   * Render node via formMeta
   */
  // 定义结点表单行为
  formMeta,
  /**
   * Start Node cannot be added
   */
  onAdd() {
    return {
      id: `scheduler_${nanoid(5)}`,
      type: 'scheduler',
      data: {
        title: `Scheduler_${++index}`,
        inputs: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              default: 'Hello Flow.',
            },
          },
        },
      },
    };
  },
  canAdd() {
    return true;
  },
};
