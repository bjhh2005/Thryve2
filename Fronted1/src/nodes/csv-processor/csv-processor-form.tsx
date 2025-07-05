import React from 'react';
import { FormRenderProps, Field, FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'filter' | 'sort' | 'aggregate';

// Define processing modes
const PROCESS_MODES = [
  { label: '过滤数据', value: 'filter' },
  { label: '排序数据', value: 'sort' },
  { label: '聚合数据', value: 'aggregate' }
] as const;

// Input configurations for different modes
const MODE_INPUTS = {
  filter: {
    column: {
      type: 'string',
      title: '目标列',
      description: '选择要过滤的列'
    },
    condition: {
      type: 'string',
      title: '条件',
      description: '等于/包含/大于/小于'
    },
    value: {
      type: 'string',
      title: '值',
      description: '过滤值'
    },
    outputFolder: {
      type: 'string',
      title: '输出文件夹',
      description: '保存位置'
    },
    outputName: {
      type: 'string',
      title: '输出文件名',
      description: '文件名'
    }
  },
  sort: {
    column: {
      type: 'string',
      title: '排序列',
      description: '选择要排序的列'
    },
    ascending: {
      type: 'boolean',
      title: '升序',
      description: '升序排序',
      default: true
    },
    outputFolder: {
      type: 'string',
      title: '输出文件夹',
      description: '保存位置'
    },
    outputName: {
      type: 'string',
      title: '输出文件名',
      description: '文件名'
    }
  },
  aggregate: {
    groupBy: {
      type: 'string',
      title: '分组列',
      description: '选择分组字段'
    },
    operation: {
      type: 'string',
      title: '操作',
      description: '求和/平均/计数/最小/最大'
    },
    targetColumn: {
      type: 'string',
      title: '目标列',
      description: '选择操作的列'
    },
    outputFolder: {
      type: 'string',
      title: '输出文件夹',
      description: '保存位置'
    },
    outputName: {
      type: 'string',
      title: '输出文件名',
      description: '文件名'
    }
  }
};

// Output configurations for different modes
const MODE_OUTPUTS = {
  filter: {
    outputFile: {
      type: 'string',
      description: '过滤后的CSV文件'
    },
    filteredData: {
      type: 'array',
      description: '过滤后的数据'
    },
    rowCount: {
      type: 'number',
      description: '过滤后的行数'
    }
  },
  sort: {
    outputFile: {
      type: 'string',
      description: '排序后的CSV文件'
    },
    sortedData: {
      type: 'array',
      description: '排序后的数据'
    }
  },
  aggregate: {
    outputFile: {
      type: 'string',
      description: '聚合后的CSV文件'
    },
    result: {
      type: 'object',
      description: '聚合结果'
    }
  }
};

interface CsvProcessorNodeJSON {
  mode: ProcessMode;
  title: string;
  inputs: {
    inputFile: string;
    [key: string]: any;
  };
  outputs: {
    [key: string]: any;
  };
}

export const CsvProcessorFormRender = (props: FormRenderProps<CsvProcessorNodeJSON>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  // Update form configuration when mode changes
  React.useEffect(() => {
    const currentMode = form.values.mode || 'filter';
    const modeInputs = MODE_INPUTS[currentMode] || MODE_INPUTS.filter;
    
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: ['inputFile', ...Object.keys(modeInputs)],
      properties: {
        inputFile: {
          type: 'string',
          title: '输入CSV文件',
          description: '选择要处理的CSV文件'
        },
        ...modeInputs
      }
    });

    form.setValueIn('outputs', {
      type: 'object',
      properties: MODE_OUTPUTS[currentMode] || MODE_OUTPUTS.filter
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
              value={field.value as string || 'filter'}
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

export const formMeta: FormMeta<CsvProcessorNodeJSON> = {
  render: CsvProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : '标题不能为空'),
    inputFile: ({ value }: { value: string }) => (value ? undefined : '请选择输入文件'),
    outputFolder: ({ value }: { value: string }) => (value ? undefined : '请选择输出文件夹'),
    outputName: ({ value }: { value: string }) => (value ? undefined : '请输入输出文件名'),
  },
}; 