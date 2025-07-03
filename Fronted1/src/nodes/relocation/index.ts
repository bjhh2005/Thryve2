import { nanoid } from 'nanoid';

import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta.tsx';
import iconRelocation from '../../assets/icon-relocation.png';

let index = 0;

interface RelocationNodeInputs {
  sourceVariable: string;
  targetVariable: string;
}

interface RelocationNodeOutputs {
  result: string;
}

export const RelocationNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Relocation,
  info: {
    icon: iconRelocation,
    description: 'Relocate variables.',
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
      id: `relocation_${nanoid(5)}`,
      type: 'relocation',
      data: {
        title: `Relocation_${++index}`,
        inputs: {
          type: 'object',
          properties: {
            sourceVariable: {
              type: 'string',
              title: 'Source Variable',
              description: 'Source variable to relocate'
            },
            targetVariable: {
              type: 'string',
              title: 'Target Variable',
              description: 'Target variable to relocate to'
            }
          }
        }
      }
    };
  },
  formMeta,
  async execute({ data }: { data: RelocationNodeInputs }): Promise<RelocationNodeOutputs> {
    console.log('Relocation node executing with content:', data.sourceVariable, data.targetVariable);
    
    try {
      // 优先使用流入的数据，如果没有则使用content字段
      const displayText = data.sourceVariable || data.targetVariable;
      
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