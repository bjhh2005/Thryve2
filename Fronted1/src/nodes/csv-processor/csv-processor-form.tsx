import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'read' | 'write' | 'filter' | 'sort' | 'aggregate';

// Define processing modes
const PROCESS_MODES = [
  { label: 'Read CSV', value: 'read' },
  { label: 'Write CSV', value: 'write' },
  { label: 'Filter Data', value: 'filter' },
  { label: 'Sort Data', value: 'sort' },
  { label: 'Aggregate Data', value: 'aggregate' }
] as const;

// Input configurations for different modes
const MODE_INPUTS = {
  read: {
    delimiter: {
      type: 'string',
      title: 'Delimiter',
      description: 'Field separator (,;|)',
      default: ','
    },
    encoding: {
      type: 'string',
      title: 'File Encoding',
      description: '(e.g., UTF-8, ASCII)',
      default: 'UTF-8'
    },
    hasHeader: {
      type: 'boolean',
      title: 'Has Header',
      description: 'First row is header',
      default: true
    }
  },
  write: {
    delimiter: {
      type: 'string',
      title: 'Delimiter',
      description: 'Field separator',
      default: ','
    },
    includeHeader: {
      type: 'boolean',
      title: 'Include Header',
      description: 'Add header row',
      default: true
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
  },
  filter: {
    column: {
      type: 'string',
      title: 'Column',
      description: 'Target column'
    },
    condition: {
      type: 'string',
      title: 'Condition',
      description: '(e.g., equals, contains, greater than)'
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
  },
  sort: {
    column: {
      type: 'string',
      title: 'Sort Column',
      description: 'Column to sort'
    },
    ascending: {
      type: 'boolean',
      title: 'Ascending Order',
      description: 'Sort ascending',
      default: true
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
  },
  aggregate: {
    groupBy: {
      type: 'string',
      title: 'Group By Column',
      description: 'Group by field'
    },
    operation: {
      type: 'string',
      title: 'Operation',
      description: 'sum, avg, count, min, max'
    },
    targetColumn: {
      type: 'string',
      title: 'Target Column',
      description: 'Column for operation'
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
};

// Output configurations for different modes
const MODE_OUTPUTS = {
  read: {
    data: {
      type: 'array',
      description: 'CSV data as array'
    },
    columnNames: {
      type: 'array',
      description: 'List of column names'
    }
  },
  write: {
    success: {
      type: 'boolean',
      description: 'Whether the write operation was successful'
    },
    filePath: {
      type: 'string',
      description: 'Path to the written file'
    }
  },
  filter: {
    filteredData: {
      type: 'array',
      description: 'Filtered CSV data'
    },
    rowCount: {
      type: 'number',
      description: 'Number of rows after filtering'
    }
  },
  sort: {
    sortedData: {
      type: 'array',
      description: 'Sorted CSV data'
    }
  },
  aggregate: {
    result: {
      type: 'object',
      description: 'Aggregation results'
    }
  }
};

export const CsvProcessorFormRender = (props: FormRenderProps<{ mode: ProcessMode }>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  // Update form configuration when mode changes
  React.useEffect(() => {
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: ['inputFile', ...Object.keys(MODE_INPUTS[form.values.mode])],
      properties: {
        inputFile: {
          type: 'string',
          title: 'Input CSV File',
          description: 'Select the CSV file to process'
        },
        ...MODE_INPUTS[form.values.mode]
      }
    });

    form.setValueIn('outputs', {
      type: 'object',
      properties: MODE_OUTPUTS[form.values.mode]
    });
  }, [form.values.mode, form]);

  const handleModeChange = (mode: ProcessMode) => {
    form.setValueIn('mode', mode);
    setKey(prev => prev + 1);
  };

  return (
    <>
      <FormHeader />
      <FormContent>
        <Field name="mode">
          {({ field }) => (
            <Select
              value={field.value as string}
              onChange={(value) => handleModeChange(value as ProcessMode)}
              style={{ width: '100%', marginBottom: 16 }}
              optionList={PROCESS_MODES as any}
            />
          )}
        </Field>
        <div key={key}>
          <FormInputs />
          <FormOutputs />
        </div>
      </FormContent>
    </>
  );
}; 