import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta';
import iconMarkdownProcessor from '../../assets/icon-markdown-processor.png';

let index = 0;

export const MarkdownProcessorRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.MarkdownProcessor,
  info: {
    icon: iconMarkdownProcessor,
    description: 'Process and manipulate Markdown files with various operations.',
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
      id: `markdown_processor_${nanoid(5)}`,
      type: WorkflowNodeType.MarkdownProcessor,
      data: {
        title: `Markdown Processor_${++index}`,
        mode: 'parse', // 默认模式
        inputs: {
          type: 'object',
          required: ['inputFile'],
          properties: {
            inputFile: {
              type: 'string',
              title: 'Input Markdown',
              description: 'Select Markdown file to process'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            html: {
              type: 'string',
              description: 'Parsed HTML content'
            },
            ast: {
              type: 'object',
              description: 'Abstract Syntax Tree'
            }
          }
        }
      }
    };
  }
}; 