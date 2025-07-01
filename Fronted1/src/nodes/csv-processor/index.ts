import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { CsvProcessorFormRender } from './csv-processor-form.tsx';
import iconCsvProcessor from '../../assets/icon-csv-processor.png';

let index = 0;

export const CsvProcessorRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.CsvProcessor,
  info: {
    icon: iconCsvProcessor,
    description: 'Process and analyze CSV files with various operations.',
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
  formComponent: CsvProcessorFormRender,
  onAdd() {
    return {
      id: `csv_processor_${nanoid(5)}`,
      type: WorkflowNodeType.CsvProcessor,
      data: {
        title: `CSV Processor_${++index}`,
        inputs: {
          type: 'object',
          required: ['inputFile', 'column', 'condition', 'value', 'outputFolder', 'outputName'],
          properties: {
            inputFile: {
              type: 'string',
              title: 'Input CSV File',
              description: 'Select the CSV file to process'
            },
            column: {
              type: 'string',
              title: 'Column',
              description: 'Target column name'
            },
            condition: {
              type: 'string',
              title: 'Condition',
              description: 'Filter condition',
              enum: ['equals', 'contains', 'greater_than', 'less_than'],
              default: 'equals'
            },
            value: {
              type: 'string',
              title: 'Value',
              description: 'Filter value'
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
            data: {
              type: 'array',
              description: 'Filtered CSV data'
            },
            rowCount: {
              type: 'number',
              description: 'Number of rows after filtering'
            }
          }
        }
      }
    };
  }
}; 