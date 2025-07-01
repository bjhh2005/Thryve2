import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs, FormItem, Feedback } from '../../form-components';
import { DynamicValueInput } from '@flowgram.ai/form-materials';
import { JsonSchema } from '../../typings';

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
      description: 'Sort method',
      enum: ['name', 'date'],
      default: 'name',
      widget: 'select',
      enumLabels: ['Name', 'Date']
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
      description: 'Split by: page/size/bookmark',
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
      description: 'Target format',
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
      description: 'Compression level',
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
      description: 'Watermark location',
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
    outputFiles: {
      type: 'array',
      description: 'Converted file(s)'
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
    success: {
      type: 'boolean',
      description: 'Metadata update status'
    },
    metadata: {
      type: 'object',
      description: 'Updated metadata information'
    }
  }
};

export const PdfProcessorFormRender: React.FC<{
  properties: Record<string, any>;
  onChange: (properties: Record<string, any>) => void;
}> = () => {
  return (
    <>
      <FormHeader />
      <FormContent>
        <FormInputs />
      </FormContent>
    </>
  );
}; 