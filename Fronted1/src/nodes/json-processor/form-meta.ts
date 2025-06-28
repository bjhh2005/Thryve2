import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { JsonProcessorFormRender } from './json-processor-form';

export const formMeta: FormMeta = {
  render: JsonProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.inputData': ({ value }) => {
      if (!value?.content) return 'Please provide JSON data';
      try {
        JSON.parse(value.content);
        return undefined;
      } catch (e) {
        return 'Invalid JSON format';
      }
    },
    'inputsValues.path': ({ value, formValues }) => {
      if (formValues.mode === 'query' && !value?.content) {
        return 'Please specify the JSON path';
      }
      return undefined;
    },
    'inputsValues.newValue': ({ value, formValues }) => {
      if (formValues.mode === 'update' && !value?.content) {
        return 'Please specify the new value';
      }
      return undefined;
    },
    'inputsValues.schema': ({ value, formValues }) => {
      if (formValues.mode === 'validate' && !value?.content) {
        return 'Please provide JSON schema';
      }
      try {
        if (formValues.mode === 'validate' && value?.content) {
          JSON.parse(value.content);
        }
        return undefined;
      } catch (e) {
        return 'Invalid JSON schema format';
      }
    }
  }
}; 