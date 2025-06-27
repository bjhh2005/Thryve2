import { FC } from 'react';

// 编辑器表单系统中的字段组件，用于绑定字段值（支持自动收集与更新）
import { Field } from '@flowgram.ai/free-layout-editor';

// 一个自定义组件，用来展示字段名和字段类型（如 name: string）
import { TypeTag } from '../type-tag';
import { JsonSchema } from '../../typings';
import { useIsSidebar } from '../../hooks';
import { FormOutputsContainer } from './styles';

interface FormOutputsProps {
  name?: string;
}

export const FormOutputs: FC<FormOutputsProps> = ({ name = 'outputs' }) => {
  const isSidebar = useIsSidebar();
  if (isSidebar) {
    return null;
  }
  return (
    <Field<JsonSchema> name={name}>
      {({ field }) => {
        const properties = field.value?.properties;
        if (properties) {
          const content = Object.keys(properties).map((key) => {
            const property = properties[key];
            return <TypeTag key={key} name={key} type={property.type as string} />;
          });
          return <FormOutputsContainer>{content}</FormOutputsContainer>;
        }
        return <></>;
      }}
    </Field>
  );
};
