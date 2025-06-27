import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tooltip, Typography, Button, Spin } from '@douyinfe/semi-ui';
import { IconCopy, IconSend, IconUser, IconBolt, IconSetting } from '@douyinfe/semi-icons';
import { useAIConfig } from '../../context/AIConfigContext';
import { AISettingsModal } from './SettingsModal';

// 消息的数据结构
interface Message {
    id: number;
    role: 'user' | 'ai';
    content: string;
}

// 模拟的初始对话数据 (可以保留或清空)
const initialMessages: Message[] = [
    { id: 1, role: 'ai', content: '您好！我是您的工作流AI助手，有什么可以帮助您的吗？请点击右上角的设置图标配置您的AI模型。' },
];

// 单条消息气泡组件 (保持不变，无需修改)
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
    };
    const renderContent = (content: string) => {
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
    const [isLoading, setIsLoading] = useState(false); // 新增：加载状态
    const [isSettingsVisible, setSettingsVisible] = useState(false); // 新增：控制设置模态框
    const { config } = useAIConfig(); // 新增：从Context获取配置
    const messagesEndRef = useRef<HTMLDivElement>(null); // 用于自动滚动

    // 自动滚动到最新消息
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

        // 创建一个空的AI消息占位符，后续会填充流式内容
        const aiResponsePlaceholder: Message = {
            id: Date.now() + 1,
            role: 'ai',
            content: '', // 初始为空
        };
        setMessages(prev => [...prev, aiResponsePlaceholder]);


        try {
            // --- 这是关键的API调用部分 ---
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: config.modelName,
                    messages: updatedMessages.map(({ role, content }) => ({ role, content })), // 发送完整对话历史
                    temperature: config.temperature,
                    apiKey: config.apiKey, // 发送用户配置的Key
                    apiHost: config.apiHost, // 发送用户配置的Host
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // --- 处理流式响应 ---
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
                            if (parsed.end) { // 检查是否是结束标记
                                break;
                            }
                            aiFullResponse += parsed.content || '';
                            // 更新最后一条AI消息的内容
                            setMessages(prev => prev.map(msg =>
                                msg.id === aiResponsePlaceholder.id
                                    ? { ...msg, content: aiFullResponse }
                                    : msg
                            ));
                        } catch (e) {
                            // 忽略无法解析的行
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Failed to fetch AI response:', error);
            const errorMessage = "抱歉，请求出错了。请检查您的网络、API Key或联系管理员。";
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
            {/* --- 新增的头部 --- */}
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
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                {/* 新增：加载中的提示 */}
                {isLoading && (
                    <div className="message-bubble ai">
                        <div className="avatar"><IconBolt /></div>
                        <div className="bubble-content">
                            <Spin size="small" /> <span style={{ marginLeft: 8 }}>正在思考...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} /> {/* 用于滚动定位的空元素 */}
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
                    disabled={isLoading} // 加载中禁用输入框
                />
                <Tooltip content="发送" position="top">
                    <button onClick={handleSend} disabled={!input.trim() || isLoading}>
                        <IconSend />
                    </button>
                </Tooltip>
            </div>

            {/* --- 新增的设置模态框 --- */}
            <AISettingsModal
                visible={isSettingsVisible}
                onClose={() => setSettingsVisible(false)}
            />
        </div>
    );
};