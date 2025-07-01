import { nanoid } from 'nanoid';
import { FlowNodeRegistry } from '../../typings';
import iconFolder from '../../assets/icon-folder.png';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';

let index = 0;

export const FolderInputRegistry: FlowNodeRegistry = {
    type: WorkflowNodeType.FolderInput,
    meta: {
        deleteDisable: false,
        copyDisable: false,
        defaultPorts: [
            { type: 'input' },
            { type: 'output' }
        ],
        size: {
            width: 360,
            height: 211,
        },
    },
    info: {
        icon: iconFolder,
        description: 'Select a folder and get its path and files list',
    },
    formMeta,
    onAdd() {
        return {
            id: `folder_input_${nanoid(5)}`,
            type: 'folder-input',
            data: {
                title: `Folder Input_${++index}`,
                folders: [{
                    id: `folder_${nanoid(6)}`,
                    folder: null,
                    variableName: 'folder_1'
                }],
                outputs: {
                    type: 'object',
                    properties: {}
                }
            }
        };
    },
    canAdd() {
        return true;
    },
}; 