import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'parse' | 'write' | 'append' | 'convert' | 'frontMatter' | 'toc' | 'lint';

// 定义处理模式
const PROCESS_MODES = [
  { label: 'Parse Markdown', value: 'parse' },
  { label: 'Write Content', value: 'write' },
  { label: 'Append Content', value: 'append' },
  { label: 'Convert Format', value: 'convert' },
  { label: 'Edit Front Matter', value: 'frontMatter' },
  { label: 'Generate TOC', value: 'toc' },
  { label: 'Lint Markdown', value: 'lint' }
] as const;

// 不同模式的输入配置
const MODE_INPUTS = {
  parse: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select Markdown file to parse'
    },
    parseOptions: {
      type: 'object',
      title: 'Parse Options',
      properties: {
        gfm: {
          type: 'boolean',
          title: 'GitHub Flavored Markdown',
          description: 'Enable GitHub Flavored Markdown syntax',
          default: true
        },
        breaks: {
          type: 'boolean',
          title: 'Line Breaks',
          description: 'Treat newlines as line breaks',
          default: false
        }
      }
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the parsed HTML'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the output HTML file'
    }
  },
  write: {
    inputFile: {
      type: 'string',
      title: 'Input File',
      description: 'Select the file to write to'
    },
    content: {
      type: 'string',
      title: 'Content',
      description: 'Markdown content to write'
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the Markdown file'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the Markdown file'
    }
  },
  append: {
    inputFile: {
      type: 'string',
      title: 'Input File',
      description: 'Select the file to append to'
    },
    content: {
      type: 'string',
      title: 'Content',
      description: 'Markdown content to append'
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the appended file'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the output file'
    }
  },
  convert: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select Markdown file to convert'
    },
    targetFormat: {
      type: 'string',
      title: 'Target Format',
      description: 'Select output format',
      enum: ['html', 'pdf', 'docx', 'latex'],
      default: 'html'
    },
    options: {
      type: 'object',
      title: 'Conversion Options',
      properties: {
        includeStylesheet: {
          type: 'boolean',
          title: 'Include Stylesheet',
          description: 'Include default stylesheet',
          default: true
        },
        highlightCode: {
          type: 'boolean',
          title: 'Highlight Code',
          description: 'Enable syntax highlighting for code blocks',
          default: true
        }
      }
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the converted file'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the converted file'
    }
  },
  frontMatter: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select Markdown file to edit front matter'
    },
    frontMatter: {
      type: 'string',
      title: 'Front Matter',
      description: 'Front matter content in JSON format'
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the modified file'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the modified file'
    }
  },
  toc: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select Markdown file to generate TOC'
    },
    options: {
      type: 'object',
      title: 'TOC Options',
      properties: {
        maxDepth: {
          type: 'number',
          title: 'Maximum Depth',
          description: 'Maximum heading depth to include',
          default: 3
        },
        numbered: {
          type: 'boolean',
          title: 'Numbered',
          description: 'Add number prefix to headings',
          default: false
        }
      }
    },
    outputFolder: {
      type: 'string',
      title: 'Output Folder',
      description: 'Select folder to save the file with TOC'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the output file'
    }
  },
  lint: {
    inputFile: {
      type: 'string',
      title: 'Markdown File',
      description: 'Select Markdown file to lint'
    },
    rules: {
      type: 'object',
      title: 'Lint Rules',
      properties: {
        checkSpelling: {
          type: 'boolean',
          title: 'Check Spelling',
          description: 'Enable spell checking',
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
      description: 'Select folder to save the linting report'
    },
    outputName: {
      type: 'string',
      title: 'Output Name',
      description: 'Name for the linting report file'
    }
  }
};

// 不同模式的输出配置
const MODE_OUTPUTS = {
  parse: {
    html: {
      type: 'string',
      title: 'HTML Output',
      description: 'Parsed HTML content'
    },
    ast: {
      type: 'object',
      title: 'AST',
      description: 'Abstract Syntax Tree'
    }
  },
  write: {},
  append: {},
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