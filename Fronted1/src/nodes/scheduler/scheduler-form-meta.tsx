import {
  Field,
  FieldRenderProps,
  FormRenderProps,
  FormMeta,
  ValidateTrigger
} from '@flowgram.ai/free-layout-editor';
import { JsonSchemaEditor } from '@flowgram.ai/form-materials';
import { Button, Select, InputNumber } from '@douyinfe/semi-ui';
import { FlowNodeJSON, JsonSchema } from '../../typings';
import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs, FormItem, Feedback, FormInputs } from '../../form-components';
import React from 'react';

type SchedulerMode = 'interval';

const SCHEDULER_MODES = [
  {
    label: 'Interval',
    value: 'interval',
  }
];

const MODE_INPUTS = {
  interval: {
    interval: {
      type: 'string',
      description: 'Interval in seconds',
      default: 3,
    },
  },
};


export const SchedulerFormRender = (props: FormRenderProps<{ mode: SchedulerMode }>) => {
  const [key, setKey] = React.useState(0);
  const isSidebar = useIsSidebar();
  const { readonly } = useNodeRenderContext();
  const { form } = props;


  React.useEffect(() => {
    setKey(prev => prev + 1);
    const mode = form.values.mode || 'interval';
    form.setValueIn('inputs', {
      type: 'object',
      required: [...Object.keys(MODE_INPUTS[mode])],
      properties: MODE_INPUTS[mode]
    });
  }, [form.values.mode, form]);

  const handleModeChange = (mode: SchedulerMode) => {
    form.setValueIn('mode', mode);
    setKey(prev => prev + 1);
  };

  const intervalInput = (
    <Field<string> name="interval">
      {({ field, fieldState }) => (
        <FormItem name={'interval'} type={'string'} required={form.values.mode === 'interval'}>
          <InputNumber
            style={{ width: '100%' }}
            value={field.value}
            onChange={(val) => field.onChange(val as string)}
            min={1}
            readonly={readonly}
            suffix="seconds"
          />
          <Feedback errors={fieldState?.errors} />
        </FormItem>
      )}
    </Field>
  );


  const renderInputs = () => {
    switch (form.values.mode) {
      case 'interval':
        return intervalInput;
      default:
        return intervalInput;
    }
  };

  const renderContent = () => (
    <>
      <FormHeader />
      <FormContent>
        {!isSidebar && (
          <Field name="mode">
            {({ field }) => (
              <Select
                value={field.value as string || 'interval'}
                onChange={(value) => handleModeChange(value as SchedulerMode)}
                style={{ width: '100%', marginBottom: 16 }}
                optionList={SCHEDULER_MODES}
              />
            )}
          </Field>
        )}
        <div key={key}>
          {renderInputs()}
          <FormOutputs />
        </div>
      </FormContent>
    </>
  );

  if (isSidebar) {
    return renderContent();
  }

  return renderContent();
};

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: SchedulerFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
    interval: ({ value }: { value: number }) => {
      if (value && value < 1) return 'Interval must be greater than 0 seconds';
      return undefined;
    }
  },
};
