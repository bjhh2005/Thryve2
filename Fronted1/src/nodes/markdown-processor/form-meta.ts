import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { MarkdownProcessorFormRender } from './markdown-processor-form';

export const formMeta: FormMeta = {
  render: MarkdownProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.inputFile': ({ value, formValues }) => {
      if (['parse', 'convert', 'frontMatter', 'toc', 'write', 'append'].includes(formValues.mode) && !value?.content) {
        return 'Please select a Markdown file';
      }
      if (value?.content && !value.content.toLowerCase().endsWith('.md')) {
        return 'File must be a Markdown file (.md)';
      }
      return undefined;
    },
    'inputsValues.content': ({ value, formValues }) => {
      if (['write', 'append'].includes(formValues.mode) && !value?.content) {
        return 'Content is required';
      }
      return undefined;
    },
    'inputsValues.targetFormat': ({ value, formValues }) => {
      if (formValues.mode === 'convert' && !value?.content) {
        return 'Please select target format';
      }
      return undefined;
    },
    'inputsValues.frontMatter': ({ value, formValues }) => {
      if (formValues.mode === 'frontMatter' && !value?.content) {
        return 'Front matter content is required';
      }
      try {
        if (value?.content) {
          JSON.parse(value.content);
        }
      } catch (e) {
        return 'Front matter must be valid JSON';
      }
      return undefined;
    },
    'inputsValues.outputFolder': ({ value }) => {
      if (!value?.content) return 'Please select output folder';
      return undefined;
    },
    'inputsValues.outputName': ({ value }) => {
      if (!value?.content) return 'Please enter output file name';
      return undefined;
    }
  }
}; 