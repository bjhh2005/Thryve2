import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'write' | 'append' | 'convert' | 'frontMatter' | 'toc' | 'lint';

// 定义处理模式
const PROCESS_MODES = [
  { label: 'Write Content', value: 'write' },
  { label: 'Append Content', value: 'append' },
  { label: 'Convert Format', value: 'convert' },
  { label: 'Edit Front Matter', value: 'frontMatter' },
  { label: 'Generate TOC', value: 'toc' },
  { label: 'Lint Markdown', value: 'lint' }
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
      description: 'html/pdf',
      enum: ['html', 'pdf'],
      default: 'html'
    },
    options: {
      type: 'object',
      title: 'Conversion Options',
      properties: {
        includeStylesheet: {
          type: 'boolean',
          title: 'Include Stylesheet',
          description: 'Add default styles',
          default: true
        },
        highlightCode: {
          type: 'boolean',
          title: 'Highlight Code',
          description: 'Enable highlighting',
          default: true
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
          default: false
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
  },
  lint: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select MD file'
    },
    rules: {
      type: 'object',
      title: 'Lint Rules',
      properties: {
        checkSpelling: {
          type: 'boolean',
          title: 'Check Spelling',
          description: 'Enable spell check',
          default: true
        },
        checkLinks: {
          type: 'boolean',
          title: 'Check Links',
          description: 'Validate links',
          default: true
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
      description: 'Path to output file'
    }
  },
  append: {
    outputFile: {
      type: 'string',
      description: 'Path to output file'
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
  },
  lint: {
    issues: {
      type: 'array',
      title: 'Issues',
      description: 'List of detected issues',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Issue type'
          },
          message: {
            type: 'string',
            description: 'Issue description'
          },
          line: {
            type: 'number',
            description: 'Line number'
          }
        }
      }
    }
  }
};

export const MarkdownProcessorFormRender = (props: FormRenderProps<{ mode: ProcessMode }>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  // 更新表单配置
  React.useEffect(() => {
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: ['inputFile', ...Object.keys(MODE_INPUTS[form.values.mode])],
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