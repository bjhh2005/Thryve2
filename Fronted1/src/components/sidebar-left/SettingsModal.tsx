import React, { useState, useEffect } from 'react';
import { Modal, Input, Slider, Button, Toast, Typography } from '@douyinfe/semi-ui';
import { useAIConfig } from '../../context/AIConfigContext';

// 1. 不再依赖 <Form>，我们用 React 的 useState 来独立管理数据
interface FormData {
    modelName: string;
    temperature: number;
}

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AISettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const { config, setConfig } = useAIConfig();
    const [formData, setFormData] = useState<FormData>(config);

    // 2. 当弹窗打开或外部配置变化时，用全局配置初始化我们的本地数据
    useEffect(() => {
        if (visible) {
            setFormData(config);
        }
    }, [config, visible]);

    // 3. 创建一个通用的处理函数来更新本地数据
    const handleValueChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 4. 在保存时，用本地数据去更新全局配置
    const handleSave = () => {
        if (!formData.modelName.trim()) {
            Toast.error('Model Name 是必填项');
            return;
        }
        setConfig(formData);
        Toast.success('AI配置已保存');
        onClose();
    };

    return (
        <Modal
            title="AI 模型配置"
            visible={visible}
            onCancel={onClose}
            footer={
                <Button type="primary" onClick={handleSave}>
                    保存
                </Button>
            }
            width={500}
            maskClosable={false}
        >
            {/* 5. 手动渲染每个表单项和它的标签 */}
            <div style={{ marginBottom: '20px' }}>
                <Typography.Text strong>Model Name</Typography.Text>
                <div style={{ marginTop: '8px' }}>
                    <Input
                        value={formData.modelName}
                        onChange={(value) => handleValueChange('modelName', value)}
                        placeholder="例如: gpt-4, gpt-3.5-turbo"
                    />
                </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Typography.Text strong>Temperature (模型创造性)</Typography.Text>
                <div style={{ marginTop: '8px' }}>
                    <Slider
                        value={formData.temperature}
                        onChange={(value) => handleValueChange('temperature', value as number)}
                        min={0}
                        max={2}
                        step={0.1}
                        tipFormatter={(v) => `${v}`}
                        style={{ width: '95%', padding: '0 10px' }} // 增加一些内边距防止滑块出界
                    />
                </div>
            </div>
        </Modal>
    );
};