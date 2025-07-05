import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';

import { FlowNodeJSON } from '../../typings';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';

const renderForm = () => {
  return (
    <>
      <FormHeader />
      <FormContent>
        <FormInputs />
        <FormOutputs />
      </FormContent>
    </>
  );
};

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
    'inputsValues.target_workflow': ({ value }) => {
      if (!value || !value.content) {
        return 'Target workflow is required';
      }
      return undefined;
    },
  },
}; 