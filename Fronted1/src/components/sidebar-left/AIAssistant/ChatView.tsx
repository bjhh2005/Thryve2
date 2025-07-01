import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useChat } from '../../../context/ChatProvider';
import { useAIConfig } from '../../../context/AIConfigContext';
import { MarkdownRenderer } from '../../markdown/MarkdownRenderer';
import { Spin, Tooltip, Button, Typography } from '@douyinfe/semi-ui';
import { IconUser, IconBolt, IconSetting, IconSend, IconSidebar, IconMenu } from '@douyinfe/semi-icons';
import { AISettingsModal } from './SettingsModal';
import { ChatMessage } from '../../../utils/db';
import './ChatView.less';

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div className={`message-bubble ${message.role}`}>
        <div className="avatar">{message.role === 'assistant' ? <IconBolt /> : <IconUser />}</div>
        <div className="bubble-content">
            {message.content === 'Thinking...' ? (
                <div style={{ display: 'flex', alignItems: 'center' }}><Spin size="small" /> <span style={{ marginLeft: 8 }}>正在思考...</span></div>
            ) : (
                <MarkdownRenderer content={message.content} />
            )}
        </div>
    </div>
);

export const ChatView = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);

    const { messages, addMessageToActiveConversation, updateMessageContent, isConversationListCollapsed, toggleConversationList } = useChat();
    const { config, getActiveModelName, getActiveProviderConfig } = useAIConfig();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessageContent = input;
        setInput('');
        setIsLoading(true);

        // 1. 先将用户消息添加到Context和数据库
        const userMessage = await addMessageToActiveConversation({ role: 'user', content: userMessageContent });

        // 2. 准备发送给API的上下文，此时应包含刚刚添加的用户消息
        const messagesForApi = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

        // 3. 添加一个AI占位消息，并获取其ID
        const aiPlaceholder = await addMessageToActiveConversation({ role: 'assistant', content: 'Thinking...' });

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
            const activeProviderConfig = getActiveProviderConfig();

            const response = await fetch(`${apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiHost: activeProviderConfig.apiHost,
                    apiKey: activeProviderConfig.apiKey,
                    model: activeProviderConfig.model,
                    temperature: config.temperature,
                    messages: messagesForApi,
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
                            if (parsed.error) throw new Error(parsed.error);
                            if (parsed.end) break;

                            aiFullResponse += parsed.content || '';
                            // 实时更新UI，但不频繁写入数据库
                            updateMessageContent(aiPlaceholder.id, aiFullResponse);

                        } catch (e) { console.error("Failed to parse stream data:", data, e); }
                    }
                }
            }

            // 确保流结束后，如果内容为空，则填充默认回复
            if (aiFullResponse === '') {
                aiFullResponse = '我暂时无法回答这个问题。';
                await updateMessageContent(aiPlaceholder.id, aiFullResponse);
            }

        } catch (error) {
            const errorMessage = `抱歉，请求出错了: ${error instanceof Error ? error.message : String(error)}`;
            await updateMessageContent(aiPlaceholder.id, errorMessage);
        } finally {
            setIsLoading(false);
        }

    }, [input, isLoading, messages, config, addMessageToActiveConversation, updateMessageContent, getActiveProviderConfig]);

    return (
        <div className="chat-view-panel">
            <div className="ai-panel-header">
                <div className="header-actions-left">
                    <Tooltip content={isConversationListCollapsed ? "展开会话列表" : "折叠会话列表"} position="right">
                        <Button
                            icon={<IconMenu />}
                            type="tertiary"
                            theme="borderless"
                            onClick={toggleConversationList}
                            className="collapse-button"
                        />
                    </Tooltip>
                </div>
                <Typography.Text strong>当前模型: {getActiveModelName()}</Typography.Text>
                <Tooltip content="配置AI模型"><Button icon={<IconSetting />} type="tertiary" theme="borderless" onClick={() => setSettingsVisible(true)} /></Tooltip>
            </div>
            <div className="messages-list">
                {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                <div ref={messagesEndRef} />
            </div>
            <div className="ai-input-form">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={isLoading}
                    placeholder="直接向AI下达指令或提问..."
                />
                <Tooltip content="发送" position="top">
                    <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                        <IconSend />
                    </button>
                </Tooltip>
            </div>
            <AISettingsModal visible={isSettingsVisible} onClose={() => setSettingsVisible(false)} />
        </div>
    );
};