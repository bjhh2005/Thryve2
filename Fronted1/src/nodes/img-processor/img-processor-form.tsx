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
      description: 'Select image to resize'
    },
    width: {
      type: 'number',
      title: 'Width',
      description: 'New width in pixels',
      minimum: 1
    },
    height: {
      type: 'number',
      title: 'Height',
      description: 'New height in pixels',
      minimum: 1
    },
    maintainAspectRatio: {
      type: 'boolean',
      title: 'Maintain Aspect Ratio',
      description: 'Keep original aspect ratio',
      default: true
    }
  },
  compress: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image to compress'
    },
    quality: {
      type: 'number',
      title: 'Quality',
      description: 'Compression quality (1-100)',
      minimum: 1,
      maximum: 100,
      default: 80
    }
  },
  convert: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image to convert'
    },
    format: {
      type: 'string',
      title: 'Output Format',
      description: 'Select target format',
      enum: IMAGE_FORMATS.map(format => format.value),
      default: 'jpeg'
    },
    quality: {
      type: 'number',
      title: 'Quality',
      description: 'Output quality (1-100)',
      minimum: 1,
      maximum: 100,
      default: 90
    }
  },
  rotate: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image to rotate'
    },
    angle: {
      type: 'number',
      title: 'Rotation Angle',
      description: 'Select rotation angle',
      enum: ROTATION_ANGLES.map(angle => angle.value),
      default: 90
    }
  },
  crop: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image to crop'
    },
    x: {
      type: 'number',
      title: 'X Position',
      description: 'Starting X coordinate',
      minimum: 0
    },
    y: {
      type: 'number',
      title: 'Y Position',
      description: 'Starting Y coordinate',
      minimum: 0
    },
    width: {
      type: 'number',
      title: 'Width',
      description: 'Crop width in pixels',
      minimum: 1
    },
    height: {
      type: 'number',
      title: 'Height',
      description: 'Crop height in pixels',
      minimum: 1
    }
  },
  filter: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image to apply filter'
    },
    filterType: {
      type: 'string',
      title: 'Filter Type',
      description: 'Select filter effect',
      enum: FILTER_EFFECTS.map(effect => effect.value),
      default: 'grayscale'
    },
    intensity: {
      type: 'number',
      title: 'Intensity',
      description: 'Filter intensity (1-100)',
      minimum: 1,
      maximum: 100,
      default: 50
    }
  },
  watermark: {
    inputFile: {
      type: 'string',
      title: 'Input Image',
      description: 'Select image to watermark'
    },
    watermarkText: {
      type: 'string',
      title: 'Watermark Text',
      description: 'Text to use as watermark'
    },
    fontSize: {
      type: 'number',
      title: 'Font Size',
      description: 'Watermark font size in pixels',
      minimum: 1,
      default: 24
    },
    opacity: {
      type: 'number',
      title: 'Opacity',
      description: 'Watermark opacity (1-100)',
      minimum: 1,
      maximum: 100,
      default: 50
    },
    position: {
      type: 'string',
      title: 'Position',
      description: 'Watermark position',
      enum: ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
      default: 'bottomRight'
    }
  }
};

// 输出配置
const OUTPUT_CONFIG = {
  processedImage: {
    type: 'string',
    title: 'Processed Image',
    description: 'Path to the processed image'
  },
  width: {
    type: 'number',
    title: 'Width',
    description: 'Width of processed image'
  },
  height: {
    type: 'number',
    title: 'Height',
    description: 'Height of processed image'
  },
  format: {
    type: 'string',
    title: 'Format',
    description: 'Format of processed image'
  },
  size: {
    type: 'number',
    title: 'File Size',
    description: 'Size of processed image in bytes'
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