import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import iconEnd from '../../assets/icon-end.jpg';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';

let index = 0;

export const FuncEndRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.FuncEnd,
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
      id: `Func_end_${nanoid(5)}`,
      type: 'func-end',
      data: {
        title: `Function End_${++index}`,
        inputs: {
          type: 'object',
          properties: {
            result: {
              type: 'string',
              description: 'The result of the function'
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
