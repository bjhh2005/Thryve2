import {
  Field,
  FieldArray,
  FieldArrayRenderProps,
  FormRenderProps,
  FormMeta,
  ValidateTrigger,
  FlowNodeJSON,
} from '@flowgram.ai/free-layout-editor';
import { Input, Button, Notification } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs, FormItem } from '../../form-components';
import React, { useCallback, useMemo, useState } from 'react';

interface StringInputNodeJSON extends FlowNodeJSON {
  data: {
    title?: string;
    inputs: {
      inputStrings: string[];
    };
  };
}

const StringInput = React.memo<{
  field: any;
  index: number;
  onRemove?: () => void;
  readonly?: boolean;
}>(({ field, index, onRemove, readonly }) => {
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
});

export const renderForm = ({ form }: FormRenderProps<StringInputNodeJSON>) => {
  const isSidebar = useIsSidebar();
  const { readonly } = useNodeRenderContext();
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleAdd = useCallback(async (field: any) => {
    if (isAdding) return;
    
    try {
      setIsAdding(true);
      
      if (!field.value) {
        await field.onChange([]);
      }
      
      const newValues = [...(field.value || []), ''];
      await field.onChange(newValues);
      
    } catch (error: any) {
      console.error('Failed to add string input:', error);
      Notification.error({
        title: 'Error',
        content: error.message || 'Failed to add string input'
      });
    } finally {
      setIsAdding(false);
    }
  }, [isAdding]);

  const handleRemove = useCallback(async (field: any, index: number) => {
    if (isDeleting === index) return;
    
    try {
      setIsDeleting(index);
      
      if (!Array.isArray(field.value)) {
        throw new Error('Field value is not an array');
      }
      
      if (index < 0 || index >= field.value.length) {
        throw new Error('Invalid index');
      }

      if (field.value.length <= 1) {
        throw new Error('Cannot delete the last string input');
      }

      const newValues = field.value.filter((_: any, i: number) => i !== index);
      await field.onChange(newValues);
      
    } catch (error: any) {
      console.error('Failed to remove string input:', error);
      Notification.error({
        title: 'Error',
        content: error.message || 'Failed to remove string input'
      });
    } finally {
      setIsDeleting(null);
    }
  }, [isDeleting]);

  const renderInputs = useCallback(() => (
    <FieldArray<string> name="inputs.inputStrings">
      {({ field }) => {
        const inputs = useMemo(() => (
          (field.value || []).map((value, index) => (
            <StringInput
              key={`string-input-${index}-${value}`}
              field={{
                value: value,
                onChange: (newValue: string) => {
                  const newValues = [...(field.value || [])];
                  newValues[index] = newValue;
                  field.onChange(newValues);
                }
              }}
              index={index}
              onRemove={field.value && field.value.length > 1 ? () => handleRemove(field, index) : undefined}
              readonly={readonly}
            />
          ))
        ), [field.value, handleRemove, readonly]);

        return (
          <div>
            {inputs}
            {!readonly && (
              <Button
                type="primary"
                theme="light"
                icon={<IconPlus />}
                onClick={() => handleAdd(field)}
                disabled={isDeleting !== null || isAdding}
                style={{ 
                  width: '100%', 
                  marginTop: '8px',
                  opacity: isAdding ? 0.5 : 1
                }}
              >
                Add an input string
              </Button>
            )}
          </div>
        );
      }}
    </FieldArray>
  ), [readonly, handleAdd, handleRemove, isAdding, isDeleting]);

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
