import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { FolderInputFormRender } from './folder-input-form-render';

export const formMeta: FormMeta = {
    render: FolderInputFormRender,
    validateTrigger: ValidateTrigger.onChange,
    validate: {
        title: ({ value }) => (value ? undefined : 'Title is required'),
        'folders.*.folderPath': ({ value }) => {
            if (!value) return 'Please select a folder';
            return undefined;
        },
        'folders.*.variableName': ({ value, formValues }) => {
            if (!value) return 'Variable name is required';
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
                return 'Variable name must start with a letter or underscore and can only contain letters, numbers, and underscores';
            }
            // 检查变量名是否重复
            const folders = formValues?.data?.folders || [];
            const count = folders.filter((f: any) => f.variableName === value).length;
            if (count > 1) {
                return 'Variable name must be unique';
            }
            return undefined;
        }
    }
}; 