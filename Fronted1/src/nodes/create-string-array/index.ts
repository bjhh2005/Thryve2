import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import iconStart from '../../assets/icon-create-string-array.svg';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';

let index = 0;
let string_index = 0;

export const CreateStringArrayNodeRegistry: FlowNodeRegistry = {
  // 定义结点类型
  type: WorkflowNodeType.CreateStringArray,
  // 定义结点属性
  meta: {
    isStart: false,
    deleteDisable: false,
    copyDisable: false,
    defaultPorts: [
      { type: 'input' },
      { type: 'output' }
    ],
    size: {
      width: 360,
      height: 211,
    },
  },
  // 定义结点UI展示
  info: {
    icon: iconStart,
    description:
      'Converts multiple input strings into an array.',
  },
  /**
   * Render node via formMeta
   */
  // 定义结点表单行为
  formMeta,
  /**
   * Start Node cannot be added
   */
  onAdd() {
    return {
      id: `create-string-array_${nanoid(5)}`,
      type: 'create-string-array',
      data: {
        title: `CreateStringArray_${++index}`,
        inputs: {
          type: 'object',
          properties: {
            [`String_${string_index++}`]: {
              type: 'string',
              default: ''
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            outputArray: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        }
      },
    };
  }
};
