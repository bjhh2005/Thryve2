// NewProjectModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button } from '@douyinfe/semi-ui';
import { IconFile, IconChevronRight } from '@douyinfe/semi-icons';

// 定义 props 类型
interface NewProjectModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (projectName: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ visible, onClose, onSubmit }) => {
    const [formApi, setFormApi] = useState<any>();

    // 在弹窗可见时，自动聚焦到输入框
    useEffect(() => {
        if (visible) {
            setTimeout(() => {
                formApi?.focus('projectName');
            }, 300); // 延迟以等待动画完成
        }
    }, [visible, formApi]);

    const handleOk = () => {
        formApi?.submitForm();
    };

    const handleSubmit = ({ projectName }: { projectName: string }) => {
        let finalProjectName = projectName;
        if (!finalProjectName || finalProjectName.trim() === '') {
            // 提供一个更具信息的默认名称
            finalProjectName = `未命名画布 ${new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        }
        onSubmit(finalProjectName);
        onClose(); // 提交后关闭弹窗
    };

    // 自定义页脚按钮
    const footer = (
        <div className="new-project-modal-footer">
            <Button type="tertiary" onClick={onClose}>取消</Button>
            <Button type="primary" theme="solid" icon={<IconChevronRight />} onClick={handleOk}>创建画布</Button>
        </div>
    );

    return (
        <Modal
            className="new-project-modal"
            title={null} // 禁用默认标题，我们将完全自定义
            visible={visible}
            onCancel={onClose}
            footer={footer} // 使用自定义页脚
            maskClosable={false}
            width={420}
            centered
        >
            <div className="new-project-modal-content">
                <div className="header-icon">
                    <IconFile size="large" />
                </div>
                <h3 className="header-title">新建画布</h3>
                <p className="header-subtitle">为您的新项目进行命名</p>

                <Form getFormApi={setFormApi} onSubmit={handleSubmit}>
                    <Form.Input
                        field="projectName"
                        className="project-name-input"
                        noLabel // 隐藏默认标签
                    />
                </Form>
            </div>
        </Modal>
    );
};