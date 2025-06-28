import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { ExportVariableFormRender } from './export-variable-form';

export const formMeta: FormMeta = {
  render: ExportVariableFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.selectedVariable': ({ value }) => {
      if (!value) return 'Please select a variable to export';
      return undefined;
    },
    'inputsValues.exportPath': ({ value }) => {
      if (!value?.content) return 'Please specify the export path';
      return undefined;
    },
    'inputsValues.exportFormat': ({ value }) => {
      if (!value?.content) return 'Please select the export format';
      return undefined;
    }
  }
}; 