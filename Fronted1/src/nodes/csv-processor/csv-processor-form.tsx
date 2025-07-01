import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs, FormItem, Feedback } from '../../form-components';
import { DynamicValueInput } from '@flowgram.ai/form-materials';
import { JsonSchema } from '../../typings';

type ProcessMode = 'filter' | 'sort' | 'aggregate';

// Define processing modes
const PROCESS_MODES = [
  { label: 'Filter Data', value: 'filter' },
  { label: 'Sort Data', value: 'sort' },
  { label: 'Aggregate Data', value: 'aggregate' }
] as const;

// Input configurations for different modes
const MODE_INPUTS = {
  filter: {
    column: {
      type: 'string',
      title: 'Column',
      description: 'Target column'
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
      description: 'Aggregation operation',
      enum: ['sum', 'avg', 'count', 'min', 'max'],
      default: 'count'
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

  // Set default mode if not set
  React.useEffect(() => {
    if (!form.values.mode) {
      form.setValueIn('mode', 'filter');
    }
  }, [form]);

  // Update form configuration when mode changes
  React.useEffect(() => {
    if (!form.values.mode) return;
    
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: ['inputFile', ...Object.keys(MODE_INPUTS[form.values.mode] || {})],
      properties: {
        inputFile: {
          type: 'string',
          title: 'Input CSV File',
          description: 'Select the CSV file to process'
        },
        ...(MODE_INPUTS[form.values.mode] || {})
      }
    });

    form.setValueIn('outputs', {
      type: 'object',
      properties: MODE_OUTPUTS[form.values.mode] || {}
    });
  }, [form.values.mode, form]);

  const handleModeChange = (mode: ProcessMode) => {
    form.setValueIn('mode', mode);
    setKey(prev => prev + 1);
  };

  const renderFormInputs = () => {
    return (
      <Field<JsonSchema> name="inputs">
        {({ field: inputsField }) => {
          const required = inputsField.value?.required || [];
          const properties = inputsField.value?.properties;
          if (!properties) {
            return <></>;
          }
          const content = Object.keys(properties).map((key) => {
            const property = properties[key];
            if (property.enum && Array.isArray(property.enum)) {
              return (
                <Field key={key} name={`inputsValues.${key}`} defaultValue={property.default}>
                  {({ field, fieldState }) => (
                    <FormItem
                      name={key}
                      type={property.type as string}
                      required={required.includes(key)}
                      description={property.description}
                    >
                      <Select
                        value={field.value?.content || property.default}
                        onChange={(value) => field.onChange({ content: value })}
                        style={{ width: '100%' }}
                        placeholder={property.description || 'Please select...'}
                        optionList={(property.enum as string[]).map(value => ({
                          label: value.charAt(0).toUpperCase() + value.slice(1),
                          value: value
                        }))}
                      />
                      <Feedback errors={fieldState?.errors} />
                    </FormItem>
                  )}
                </Field>
              );
            }
            return (
              <Field key={key} name={`inputsValues.${key}`} defaultValue={property.default}>
                {({ field, fieldState }) => (
                  <FormItem
                    name={key}
                    type={property.type as string}
                    required={required.includes(key)}
                    description={property.description}
                  >
                    <DynamicValueInput
                      value={field.value}
                      onChange={field.onChange}
                      readonly={false}
                      hasError={Object.keys(fieldState?.errors || {}).length > 0}
                      schema={property}
                      constantProps={{
                        placeholder: property.description || 'Please input...',
                        style: { width: '100%' }
                      }}
                    />
                    <Feedback errors={fieldState?.errors} />
                  </FormItem>
                )}
              </Field>
            );
          });
          return <>{content}</>;
        }}
      </Field>
    );
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
          {renderFormInputs()}
          <FormOutputs />
        </div>
      </FormContent>
    </>
  );
}; 