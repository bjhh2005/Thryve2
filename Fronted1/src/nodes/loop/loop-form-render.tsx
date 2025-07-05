import { FormRenderProps, FlowNodeJSON, Field } from '@flowgram.ai/free-layout-editor';
import { SubCanvasRender } from '@flowgram.ai/free-container-plugin';
import { BatchVariableSelector, IFlowRefValue } from '@flowgram.ai/form-materials';
import { Select, InputNumber } from '@douyinfe/semi-ui';
import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs, FormItem, Feedback, FormInputs } from '../../form-components';
import React from 'react';

type LoopMode = 'array' | 'times';

const LOOP_MODES = [{
  label: 'Array-based',
  value: 'array',
}, {
  label: 'Times-based',
  value: 'times',
}];

const MODE_INPUTS = {
  array: {
    batchFor: {
      type: 'array',
    },
  },
  times: {
    times: {
      type: 'number',
    },
  },
};

interface LoopNodeJSON extends FlowNodeJSON {
  data: {
    batchFor?: IFlowRefValue;
    times?: number;
    mode: LoopMode;
    blocks?: FlowNodeJSON[];
  };
}

export const LoopFormRender = (props: FormRenderProps<{ mode: LoopMode }>) => {
  const formHeight = 85;
  const { form } = props;
  const [key, setKey] = React.useState(0);
  const isSidebar = useIsSidebar();
  const { readonly } = useNodeRenderContext();

  React.useEffect(() => {
    setKey(prev => prev + 1);
    const mode = form.values.mode || 'array';
    form.setValueIn('inputs', {
      type: 'object',
      required: [...Object.keys(MODE_INPUTS[mode])],
      properties: MODE_INPUTS[mode]
    });
  }, [form.values.mode, form]);

  const handleModeChange = (mode: LoopMode) => {
    form.setValueIn('mode', mode);
    setKey(prev => prev + 1);
  };

  const batchFor = (
    <Field<IFlowRefValue> name={`batchFor`}>
      {({ field, fieldState }) => (
        <FormItem name={'batchFor'} type={'array'} required={form.values.mode !== 'times'}>
          <BatchVariableSelector
            style={{ width: '100%' }}
            value={field.value?.content}
            onChange={(val) => field.onChange({ type: 'ref', content: val })}
            readonly={readonly}
            hasError={fieldState?.errors && Object.keys(fieldState.errors).length > 0}
          />
          <Feedback errors={fieldState?.errors} />
        </FormItem>
      )}
    </Field>
  );

  const timesInput = (
    <Field<number> name="times">
      {({ field, fieldState }) => (
        <FormItem name={'times'} type={'number'} required={form.values.mode !== 'array'}>
          <InputNumber
            style={{ width: '100%' }}
            value={field.value}
            onChange={(val) => field.onChange(Number(val))}
            min={1}
            readonly={readonly}
          />
          <Feedback errors={fieldState?.errors} />
        </FormItem>
      )}
    </Field>
  );

  const renderInputs = () => {
    switch (form.values.mode) {
      case 'array':
        return batchFor;
      case 'times':
        return timesInput;
      default:
        return batchFor;
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
                value={field.value as string || 'array'}
                onChange={(value) => handleModeChange(value as LoopMode)}
                style={{ width: '100%', marginBottom: 16 }}
                optionList={LOOP_MODES as any}
              />
            )}
          </Field>
        )}
        <div key={key}>
          {renderInputs()}
          <FormOutputs />
        </div>
      </FormContent>
      <Field name="blocks">
        {({ field }) => (
          <SubCanvasRender offsetY={-formHeight} />
        )}
      </Field>
    </>
  );

  if (isSidebar) {
    return renderContent();
  }

  return renderContent();
};
