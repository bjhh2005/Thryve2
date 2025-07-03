import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'extract' | 'merge' | 'split' | 'convert' | 'compress' | 'encrypt' | 'decrypt' | 'watermark' | 'metadata';

// Define processing modes
const PROCESS_MODES = [
  { label: 'Extract Content', value: 'extract' },
  { label: 'Merge PDFs', value: 'merge' },
  { label: 'Split PDF', value: 'split' },
  { label: 'Convert Format', value: 'convert' },
  { label: 'Compress PDF', value: 'compress' },
  { label: 'Encrypt PDF', value: 'encrypt' },
  { label: 'Decrypt PDF', value: 'decrypt' },
  { label: 'Add Watermark', value: 'watermark' },
  { label: 'Edit Metadata', value: 'metadata' }
] as const;

// Input configurations for different modes
const MODE_INPUTS = {
  extract: {
    inputFile: {
      type: 'string',
      title: 'PDF File',
      description: 'Select PDF file'
    },
    pageRange: {
      type: 'string',
      title: 'Page Range',
      description: 'Pages to extract (e.g., 1-5)',
      default: ''
    },
    extractImages: {
      type: 'boolean',
      title: 'Extract Images',
      description: 'Include images',
      default: false
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
    inputFiles: {
      type: 'array',
      title: 'PDF Files',
      description: 'Files to merge'
    },
    sortBy: {
      type: 'string',
      title: 'Sort By',
      description: 'name or date',
      enum: ['name', 'date'],
      default: 'name'
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
  split: {
    inputFile: {
      type: 'string',
      title: 'PDF File',
      description: 'Select PDF file'
    },
    splitMethod: {
      type: 'string',
      title: 'Split Method',
      description: 'byPage/bySize/byBookmark',
      enum: ['byPage', 'bySize', 'byBookmark'],
      default: 'byPage'
    },
    value: {
      type: 'string',
      title: 'Split Value',
      description: 'Pages/size (MB)'
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
      title: 'PDF File',
      description: 'Select PDF file'
    },
    outputFormat: {
      type: 'string',
      title: 'Output Format',
      description: 'png/jpg/text/html',
      enum: ['png', 'jpg', 'text', 'html'],
      default: 'png'
    },
    dpi: {
      type: 'number',
      title: 'DPI',
      description: 'Resolution (72-600)',
      default: 300
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
  compress: {
    inputFile: {
      type: 'string',
      title: 'PDF File',
      description: 'Select PDF file'
    },
    quality: {
      type: 'string',
      title: 'Quality',
      description: 'high/medium/low',
      enum: ['high', 'medium', 'low'],
      default: 'medium'
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
  encrypt: {
    inputFile: {
      type: 'string',
      title: 'PDF File',
      description: 'Select PDF file'
    },
    password: {
      type: 'string',
      title: 'Password',
      description: 'Encryption key'
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
  decrypt: {
    inputFile: {
      type: 'string',
      title: 'PDF File',
      description: 'Select encrypted PDF'
    },
    password: {
      type: 'string',
      title: 'Password',
      description: 'Decryption key'
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
  watermark: {
    inputFile: {
      type: 'string',
      title: 'PDF File',
      description: 'Select PDF file'
    },
    watermarkText: {
      type: 'string',
      title: 'Watermark Text',
      description: 'Text content'
    },
    opacity: {
      type: 'number',
      title: 'Opacity',
      description: 'Range: 0-100',
      default: 30
    },
    position: {
      type: 'string',
      title: 'Position',
      description: 'center/topLeft/topRight/bottomLeft/bottomRight',
      enum: ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
      default: 'center'
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
  metadata: {
    inputFile: {
      type: 'string',
      title: 'PDF File',
      description: 'Select PDF file'
    },
    title: {
      type: 'string',
      title: 'Title',
      description: 'Document title'
    },
    author: {
      type: 'string',
      title: 'Author',
      description: 'Document author'
    },
    subject: {
      type: 'string',
      title: 'Subject',
      description: 'Document subject'
    },
    keywords: {
      type: 'string',
      title: 'Keywords',
      description: 'Document keywords'
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
  extract: {
    text: {
      type: 'string',
      description: 'Extracted text content'
    },
    images: {
      type: 'array',
      description: 'Extracted images (if enabled)'
    }
  },
  merge: {
    outputFile: {
      type: 'string',
      description: 'Path to merged PDF file'
    },
    pageCount: {
      type: 'number',
      description: 'Total pages in merged file'
    }
  },
  split: {
    outputFiles: {
      type: 'array',
      description: 'List of split PDF files'
    },
    fileCount: {
      type: 'number',
      description: 'Number of files created'
    }
  },
  convert: {
    outputFile: {
      type: 'string',
      description: 'Converted file'
    },
    conversionLog: {
      type: 'string',
      description: 'Conversion process log'
    }
  },
  compress: {
    outputFile: {
      type: 'string',
      description: 'Compressed PDF file'
    },
    compressionRatio: {
      type: 'number',
      description: 'Achieved compression ratio'
    }
  },
  encrypt: {
    outputFile: {
      type: 'string',
      description: 'Encrypted PDF file'
    },
    success: {
      type: 'boolean',
      description: 'Encryption success status'
    }
  },
  decrypt: {
    outputFile: {
      type: 'string',
      description: 'Decrypted PDF file'
    },
    success: {
      type: 'boolean',
      description: 'Decryption success status'
    }
  },
  watermark: {
    outputFile: {
      type: 'string',
      description: 'Watermarked PDF file'
    }
  },
  metadata: {
    outputFile: {
      type: 'string',
      description: 'PDF file with updated metadata'
    },
    metadata: {
      type: 'object',
      description: 'Updated metadata information'
    }
  }
};

export const PdfProcessorFormRender = (props: FormRenderProps<{ mode: ProcessMode }>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  // Update form configuration when mode changes
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