import React, { useState, useCallback } from 'react';
import { Field, FieldArray, FormRenderProps, FlowNodeJSON, FlowNodeVariableData, ASTFactory } from '@flowgram.ai/free-layout-editor';
import { Button, Spin, Typography, Notification } from '@douyinfe/semi-ui';
import { IconUpload, IconFile, IconClear, IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { nanoid } from 'nanoid';
import { JsonSchemaEditor, IJsonSchema } from '@flowgram.ai/form-materials';

import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormItem, FormOutputs } from '../../form-components';
import { FileReference, DesktopFilePayload, JsonSchema } from '../../typings';
import { FilePort } from './styles';

declare global {
    interface Window {
        electronAPI: {
            selectFile: () => Promise<DesktopFilePayload>;
            readFile: (filePath: string) => Promise<{
                success: boolean;
                content: string | null;
                error: string | null;
            }>;
            getFileInfo: (filePath: string) => Promise<{
                success: boolean;
                info: {
                    size: number;
                    created: Date;
                    modified: Date;
                    accessed: Date;
                } | null;
                error: string | null;
            }>;
        };
    }
}

interface FileInputNodeJSON extends FlowNodeJSON {
    data: {
        title?: string;
    };

    files: Array<{
        id: string;
        file: FileReference | null;
        variableName: string;
    }>;
    outputs: JsonSchema;
}

const FileInput: React.FC<{
    field: any;
    fileData: { id: string; file: FileReference | null; variableName: string };
    index: number;
    onRemove?: () => void;
    readonly?: boolean;
    onFileSelect?: (file: FileReference) => void;
    form: FormRenderProps<FileInputNodeJSON>['form'];
}> = ({ field, fileData, index, onRemove, readonly, onFileSelect, form }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { node } = useNodeRenderContext();

    const handleSelectFile = async () => {
        if (!window.electronAPI) {
            Notification.error({
                title: 'Error',
                content: 'Desktop file selection API is not available'
            });
            return;
        }

        setIsProcessing(true);
        try {
            const result = await window.electronAPI.selectFile();
            if (result.canceled) {
                return;
            }

            const fileInfo = await window.electronAPI.getFileInfo(result.filePath);
            if (!fileInfo.success) {
                throw new Error(fileInfo.error || 'Failed to get file info');
            }

            const fileRef: FileReference = {
                filePath: result.filePath,
                fileName: result.fileName,
                mimeType: result.mimeType,
                size: result.fileSize,
                created: fileInfo.info?.created,
                modified: fileInfo.info?.modified,
                accessed: fileInfo.info?.accessed
            };

            // 使用文件名作为变量名，但将点号替换为下划线
            const variableName = fileRef.fileName.replace(/\./g, '_');
            
            field.onChange({ 
                ...field.value, 
                file: fileRef,
                variableName // 更新变量名为文件名
            });

            // 更新输出配置
            const currentOutputs = form.values?.outputs || {
                type: 'object',
                properties: {}
            };

            form.setValueIn('outputs', {
                ...currentOutputs,
                properties: {
                    ...currentOutputs.properties,
                    [variableName]: {
                        type: 'string',
                        title: fileRef.fileName,
                        description: 'File Path',
                        isOutput: true,
                        default: fileRef.filePath // 设置默认值为文件路径
                    }
                }
            });

            // 注册变量到系统中
            const variableData = node.getData(FlowNodeVariableData);
            if (variableData) {
                
                // 获取当前所有文件
                const currentFiles = form.values?.files || [];
                
                // 为每个文件创建变量
                currentFiles.forEach(fileEntry => {
                    if (!fileEntry.file) return;
                    
                    variableData.setVar(
                        ASTFactory.createVariableDeclaration({
                            meta: {
                                title: fileEntry.file.fileName,
                                icon: node.getNodeRegistry()?.info?.icon,
                            },
                            key: `${node.id}_${fileEntry.variableName}`,
                            type: ASTFactory.createString(),
                            initializer: {
                                kind: 'String',
                                value: fileEntry.file.filePath
                            }
                        })
                    );
                });
            }

            onFileSelect?.(fileRef);
            
            Notification.success({
                title: 'Success',
                content: `File selected: ${result.fileName}`
            });
        } catch (error: any) {
            Notification.error({
                title: 'Error',
                content: error.message
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flexGrow: 1 }}>
                    <FormItem
                        name={`Variable Name ${index + 1}`}
                        type="string"
                        required={true}
                    >
                        <input
                            type="text"
                            value={fileData.variableName}
                            onChange={(e) => field.onChange({ ...field.value, variableName: e.target.value })}
                            placeholder="Enter variable name"
                            style={{
                                width: '100%',
                                padding: '4px 8px',
                                marginBottom: '8px',
                                border: '1px solid var(--semi-color-border)',
                                borderRadius: '4px'
                            }}
                        />
                    </FormItem>
                    <div style={{ 
                        padding: '12px',
                        backgroundColor: 'var(--semi-color-fill-0)',
                        borderRadius: '6px'
                    }}>
                        <Spin spinning={isProcessing}>
                            {field.value?.file ? (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <IconFile />
                                        <Typography.Text strong>{field.value.file.fileName}</Typography.Text>
                                        {!readonly && (
                                            <Button
                                                type="tertiary"
                                                theme="borderless"
                                                icon={<IconClear />}
                                                onClick={() => field.onChange({ ...field.value, file: null })}
                                            />
                                        )}
                                    </div>
                                    <Typography.Text type="tertiary">
                                        {field.value.file.mimeType} - {(field.value.file.size / 1024).toFixed(2)} KB
                                    </Typography.Text>
                                </div>
                            ) : (
                                <Button
                                    icon={<IconUpload />}
                                    onClick={handleSelectFile}
                                    disabled={readonly || isProcessing}
                                    block
                                >
                                    Select File
                                </Button>
                            )}
                        </Spin>
                    </div>
                </div>
                {!readonly && onRemove && (
                    <Button
                        type="danger"
                        theme="borderless"
                        icon={<IconDelete />}
                        onClick={onRemove}
                        title="Remove this file input"
                    />
                )}
            </div>
        </div>
    );
};

export const FileInputFormRender = ({ form }: FormRenderProps<FileInputNodeJSON>) => {
    const isSidebar = useIsSidebar();
    const { readonly } = useNodeRenderContext();
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleFileSelect = (file: FileReference, index: number) => {
        const currentFiles = form.values?.files || [];
        const fileData = currentFiles[index];
        
        // 更新输出变量的值
        const currentOutputs = form.values?.outputs;
        if (currentOutputs?.properties && fileData) {
            const property = currentOutputs.properties[fileData.variableName];
            if (property) {
                form.setValueIn(
                    `outputs.properties.${fileData.variableName}.default`,
                    file.filePath
                );
            }
        }
    };

    const handleRemove = useCallback(async (field: any, index: number) => {
        // 防止重复点击
        if (isDeleting === index) return;
        
        try {
            setIsDeleting(index);
            
            // 类型和边界检查
            if (!Array.isArray(field.value)) {
                throw new Error('Field value is not an array');
            }
            
            if (index < 0 || index >= field.value.length) {
                throw new Error('Invalid index');
            }

            // 检查是否是最后一个分支
            if (field.value.length <= 1) {
                throw new Error('Cannot delete the last file input');
            }

            // 获取要删除的文件的变量名
            const fileToRemove = (field.value || [])[index];
            
            // 删除 outputs 中对应的变量
            const currentOutputs = form.values?.outputs || {
                type: 'object',
                properties: {}
            };
            
            const newProperties = { ...currentOutputs.properties };
            delete newProperties[fileToRemove.variableName];
            
            form.setValueIn('outputs', {
                ...currentOutputs,
                properties: newProperties
            });

            // 删除文件分支
            await field.remove(index);
            
        } catch (error: any) {
            console.error('Failed to remove file input:', error);
            Notification.error({
                title: 'Error',
                content: error.message || 'Failed to remove file input'
            });
        } finally {
            setIsDeleting(null);
        }
    }, [isDeleting, form]);

    const handleAdd = useCallback(async (field: any) => {
        // 防止重复点击
        if (isAdding) return;
        
        try {
            setIsAdding(true);
            
            // 初始化数组（如果不存在）
            if (!field.value) {
                await field.onChange([]);
            }
            
            const newFileId = nanoid(6);
            const currentFiles = field.value || [];
            
            // 添加新文件
            await field.append({
                id: `file_${newFileId}`,
                file: null,
                variableName: `file_${currentFiles.length + 1}`
            });
            
        } catch (error: any) {
            console.error('Failed to add file input:', error);
            Notification.error({
                title: 'Error',
                content: error.message || 'Failed to add file input'
            });
        } finally {
            setIsAdding(false);
        }
    }, [isAdding]);

    if (isSidebar) {
        return (
            <>
                <FormHeader />
                <FormContent>
                    <Field
                        name="outputs"
                        render={({ field: { value, onChange } }) => (
                            <>
                                <JsonSchemaEditor
                                    value={value as IJsonSchema}
                                    onChange={(value) => onChange(value as JsonSchema)}
                                />
                                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                    <Button type="primary">OK</Button>
                                </div>
                            </>
                        )}
                    />
                </FormContent>
            </>
        );
    }

    return (
        <>
            <FormHeader />
            <FormContent>
                <FieldArray<{ id: string; file: FileReference | null; variableName: string }> name="files">
                    {({ field }) => (
                        <div>
                            {(field.value || []).map((fileData, index) => (
                                <Field
                                    key={fileData.id}
                                    name={`files.${index}`}
                                >
                                    {({ field: fileField }) => (
                                        <FileInput
                                            field={fileField}
                                            fileData={fileData}
                                            index={index}
                                            onRemove={
                                                !readonly && (field.value || []).length > 1
                                                    ? () => handleRemove(field, index)
                                                    : undefined
                                            }
                                            readonly={readonly}
                                            onFileSelect={(file) => handleFileSelect(file, index)}
                                            form={form}
                                        />
                                    )}
                                </Field>
                            ))}
                            {!readonly && (
                                <Button
                                    icon={<IconPlus />}
                                    onClick={() => handleAdd(field)}
                                    disabled={isDeleting !== null || isAdding}
                                    style={{ 
                                        marginTop: '8px',
                                        opacity: isAdding ? 0.5 : 1
                                    }}
                                >
                                    Add File Input
                                </Button>
                            )}
                        </div>
                    )}
                </FieldArray>
                <FormOutputs />
            </FormContent>
        </>
    );
}; 