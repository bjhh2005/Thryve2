import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { ImgProcessorFormRender } from './img-processor-form';

export const formMeta: FormMeta = {
  render: ImgProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.inputFile': ({ value }) => {
      if (!value?.content) return 'Please select an image file';
      const ext = value.content.toLowerCase();
      if (!ext.endsWith('.jpg') && !ext.endsWith('.jpeg') && !ext.endsWith('.png') && !ext.endsWith('.gif') && !ext.endsWith('.webp')) {
        return 'File must be an image (jpg, jpeg, png, gif, webp)';
      }
      return undefined;
    },
    'inputsValues.width': ({ value, formValues }) => {
      if (formValues.mode === 'resize' && (!value?.content || value.content < 1)) {
        return 'Width must be a positive number';
      }
      return undefined;
    },
    'inputsValues.height': ({ value, formValues }) => {
      if (formValues.mode === 'resize' && (!value?.content || value.content < 1)) {
        return 'Height must be a positive number';
      }
      return undefined;
    },
    'inputsValues.quality': ({ value, formValues }) => {
      if ((formValues.mode === 'compress' || formValues.mode === 'convert') && 
          (!value?.content || value.content < 1 || value.content > 100)) {
        return 'Quality must be between 1 and 100';
      }
      return undefined;
    },
    'inputsValues.format': ({ value, formValues }) => {
      if (formValues.mode === 'convert' && !value?.content) {
        return 'Please select output format';
      }
      return undefined;
    },
    'inputsValues.angle': ({ value, formValues }) => {
      if (formValues.mode === 'rotate' && (!value?.content || ![-270, -180, -90, 90, 180, 270].includes(value.content))) {
        return 'Please select a valid rotation angle';
      }
      return undefined;
    }
  }
}; 