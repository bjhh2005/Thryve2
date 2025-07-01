import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tooltip, Typography, Button, Spin } from '@douyinfe/semi-ui';
import { IconCopy, IconSend, IconUser, IconBolt, IconSetting } from '@douyinfe/semi-icons';
import { useAIConfig } from '../../../context/AIConfigContext';
import { AISettingsModal } from './SettingsModal';
import { MarkdownRenderer } from '../../markdown/MarkdownRenderer';

// Message 接口定义
interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

// 初始对话数据
const initialMessages: Message[] = [
    { id: 1, role: 'assistant', content: '您好！我是您的工作流AI助手，有什么可以帮助您的吗？请点击右上角的设置图标配置您的AI模型。' },
];

// 消息气泡组件
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
    };
    const renderContent = (content: string) => {
        // 在占位符消息中显示加载动画   
        if (content === 'Thinking...') {
            return <div style={{ display: 'flex', alignItems: 'center' }}><Spin size="small" /> <span style={{ marginLeft: 8 }}>正在思考...</span></div>
        }
        // 分割代码块和普通文本
        const parts = content.split(/```(json|typescript|javascript|bash|)\n([\s\S]*?)\n```/);
        return parts.map((part, index) => {
            if (index % 3 === 2) { // 代码部分
                return (
                    <div className="code-block" key={index}>
                        <pre><code>{part}</code></pre>
                        <Tooltip content="复制" position="left">
                            <button className="copy-button" onClick={() => handleCopy(part)}>
                                <IconCopy size="small" />
                            </button>
                        </Tooltip>
                    </div>
                );
            }
            return <p key={index}>{part}</p>; // 普通文本
        });
    };
    return (
        <div className={`message-bubble ${message.role}`}>
            <div className="avatar">
                {message.role === 'assistant' ? <IconBolt /> : <IconUser />}
            </div>
            <div className="bubble-content">
                {message.role === 'user' ? (
                    <p>{message.content}</p>
                ) : (
                    message.content === 'Thinking...' ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Spin size="small" /> <span style={{ marginLeft: 8 }}>正在思考...</span>
                        </div>
                    ) : (
                        <MarkdownRenderer content={message.content} />
                    )
                )}
            </div>
        </div>
    );
};

// 主要的AI助手面板组件
export const AIAssistantPanel = () => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);

    // --- 核心修改 1: 从 Context 获取新的辅助函数 ---
    const { config, getActiveModelName, getActiveProviderConfig } = useAIConfig();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: input,
        };

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        const aiResponsePlaceholder: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: 'Thinking...',
        };
        setMessages(prev => [...prev, aiResponsePlaceholder]);

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

            // --- 核心修改 2: 获取当前激活服务商的配置 ---
            const activeProviderConfig = getActiveProviderConfig();

            const response = await fetch(`${apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },

                // --- 核心修改 3: 发送一个扁平化的、干净的数据结构给后端 ---
                body: JSON.stringify({
                    apiHost: activeProviderConfig.apiHost,
                    apiKey: activeProviderConfig.apiKey,
                    model: activeProviderConfig.model,
                    temperature: config.temperature, // temperature 是全局配置
                    messages: updatedMessages.map(({ role, content }) => ({ role, content })),
                }),
            });

            if (!response.ok || !response.body) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            // 流式响应处理逻辑保持不变
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiFullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) { throw new Error(parsed.error); }
                            if (parsed.end) {
                                if (aiFullResponse === '') { aiFullResponse = '我暂时无法回答这个问题。'; }
                                break;
                            }
                            aiFullResponse += parsed.content || '';
                            setMessages(prev => prev.map(msg =>
                                msg.id === aiResponsePlaceholder.id
                                    ? { ...msg, content: aiFullResponse }
                                    : msg
                            ));
                        } catch (e) {
                            console.error("Failed to parse stream data:", data, e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch AI response:', error);
            const errorMessage = `抱歉，请求出错了: ${error instanceof Error ? error.message : String(error)}`;
            setMessages(prev => prev.map(msg =>
                msg.id === aiResponsePlaceholder.id
                    ? { ...msg, content: errorMessage }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, config, getActiveProviderConfig]); // 依赖项更新

    return (
        <div className="ai-assistant-panel">
            <div className="ai-panel-header">
                <Typography.Text strong>
                    {/* --- 核心修改 4: 使用新的辅助函数显示模型名 --- */}
                    当前模型: {getActiveModelName()}
                </Typography.Text>
                <Tooltip content="配置AI模型">
                    <Button
                        icon={<IconSetting />}
                        type="tertiary"
                        theme="borderless"
                        onClick={() => setSettingsVisible(true)}
                    />
                </Tooltip>
            </div>

            <div className="messages-list">
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-form">
                <textarea
                    placeholder="直接向AI下达指令或提问..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={isLoading}
                />
                <Tooltip content="发送" position="top">
                    <button onClick={handleSend} disabled={!input.trim() || isLoading}>
                        <IconSend />
                    </button>
                </Tooltip>
            </div>

            <AISettingsModal
                visible={isSettingsVisible}
                onClose={() => setSettingsVisible(false)}
            />
        </div>
    );
};