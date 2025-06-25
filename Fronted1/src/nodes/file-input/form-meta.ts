// src/nodes/file-input/form-meta.ts 

import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { FlowNodeJSON } from '../../typings';
import { FileInputFormRender } from './file-input-form-render';

export const formMeta: FormMeta<FlowNodeJSON> = {
    render: FileInputFormRender,
    validateTrigger: ValidateTrigger.onChange,
    validate: {
        title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
    },
};