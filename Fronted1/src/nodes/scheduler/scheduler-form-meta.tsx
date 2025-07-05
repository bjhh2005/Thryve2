import { FormRenderProps, FlowNodeJSON, Field, FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { IFlowRefValue } from '@flowgram.ai/form-materials';
import { Select, InputNumber, Switch, Input } from '@douyinfe/semi-ui';
import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs, FormItem, Feedback, FormInputs } from '../../form-components';
import React from 'react';

type SchedulerMode = 'interval' | 'cron';

const SCHEDULER_MODES = [{
  label: 'Interval',
  value: 'interval',
}, {
  label: 'Cron',
  value: 'cron',
}];

const MODE_INPUTS: Record<SchedulerMode, Record<string, { type: string, description: string }>> = {
  interval: {
    opened: {
      type: 'boolean',
      description: 'Opened',
    },
    interval: {
      type: 'number',
      description: 'Interval in seconds',
    },
  },
  cron: {
    opened: {
      type: 'boolean',
      description: 'Opened',
    },
    cron: {
      type: 'string',
      description: 'Cron expression',
    },
  },
};

interface SchedulerNodeJSON extends FlowNodeJSON {
  data: {
    mode: SchedulerMode;
    opened?: boolean;
    interval?: number;
    cron?: string;
  };
}

export const SchedulerFormRender = (props: FormRenderProps<SchedulerNodeJSON>) => {
  const { form } = props;
  const [key, setKey] = React.useState(0);

  React.useEffect(() => {
    const mode = form.values?.data?.mode || 'interval';
    setKey(prev => prev + 1);
    form.setValueIn('inputs', {
      type: 'object',
      required: [...Object.keys(MODE_INPUTS[mode as SchedulerMode])],
      properties: MODE_INPUTS[mode as SchedulerMode]
    });
  }, [form.values?.data?.mode, form]);

  const handleModeChange = (mode: SchedulerMode) => {
    form.setValueIn('data.mode', mode);
    setKey(prev => prev + 1);
  };

  return (
    <>
      <FormHeader />
      <FormContent>
        <Field name="data.mode">
          {({ field }) => (
            <Select
              value={field.value as string || 'interval'}
              onChange={(value) => handleModeChange(value as SchedulerMode)}
              style={{ width: '100%', marginBottom: 16 }}
              optionList={SCHEDULER_MODES as any}
            />
          )}
        </Field>
        <div key={key}>
          <FormInputs />
          <FormOutputs />
        </div>
      </FormContent>
    </>
  );
};

export const formMeta: FormMeta<SchedulerNodeJSON> = {
  render: SchedulerFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'title is required'),
    interval: ({ value }: { value: number }) => {
      if (value && value < 1) return 'interval is required';
      return undefined;
    },
    cron: ({ value }: { value: string }) => {
      if (!value) return 'cron is required';
      return undefined;
    },
  },
}; 