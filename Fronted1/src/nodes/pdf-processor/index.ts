import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta.ts';
import iconPdfProcessor from '../../assets/icon-pdf-processor.png';

export const PdfProcessorRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.PdfProcessor,
  info: {
    icon: iconPdfProcessor,
    description: 'Process and manipulate PDF files with various operations.',
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
      id: `pdf_processor_${nanoid(5)}`,
      type: WorkflowNodeType.PdfProcessor,
      data: {
        title: 'PDF Processor',
        mode: 'extract', // 默认模式
        inputs: {
          type: 'object',
          required: ['inputFile'],
          properties: {
            inputFile: {
              type: 'string',
              title: 'Input PDF',
              description: 'Select PDF file to process'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Extracted text content'
            },
            pageCount: {
              type: 'number',
              description: 'Total number of pages'
            },
            success: {
              type: 'boolean',
              description: 'Operation success status'
            }
          }
        }
      }
    };
  }
}; 