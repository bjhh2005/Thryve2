import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { ImgProcessorFormRender } from './img-processor-form.tsx';
import iconImgProcessor from '../../assets/icon-image-processor.png';

let index = 0;

export const ImgProcessorRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.ImgProcessor,
  info: {
    icon: iconImgProcessor,
    description: 'Process and manipulate images with various operations.',
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
  formComponent: ImgProcessorFormRender,
  onAdd() {
    return {
      id: `img_processor_${nanoid(5)}`,
      type: WorkflowNodeType.ImgProcessor,
      data: {
        title: `Image Processor_${++index}`,
        inputs: {
          type: 'object',
          required: ['inputFile', 'width', 'height', 'maintainAspectRatio', 'outputFolder', 'outputName'],
          properties: {
            inputFile: {
              type: 'string',
              title: 'Input Image',
              description: 'Select image to process'
            },
            width: {
              type: 'number',
              title: 'Width',
              description: 'Width in pixels',
              minimum: 1
            },
            height: {
              type: 'number',
              title: 'Height',
              description: 'Height in pixels',
              minimum: 1
            },
            maintainAspectRatio: {
              type: 'boolean',
              title: 'Maintain Aspect Ratio',
              description: 'Keep original aspect ratio'
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
            processedImage: {
              type: 'string',
              description: 'Path to the processed image'
            },
            width: {
              type: 'number',
              description: 'Width of processed image'
            },
            height: {
              type: 'number',
              description: 'Height of processed image'
            }
          }
        }
      }
    };
  }
}; 