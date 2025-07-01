import React, { useState, useCallback } from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { IconCopy, IconSend, IconUser, IconBolt } from '@douyinfe/semi-icons';
import TextareaAutosize from 'react-textarea-autosize';

// ... (Message 和 MessageBubble 组件与之前相同, 这里为了完整性再次提供) ...
interface Message { id: number; role: 'user' | 'ai'; content: string; }
const initialMessages: Message[] = [
    { id: 1, role: 'ai', content: '您好！我是您的工作流AI助手，有什么可以帮助您的吗？' },
    { id: 2, role: 'user', content: '你好，请帮我创建一个包含“开始”和“结束”节点的简单工作流。' },
    { id: 3, role: 'ai', content: '好的，已为您创建。\n\n```json\n{\n  "nodes": [\n    { "id": "start-1", "type": "START" },\n    { "id": "end-1", "type": "END" }\n  ],\n  "edges": []\n}\n```\n\n请问还有其他需要吗？' },
];

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



export const ChatView: React.FC = () => {
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
        <>
            <div className="messages-list">
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            </div>
            <div className="ai-input-wrapper">
                <div className="ai-input-container">
                    <TextareaAutosize
                        minRows={1} maxRows={8}
                        placeholder="与 AI 对话，或让他直接操作工作流..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    />
                    <Tooltip content="发送" position="top">
                        <button className="send-button" onClick={handleSend} disabled={!input.trim()}>
                            <IconSend />
                        </button>
                    </Tooltip>
                </div>
                <p className="input-footer-text">
                    Doc T.ai 可能会犯错，请核查重要信息。
                </p>
            </div>
        </>
    );
};