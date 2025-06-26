// src/nodes/file-input/form-meta.ts 

import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { FlowNodeJSON } from '../../typings';
import { FileInputFormRender } from './file-input-form-render.tsx';

export const formMeta: FormMeta<FlowNodeJSON> = {
    render: FileInputFormRender,
    validateTrigger: ValidateTrigger.onChange,
    validate: {
        title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
        'files.*.file': ({ value }) => {
            if (!value) return 'Please select a file';
            
            // 验证文件对象的结构
            const { filePath, fileName, mimeType, size } = value;
            if (!filePath || typeof filePath !== 'string') return 'Invalid file path';
            if (!fileName || typeof fileName !== 'string') return 'Invalid file name';
            if (!mimeType || typeof mimeType !== 'string') return 'Invalid MIME type';
            if (typeof size !== 'number') return 'Invalid file size';
            
            return undefined;
        },
        'files.*.variableName': ({ value, formValues }) => {
            if (!value) return 'Variable name is required';
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                return 'Variable name must start with a letter or underscore and can only contain letters, numbers, and underscores';
            }
            // 检查变量名是否重复
            const files = formValues?.data?.files || [];
            const count = files.filter((f: any) => f.variableName === value).length;
            if (count > 1) {
                return 'Variable name must be unique';
            }
            return undefined;
        },
    },
};