import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { WorkflowNodeType } from '../constants';
import { formMeta } from './form-meta';
import iconCsvProcessor from '../../assets/icon-csv-processor.png';

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
      height: 300,
    },
  },
  formMeta,
  onAdd() {
    return {
      id: `csv_processor_${nanoid(5)}`,
      type: WorkflowNodeType.CsvProcessor,
      data: {
        title: 'CSV Processor',
        mode: 'read', // 默认模式
        inputs: {
          type: 'object',
          required: ['inputFile'],
          properties: {
            inputFile: {
              type: 'string',
              title: 'Input CSV File',
              description: 'Select the CSV file to process'
            }
          }
        },
        outputs: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: 'Processed CSV data'
            },
            rowCount: {
              type: 'number',
              description: 'Number of rows in the CSV'
            },
            columnNames: {
              type: 'array',
              description: 'List of column names'
            }
          }
        }
      }
    };
  }
}; 