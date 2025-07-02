import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { ExportVariableFormRender } from './export-variable-form';

export const formMeta: FormMeta = {
  render: ExportVariableFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.selectedVariable': ({ value }) => {
      if (!value?.content) return 'Please select a variable to export';
      return undefined;
    },
    'inputsValues.outputFolder': ({ value }) => {
      if (!value?.content) return 'Please select output folder';
      return undefined;
    },
    'inputsValues.outputName': ({ value }) => {
      if (!value?.content) return 'Please enter output file name';
      return undefined;
    },
    'inputsValues.exportFormat': ({ value }) => {
      if (!value?.content) return 'Please select export format';
      return undefined;
    }
  }
}; 