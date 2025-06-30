import React, { useState, useCallback } from 'react';
import { Field, FieldArray, FormRenderProps, FlowNodeJSON, FlowNodeVariableData, ASTFactory } from '@flowgram.ai/free-layout-editor';
import { Button, Spin, Typography, Notification } from '@douyinfe/semi-ui';
import { IconFolder, IconClear, IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { nanoid } from 'nanoid';

import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs } from '../../form-components';
import { FolderPort } from './styles';

interface FolderReference {
    folderPath: string;
    folderName: string;
    files: string[];
}

interface FolderInputNodeJSON extends FlowNodeJSON {
    data: {
        title?: string;
    };
    folders: Array<{
        id: string;
        folder: FolderReference | null;
        variableName: string;
    }>;
    outputs: {
        type: 'object';
        properties: Record<string, any>;
    };
}

const FolderInput: React.FC<{
    field: any;
    folderData: { id: string; folder: FolderReference | null; variableName: string };
    index: number;
    onRemove?: () => void;
    readonly?: boolean;
    onFolderSelect?: (folder: FolderReference) => void;
    form: FormRenderProps<FolderInputNodeJSON>['form'];
}> = ({ field, folderData, index, onRemove, readonly, onFolderSelect, form }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { node } = useNodeRenderContext();

    const handleSelectFolder = async () => {
        if (!window.electronAPI) {
            Notification.error({
                title: 'Error',
                content: 'Desktop folder selection API is not available'
            });
            return;
        }

        setIsProcessing(true);
        try {
            const result = await window.electronAPI.selectFolder();
            if (result.canceled) {
                return;
            }

            const folderRef: FolderReference = {
                folderPath: result.folderPath,
                folderName: result.folderName,
                files: result.files
            };

            // 使用文件夹名作为变量名，保留中文但替换空格和特殊字符为下划线
            const variableName = folderRef.folderName
                .trim()
                .replace(/[\s\(\)\[\]\{\}\+\*\?\^\$\|\.\\]/g, '_');
            
            field.onChange({ 
                ...field.value, 
                folder: folderRef,
                variableName
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
                        title: folderRef.folderName,
                        description: 'File path',
                        isOutput: true,
                        default: folderRef.folderPath
                    },
                    [`${variableName}_files`]: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        title: `${folderRef.folderName} File list`,
                        description: 'File list in the folder',
                        isOutput: true,
                        default: folderRef.files
                    }
                }
            });

            // 注册变量到系统中
            const variableData = node.getData(FlowNodeVariableData);
            if (variableData) {
                // 注册文件夹路径变量
                variableData.setVar(
                    ASTFactory.createVariableDeclaration({
                        meta: {
                            title: folderRef.folderName,
                            icon: node.getNodeRegistry()?.info?.icon,
                        },
                        key: `${node.id}_${variableName}`,
                        type: ASTFactory.createString(),
                        initializer: {
                            kind: 'String',
                            value: folderRef.folderPath
                        }
                    })
                );

                // 注册文件列表变量
                variableData.setVar(
                    ASTFactory.createVariableDeclaration({
                        meta: {
                            title: `${folderRef.folderName} File list`,
                            icon: node.getNodeRegistry()?.info?.icon,
                        },
                        key: `${node.id}_${variableName}_files`,
                        type: {
                            kind: 'Array',
                            items: {
                                kind: 'String'
                            }
                        },
                        initializer: {
                            kind: 'Array',
                            elements: folderRef.files.map(file => ({
                                kind: 'String',
                                value: file
                            }))
                        }
                    })
                );
            }

            onFolderSelect?.(folderRef);
            
            Notification.success({
                title: 'Success',
                content: `Folder selected: ${result.folderName}`
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
                    <div style={{ 
                        padding: '12px',
                        backgroundColor: 'var(--semi-color-fill-0)',
                        borderRadius: '6px'
                    }}>
                        <Spin spinning={isProcessing}>
                            {field.value?.folder ? (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <IconFolder />
                                        <Typography.Text strong>{field.value.folder.folderName}</Typography.Text>
                                        {!readonly && (
                                            <Button
                                                type="tertiary"
                                                theme="borderless"
                                                icon={<IconClear />}
                                                onClick={() => field.onChange({ ...field.value, folder: null })}
                                            />
                                        )}
                                    </div>
                                    <Typography.Text type="tertiary">
                                        {field.value.folder.files.length} files
                                    </Typography.Text>
                                </div>
                            ) : (
                                <Button
                                    icon={<IconFolder />}
                                    onClick={handleSelectFolder}
                                    disabled={readonly || isProcessing}
                                    block
                                >
                                    Select Folder
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
                        title="Remove this folder input"
                    />
                )}
            </div>
        </div>
    );
};

export const FolderInputFormRender = ({ form }: FormRenderProps<FolderInputNodeJSON>) => {
    const isSidebar = useIsSidebar();
    const { readonly } = useNodeRenderContext();
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleRemove = useCallback(async (field: any, index: number) => {
        if (isDeleting === index) return;
        
        try {
            setIsDeleting(index);
            
            if (!Array.isArray(field.value)) {
                throw new Error('Field value is not an array');
            }
            
            if (index < 0 || index >= field.value.length) {
                throw new Error('Invalid index');
            }

            if (field.value.length <= 1) {
                throw new Error('Cannot delete the last folder input');
            }

            const folderToRemove = (field.value || [])[index];
            
            const currentOutputs = form.values?.outputs || {
                type: 'object',
                properties: {}
            };
            
            const newProperties = { ...currentOutputs.properties };
            delete newProperties[folderToRemove.variableName];
            delete newProperties[`${folderToRemove.variableName}_files`];
            
            form.setValueIn('outputs', {
                ...currentOutputs,
                properties: newProperties
            });

            await field.remove(index);
            
        } catch (error: any) {
            console.error('Failed to remove folder input:', error);
            Notification.error({
                title: 'Error',
                content: error.message || 'Failed to remove folder input'
            });
        } finally {
            setIsDeleting(null);
        }
    }, [isDeleting, form]);

    const handleAdd = useCallback(async (field: any) => {
        if (isAdding) return;
        
        try {
            setIsAdding(true);
            
            if (!field.value) {
                await field.onChange([]);
            }
            
            const newFolderId = nanoid(6);
            await field.append({
                id: `folder_${newFolderId}`,
                folder: null,
                variableName: `folder_${(field.value || []).length + 1}`
            });
            
        } catch (error: any) {
            console.error('Failed to add folder input:', error);
            Notification.error({
                title: 'Error',
                content: error.message || 'Failed to add folder input'
            });
        } finally {
            setIsAdding(false);
        }
    }, [isAdding]);

    return (
        <>
            <FormHeader />
            <FormContent>
                <FieldArray<{ id: string; folder: FolderReference | null; variableName: string }> name="folders">
                    {({ field }) => (
                        <div>
                            {(field.value || []).map((folderData, index) => (
                                <Field
                                    key={folderData.id}
                                    name={`folders.${index}`}
                                >
                                    {({ field: folderField }) => (
                                        <FolderInput
                                            field={folderField}
                                            folderData={folderData}
                                            index={index}
                                            onRemove={
                                                !readonly && (field.value || []).length > 1
                                                    ? () => handleRemove(field, index)
                                                    : undefined
                                            }
                                            readonly={readonly}
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
                                    Add Folder Input
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