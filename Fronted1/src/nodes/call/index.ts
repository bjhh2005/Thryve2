import { nanoid } from 'nanoid';

import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta';
import iconCall from '../../assets/icon-call.svg';
import { IFlowValue } from '@flowgram.ai/form-materials';

let index = 0;

interface CallNodeInputs {
  target_workflow: IFlowValue;
  input_data?: IFlowValue;
}

interface CallNodeOutputs {
  output: any;
}

export const CallNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Call,
  info: {
    icon: iconCall,
    description: 'Call a subworkflow and wait for its completion.',
  },
  meta: {
    defaultPorts: [
      { type: 'input' },
      { type: 'output' }
    ],
    size: {
      width: 360,
      height: 220,
    },
  },
  onAdd() {
    return {
      id: `call_${nanoid(5)}`,
      type: 'call',
      data: {
        title: `Call_${++index}`,
        inputs: {
          type: 'object',
          required: ['target_workflow'],
          properties: {
            target_workflow: {
              type: 'string',
              title: 'Target Workflow',
              description: 'The title of the start node of the subworkflow to call'
            },
            input_data: {
              type: 'string',
              title: 'Input Data',
              description: 'Data to pass to the subworkflow (optional)'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            output: {
              type: 'string',
              title: 'Output',
              description: 'Result returned from the subworkflow',
            }
          }
        }
      }
    };
  },
  formMeta,
  async execute({ data }: { data: CallNodeInputs }): Promise<CallNodeOutputs> {
    console.log('Call node executing:', data);
    
    try {
      const targetWorkflow = data.target_workflow?.content;
      
      if (!targetWorkflow) {
        throw new Error('Target workflow is required');
      }
      
      // 在前端环境中，我们只是模拟调用
      // 实际的子工作流调用会在后端处理
      console.log(`Calling workflow with start node title: ${targetWorkflow}`);
      
      const inputData = data.input_data?.content || null;
      console.log(`With input data:`, inputData);
      
      // 模拟返回数据
      const result = `Result from workflow: ${targetWorkflow}`;
      
      return { output: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Call execution failed';
      console.error('Call node execution failed:', error);
      return { output: `Error: ${errorMessage}` };
    }
  }
}; 