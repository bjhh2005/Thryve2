import React, { useState } from 'react';
import { Modal, Button, Form, Input, Tag, Tooltip, Typography } from '@douyinfe/semi-ui';
import { IconSetting, IconPlus, IconBolt } from '@douyinfe/semi-icons';
import { useAIConfig, PRESET_PROVIDERS, ProviderConfig, ProviderId } from '../../context/AIConfigContext';
import './SettingsModal.less';

import IconDeepSeek from '../../assets/deepseek.svg';
import IconOpenAI from '../../assets/openai.svg';

// 服务商的显示信息
const PROVIDER_DISPLAY_INFO = {
    siliconflow: { name: '内置模型', icon: <IconBolt /> },
    deepseek: { name: 'DeepSeek', icon: <img src={IconDeepSeek} width={20} alt="DeepSeek" /> },
    openai: { name: 'OpenAI', icon: <img src={IconOpenAI} width={20} alt="OpenAI" /> },
    custom: { name: '自定义服务商', icon: <IconPlus /> },
};


// 可复用的配置表单弹窗
const ProviderConfigModal: React.FC<{
    providerId: ProviderId;
    visible: boolean;
    onClose: () => void;
}> = ({ providerId, visible, onClose }) => {
    const { config, updateProviderConfig } = useAIConfig();
    const [formApi, setFormApi] = useState<any>();
    // providerConfig 和 providerDefaults 的逻辑保持不变
    const providerConfig = config.providers[providerId];
    const providerDefaults: Partial<ProviderConfig> = (providerId in PRESET_PROVIDERS) ? PRESET_PROVIDERS[providerId as keyof typeof PRESET_PROVIDERS]
        : {};

    const handleSave = (values: ProviderConfig) => {
        updateProviderConfig(providerId, values);
        onClose();
    };

    // renderLabel 辅助函数已被移除

    return (
        <Modal
            title={`配置 ${PROVIDER_DISPLAY_INFO[providerId]?.name || '服务商'}`}
            visible={visible}
            onCancel={onClose}
            onOk={() => formApi?.submitForm()}
            width={480}
        >
            <Form
                initValues={providerConfig}
                getFormApi={setFormApi}
                onSubmit={handleSave}
            >
                <Form.Input
                    field="apiKey"
                    label='API Key'
                    placeholder="输入您的 API Key"
                    type="password"
                />
                <Form.Input
                    field="apiHost"
                    label='API Host (可选)'
                    placeholder={providerDefaults.apiHost || "例如: https://api.openai.com/v1"}
                />
                <Form.Input
                    field="model"
                    label='Model Name (可选)'
                    placeholder={providerDefaults.model || "例如: gpt-4-turbo"}
                />
            </Form>
        </Modal>
    );
};


// 主设置弹窗 AISettingsModal 组件的代码保持我们上次修改后的版本，无需改动
export const AISettingsModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const { config, setConfig } = useAIConfig();
    const [editingProvider, setEditingProvider] = useState<ProviderId | null>(null);

    const handleSelectProvider = (providerId: ProviderId) => {
        setConfig({ activeProviderId: providerId });
    };

    return (
        <>
            <Modal
                title="服务商配置"
                visible={visible}
                onCancel={onClose}
                footer={null}
                width={640}
                className="provider-selection-modal"
            >
                <div className="provider-grid">
                    {(Object.keys(PROVIDER_DISPLAY_INFO) as ProviderId[]).map(providerId => {
                        const info = PROVIDER_DISPLAY_INFO[providerId];
                        const isConfigured = !!config.providers[providerId]?.apiKey;
                        const isActive = config.activeProviderId === providerId;

                        return (
                            <div
                                key={providerId}
                                className={`provider-card ${isActive ? 'active' : ''}`}
                                onClick={() => handleSelectProvider(providerId)}
                            >
                                <div className="provider-info">
                                    <span className="provider-icon">{info.icon}</span>
                                    <span className="provider-name">{info.name}</span>
                                </div>
                                <div className="provider-actions">
                                    {isConfigured && <Tag color='green' size='small'>已配置</Tag>}
                                    <Tooltip content="详细配置">
                                        <Button
                                            icon={<IconSetting />}
                                            type="tertiary"
                                            theme="borderless"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingProvider(providerId);
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal>

            {editingProvider && (
                <ProviderConfigModal
                    providerId={editingProvider}
                    visible={!!editingProvider}
                    onClose={() => setEditingProvider(null)}
                />
            )}
        </>
    );
};