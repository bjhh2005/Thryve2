import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta';
import iconOutputSyncVariable from '../../assets/icon-output-sync-variable.png';

let index = 0;

export const ExportVariableRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.ExportVariable,
  info: {
    icon: iconOutputSyncVariable,
    description: 'Export synchronized variables to various file formats.',
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
      id: `export_variable_${nanoid(5)}`,
      type: WorkflowNodeType.ExportVariable,
      data: {
        title: `Export Variable_${++index}`,
        inputs: {
          type: 'object',
          required: ['variables'],
          properties: {
            variables: {
              type: 'array',
              title: 'Variables',
              description: 'Select variables to export'
            },
            format: {
              type: 'string',
              title: 'Export Format',
              enum: ['json', 'yaml', 'env'],
              default: 'json'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            exportedFile: {
              type: 'string',
              description: 'Path to exported file'
            }
          }
        }
      }
    };
  }
}; 