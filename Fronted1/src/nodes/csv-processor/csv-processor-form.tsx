import React from 'react';
import { FormContent } from '../../form-components/form-content';
import { FormInputs } from '../../form-components/form-inputs';
import { FormHeader } from '../../form-components/form-header';

export const CsvProcessorFormRender: React.FC<{
  properties: Record<string, any>;
  onChange: (properties: Record<string, any>) => void;
}> = () => {
  return (
    <>
      <FormHeader />
      <FormContent>
        <FormInputs />
      </FormContent>
    </>
  );
}; 