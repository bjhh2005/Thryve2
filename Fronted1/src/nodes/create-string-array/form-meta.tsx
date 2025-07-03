import {
  Field,
  FieldArray,
  FieldArrayRenderProps,
  FormRenderProps,
  FormMeta,
  ValidateTrigger,
  FlowNodeJSON,
} from '@flowgram.ai/free-layout-editor';
import { Input, Button } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs, FormItem } from '../../form-components';

interface StringInputNodeJSON extends FlowNodeJSON {
  data: {
    title?: string;
    inputs: {
      inputStrings: string[];
    };
  };
}

const StringInput: React.FC<{
  field: any;
  index: number;
  onRemove?: () => void;
  readonly?: boolean;
}> = ({ field, index, onRemove, readonly }) => {
  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flexGrow: 1 }}>
          <FormItem name={`String${index}`} type="string" required>
            <Input
              value={field.value}
              onChange={field.onChange}
              placeholder={`Input string ${index + 1}`}
              readonly={readonly}
            />
          </FormItem>
        </div>
        {!readonly && onRemove && (
          <Button
            type="danger"
            theme="borderless"
            icon={<IconDelete />}
            onClick={onRemove}
            title="Remove this input"
          />
        )}
      </div>
    </div>
  );
};

export const renderForm = ({ form }: FormRenderProps<StringInputNodeJSON>) => {
  const isSidebar = useIsSidebar();
  const { readonly } = useNodeRenderContext();

  const renderInputs = () => (
    <FieldArray<string> name="inputs.inputStrings">
      {({ field }) => (
        <div key={field.value?.length}>
          {(field.value || []).map((value, index) => (
            <StringInput
              key={`string-input-${index}`}
              field={{
                value: value,
                onChange: (newValue: string) => {
                  const newValues = [...(field.value || [])];
                  newValues[index] = newValue;
                  field.onChange(newValues);
                }
              }}
              index={index}
              onRemove={field.value && field.value.length > 1 ? () => {
                const newValues = (field.value || []).filter((_: any, i: number) => i !== index);
                field.onChange(newValues);
              } : undefined}
              readonly={readonly}
            />
          ))}
          {!readonly && (
            <Button
              type="primary"
              theme="light"
              icon={<IconPlus />}
              onClick={() => {
                const newValues = [...(field.value || []), ''];
                field.onChange(newValues);
              }}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Add an input string
            </Button>
          )}
        </div>
      )}
    </FieldArray>
  );

  if (isSidebar) {
    return (
      <>
        <FormHeader />
        <FormContent>
          {renderInputs()}
          <FormOutputs />
        </FormContent>
      </>
    );
  }

  return (
    <>
      <FormHeader />
      <FormContent>
        {renderInputs()}
        <FormOutputs />
      </FormContent>
    </>
  );
};

export const formMeta: FormMeta<StringInputNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
    'inputs.inputStrings': ({ value }: { value: string[] }) => {
      if (!value || value.length === 0) {
        return 'At least one input string is required';
      }
      return undefined;
    },
  },
};
