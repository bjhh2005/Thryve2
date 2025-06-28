import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { CsvProcessorFormRender } from './csv-processor-form';

export const formMeta: FormMeta = {
  render: CsvProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.inputFile': ({ value }) => {
      if (!value?.content) return 'Please select a CSV file';
      if (!value.content.toLowerCase().endsWith('.csv')) return 'File must be a CSV';
      return undefined;
    },
    'inputsValues.delimiter': ({ value, formValues }) => {
      if (formValues.mode === 'read' && !value?.content) {
        return 'Please specify the delimiter';
      }
      return undefined;
    },
    'inputsValues.encoding': ({ value, formValues }) => {
      if (formValues.mode === 'read' && !value?.content) {
        return 'Please specify the encoding';
      }
      return undefined;
    },
    'inputsValues.outputFile': ({ value, formValues }) => {
      if (formValues.mode === 'write' && !value?.content) {
        return 'Please specify the output file';
      }
      return undefined;
    }
  }
}; 