import React, { useState, useCallback } from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { IconCopy, IconSend, IconUser, IconBolt } from '@douyinfe/semi-icons';

// 消息的数据结构
interface Message {
    id: number;
    role: 'user' | 'ai';
    content: string;
}

// 模拟的初始对话数据
const initialMessages: Message[] = [
    { id: 1, role: 'ai', content: '您好！我是您的工作流AI助手，有什么可以帮助您的吗？' },
    { id: 2, role: 'user', content: '你好，请帮我创建一个包含“开始”和“结束”节点的简单工作流。' },
    { id: 3, role: 'ai', content: '好的，已为您创建。\n\n```json\n{\n  "nodes": [\n    { "id": "start-1", "type": "START" },\n    { "id": "end-1", "type": "END" }\n  ],\n  "edges": []\n}\n```\n\n请问还有其他需要吗？' },
];

// 单条消息气泡组件
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            // 这里可以添加一个复制成功的提示，例如一个短暂的 Tooltip
            console.log('代码已复制');
        });
    };

    const renderContent = (content: string) => {
        // 简单实现代码块和普通文本分离
        const parts = content.split(/```(json|typescript|javascript|bash|)\n([\s\S]*?)\n```/);
        return parts.map((part, index) => {
            if (index % 3 === 2) { // 这是代码部分
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
            return <p key={index}>{part}</p>; // 这是普通文本
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


export const AIAssistantPanel = () => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');

    const handleSend = useCallback(() => {
        if (!input.trim()) return;

        const newUserMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: input,
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInput('');

        // 模拟AI回复
        setTimeout(() => {
            const aiResponse: Message = {
                id: Date.now() + 1,
                role: 'ai',
                content: `关于您的问题“${input}”，我正在处理...`
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);

    }, [input]);

    return (
        <div className="ai-assistant-panel">
            <div className="messages-list">
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
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
                />
                <Tooltip content="发送" position="top">
                    <button onClick={handleSend} disabled={!input.trim()}>
                        <IconSend />
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};