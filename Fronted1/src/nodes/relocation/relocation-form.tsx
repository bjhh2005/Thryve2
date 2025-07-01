import React from 'react';
import { FormContent } from '../../form-components/form-content';
import { FormHeader } from '../../form-components/form-header';
import { FormItem } from '../../form-components/form-item';

export const RelocationFormRender: React.FC<{
  properties: Record<string, any>;
  onChange: (properties: Record<string, any>) => void;
}> = ({ properties, onChange }) => {
  return (
    <>
      <FormHeader />
      <FormContent>
        <div>
          <FormItem name="sourceVariable" type="string">
            <input
              type="text"
              value={properties.input1 || ''}
              onChange={(e) =>
                onChange({ ...properties, input1: e.target.value })
              }
              placeholder="Please enter the source variable"
            />
          </FormItem>
          <FormItem name="targetVariable" type="string">
            <input
              type="text"
              value={properties.input2 || ''}
              onChange={(e) =>
                onChange({ ...properties, input2: e.target.value })
              }
              placeholder="Please enter the target variable"
            />
          </FormItem>
        </div>
      </FormContent>
    </>
  );
}; 