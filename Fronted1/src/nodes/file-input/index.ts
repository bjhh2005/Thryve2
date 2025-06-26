// src/nodes/file-input/index.ts

import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';
import iconUpload from '../../assets/icon-file-upload.svg';

export interface FileInputData {
    key: string;
    file: {
        filePath: string;
        fileName: string;
        mimeType: string;
        size: number;
    } | null;
}

export const FileInputNodeRegistry: FlowNodeRegistry = {
    type: WorkflowNodeType.FileInput,
    info: {
        icon: iconUpload,
        description: 'Select multiple files as workflow inputs.',
    },
    meta: {
        defaultPorts: [
            { type: 'input' },
            { type: 'output' }
        ],
        useDynamicPort: true,
        expandable: true,
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
                title: ''
            },
            files: [],
            outputs: {
                type: 'object',
                properties: {}
            }
        };
    }
};