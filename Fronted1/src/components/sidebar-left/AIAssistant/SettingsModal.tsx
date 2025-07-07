// SettingsModal.tsx

import React, { useState } from 'react';
import { Modal, Button, Form, Input, Tag, Tooltip, Typography, Select } from '@douyinfe/semi-ui';
import { IconSetting, IconPlus, IconBolt, IconTickCircle } from '@douyinfe/semi-icons';
import { useAIConfig, PRESET_PROVIDERS, ProviderConfig, ProviderId } from '../../../context/AIConfigContext';
import './SettingsModal.less';

import IconDeepSeek from '../../../assets/deepseek.svg';
import IconOpenAI from '../../../assets/openai.svg';

// 服务商的显示信息 (保持不变)
const PROVIDER_DISPLAY_INFO = {
    siliconflow: { name: '内置模型', icon: <IconBolt /> },
    deepseek: { name: 'DeepSeek', icon: <img src={IconDeepSeek} width={20} alt="DeepSeek" /> },
    openai: { name: 'OpenAI', icon: <img src={IconOpenAI} width={20} alt="OpenAI" /> },
    custom: { name: '自定义服务商', icon: <IconPlus /> },
};

// 1. 新增：为特定服务商提供预设模型列表
const PROVIDER_MODEL_OPTIONS: Partial<Record<ProviderId, { label: string; value: string; }[]>> = {
    siliconflow: [
        { label: "Qwen2-7B-Instruct", value: "Qwen/Qwen2-7B-Instruct" },
        { label: "GLM-4.1V-9B-Thinking", value: "THUDM/GLM-4.1V-9B-Thinking" },
        { label: "DeepSeek-R1-0528-Qwen3-8B", value: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B" },
        { label: "BCE Embedding Base v1", value: "netease-youdao/bce-embedding-base_v1" },
    ],
    deepseek: [
        { label: "DeepSeek Chat", value: "deepseek-chat" },
        { label: "DeepSeek Coder", value: "deepseek-coder" }, // Coder is also a common model
    ],
    openai: [
        { label: "GPT-4o", value: "gpt-4o" },
        { label: "GPT-4o mini", value: "gpt-4o-mini" },
        { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
        { label: "O1", value: "o1" },
        { label: "O1 mini", value: "o1-mini" },
        { label: "O3 mini", value: "o3-mini" },
    ],
};

// 2. 增强：ProviderConfigModal 组件，支持模型选择
const ProviderConfigModal: React.FC<{
    providerId: ProviderId;
    visible: boolean;
    onClose: () => void;
}> = ({ providerId, visible, onClose }) => {
    const { config, updateProviderConfig } = useAIConfig();
    const [formApi, setFormApi] = useState<any>();

    const providerConfig = config.providers[providerId];
    const providerDefaults: Partial<ProviderConfig> = (providerId in PRESET_PROVIDERS)
        ? PRESET_PROVIDERS[providerId as keyof typeof PRESET_PROVIDERS]
        : {};

    const handleSave = (values: ProviderConfig) => {
        updateProviderConfig(providerId, values);
        onClose();
    };

    // 获取当前服务商的预设模型列表
    const modelOptions = PROVIDER_MODEL_OPTIONS[providerId];

    return (
        <Modal
            title={`配置 ${PROVIDER_DISPLAY_INFO[providerId]?.name || '服务商'}`}
            visible={visible}
            onCancel={onClose}
            onOk={() => formApi?.submitForm()}
            width={520} // 稍微加宽以容纳更复杂的表单
            className="provider-config-modal" // 添加 class 用于样式定制
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

                {/* 核心修改：根据是否有预设模型列表来渲染不同组件 */}
                {modelOptions ? (
                    <Form.Select
                        field="model"
                        label="选择模型"
                        placeholder={providerDefaults.model || "请选择一个模型"}
                        optionList={modelOptions}
                        style={{ width: '100%' }}
                    />
                ) : (
                    <Form.Input
                        field="model"
                        label='模型名称 (可选)'
                        placeholder={providerDefaults.model || "例如: gpt-4-turbo"}
                    />
                )}
            </Form>
        </Modal>
    );
};


// 3. 增强：AISettingsModal 主弹窗，添加激活状态指示器
const ActiveIndicator = () => (
    <div className="active-indicator">
        <IconTickCircle />
    </div>
);

export const AISettingsModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const { config, setConfig } = useAIConfig();
    const [editingProvider, setEditingProvider] = useState<ProviderId | null>(null);

    const handleSelectProvider = (providerId: ProviderId) => {
        setConfig({ activeProviderId: providerId });
    };

    return (
        <>
            <Modal
                title="AI 服务商配置" // 更新标题
                visible={visible}
                onCancel={onClose}
                footer={null}
                width={720} // 加宽以适应新的卡片布局
                className="provider-selection-modal"
            >
                <div className="provider-grid">
                    {(Object.keys(PROVIDER_DISPLAY_INFO) as ProviderId[]).map((providerId, index) => {
                        const info = PROVIDER_DISPLAY_INFO[providerId];
                        const isConfigured = !!config.providers[providerId]?.apiKey;
                        const isActive = config.activeProviderId === providerId;

                        return (
                            <div
                                key={providerId}
                                className={`provider-card ${isActive ? 'active' : ''}`}
                                onClick={() => handleSelectProvider(providerId)}
                                // 为入场动画设置延迟
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {isActive && <ActiveIndicator />}
                                <div className="provider-info">
                                    <span className="provider-icon">{info.icon}</span>
                                    <span className="provider-name">{info.name}</span>
                                </div>
                                <div className="provider-actions">
                                    {isConfigured && <Tag color='green' size='small'>已配置</Tag>}
                                    <Tooltip content="详细配置">
                                        <Button
                                            className="settings-button"
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
                                <div className="card-shine-effect"></div>
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