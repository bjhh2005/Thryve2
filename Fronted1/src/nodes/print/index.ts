import { nanoid } from 'nanoid';
import i18next from 'i18next';

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
    description: 'Display text in browser',
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
    const t = i18next.t.bind(i18next);

    return {
      id: `print_${nanoid(5)}`,
      type: 'print',
      data: {
        title: `${t('nodes.print.title')}_${++index}`,
        inputs: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              title: t('nodes.print.fields.input.title'),
              description: t('nodes.print.fields.input.description')
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            result: {
              type: 'string',
              title: t('nodes.print.fields.output.title'),
              description: t('nodes.print.fields.output.description')
            }
          }
        }
      }
    };
  },
  // 添加更新节点的方法
  onUpdate(node: any) {
    if (node.data) {
      node.data = updateNodeData(node.data);
    }
    return node;
  },
  formMeta,
  async execute({ data }: { data: PrintNodeInputs }): Promise<PrintNodeOutputs> {
    console.log('Print node executing with content:', data.content);
    
    try {
      const displayText = data.input?.content || data.content;
      
      if (typeof displayText === 'undefined') {
        console.error('Print node: no text to display');
        return { result: 'Error: No content to display' };
      }

      const text = String(displayText);
      console.log('Print node displaying:', text);
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(text);
      }
      
      return { result: text };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to display';
      console.error('Print node execution failed:', error);
      return { result: `Error: ${errorMessage}` };
    }
  }
}; 