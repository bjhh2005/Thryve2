import React, { useState } from 'react';
import { FormRenderProps, FlowNodeJSON, Field } from '@flowgram.ai/free-layout-editor';
import { Button, Spin, Typography, Notification } from '@douyinfe/semi-ui';
import { IconUpload, IconFile, IconClear } from '@douyinfe/semi-icons';

import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs } from '../../form-components';
import { FileReference, DesktopFilePayload } from '../../typings';

interface FileInputNodeJSON extends FlowNodeJSON {
    data: {
        title?: string;
        file: FileReference | null;
    };
}

// 声明一个全局 window 类型以包含我们的 preload API
declare global {
    interface Window {
        electronAPI: {
            selectFile: () => Promise<DesktopFilePayload>;
        };
    }
}


export const FileInputFormRender = ({ form }: FormRenderProps<FileInputNodeJSON>) => {
    const isSidebar = useIsSidebar();
    const { readonly } = useNodeRenderContext();

    // isUploading 的语义可以理解为 "正在选择和处理文件"
    const [isProcessing, setIsProcessing] = useState(false);

    const uploaderUI = (
        <Field<FileReference | null> name="file">
            {({ field }) => {

                // **核心逻辑修改**
                const handleSelectFile = async () => {
                    if (!window.electronAPI) {
                        Notification.error({ title: '错误', content: '桌面端文件选择接口不可用。' });
                        return;
                    }

                    setIsProcessing(true);
                    try {
                        // 调用通过 preload 脚本暴露的函数
                        const result = await window.electronAPI.selectFile();

                        if (result.canceled) {
                            // 用户取消了文件选择
                            return;
                        }

                        // 从返回结果构造新的 FileReference 对象
                        const fileReference: FileReference = {
                            filePath: result.filePath,
                            fileName: result.fileName,
                            mimeType: result.mimeType,
                            size: result.fileSize,
                        };

                        field.onChange(fileReference);
                        Notification.success({ title: '选择成功', content: result.fileName });

                    } catch (error: any) {
                        Notification.error({ title: '选择文件时出错', content: error.message });
                    } finally {
                        setIsProcessing(false);
                    }
                };

                const currentFile = field.value;

                return (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <Spin spinning={isProcessing} tip="正在处理...">
                            {currentFile ? (
                                <div>
                                    <IconFile size="extra-large" />
                                    <Typography.Title heading={6} style={{ margin: '8px 0' }}>
                                        {currentFile.fileName}
                                    </Typography.Title>
                                    <Typography.Text type="tertiary">
                                        {currentFile.mimeType} - {(currentFile.size / 1024).toFixed(2)} KB
                                    </Typography.Text>
                                    {/* 新增：显示文件路径，这对调试很有帮助 */}
                                    <Typography.Text type="secondary" style={{ display: 'block', wordBreak: 'break-all', marginTop: 8 }}>
                                        路径: {currentFile.filePath}
                                    </Typography.Text>
                                    {!readonly && (
                                        <div style={{ marginTop: '16px' }}>
                                            <Button
                                                icon={<IconClear />}
                                                theme="light"
                                                onClick={() => field.onChange(null)}
                                            >
                                                清除并重新选择
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* 不再需要隐藏的 input[type=file] */}
                                    <Button
                                        icon={<IconUpload />}
                                        type="primary"
                                        onClick={handleSelectFile} // 点击按钮直接调用我们的新函数
                                        disabled={readonly || isProcessing}
                                    >
                                        选择文件
                                    </Button>
                                </>
                            )}
                        </Spin>
                    </div>
                );
            }}
        </Field>
    );

    if (isSidebar) {
        return (
            <>
                <FormHeader />
                <FormContent>
                    {uploaderUI}
                    <FormOutputs />
                </FormContent>
            </>
        );
    }

    return (
        <>
            <FormHeader />
            <FormContent>
                {uploaderUI}
            </FormContent>
        </>
    );
};