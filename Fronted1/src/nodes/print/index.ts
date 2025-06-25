import { nanoid } from 'nanoid';

import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta.tsx';
import iconPrint from '../../assets/icon-print.png';
import { IFlowValue } from '@flowgram.ai/form-materials';

let index = 0;

interface PrintNodeInputs {
  content: string;
  input?: IFlowValue;
}

interface PrintNodeOutputs {
  result: string;
}

export const PrintNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Print,
  info: {
    icon: iconPrint,
    description: 'Display text in browser.',
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
      id: `print_${nanoid(5)}`,
      type: 'print',
      data: {
        title: `Print_${++index}`,
        content: 'Hello from Print Node!',
        inputs: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              title: 'Input Text',
              description: 'Text from previous node'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            result: {
              type: 'string',
              title: 'Printed Text',
              description: 'The text that was printed',
            }
          }
        }
      }
    };
  },
  formMeta,
  async execute({ data }: { data: PrintNodeInputs }): Promise<PrintNodeOutputs> {
    console.log('Print node executing with content:', data.content);
    
    try {
      // 优先使用流入的数据，如果没有则使用content字段
      const displayText = data.input?.content || data.content;
      
      // 确保内容存在
      if (typeof displayText === 'undefined') {
        console.error('Print node: no text to display');
        return { result: 'Error: No content to display' };
      }

      // 显示内容
      const text = String(displayText);
      console.log('Print node displaying:', text);
      
      // 直接使用 alert 显示文本
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(text);
      }
      
      console.log('Print node executed successfully');
      return { result: text };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to display';
      console.error('Print node execution failed:', error);
      return { result: `Error: ${errorMessage}` };
    }
  }
}; 