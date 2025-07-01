import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'query' | 'update' | 'validate' | 'merge' | 'diff';

// Define processing modes
const PROCESS_MODES = [
  { label: 'Query JSON', value: 'query' },
  { label: 'Update JSON', value: 'update' },
  { label: 'Validate JSON', value: 'validate' },
  { label: 'Merge JSON', value: 'merge' },
  { label: 'Compare JSON', value: 'diff' }
] as const;

// Input configurations for different modes
const MODE_INPUTS = {
  query: {
    inputFile: {
      type: 'string',
      title: 'JSON Data',
      description: 'Data to query',
      format: 'json'
    },
    path: {
      type: 'string',
      title: 'JSON Path',
      description: 'Query expression ($.path.to.field)'
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
  update: {
    inputFile: {
      type: 'string',
      title: 'JSON Data',
      description: 'Data to update',
      format: 'json'
    },
    path: {
      type: 'string',
      title: 'JSON Path',
      description: 'Update path ($.path.to.field)'
    },
    newValue: {
      type: 'string',
      title: 'New Value',
      description: 'Value to set'
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
  validate: {
    inputFile: {
      type: 'string',
      title: 'JSON Data',
      description: 'Data to validate',
      format: 'json'
    },
    schema: {
      type: 'string',
      title: 'JSON Schema',
      description: 'Validation schema',
      format: 'json'
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
  merge: {
    inputFile: {
      type: 'string',
      title: 'Base JSON',
      description: 'Base object',
      format: 'json'
    },
    sourceData: {
      type: 'string',
      title: 'Source JSON',
      description: 'Object to merge',
      format: 'json'
    },
    deep: {
      type: 'boolean',
      title: 'Deep Merge',
      description: 'Enable deep merge',
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
  diff: {
    inputFile: {
      type: 'string',
      title: 'Original JSON',
      description: 'Original data',
      format: 'json'
    },
    compareData: {
      type: 'string',
      title: 'Compare JSON',
      description: 'Data to compare',
      format: 'json'
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
    const currentMode = form.values.mode || 'query';
    const modeInputs = MODE_INPUTS[currentMode] || MODE_INPUTS.query;
    
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: ['inputFile', ...Object.keys(modeInputs)],
      properties: modeInputs
    });

    form.setValueIn('outputs', {
      type: 'object',
      properties: MODE_OUTPUTS[currentMode] || MODE_OUTPUTS.query
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