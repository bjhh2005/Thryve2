import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { TextProcessorFormRender } from './text-processor-form';

export const formMeta: FormMeta = {
  render: TextProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.inputFile': ({ value }) => {
      if (!value?.content) return 'Please select an input file';
      return undefined;
    },
    'inputsValues.content': ({ value, formValues }) => {
      const mode = formValues.mode;
      if ((mode === 'append' || mode === 'write') && !value?.content) {
        return 'Please enter the content to process';
      }
      return undefined;
    },
    'inputsValues.searchText': ({ value, formValues }) => {
      if (formValues.mode === 'replace' && !value?.content) {
        return 'Please enter the text to search for';
      }
      return undefined;
    },
    'inputsValues.replaceText': ({ value, formValues }) => {
      if (formValues.mode === 'replace' && !value?.content) {
        return 'Please enter the text to replace with';
      }
      return undefined;
    },
    'inputsValues.minLength': ({ value, formValues }) => {
      if (formValues.mode === 'wordFreq' && (value?.content < 1 || !Number.isInteger(value?.content))) {
        return 'Minimum word length must be a positive integer';
      }
      return undefined;
    }
  }
}; 