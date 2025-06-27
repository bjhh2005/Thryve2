import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'append' | 'write' | 'replace' | 'wordFreq';

// Define processing modes
const PROCESS_MODES = [
  { label: 'Append Content', value: 'append' },
  { label: 'Write Content', value: 'write' },
  { label: 'Find and Replace', value: 'replace' },
  { label: 'Word Frequency Analysis', value: 'wordFreq' }
] as const;

// Input configurations for different modes
const MODE_INPUTS = {
  append: {
    content: {
      type: 'string',
      title: 'Content to Append',
      description: 'Content to be appended at the end of the file'
    }
  },
  write: {
    content: {
      type: 'string',
      title: 'Content to Write',
      description: 'Content to write to the file (will overwrite existing content)'
    }
  },
  replace: {
    searchText: {
      type: 'string',
      title: 'Search Text',
      description: 'Text to search for'
    },
    replaceText: {
      type: 'string',
      title: 'Replace Text',
      description: 'Text to replace with'
    },
    useRegex: {
      type: 'boolean',
      title: 'Use Regular Expression',
      description: 'Enable regular expression for search and replace'
    }
  },
  wordFreq: {
    ignoreCase: {
      type: 'boolean',
      title: 'Ignore Case',
      description: 'Ignore case when counting words'
    },
    minLength: {
      type: 'integer',
      title: 'Minimum Word Length',
      description: 'Minimum length of words to count',
      default: 1
    }
  }
};

// Output configurations for different modes
const MODE_OUTPUTS = {
  append: {},
  write: {},
  replace: {
    replacementCount: {
      type: 'number',
      title: 'Replacement Count',
      description: 'Number of replacements made'
    }
  },
  wordFreq: {
    statistics: {
      type: 'object',
      title: 'Statistics',
      description: 'Detailed word frequency statistics',
      properties: {
        totalWords: {
          type: 'number',
          title: 'Total Words',
          description: 'Total number of words in the file',
          default: 0
        },
        uniqueWords: {
          type: 'number',
          title: 'Unique Words',
          description: 'Number of unique words in the file',
          default: 0
        },
        frequencies: {
          type: 'object',
          title: 'Word Frequencies',
          description: 'Frequency count for each word',
          properties: {
            word: {
              type: 'string',
              title: 'Word'
            },
            frequency: {
              type: 'number',
              title: 'Frequency',
              default: 0
            }
          }
        }
      }
    }
  }
};

export const TextProcessorFormRender = (props: FormRenderProps<{ mode: ProcessMode }>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  // 更新表单配置
  React.useEffect(() => {
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: ['inputFile', ...Object.keys(MODE_INPUTS[form.values.mode])],
      properties: {
        inputFile: {
          type: 'string',
          title: 'Input File',
          description: 'Select the text file to process'
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