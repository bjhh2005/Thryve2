import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';

import { FlowNodeJSON } from '../../typings';
import { FormHeader, FormContent, FormInputs } from '../../form-components';

const renderForm = () => {
  return (
    <>
      <FormHeader />
      <FormContent>
        <FormInputs />
      </FormContent>
    </>
  );
};

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
    sleepTime: ({ value }) => {
      if (typeof value === 'undefined' || value === '') return 'Sleep time is required';
      return undefined;
    },
  },
}; 