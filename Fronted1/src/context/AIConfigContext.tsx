import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// 定义配置的数据结构
interface AIConfig {
    modelName: string;
    temperature: number;
}

// 定义Context提供的值的类型
interface AIConfigContextType {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

// 创建Context，并提供一个默认值
const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

// 自定义Hook，方便组件使用Context
export const useAIConfig = () => {
    const context = useContext(AIConfigContext);
    if (!context) {
        throw new Error('useAIConfig must be used within an AIConfigProvider');
    }
    return context;
};

// Provider组件，包裹你的应用
export const AIConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfigState] = useState<AIConfig>(() => {
        const savedConfig = localStorage.getItem('aiConfig');
        const initialConfig = savedConfig ? JSON.parse(savedConfig) : null;
        return {
            modelName: initialConfig?.modelName || 'Qwen/QwQ-32B',
            temperature: initialConfig?.temperature || 0.7,
        };
    });

    useEffect(() => {
        localStorage.setItem('aiConfig', JSON.stringify(config));
    }, [config]);

    const setConfig = (newConfig: AIConfig) => {
        setConfigState(newConfig);
    };

    return (
        <AIConfigContext.Provider value={{ config, setConfig }}>
            {children}
        </AIConfigContext.Provider>
    );
};