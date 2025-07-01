import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';
import iconFileUpload from '../../assets/icon-txt-processor.png';

let index = 0;

export const TextProcessorNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.TextProcessor,
  info: {
    icon: iconFileUpload,
    description: 'Process text files with various operations like append, write, replace, and analyze.',
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
  formMeta,
  onAdd() {
    return {
      id: `text_processor_${nanoid(5)}`,
      type: WorkflowNodeType.TextProcessor,
      data: {
        title: `Text Processor_${++index}`,
        mode: 'append', // Default mode
        inputs: {
          type: 'object',
          required: ['inputFile'],
          properties: {
            inputFile: {
              type: 'string',
              title: 'Input File',
              description: 'Select the text file to process'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            // 默认为空，因为append模式没有输出
          }
        }
      }
    };
  }
}; 