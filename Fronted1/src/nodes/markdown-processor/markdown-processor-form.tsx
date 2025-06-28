import React from 'react';
import { FormContent } from '../../form-components';
import { FormHeader } from '../../form-components/form-header';
import { FormInputs } from '../../form-components/form-inputs';
import { FormOutputs } from '../../form-components/form-outputs';
import { FormRenderProps } from '@flowgram.ai/free-layout-editor';

const MODES = [
  { label: 'Preview', value: 'preview' },
  { label: 'Template', value: 'template' },
  { label: 'Export', value: 'export' },
  { label: 'Extract', value: 'extract' },
  { label: 'Convert', value: 'convert' }
];

const OUTPUT_FORMATS = [
  { label: 'HTML', value: 'html' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Word', value: 'docx' },
  { label: 'Plain Text', value: 'txt' }
];

export const MarkdownProcessorFormRender: React.FC<FormRenderProps> = ({
  formValues,
  onChange,
  onSubmit,
  onCancel,
  errors
}) => {
  const mode = formValues.mode || 'preview';

  const getInputFields = () => {
    const commonFields = {
      inputContent: {
        type: 'file',
        title: 'Input Content',
        description: 'Enter Markdown content or select a .md file',
        accept: '.md,text/markdown'
      }
    };

    switch (mode) {
      case 'template':
        return {
          ...commonFields,
          templateFile: {
            type: 'file',
            title: 'Template File',
            description: 'Select a Markdown template file',
            accept: '.md,text/markdown'
          },
          variables: {
            type: 'textarea',
            title: 'Template Variables',
            description: 'Enter variables in JSON format'
          }
        };
      case 'export':
        return {
          ...commonFields,
          cssFile: {
            type: 'file',
            title: 'CSS File',
            description: 'Optional: Select a CSS file for styling',
            accept: '.css'
          },
          outputFormat: {
            type: 'select',
            title: 'Output Format',
            description: 'Select the desired output format',
            options: OUTPUT_FORMATS
          }
        };
      case 'extract':
        return {
          ...commonFields,
          extractOptions: {
            type: 'checkboxGroup',
            title: 'Extract Options',
            options: [
              { label: 'Front Matter', value: 'frontMatter' },
              { label: 'Table of Contents', value: 'toc' },
              { label: 'Links', value: 'links' },
              { label: 'Images', value: 'images' }
            ]
          }
        };
      case 'convert':
        return {
          ...commonFields,
          targetFormat: {
            type: 'select',
            title: 'Target Format',
            description: 'Select the target Markdown format',
            options: [
              { label: 'GitHub Flavored', value: 'gfm' },
              { label: 'CommonMark', value: 'commonmark' },
              { label: 'Original', value: 'original' }
            ]
          }
        };
      default:
        return commonFields;
    }
  };

  const getOutputFields = () => {
    const commonFields = {
      html: {
        type: 'textarea',
        title: 'HTML Output',
        readOnly: true
      }
    };

    switch (mode) {
      case 'template':
        return {
          ...commonFields,
          renderedContent: {
            type: 'textarea',
            title: 'Rendered Content',
            readOnly: true
          }
        };
      case 'extract':
        return {
          frontMatter: {
            type: 'textarea',
            title: 'Front Matter',
            readOnly: true
          },
          toc: {
            type: 'textarea',
            title: 'Table of Contents',
            readOnly: true
          },
          links: {
            type: 'textarea',
            title: 'Links',
            readOnly: true
          },
          images: {
            type: 'textarea',
            title: 'Images',
            readOnly: true
          }
        };
      case 'convert':
        return {
          convertedContent: {
            type: 'textarea',
            title: 'Converted Content',
            readOnly: true
          }
        };
      default:
        return commonFields;
    }
  };

  return (
    <FormContent>
      <FormHeader
        title={formValues.title}
        onTitleChange={(title) => onChange({ ...formValues, title })}
        error={errors?.title}
        mode={mode}
        modes={MODES}
        onModeChange={(newMode) => onChange({ ...formValues, mode: newMode })}
      />
      <FormInputs
        values={formValues.inputsValues}
        onChange={(inputsValues) => onChange({ ...formValues, inputsValues })}
        fields={getInputFields()}
        errors={errors}
      />
      <FormOutputs
        values={formValues.outputsValues}
        onChange={(outputsValues) => onChange({ ...formValues, outputsValues })}
        fields={getOutputFields()}
      />
    </FormContent>
  );
}; 