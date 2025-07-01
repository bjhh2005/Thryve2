import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs, FormItem, Feedback } from '../../form-components';
import { DynamicValueInput } from '@flowgram.ai/form-materials';
import { JsonSchema } from '../../typings';

interface ExtendedJsonSchema extends JsonSchema {
  enumLabels?: string[];
}

type ProcessMode = 'write' | 'append' | 'convert' | 'frontMatter' | 'toc';

// 定义处理模式
const PROCESS_MODES = [
  { label: 'Write Content', value: 'write' },
  { label: 'Append Content', value: 'append' },
  { label: 'Convert Format', value: 'convert' },
  { label: 'Edit Front Matter', value: 'frontMatter' },
  { label: 'Generate TOC', value: 'toc' }
] as const;

// 不同模式的输入配置
const MODE_INPUTS = {
  write: {
    inputFile: {
      type: 'string',
      title: 'Input File',
      description: 'Select MD file'
    },
    content: {
      type: 'string',
      title: 'Content',
      description: 'MD content'
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
  append: {
    inputFile: {
      type: 'string',
      title: 'Input File',
      description: 'Select MD file'
    },
    content: {
      type: 'string',
      title: 'Content',
      description: 'Content to append'
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
  convert: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select MD file'
    },
    targetFormat: {
      type: 'string',
      title: 'Target Format',
      description: 'Output format',
      enum: ['pdf', 'html'],
      default: 'html',
      widget: 'select',
      enumLabels: ['PDF', 'HTML']
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
  frontMatter: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select MD file'
    },
    frontMatter: {
      type: 'string',
      title: 'Front Matter',
      description: 'JSON format'
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
  toc: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select MD file'
    },
    options: {
      type: 'object',
      title: 'TOC Options',
      properties: {
        maxDepth: {
          type: 'number',
          title: 'Maximum Depth',
          description: 'Max heading level',
          default: 3
        },
        numbered: {
          type: 'boolean',
          title: 'Numbered',
          description: 'Add numbers',
          default: false,
          widget: 'select',
          enum: [true, false],
          enumLabels: ['Yes', 'No']
        }
      }
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

// 不同模式的输出配置
const MODE_OUTPUTS = {
  write: {
    outputFile: {
      type: 'string',
      title: 'Output File',
      description: 'Path to written markdown file'
    }
  },
  append: {
    outputFile: {
      type: 'string',
      title: 'Output File',
      description: 'Path to appended markdown file'
    }
  },
  convert: {
    convertedFile: {
      type: 'string',
      title: 'Converted File',
      description: 'Path to converted file'
    }
  },
  frontMatter: {
    outputFile: {
      type: 'string',
      title: 'Output File',
      description: 'Path to modified markdown file'
    },
    metadata: {
      type: 'object',
      title: 'Metadata',
      description: 'Extracted front matter metadata'
    }
  },
  toc: {
    tableOfContents: {
      type: 'string',
      title: 'Table of Contents',
      description: 'Generated table of contents'
    }
  }
};

export const MarkdownProcessorFormRender = (props: FormRenderProps<{ mode: ProcessMode }>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  // 更新表单配置
  React.useEffect(() => {
    setKey(prev => prev + 1);
    const currentMode = form.values?.mode || 'write';
    const modeInputs = MODE_INPUTS[currentMode] || {};
    
    form.setValueIn('inputs', {
      type: 'object',
      required: ['inputFile', ...Object.keys(modeInputs)],
      properties: modeInputs
    });

    form.setValueIn('outputs', {
      type: 'object',
      properties: MODE_OUTPUTS[currentMode] || {}
    });
  }, [form.values?.mode, form]);

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
            const property = properties[key] as ExtendedJsonSchema;
            // 如果字段有 enum 属性，使用 Select 组件渲染
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
                        optionList={property.enum!.map(value => ({
                          label: property.enumLabels?.[property.enum!.indexOf(value)] || ((value as string).charAt(0).toUpperCase() + (value as string).slice(1)),
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