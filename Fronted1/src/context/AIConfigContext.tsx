import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// 定义配置的数据结构
interface AIConfig {
    modelName: string;
    apiKey: string;
    apiHost: string;
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
        // 从 localStorage 读取初始配置，实现持久化
        try {
            const savedConfig = localStorage.getItem('aiConfig');
            return savedConfig ? JSON.parse(savedConfig) : {
                modelName: 'gpt-3.5-turbo',
                apiKey: '',
                apiHost: '',
                temperature: 0.7,
            };
        } catch (error) {
            console.error("Failed to parse AI config from localStorage", error);
            return {
                modelName: 'gpt-3.5-turbo',
                apiKey: '',
                apiHost: '',
                temperature: 0.7,
            };
        }
    });

    // 当配置变化时，存入 localStorage
    useEffect(() => {
        try {
            localStorage.setItem('aiConfig', JSON.stringify(config));
        } catch (error) {
            console.error("Failed to save AI config to localStorage", error);
        }
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