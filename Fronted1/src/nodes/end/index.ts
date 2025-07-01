import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import iconEnd from '../../assets/icon-end.jpg';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';

let index = 0;

export const EndNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.End,
  meta: {
    deleteDisable: false,
    copyDisable: false,
    defaultPorts: [{ type: 'input' }],
    size: {
      width: 360,
      height: 211,
    },
  },
  info: {
    icon: iconEnd,
    description:
      'The final node of the workflow, used to return the result information after the workflow is run.',
  },
  /**
   * Render node via formMeta
   */
  formMeta,
  onAdd() {
    return {
      id: `end_${nanoid(5)}`,
      type: 'end',
      data: {
        title: `End_${++index}`,
        inputs: {
          type: 'object',
          properties: {
            result: {
              type: 'string',
              description: '工作流的最终结果'
            }
          }
        }
      }
    };
  },
  /**
   * End Node can be added
   */
  canAdd() {
    return true;
  },
};
