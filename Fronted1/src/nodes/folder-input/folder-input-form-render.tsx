import React, { useState, useCallback } from 'react';
import { Field, FieldArray, FormRenderProps, FlowNodeJSON, FlowNodeVariableData, ASTFactory } from '@flowgram.ai/free-layout-editor';
import { Button, Spin, Typography, Notification, Switch } from '@douyinfe/semi-ui';
import { IconFolder, IconClear, IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { nanoid } from 'nanoid';
import './styles.css';

import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs } from '../../form-components';
import { FolderPort } from './styles';

interface FolderReference {
    folderPath: string;
    folderName: string;
    files: string[];
    deepSearch?: boolean;
}

interface FolderInputNodeJSON extends FlowNodeJSON {
    data: {
        title?: string;
    };
    folders: Array<{
        id: string;
        folder: FolderReference | null;
        variableName: string;
        deepSearch: boolean;
    }>;
    outputs: {
        type: 'object';
        properties: Record<string, any>;
    };
}

const FolderInput: React.FC<{
    field: any;
    folderData: { id: string; folder: FolderReference | null; variableName: string; deepSearch: boolean };
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

            console.log('Current outputs before update:', currentOutputs);

            // 先注册变量
            const variableData = node.getData(FlowNodeVariableData);
            if (!variableData) {
                console.warn('Variable data manager is not initialized');
                return;
            }

            if (!folderRef) {
                console.warn('Folder reference is empty');
                return;
            }

            if (!folderRef.files || !Array.isArray(folderRef.files) || folderRef.files.length === 0) {
                console.warn('No files in folder or invalid file list format');
                return;
            }

            if (!folderRef.folderName) {
                console.warn('Folder name is empty');
                return;
            }

            if (!variableName) {
                console.warn('Variable name is not set');
                return;
            }

            // 更新表单，这会触发同步插件
            form.setValueIn('outputs', {
                ...currentOutputs,
                properties: {
                    ...currentOutputs.properties,
                    [variableName]: {
                        type: 'string',
                        title: folderRef.folderName,
                        description: 'Folder path',
                        isOutput: true,
                        default: folderRef.folderPath
                    },
                    [`${variableName}_files`]: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        title: `${folderRef.folderName} File List`,
                        description: 'File list in the folder',
                        isOutput: true,
                        default: folderRef.files
                    }
                }
            });

            console.log('Updated outputs:', form.values?.outputs);

            // 确保表单更新完成后再触发一次同步
            setTimeout(() => {
                console.log('Triggering manual sync');
                const outputs = form.getValueIn('outputs');
                if (outputs) {
                    form.setValueIn('outputs', outputs);
                }
            }, 0);

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
        <div style={{ 
            position: 'relative', 
            marginBottom: '16px',
            borderRadius: '8px',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flexGrow: 1 }}>
                    <div className="folder-card" style={{ 
                        padding: '16px',
                        backgroundColor: 'var(--semi-color-fill-0)',
                        borderRadius: '8px',
                        border: '1px solid var(--semi-color-border)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}>
                        <Spin spinning={isProcessing}>
                            {field.value?.folder ? (
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        marginBottom: '12px',
                                        padding: '8px',
                                        backgroundColor: 'var(--semi-color-fill-1)',
                                        borderRadius: '6px'
                                    }}>
                                        <IconFolder style={{ 
                                            color: 'var(--semi-color-primary)',
                                            fontSize: '20px'
                                        }} />
                                        <div style={{ flexGrow: 1 }}>
                                            <Typography.Text strong style={{ fontSize: '15px' }}>
                                                {field.value.folder.folderName}
                                            </Typography.Text>
                                            <Typography.Text type="tertiary" style={{ display: 'block', fontSize: '12px' }}>
                                                {field.value.folder.folderPath}
                                            </Typography.Text>
                                        </div>
                                        {!readonly && (
                                            <Button
                                                type="tertiary"
                                                theme="borderless"
                                                icon={<IconClear />}
                                                onClick={() => field.onChange({ ...field.value, folder: null })}
                                                style={{ padding: '4px' }}
                                            />
                                        )}
                                    </div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        marginBottom: '12px',
                                        padding: '8px 12px',
                                        backgroundColor: 'var(--semi-color-fill-1)',
                                        borderRadius: '6px'
                                    }}>
                                        <Switch
                                            checked={field.value.deepSearch}
                                            onChange={(checked) => field.onChange({ ...field.value, deepSearch: checked })}
                                            disabled={readonly}
                                            size="small"
                                        />
                                        <Typography.Text>
                                            Recursive search for subfolders
                                        </Typography.Text>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        backgroundColor: 'var(--semi-color-fill-1)',
                                        borderRadius: '6px'
                                    }}>
                                        <Typography.Text type="tertiary" style={{ fontSize: '13px' }}>
                                            {field.value.folder.files.length} files found
                                        </Typography.Text>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    icon={<IconFolder style={{ fontSize: '16px' }} />}
                                    onClick={handleSelectFolder}
                                    disabled={readonly || isProcessing}
                                    block
                                    style={{
                                        height: '48px',
                                        fontSize: '15px',
                                        borderStyle: 'dashed',
                                        backgroundColor: 'var(--semi-color-fill-1)'
                                    }}
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
                        className="delete-button"
                        style={{
                            marginTop: '16px',
                            opacity: 0.8,
                            transition: 'opacity 0.3s ease'
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export const FolderInputFormRender = ({ form }: FormRenderProps<FolderInputNodeJSON>) => {
    const isSidebar = useIsSidebar();
    const { readonly, node } = useNodeRenderContext();
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
            
            // 删除同步变量
            const variableData = node?.getData(FlowNodeVariableData);
            if (variableData) {
                // 清除变量
                variableData.clearVar(folderToRemove.variableName);
                variableData.clearVar(`${folderToRemove.variableName}_files`);

                // 重新加载outputs
                const currentOutputs = form.getValueIn('outputs');
                if (currentOutputs) {
                    form.setValueIn('outputs', {
                        ...currentOutputs,
                        properties: {
                            ...currentOutputs.properties
                        }
                    });
                }
            }

            await field.remove(index);

            // 确保表单更新完成后再触发一次同步
            setTimeout(() => {
                const outputs = form.getValueIn('outputs');
                if (outputs) {
                    form.setValueIn('outputs', outputs);
                }
            }, 0);
            
        } catch (error: any) {
            console.error('Failed to remove folder input:', error);
            Notification.error({
                title: 'Error',
                content: error.message || 'Failed to remove folder input'
            });
        } finally {
            setIsDeleting(null);
        }
    }, [isDeleting, form, node]);

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
                variableName: `folder_${(field.value || []).length + 1}`,
                deepSearch: false
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
                <FieldArray<{ id: string; folder: FolderReference | null; variableName: string; deepSearch: boolean }> name="folders">
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