import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { MarkdownProcessorFormRender } from './markdown-processor-form.tsx';

export const formMeta: FormMeta = {
  render: MarkdownProcessorFormRender,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.inputFile': ({ value }) => {
      if (!value?.content) return 'Please select a Markdown file';
      if (!value.content.toLowerCase().endsWith('.md')) {
        return 'File must be a Markdown file';
      }
      return undefined;
    },
    'inputsValues.content': ({ value, formValues }) => {
      if ((formValues.mode === 'append' || formValues.mode === 'write') && !value?.content) {
        return 'Please enter the content to process';
      }
      return undefined;
    },
    'inputsValues.frontMatter': ({ value, formValues }) => {
      if (formValues.mode === 'frontMatter' && !value?.content) {
        return 'Please enter the front matter content';
      }
      try {
        if (formValues.mode === 'frontMatter' && value?.content) {
          JSON.parse(value.content);
        }
        return undefined;
      } catch (e) {
        return 'Invalid front matter format (must be valid JSON)';
      }
    },
    'inputsValues.targetFormat': ({ value, formValues }) => {
      if (formValues.mode === 'convert' && !value?.content) {
        return 'Please select the target format';
      }
      return undefined;
    }
  }
}; 