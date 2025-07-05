import { nanoid } from 'nanoid';

import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta.tsx';
import iconSleep from '../../assets/icon-sleep.svg';
import { IFlowValue } from '@flowgram.ai/form-materials';

let index = 0;


export const SleepNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Sleep,
  info: {
    icon: iconSleep,
    description: 'Sleep for a specified time.',
  },
  meta: {
    defaultPorts: [
      { type: 'input' },
      { type: 'output' }
    ],
    size: {
      width: 360,
      height: 200,
    },
  },
  onAdd() {
    return {
      id: `sleep_${nanoid(5)}`,
      type: 'sleep',
      data: {
        title: `Sleep_${++index}`,
        inputs: {
          type: 'object',
          properties: {
            sleepTime: {
              type: 'number',
              title: 'Sleep Time',
              description: 'Sleep time in seconds',
              default: 10
            }
          }
        }
      }
    };
  },
  formMeta
}; 