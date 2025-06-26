import { nanoid } from 'nanoid';
import { Field, FieldArray } from '@flowgram.ai/free-layout-editor';
import { ConditionRow, ConditionRowValueType } from '@flowgram.ai/form-materials';
import { Button, Notification } from '@douyinfe/semi-ui';
import { IconPlus, IconCrossCircleStroked } from '@douyinfe/semi-icons';
import { useState, useCallback } from 'react';

import { useNodeRenderContext } from '../../../hooks';
import { FormItem } from '../../../form-components';
import { Feedback } from '../../../form-components';
import { ConditionPort } from './styles';

interface ConditionValue {
  key: string;
  value?: ConditionRowValueType;
}

export function ConditionInputs() {
  const { readonly } = useNodeRenderContext();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleRemove = useCallback(async (field: any, index: number) => {
    // 防止重复点击
    if (isDeleting === index) return;
    
    try {
      setIsDeleting(index);
      
      // 类型和边界检查
      if (!Array.isArray(field.value)) {
        throw new Error('Field value is not an array');
      }
      
      if (index < 0 || index >= field.value.length) {
        throw new Error('Invalid index');
      }

      // 检查是否是最后一个分支
      if (field.value.length <= 1) {
        throw new Error('Cannot delete the last condition branch');
      }

      // 执行删除
      await field.remove(index);
      
    } catch (error: any) {
      console.error('Failed to remove condition branch:', error);
      Notification.error({
        title: 'Error',
        content: error.message || 'Failed to remove condition branch'
      });
    } finally {
      setIsDeleting(null);
    }
  }, [isDeleting]);

  const handleAdd = useCallback(async (field: any) => {
    // 防止重复点击
    if (isAdding) return;
    
    try {
      setIsAdding(true);
      
      // 类型检查
      if (!Array.isArray(field.value)) {
        throw new Error('Field value is not an array');
      }

      // 执行添加
      await field.append({
        key: `if_${nanoid(6)}`,
        value: { type: 'expression', content: '' },
      });
      
    } catch (error: any) {
      console.error('Failed to add condition branch:', error);
      Notification.error({
        title: 'Error',
        content: error.message || 'Failed to add condition branch'
      });
    } finally {
      setIsAdding(false);
    }
  }, [isAdding]);

  return (
    <FieldArray name="conditions">
      {({ field }) => (
        <>
          {field.map((child, index) => (
            <Field<ConditionValue> key={child.name} name={child.name}>
              {({ field: childField, fieldState: childState }) => (
                <FormItem name="if" type="boolean" required={true} labelWidth={40}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ConditionRow
                      readonly={readonly}
                      style={{ flexGrow: 1 }}
                      value={childField.value.value}
                      onChange={(v) => childField.onChange({ value: v, key: childField.value.key })}
                    />

                    <Button
                      theme="borderless"
                      icon={<IconCrossCircleStroked />}
                      onClick={() => handleRemove(field, index)}
                      disabled={readonly || (field.value || []).length <= 1 || isDeleting !== null}
                      style={{ 
                        visibility: (field.value || []).length <= 1 ? 'hidden' : 'visible',
                        opacity: isDeleting === index ? 0.5 : 1
                      }}
                    />
                  </div>

                  <Feedback errors={childState?.errors} invalid={childState?.invalid} />
                  <ConditionPort 
                    data-port-id={childField.value?.key || `if_${nanoid(6)}`} 
                    data-port-type="output" 
                  />
                </FormItem>
              )}
            </Field>
          ))}
          {!readonly && (
            <div>
              <Button
                theme="borderless"
                icon={<IconPlus />}
                disabled={isDeleting !== null || isAdding}
                onClick={() => handleAdd(field)}
                style={{
                  opacity: isAdding ? 0.5 : 1
                }}
              >
                Add
              </Button>
            </div>
          )}
        </>
      )}
    </FieldArray>
  );
}
