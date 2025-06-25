import { nanoid } from 'nanoid';
import { Field, FieldArray } from '@flowgram.ai/free-layout-editor';
import { ConditionRow, ConditionRowValueType } from '@flowgram.ai/form-materials';
import { Button } from '@douyinfe/semi-ui';
import { IconPlus, IconCrossCircleStroked } from '@douyinfe/semi-icons';

import { useNodeRenderContext } from '../../../hooks';
import { FormItem } from '../../../form-components';
import { Feedback } from '../../../form-components';
import { ConditionPort } from './styles';

interface ConditionValue {
  key: string;
  value?: ConditionRowValueType;
}

const createDefaultCondition = () => ({
  key: `if_${nanoid(6)}`,
  value: { type: 'expression', content: '' },
});

export function ConditionInputs() {
  const { readonly } = useNodeRenderContext();
  return (
    <FieldArray name="conditions">
      {({ field }) => {
        // 确保 field.value 是数组
        const conditions = Array.isArray(field.value) ? field.value : [];
        
        // 如果没有条件分支，自动添加一个默认分支
        if (conditions.length === 0) {
          field.append(createDefaultCondition());
        }

        return (
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

                      {/* 只有当有多个分支时才显示删除按钮 */}
                      {conditions.length > 1 && (
                        <Button
                          theme="borderless"
                          icon={<IconCrossCircleStroked />}
                          onClick={() => field.delete(index)}
                        />
                      )}
                    </div>

                    <Feedback errors={childState?.errors} invalid={childState?.invalid} />
                    <ConditionPort data-port-id={childField.value.key} data-port-type="output" />
                  </FormItem>
                )}
              </Field>
            ))}
            {!readonly && (
              <div>
                <Button
                  theme="borderless"
                  icon={<IconPlus />}
                  onClick={() => field.append(createDefaultCondition())}
                >
                  Add
                </Button>
              </div>
            )}
          </>
        );
      }}
    </FieldArray>
  );
}
