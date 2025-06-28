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
      description: 'CSV field delimiter (e.g., comma, semicolon)',
      default: ','
    },
    encoding: {
      type: 'string',
      title: 'File Encoding',
      description: 'File encoding (e.g., UTF-8, ASCII)',
      default: 'UTF-8'
    },
    hasHeader: {
      type: 'boolean',
      title: 'Has Header',
      description: 'First row contains column names',
      default: true
    }
  },
  write: {
    outputFile: {
      type: 'string',
      title: 'Output File',
      description: 'Name of the output CSV file'
    },
    delimiter: {
      type: 'string',
      title: 'Delimiter',
      description: 'CSV field delimiter',
      default: ','
    },
    includeHeader: {
      type: 'boolean',
      title: 'Include Header',
      description: 'Include column names in the first row',
      default: true
    }
  },
  filter: {
    column: {
      type: 'string',
      title: 'Column',
      description: 'Column to filter on'
    },
    condition: {
      type: 'string',
      title: 'Condition',
      description: 'Filter condition (e.g., equals, contains, greater than)'
    },
    value: {
      type: 'string',
      title: 'Value',
      description: 'Value to filter by'
    }
  },
  sort: {
    column: {
      type: 'string',
      title: 'Sort Column',
      description: 'Column to sort by'
    },
    ascending: {
      type: 'boolean',
      title: 'Ascending Order',
      description: 'Sort in ascending order',
      default: true
    }
  },
  aggregate: {
    groupBy: {
      type: 'string',
      title: 'Group By Column',
      description: 'Column to group by'
    },
    operation: {
      type: 'string',
      title: 'Operation',
      description: 'Aggregation operation (e.g., sum, average, count)'
    },
    targetColumn: {
      type: 'string',
      title: 'Target Column',
      description: 'Column to perform operation on'
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