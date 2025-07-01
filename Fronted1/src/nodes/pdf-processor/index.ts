import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { PdfProcessorFormRender } from './pdf-processor-form.tsx';
import iconPdfProcessor from '../../assets/icon-pdf-processor.png';

let index = 0;

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
  formComponent: PdfProcessorFormRender,
  onAdd() {
    return {
      id: `pdf_processor_${nanoid(5)}`,
      type: WorkflowNodeType.PdfProcessor,
      data: {
        title: `PDF Processor_${++index}`,
        inputs: {
          type: 'object',
          required: ['inputFile', 'pageRange', 'extractImages', 'outputFolder', 'outputName'],
          properties: {
            inputFile: {
              type: 'string',
              title: 'Input PDF',
              description: 'Select PDF file to process'
            },
            pageRange: {
              type: 'string',
              title: 'Page Range',
              description: 'Pages to extract (e.g., 1-5)'
            },
            extractImages: {
              type: 'boolean',
              title: 'Extract Images',
              description: 'Whether to extract images'
            },
            outputFolder: {
              type: 'string',
              title: 'Output Folder',
              description: 'Save location'
            },
            outputName: {
              type: 'string',
              title: 'Output Name',
              description: 'File name'
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
            images: {
              type: 'array',
              description: 'Extracted images'
            }
          }
        }
      }
    };
  }
}; 