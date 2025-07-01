import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { RelocationFormRender } from './relocation-form.tsx';
import RelocationIcon from '../../assets/icon-relocation.png';
import { nanoid } from 'nanoid';

let index = 0;

export const RelocationNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Relocation,
  info: {
    icon: RelocationIcon,
    description: 'relocation node',
  },
  meta: {
    defaultPorts: [
      { type: 'input' },
      { type: 'output' }
    ],
    useDynamicPort: false,
    expandable: true,
    size: {
      width: 360,
      height: 400,
    },
  },
  onAdd() {
    return {
      id: `relocation_${nanoid(5)}`,
      type: WorkflowNodeType.Relocation,
      data: {
        title: `Relocation_${++index}`,
        inputs: {
          type: 'object',
          required: ['inputFile'],
          properties: {
            sourceVariable: {
              type: 'string',
              title: 'Assigning variable',
              description: 'Select the assigning variable'
            },
            targetVariable: {
              type: 'string',
              title: 'Assigned variable',
              description: 'Select the assigned variable'
            }
          }
        }
      }
    };
  }
}; 