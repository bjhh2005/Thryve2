import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta';
import iconImgProcessor from '../../assets/icon-image-processor.png';

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
  formMeta,
  onAdd() {
    return {
      id: `img_processor_${nanoid(5)}`,
      type: WorkflowNodeType.ImgProcessor,
      data: {
        title: 'Image Processor',
        mode: 'resize', // 默认模式
        inputs: {
          type: 'object',
          required: ['inputFile'],
          properties: {
            inputFile: {
              type: 'string',
              title: 'Input Image',
              description: 'Select image to process'
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
            },
            format: {
              type: 'string',
              description: 'Format of processed image'
            },
            size: {
              type: 'number',
              description: 'Size of processed image in bytes'
            }
          }
        }
      }
    };
  }
}; 