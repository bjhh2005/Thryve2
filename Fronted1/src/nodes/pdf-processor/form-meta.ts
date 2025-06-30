import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { PdfProcessorFormRender } from './pdf-processor-form';

export const formMeta: FormMeta = {
  render: PdfProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.inputFile': ({ value }) => {
      if (!value?.content) return 'Please select a PDF file';
      if (!value.content.toLowerCase().endsWith('.pdf')) {
        return 'File must be a PDF';
      }
      return undefined;
    },
    'inputsValues.pageRange': ({ value, formValues }) => {
      if (formValues.mode === 'extract' && value?.content) {
        const range = value.content.split('-').map(Number);
        if (range.length !== 2 || isNaN(range[0]) || isNaN(range[1]) || range[0] > range[1]) {
          return 'Invalid page range format (e.g., 1-5)';
        }
      }
      return undefined;
    },
    'inputsValues.password': ({ value, formValues }) => {
      if (formValues.mode === 'decrypt' && !value?.content) {
        return 'Password is required for decryption';
      }
      return undefined;
    },
    'inputsValues.watermarkText': ({ value, formValues }) => {
      if (formValues.mode === 'watermark' && !value?.content) {
        return 'Watermark text is required';
      }
      return undefined;
    },
    'inputsValues.outputFormat': ({ value, formValues }) => {
      if (formValues.mode === 'convert' && !value?.content) {
        return 'Output format is required';
      }
      return undefined;
    },
    'inputsValues.outputFolder': ({ value }) => {
      if (!value?.content) return 'Please select output folder';
      return undefined;
    },
    'inputsValues.outputName': ({ value }) => {
      if (!value?.content) return 'Please enter output file name';
      return undefined;
    }
  }
}; 