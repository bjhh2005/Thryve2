import { FlowDocumentJSON } from './typings';

export const initialData: FlowDocumentJSON = {
    nodes: [
        {
            id: 'start_0',
            type: 'start',
            meta: {
                position: {
                    x: 180,
                    y: 428.2,
                },
            },
            data: {
                title: 'Start',
                outputs: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            default: 'Hello Flow.',
                        },
                        enable: {
                            type: 'boolean',
                            default: true,
                        },
                        array_obj: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    int: {
                                        type: 'number',
                                    },
                                    str: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            id: 'end_0',
            type: 'end',
            meta: {
                position: {
                    x: 3040,
                    y: 428.2,
                },
            },
            data: {
                title: 'End',
                inputs: {
                    type: 'object',
                    properties: {
                        result: {
                            type: 'string',
                        },
                    },
                },
            },
        },
        {
            id: 'loop_5F6lD',
            type: 'loop',
            meta: {
                position: {
                    x: 970,
                    y: 105,
                },
            },
            data: {
                title: 'Loop_1',
                mode: 'array',
                inputs: {
                    type: 'object',
                    required: [
                        'batchFor',
                    ],
                    properties: {
                        batchFor: {
                            type: 'array',
                        },
                    },
                },
                batchFor: {
                    type: 'ref',
                },
            },
            blocks: [
                {
                    id: 'start_4Y-fU',
                    type: 'start',
                    meta: {
                        position: {
                            x: 180,
                            y: 309.2,
                        },
                    },
                    data: {
                        title: 'Start_1',
                        outputs: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    default: 'Hello Flow.',
                                },
                                enable: {
                                    type: 'boolean',
                                    default: true,
                                },
                            },
                        },
                    },
                },
                {
                    id: 'condition_LB_U4',
                    type: 'condition',
                    meta: {
                        position: {
                            x: 640,
                            y: 245.59999999999997,
                        },
                    },
                    data: {
                        title: 'Condition_1',
                        conditions: [
                            {
                                value: {
                                    left: {
                                        type: 'ref',
                                    },
                                },
                                key: 'if_VjSM0',
                            },
                            {
                                key: 'if_oGx2z',
                                value: {},
                            },
                        ],
                    },
                },
                {
                    id: 'pdf_processor_PLAk9',
                    type: 'pdf-processor',
                    meta: {
                        position: {
                            x: 1100,
                            y: 0,
                        },
                    },
                    data: {
                        title: 'PDF Processor_1',
                        mode: 'extract',
                        inputs: {
                            type: 'object',
                            required: [
                                'inputFile',
                                'inputFile',
                                'pageRange',
                                'extractImages',
                                'outputFolder',
                                'outputName',
                            ],
                            properties: {
                                inputFile: {
                                    type: 'string',
                                    title: 'PDF File',
                                    description: 'Select PDF file',
                                },
                                pageRange: {
                                    type: 'string',
                                    title: 'Page Range',
                                    description: 'Pages to extract (e.g., 1-5)',
                                    default: '',
                                },
                                extractImages: {
                                    type: 'boolean',
                                    title: 'Extract Images',
                                    description: 'Include images',
                                    default: false,
                                },
                                outputFolder: {
                                    type: 'string',
                                    title: 'Output Folder',
                                    description: 'Save location',
                                },
                                outputName: {
                                    type: 'string',
                                    title: 'Output Name',
                                    description: 'File name',
                                },
                            },
                        },
                        outputs: {
                            type: 'object',
                            properties: {
                                text: {
                                    type: 'string',
                                    description: 'Extracted text content',
                                },
                                images: {
                                    type: 'array',
                                    description: 'Extracted images (if enabled)',
                                },
                            },
                        },
                        inputsValues: {
                            pageRange: '',
                            extractImages: false,
                        },
                    },
                },
                {
                    id: 'img_processor_lXfgI',
                    type: 'img-processor',
                    meta: {
                        position: {
                            x: 1100,
                            y: 386.3999999999999,
                        },
                    },
                    data: {
                        title: 'Image Processor_1',
                        mode: 'resize',
                        inputs: {
                            type: 'object',
                            required: [
                                'inputFile',
                                'inputFile',
                                'width',
                                'height',
                                'maintainAspectRatio',
                                'outputFolder',
                                'outputName',
                            ],
                            properties: {
                                inputFile: {
                                    type: 'string',
                                    title: 'Input Image',
                                    description: 'Select image file',
                                },
                                width: {
                                    type: 'number',
                                    title: 'Width',
                                    description: 'Width (px) > 0',
                                    minimum: 1,
                                },
                                height: {
                                    type: 'number',
                                    title: 'Height',
                                    description: 'Height (px) > 0',
                                    minimum: 1,
                                },
                                maintainAspectRatio: {
                                    type: 'boolean',
                                    title: 'Aspect Ratio',
                                    description: 'Keep aspect ratio',
                                },
                                outputFolder: {
                                    type: 'string',
                                    title: 'Output Folder',
                                    description: 'Save location',
                                },
                                outputName: {
                                    type: 'string',
                                    title: 'Output Name',
                                    description: 'File name',
                                },
                            },
                        },
                        outputs: {
                            type: 'object',
                            properties: {
                                processedImage: {
                                    type: 'string',
                                    title: 'Image',
                                    description: 'Output path',
                                },
                                width: {
                                    type: 'number',
                                    title: 'Width',
                                    description: 'Output width',
                                },
                                height: {
                                    type: 'number',
                                    title: 'Height',
                                    description: 'Output height',
                                },
                                format: {
                                    type: 'string',
                                    title: 'Format',
                                    description: 'Output format',
                                },
                                size: {
                                    type: 'number',
                                    title: 'Size',
                                    description: 'File size (bytes)',
                                },
                            },
                        },
                    },
                },
                {
                    id: 'end_Wg_s3',
                    type: 'end',
                    meta: {
                        position: {
                            x: 1560,
                            y: 309.2,
                        },
                    },
                    data: {
                        title: 'End_1',
                        inputs: {
                            type: 'object',
                            properties: {
                                result: {
                                    type: 'string',
                                    description: '工作流的最终结果',
                                },
                            },
                        },
                    },
                },
            ],
            edges: [
                {
                    sourceNodeID: 'start_4Y-fU',
                    targetNodeID: 'condition_LB_U4',
                },
                {
                    sourceNodeID: 'condition_LB_U4',
                    targetNodeID: 'pdf_processor_PLAk9',
                    sourcePortID: 'if_VjSM0',
                },
                {
                    sourceNodeID: 'condition_LB_U4',
                    targetNodeID: 'img_processor_lXfgI',
                    sourcePortID: 'if_oGx2z',
                },
                {
                    sourceNodeID: 'pdf_processor_PLAk9',
                    targetNodeID: 'end_Wg_s3',
                },
                {
                    sourceNodeID: 'img_processor_lXfgI',
                    targetNodeID: 'end_Wg_s3',
                },
            ],
        },
        {
            id: 'folder_input_4MNKU',
            type: 'folder-input',
            meta: {
                position: {
                    x: 640,
                    y: 366.4,
                },
            },
            data: {
                title: 'Folder Input_2',
                folders: [
                    {
                        id: 'folder_XP_0QV',
                        folder: null,
                        variableName: 'folder_1',
                    },
                ],
                outputs: {
                    type: 'object',
                    properties: {},
                },
            },
        },
    ],
    edges: [
        {
            sourceNodeID: 'start_0',
            targetNodeID: 'folder_input_4MNKU',
        },
        {
            sourceNodeID: 'loop_5F6lD',
            targetNodeID: 'end_0',
        },
        {
            sourceNodeID: 'folder_input_4MNKU',
            targetNodeID: 'loop_5F6lD',
        },
    ],
};
