import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// 1. 定义每个服务商的配置结构
export interface ProviderConfig {
    apiKey: string;
    apiHost: string;
    model: string;
}

// 2. 定义所有预设服务商的默认信息
export const PRESET_PROVIDERS = { // 注意：这里将 const PRESET_PROVIDERS: Record<string, ...> 改为 const PRESET_PROVIDERS，以便TS能推断出具体的键
    siliconflow: {
        apiHost: "https://api.siliconflow.cn/v1",
        apiKey: "",
        model: 'Qwen/Qwen2-7B-Instruct',
    },
    deepseek: {
        apiHost: "https://api.deepseek.com/v1",
        model: 'deepseek-chat',
    },
    openai: {
        apiHost: "https://api.openai.com/v1",
        model: 'gpt-4-turbo',
    },
};

// --- 核心修改：在这里定义并导出 ProviderId 类型 ---
// 它会自动包含 'siliconflow', 'deepseek', 'openai'，并额外加上 'custom'
export type ProviderId = keyof typeof PRESET_PROVIDERS | 'custom';


// 3. 定义新的全局配置状态结构，并使用 ProviderId 类型
export interface AIConfig {
    activeProviderId: ProviderId; // <-- 使用更严格的 ProviderId 类型
    providers: Record<ProviderId, ProviderConfig>; // <-- 使用更严格的 ProviderId 类型
    temperature: number;
}

// 定义 Context 的类型，并使用 ProviderId 类型
interface AIConfigContextType {
    config: AIConfig;
    setConfig: (newConfig: Partial<AIConfig>) => void;
    updateProviderConfig: (providerId: ProviderId, newProviderConfig: Partial<ProviderConfig>) => void; // <-- 使用更严格的 ProviderId 类型
    getActiveProviderConfig: () => ProviderConfig;
    getActiveModelName: () => string;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const useAIConfig = () => {
    const context = useContext(AIConfigContext);
    if (!context) throw new Error('useAIConfig must be used within an AIConfigProvider');
    return context;
};

export const AIConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfigState] = useState<AIConfig>(() => {
        const savedConfig = localStorage.getItem('aiConfig');
        const initialConfig = savedConfig ? JSON.parse(savedConfig) : {};

        const providers: Record<ProviderId, ProviderConfig> = {
            siliconflow: { ...PRESET_PROVIDERS.siliconflow, ...initialConfig.providers?.siliconflow },
            deepseek: { ...PRESET_PROVIDERS.deepseek, ...initialConfig.providers?.deepseek, apiKey: initialConfig.providers?.deepseek?.apiKey || '' },
            openai: { ...PRESET_PROVIDERS.openai, ...initialConfig.providers?.openai, apiKey: initialConfig.providers?.openai?.apiKey || '' },
            custom: { apiHost: '', apiKey: '', model: '', ...initialConfig.providers?.custom },
        };

        return {
            activeProviderId: initialConfig.activeProviderId || 'siliconflow',
            providers,
            temperature: initialConfig.temperature || 0.7,
        };
    });

    useEffect(() => {
        localStorage.setItem('aiConfig', JSON.stringify(config));
    }, [config]);

    const setConfig = (newConfig: Partial<AIConfig>) => {
        setConfigState(prev => ({ ...prev, ...newConfig }));
    };

    const updateProviderConfig = (providerId: ProviderId, newProviderConfig: Partial<ProviderConfig>) => {
        setConfigState(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                [providerId]: {
                    ...prev.providers[providerId],
                    ...newProviderConfig,
                },
            },
        }));
    };

    const getActiveProviderConfig = () => {
        return config.providers[config.activeProviderId] || config.providers.custom;
    };

    const getActiveModelName = () => {
        return getActiveProviderConfig().model || '未配置';
    };

    const value = { config, setConfig, updateProviderConfig, getActiveProviderConfig, getActiveModelName };

    return (
        <AIConfigContext.Provider value={value}>
            {children}
        </AIConfigContext.Provider>
    );
};