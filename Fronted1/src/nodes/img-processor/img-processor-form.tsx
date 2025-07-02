import React from 'react';
import { FormRenderProps, Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

type ProcessMode = 'resize' | 'compress' | 'convert' | 'rotate' | 'crop' | 'filter' | 'watermark';

// 定义处理模式
const PROCESS_MODES = [
  { label: 'Resize Image', value: 'resize' },
  { label: 'Compress Image', value: 'compress' },
  { label: 'Convert Format', value: 'convert' },
  { label: 'Rotate Image', value: 'rotate' },
  { label: 'Crop Image', value: 'crop' },
  { label: 'Apply Filter', value: 'filter' },
  { label: 'Add Watermark', value: 'watermark' }
] as const;

// 图像格式选项
const IMAGE_FORMATS = [
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' },
  { label: 'WEBP', value: 'webp' },
  { label: 'GIF', value: 'gif' }
] as const;

// 滤镜效果选项
const FILTER_EFFECTS = [
  { label: 'Grayscale', value: 'grayscale' },
  { label: 'Sepia', value: 'sepia' },
  { label: 'Blur', value: 'blur' },
  { label: 'Sharpen', value: 'sharpen' },
  { label: 'Brightness', value: 'brightness' },
  { label: 'Contrast', value: 'contrast' }
] as const;

// 旋转角度选项
const ROTATION_ANGLES = [
  { label: '-270°', value: -270 },
  { label: '-180°', value: -180 },
  { label: '-90°', value: -90 },
  { label: '90°', value: 90 },
  { label: '180°', value: 180 },
  { label: '270°', value: 270 }
] as const;

// 不同模式的输入配置
const MODE_INPUTS = {
  resize: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image file'
    },
    width: {
      type: 'number',
      title: 'Width',
      description: 'Width (px) > 0',
      minimum: 1
    },
    height: {
      type: 'number',
      title: 'Height',
      description: 'Height (px) > 0',
      minimum: 1
    },
    maintainAspectRatio: {
      type: 'boolean',
      title: 'Aspect Ratio',
      description: 'Keep aspect ratio'
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
      title: 'Input Image',
      description: 'Select image file'
    },
    quality: {
      type: 'number',
      title: 'Quality',
      description: 'Range: 1-100',
      minimum: 1,
      maximum: 100,
      default: 80
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
      title: 'Input Image',
      description: 'Select image file'
    },
    format: {
      type: 'string',
      title: 'Format',
      description: 'jpeg/png/webp/gif',
      enum: IMAGE_FORMATS.map(format => format.value),
      default: 'jpeg'
    },
    quality: {
      type: 'number',
      title: 'Quality',
      description: 'Range: 1-100',
      minimum: 1,
      maximum: 100,
      default: 90
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
  rotate: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image file'
    },
    angle: {
      type: 'number',
      title: 'Angle',
      description: '±90°/±180°/±270°',
      enum: ROTATION_ANGLES.map(angle => angle.value),
      default: 90
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
  crop: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image file'
    },
    x: {
      type: 'number',
      title: 'X Position',
      description: 'Start X (px) ≥ 0',
      minimum: 0
    },
    y: {
      type: 'number',
      title: 'Y Position',
      description: 'Start Y (px) ≥ 0',
      minimum: 0
    },
    width: {
      type: 'number',
      title: 'Width',
      description: 'Width (px) > 0',
      minimum: 1
    },
    height: {
      type: 'number',
      title: 'Height',
      description: 'Height (px) > 0',
      minimum: 1
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
  filter: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image file'
    },
    filterType: {
      type: 'string',
      title: 'Filter',
      description: 'grayscale/sepia/blur/sharpen/brightness/contrast',
      enum: FILTER_EFFECTS.map(effect => effect.value),
      default: 'grayscale'
    },
    intensity: {
      type: 'number',
      title: 'Intensity',
      description: 'Range: 1-100',
      minimum: 1,
      maximum: 100,
      default: 50
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
      title: 'Input Image',
      description: 'Select image file'
    },
    watermarkText: {
      type: 'string',
      title: 'Text',
      description: 'Watermark content'
    },
    fontSize: {
      type: 'number',
      title: 'Font Size',
      description: 'Size (px) > 0',
      minimum: 1,
      default: 24
    },
    opacity: {
      type: 'number',
      title: 'Opacity',
      description: 'Range: 1-100',
      minimum: 1,
      maximum: 100,
      default: 50
    },
    position: {
      type: 'string',
      title: 'Position',
      description: 'center/topLeft/topRight/bottomLeft/bottomRight',
      enum: ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
      default: 'bottomRight'
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

// 输出配置
const OUTPUT_CONFIG = {
  processedImage: {
    type: 'string',
    title: 'Image',
    description: 'Output path'
  },
  width: {
    type: 'number',
    title: 'Width',
    description: 'Output width'
  },
  height: {
    type: 'number',
    title: 'Height',
    description: 'Output height'
  },
  format: {
    type: 'string',
    title: 'Format',
    description: 'Output format'
  },
  size: {
    type: 'number',
    title: 'Size',
    description: 'File size (bytes)'
  }
};

export const ImgProcessorFormRender = (props: FormRenderProps<{ mode: ProcessMode }>) => {
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
      properties: OUTPUT_CONFIG
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