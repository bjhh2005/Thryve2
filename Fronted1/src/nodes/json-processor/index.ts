import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta.ts';
import iconJsonProcessor from '../../assets/icon-json-processor.png';

export const JsonProcessorRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.JsonProcessor,
  info: {
    icon: iconJsonProcessor,
    description: 'Process and manipulate JSON data with various operations.',
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
      height: 300,
    },
  },
  formMeta,
  onAdd() {
    return {
      id: `json_processor_${nanoid(5)}`,
      type: WorkflowNodeType.JsonProcessor,
      data: {
        title: 'JSON Processor',
        mode: 'parse', // 默认模式
        inputs: {
          type: 'object',
          required: ['inputData'],
          properties: {
            inputData: {
              type: 'string',
              title: 'Input JSON',
              description: 'Enter JSON string or select JSON file'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            result: {
              type: 'object',
              description: 'Processed JSON data'
            },
            isValid: {
              type: 'boolean',
              description: 'JSON validation result'
            }
          }
        }
      }
    };
  }
}; 