import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import iconStart from '../../assets/icon-start.jpg';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';

let index = 0;

export const StartNodeRegistry: FlowNodeRegistry = {
  // 定义结点类型
  type: WorkflowNodeType.Start,
  // 定义结点属性
  meta: {
    isStart: true,
    deleteDisable: false,
    copyDisable: false,
    defaultPorts: [{ type: 'output' }],
    size: {
      width: 360,
      height: 211,
    },
  },
  // 定义结点UI展示
  info: {
    icon: iconStart,
    description:
      '工作流的起始节点，标志着流程的开始。',
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
      id: `start_${nanoid(5)}`,
      type: 'start',
      data: {
        title: `Start_${++index}`,
        outputs: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              default: 'Hello Flow.',
            },
            enable: {
              type: 'boolean',
              default: true,
            }
          },
        },
      },
    };
  },
  canAdd() {
    return true;
  },
};
