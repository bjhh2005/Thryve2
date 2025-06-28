import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tooltip, Typography, Button, Spin } from '@douyinfe/semi-ui';
import { IconCopy, IconSend, IconUser, IconBolt, IconSetting } from '@douyinfe/semi-icons';
import { useAIConfig } from '../../context/AIConfigContext';
import { AISettingsModal } from './SettingsModal';

// Message 接口 (保持不变)
interface Message {
    id: number;
    role: 'user' | 'ai';
    content: string;
}

// 初始对话数据 (保持不变)
const initialMessages: Message[] = [
    { id: 1, role: 'ai', content: '您好！我是您的工作流AI助手，有什么可以帮助您的吗？请点击右上角的设置图标配置您的AI模型。' },
];

// MessageBubble 组件 (保持不变)
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    // ... 内部代码保持不变 ...
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
    };
    const renderContent = (content: string) => {
        if (content === 'Thinking...') {
            return <div style={{ display: 'flex', alignItems: 'center' }}><Spin size="small" /> <span style={{ marginLeft: 8 }}>正在思考...</span></div>
        }
        const parts = content.split(/```(json|typescript|javascript|bash|)\n([\s\S]*?)\n```/);
        return parts.map((part, index) => {
            if (index % 3 === 2) {
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
            return <p key={index}>{part}</p>;
        });
    };
    return (
        <div className={`message-bubble ${message.role}`}>
            <div className="avatar">
                {message.role === 'ai' ? <IconBolt /> : <IconUser />}
            </div>
            <div className="bubble-content">
                {renderContent(message.content)}
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
    const { config } = useAIConfig();
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

        // 优化UI：先创建一个“思考中”的占位消息
        const aiResponsePlaceholder: Message = {
            id: Date.now() + 1,
            role: 'ai',
            content: 'Thinking...', // 特殊内容，用于显示Spin动画
        };
        setMessages(prev => [...prev, aiResponsePlaceholder]);

        try {
            // --- 核心修改：从环境变量读取API地址 ---
            const apiBaseUrl = 'http://localhost:4000';
            const response = await fetch(`${apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.modelName,
                    messages: updatedMessages.map(({ role, content }) => ({ role, content })),
                    temperature: config.temperature,
                    apiKey: config.apiKey,
                    apiHost: config.apiHost,
                }),
            });

            if (!response.ok || !response.body) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

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

                            // 增强错误处理：检查从流中返回的错误
                            if (parsed.error) {
                                throw new Error(parsed.error);
                            }

                            if (parsed.end) {
                                if (aiFullResponse === '') { // 如果模型没返回任何内容
                                    aiFullResponse = '我暂时无法回答这个问题。';
                                }
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
    }, [input, isLoading, messages, config]);

    return (
        <div className="ai-assistant-panel">
            <div className="ai-panel-header">
                <Typography.Text strong>
                    当前模型: {config.modelName || '未配置'}
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
                {/* 不再需要独立的加载中提示，因为它被合并到了消息气泡里 */}
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