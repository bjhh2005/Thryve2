import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'parse' | 'stringify' | 'query' | 'update' | 'validate' | 'merge' | 'diff';

// Define processing modes
const PROCESS_MODES = [
  { label: 'Parse JSON', value: 'parse' },
  { label: 'Stringify JSON', value: 'stringify' },
  { label: 'Query JSON', value: 'query' },
  { label: 'Update JSON', value: 'update' },
  { label: 'Validate JSON', value: 'validate' },
  { label: 'Merge JSON', value: 'merge' },
  { label: 'Compare JSON', value: 'diff' }
] as const;

// Input configurations for different modes
const MODE_INPUTS = {
  parse: {
    inputData: {
      type: 'string',
      title: 'JSON String',
      description: 'Enter JSON string to parse',
      format: 'json'
    }
  },
  stringify: {
    inputData: {
      type: 'object',
      title: 'JSON Object',
      description: 'JSON object to stringify'
    },
    indent: {
      type: 'number',
      title: 'Indentation',
      description: 'Number of spaces for indentation',
      default: 2
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the JSON file'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the JSON file'
    }
  },
  query: {
    inputData: {
      type: 'string',
      title: 'JSON Data',
      description: 'JSON data to query',
      format: 'json'
    },
    path: {
      type: 'string',
      title: 'JSON Path',
      description: 'JSONPath expression (e.g., $.store.book[0].title)'
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the query result'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the output file'
    }
  },
  update: {
    inputData: {
      type: 'string',
      title: 'JSON Data',
      description: 'JSON data to update',
      format: 'json'
    },
    path: {
      type: 'string',
      title: 'JSON Path',
      description: 'Path to update (e.g., $.store.book[0].title)'
    },
    newValue: {
      type: 'string',
      title: 'New Value',
      description: 'New value to set at the specified path'
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the updated JSON'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the updated JSON file'
    }
  },
  validate: {
    inputData: {
      type: 'string',
      title: 'JSON Data',
      description: 'JSON data to validate',
      format: 'json'
    },
    schema: {
      type: 'string',
      title: 'JSON Schema',
      description: 'JSON Schema for validation',
      format: 'json'
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the validation report'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the validation report file'
    }
  },
  merge: {
    inputData: {
      type: 'string',
      title: 'Base JSON',
      description: 'Base JSON object',
      format: 'json'
    },
    sourceData: {
      type: 'string',
      title: 'Source JSON',
      description: 'JSON to merge with base',
      format: 'json'
    },
    deep: {
      type: 'boolean',
      title: 'Deep Merge',
      description: 'Perform deep merge of objects',
      default: true
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the merged JSON'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the merged JSON file'
    }
  },
  diff: {
    inputData: {
      type: 'string',
      title: 'Original JSON',
      description: 'Original JSON data',
      format: 'json'
    },
    compareData: {
      type: 'string',
      title: 'Compare JSON',
      description: 'JSON to compare against',
      format: 'json'
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the comparison result'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the comparison result file'
    }
  }
};

// Output configurations for different modes
const MODE_OUTPUTS = {
  parse: {
    result: {
      type: 'object',
      description: 'Parsed JSON object'
    },
    isValid: {
      type: 'boolean',
      description: 'Whether the JSON is valid'
    }
  },
  stringify: {
    result: {
      type: 'string',
      description: 'Stringified JSON'
    }
  },
  query: {
    result: {
      type: 'any',
      description: 'Query result'
    },
    found: {
      type: 'boolean',
      description: 'Whether the path exists'
    }
  },
  update: {
    result: {
      type: 'object',
      description: 'Updated JSON object'
    },
    success: {
      type: 'boolean',
      description: 'Whether the update was successful'
    }
  },
  validate: {
    isValid: {
      type: 'boolean',
      description: 'Validation result'
    },
    errors: {
      type: 'array',
      description: 'Validation errors if any'
    }
  },
  merge: {
    result: {
      type: 'object',
      description: 'Merged JSON object'
    }
  },
  diff: {
    differences: {
      type: 'array',
      description: 'List of differences found'
    },
    areEqual: {
      type: 'boolean',
      description: 'Whether the JSONs are equal'
    }
  }
};

export const JsonProcessorFormRender = (props: FormRenderProps<{ mode: ProcessMode }>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  // Update form configuration when mode changes
  React.useEffect(() => {
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: ['inputData', ...Object.keys(MODE_INPUTS[form.values.mode])],
      properties: MODE_INPUTS[form.values.mode]
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