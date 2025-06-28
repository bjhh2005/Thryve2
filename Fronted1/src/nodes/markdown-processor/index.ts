import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta.ts';
import iconMarkdownProcessor from '../../assets/icon-markdown-processor.png';

export const MarkdownProcessorRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.MarkdownProcessor,
  info: {
    icon: iconMarkdownProcessor,
    description: 'Process and convert Markdown files with various operations.',
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
        title: 'Markdown Processor',
        mode: 'preview', // 默认模式
        inputs: {
          type: 'object',
          required: ['inputContent'],
          properties: {
            inputContent: {
              type: 'string',
              title: 'Markdown Content',
              description: 'Enter Markdown content or select a .md file'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            html: {
              type: 'string',
              description: 'Converted HTML content'
            },
            toc: {
              type: 'array',
              description: 'Table of contents'
            },
            metadata: {
              type: 'object',
              description: 'Extracted front matter'
            }
          }
        }
      }
    };
  }
}; 