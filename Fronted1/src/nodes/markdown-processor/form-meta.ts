import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { MarkdownProcessorFormRender } from './markdown-processor-form';

export const formMeta: FormMeta = {
  render: MarkdownProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.inputContent': ({ value }) => {
      if (!value?.content) return 'Please provide Markdown content';
      return undefined;
    },
    'inputsValues.templateFile': ({ value, formValues }) => {
      if (formValues.mode === 'template' && !value?.content) {
        return 'Please select a template file';
      }
      return undefined;
    },
    'inputsValues.variables': ({ value, formValues }) => {
      if (formValues.mode === 'template' && value?.content) {
        try {
          JSON.parse(value.content);
          return undefined;
        } catch (e) {
          return 'Invalid JSON format for variables';
        }
      }
      return undefined;
    },
    'inputsValues.cssFile': ({ value, formValues }) => {
      if (formValues.mode === 'export' && value?.content) {
        if (!value.content.toLowerCase().endsWith('.css')) {
          return 'File must be a CSS file';
        }
      }
      return undefined;
    },
    'inputsValues.outputFormat': ({ value, formValues }) => {
      if (formValues.mode === 'export' && !value?.content) {
        return 'Please select an output format';
      }
      return undefined;
    }
  }
}; 