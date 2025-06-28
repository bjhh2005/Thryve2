import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

// 导出格式选项
const EXPORT_FORMATS = [
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'CSV', value: 'csv' },
  { label: 'Text', value: 'txt' },
  { label: 'XML', value: 'xml' }
] as const;

type ExportFormat = typeof EXPORT_FORMATS[number]['value'];

// 输入配置
const INPUT_CONFIG = {
  selectedVariable: {
    type: 'object',
    title: 'Variable to Export',
    description: 'Select the variable you want to export'
  },
  exportPath: {
    type: 'string',
    title: 'Export Path',
    description: 'Specify where to save the exported file'
  },
  exportFormat: {
    type: 'string',
    title: 'Export Format',
    description: 'Select the format for the exported file',
    enum: EXPORT_FORMATS.map(format => format.value),
    default: 'json'
  }
};

// 输出配置
const OUTPUT_CONFIG = {
  exportedFile: {
    type: 'string',
    title: 'Exported File',
    description: 'Path to the exported file'
  },
  success: {
    type: 'boolean',
    title: 'Success',
    description: 'Whether the export was successful'
  },
  error: {
    type: 'string',
    title: 'Error',
    description: 'Error message if export failed'
  }
};

export const ExportVariableFormRender = (props: FormRenderProps<{ mode: string }>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  // 初始化表单配置
  React.useEffect(() => {
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: ['selectedVariable', 'exportPath', 'exportFormat'],
      properties: INPUT_CONFIG
    });

    form.setValueIn('outputs', {
      type: 'object',
      properties: OUTPUT_CONFIG
    });
  }, [form]);

  return (
    <>
      <FormHeader />
      <FormContent>
        <div key={key}>
          <FormInputs />
          <FormOutputs />
        </div>
      </FormContent>
    </>
  );
}; 