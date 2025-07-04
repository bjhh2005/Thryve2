import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconLLM from '../../assets/icon-llm.jpg';

let index = 0;
export const LLMNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.LLM,
  info: {
    icon: iconLLM,
    description:
      'Call the large language model and use variables and prompt words to generate responses.',
  },
  meta: {
    size: {
      width: 360,
      height: 300,
    },
  },
  onAdd() {
    return {
      id: `llm_${nanoid(5)}`,
      type: 'llm',
      data: {
        title: `LLM_${++index}`,
        inputsValues: {
          modelName: {
            type: 'constant',
            content: 'gpt-3.5-turbo',
          },
          apiKey: {
            type: 'constant',
            content: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          },
          apiHost: {
            type: 'constant',
            content: 'https://mock-ai-url/api/v3',
          },
          temperature: {
            type: 'constant',
            content: 0.5,
          },
          systemPrompt: {
            type: 'constant',
            content: 'You are an AI assistant.',
          },
          prompt: {
            type: 'constant',
            content: '',
          },
          outputFolder: {
            type: 'constant',
            content: '',
          },
          outputName: {
            type: 'constant',
            content: '',
          },
        },
        inputs: {
          type: 'object',
          required: ['modelName', 'apiKey', 'apiHost', 'temperature', 'prompt'],
          properties: {
            inputFiles: {
              type: 'array',
              description: 'The files to process.',
              items: {
                type: 'string',
              },
            },
            modelName: {
              type: 'string',
              description: 'The name of the model to use.',
            },
            apiKey: {
              type: 'string',
              description: 'The API key to use.',
            },
            apiHost: {
              type: 'string',
              description: 'The API host to use.',
            },
            temperature: {
              type: 'number',
              description: 'The temperature to use.',
            },
            systemPrompt: {
              type: 'string',
              description: 'The system prompt to use.',
            },
            prompt: {
              type: 'string',
              description: 'The prompt to use.',
            },
            outputFolder: {
              type: 'string',
              description: 'The folder to save the output file.',
              default: '',
            },
            outputName: {
              type: 'string',
              description: 'The name of the output file.',
              default: '',
            },
          },
        },
        outputs: {
          type: 'object',
          properties: {
            result: { type: 'string' },
            outputFile: { type: 'string' },
          },
        },
      },
    };
  },
};
