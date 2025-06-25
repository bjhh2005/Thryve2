// src/nodes/file-input/index.ts

import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';
import iconUpload from '../../assets/icon-file-upload.svg';

export const FileInputNodeRegistry: FlowNodeRegistry = {
    type: WorkflowNodeType.FileInput,
    info: {
        icon: iconUpload,
        description: '从本地选择一个文件，作为工作流的输入。', // 描述更新
    },
    meta: {
        size: {
            width: 360,
            height: 300,
        },
    },
    formMeta,
    onAdd() {
        return {
            id: `file_input_${nanoid(5)}`,
            type: WorkflowNodeType.FileInput,
            data: {
                title: '文件输入',
                file: null, // 初始值依然是 null

                // 更新 outputs schema，这是最重要的部分之一
                outputs: {
                    type: 'object',
                    title: '文件引用', // title 更新
                    properties: {
                        // 将 fileId 替换为 filePath
                        filePath: { type: 'string', title: '文件路径' },
                        fileName: { type: 'string', title: '文件名' },
                        mimeType: { type: 'string', title: '文件类型' },
                        size: { type: 'number', title: '文件大小 (字节)' },
                        metadata: { type: 'object', title: '元数据' },
                    },
                    // 更新 required 字段
                    required: ['filePath', 'fileName', 'mimeType', 'size'],
                },
            },
        };
    },
};