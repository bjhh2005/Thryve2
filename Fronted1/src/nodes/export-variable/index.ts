import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta';
import iconOutputSyncVariable from '../../assets/icon-output-sync-variable.png';

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
        title: 'Export Variable',
        inputs: {
          type: 'object',
          required: ['selectedVariable', 'exportPath', 'exportFormat'],
          properties: {
            selectedVariable: {
              type: 'string',
              title: 'Variable to Export',
              description: 'Select the variable you want to export'
            },
            exportPath: {
              type: 'string',
              title: 'Export Path',
              description: 'Specify where to save the exported file'
            },
            exportFormat: {
              type: 'string',
              title: 'Export Format',
              description: 'Select the format for the exported file',
              enum: ['json', 'yaml', 'csv', 'txt', 'xml'],
              default: 'json'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            exportedFile: {
              type: 'string',
              description: 'Path to the exported file'
            },
            success: {
              type: 'boolean',
              description: 'Whether the export was successful'
            },
            error: {
              type: 'string',
              description: 'Error message if export failed'
            }
          }
        }
      }
    };
  }
}; 