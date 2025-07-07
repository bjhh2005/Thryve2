import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useChat } from '../../../context/ChatProvider';
import { useAIConfig } from '../../../context/AIConfigContext';
import { MarkdownRenderer } from '../../markdown/MarkdownRenderer';
import { Tooltip, Button, Typography, Toast } from '@douyinfe/semi-ui';
import { IconMember, IconCommand, IconSetting, IconSend, IconMenu, IconMaximize, IconMinimize, IconImport } from '@douyinfe/semi-icons';
import { AISettingsModal } from './SettingsModal';
import { ChatMessage } from '../../../utils/db';
import { usePlayground, useService, WorkflowDocument } from '@flowgram.ai/free-layout-editor';
import { WelcomeScreen } from './WelcomeScreen';
import { ThinkingRings } from '../../loading/ThinkingRings';
import './ChatView.less';

// 检测消息中是否包含JSON工作流
const detectWorkflowJSON = (content: string): { hasJSON: boolean; jsonData?: any } => {
    try {
        // 查找代码块中的JSON
        const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
        const matches = content.match(jsonBlockRegex);

        if (matches) {
            for (const match of matches) {
                const jsonStr = match.replace(/```json\s*\n?/, '').replace(/\n?```$/, '');
                try {
                    const parsed = JSON.parse(jsonStr);
                    // 验证是否是工作流JSON格式
                    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
                        return { hasJSON: true, jsonData: parsed };
                    }
                } catch (e) {
                    // 继续尝试其他JSON块
                }
            }
        }

        // 如果没有找到代码块，尝试直接解析整个内容
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
            return { hasJSON: true, jsonData: parsed };
        }

        return { hasJSON: false };
    } catch (e) {
        return { hasJSON: false };
    }
};


const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const playground = usePlayground();
    const document = useService(WorkflowDocument);

    // 检测消息中是否包含工作流JSON
    const { hasJSON, jsonData } = detectWorkflowJSON(message.content);

    const handleImportWorkflow = useCallback(() => {
        if (playground.config.readonly) {
            Toast.warning('当前为只读模式，无法导入工作流');
            return;
        }
        if (!jsonData) {
            Toast.error('未找到有效的工作流JSON数据');
            return;
        }
        try {
            // 1. 先清空当前流程图
            document.clear();

            // 2. 等待一下确保清空完成
            setTimeout(() => {
                try {
                    // 3. 验证并加载新数据
                    if (!jsonData || !Array.isArray(jsonData.nodes) || !Array.isArray(jsonData.edges)) {
                        throw new Error('无效的流程图数据格式');
                    }
                    // 4. 渲染新的流程图
                    document.renderJSON(jsonData);
                    // 5. 调整视图以显示完整流程图
                    document.fitView(false);
                    Toast.success('工作流导入成功！');
                } catch (error) {
                    console.error('Error importing workflow:', error);
                    Toast.error('导入工作流失败，请检查JSON格式是否正确');
                }
            }, 100);
        } catch (error) {
            console.error('Error importing workflow:', error);
            Toast.error('导入工作流失败');
        }
    }, [jsonData, document, playground.config.readonly]);

    // 判断当前消息是否是 AI 正在思考的占位消息
    const isThinking = message.role === 'assistant' && message.content === 'Thinking...';

    return (
        <div className={`message-bubble ${message.role}`}>
            <div className={`avatar loading-gemini ${isThinking ? 'bouncing-avatar' : ''}`}>
                {/* <div className={'avatar loading-gemini'}> */}
                {message.role === 'assistant' ? <IconCommand style={{ color: '#cd5c68' }} /> : <IconMember style={{ color: '#3b68ff' }} />}
            </div>
            <div className="bubble-content">
                {isThinking ? (
                    <ThinkingRings visible={true} />
                ) : (
                    <>
                        <MarkdownRenderer content={message.content} />
                        {message.role === 'assistant' && hasJSON && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--semi-color-border)' }}>
                                <Tooltip content="导入上面的工作流到编辑器">
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<IconImport />}
                                        onClick={handleImportWorkflow}
                                        style={{ fontSize: '12px' }}
                                    >
                                        导入工作流
                                    </Button>
                                </Tooltip>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export const ChatView = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [isInputExpanded, setIsInputExpanded] = useState(false);

    const { messages, addMessageToActiveConversation, updateMessageContent, isConversationListCollapsed, toggleConversationList, activeConversationId, renameConversation } = useChat();
    const { config, getActiveModelName, getActiveProviderConfig } = useAIConfig();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 初始界面推荐prompt
    const handleSuggestionClick = (prompt: string) => {
        setInput(prompt);
        // 您也可以选择在这里直接发送
        // handleSend(prompt); 
    };

    // 控制input展开
    const toggleInputExpansion = () => {
        setIsInputExpanded(prev => !prev);
    };

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessageContent = input;
        setInput('');
        setIsLoading(true);

        // 在添加新消息之前，判断这是否是新会话的第一条用户消息
        const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;

        // 1. 先将用户消息添加到Context和数据库
        const userMessage = await addMessageToActiveConversation({ role: 'user', content: userMessageContent });

        // 2. 准备发送给API的上下文，此时应包含刚刚添加的用户消息
        const messagesForApi = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

        // 3. 添加一个AI占位消息，并获取其ID
        const aiPlaceholder = await addMessageToActiveConversation({ role: 'assistant', content: 'Thinking...' });

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

        // --- 在此处异步地、非阻塞地生成标题 ---
        // 我们只对新会话的第一条用户消息执行此操作
        if (isFirstUserMessage && activeConversationId) {
            // 注意：这里没有使用 await，所以它不会阻塞下面的代码执行

            console.log('✅ [ChatView] 触发了标题生成，用户消息:', userMessageContent);
            fetch(`${apiBaseUrl}/api/generate-title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessageContent }),
            })
                .then(res => {
                    if (res.ok) return res.json();
                    // 如果API返回错误，则不继续执行
                    return Promise.reject('Failed to generate title');
                })
                .then(data => {
                    console.log('✅ [ChatView] 收到后端生成的标题:', data);
                    if (data.title) {
                        console.log(`✅ [ChatView] 正在调用 renameConversation，ID: ${activeConversationId}, 新标题: ${data.title}`);
                        // 调用 renameConversation 更新UI和数据库中的标题
                        renameConversation(activeConversationId, data.title);
                    }
                })
                .catch(err => console.error("Title generation error:", err)); // 只在控制台打印错误，不影响主流程
        }

        try {
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
                            await updateMessageContent(aiPlaceholder.id, aiFullResponse);

                        } catch (e) { console.error("Failed to parse stream data:", data, e); }
                    }
                }
            }

            if (aiFullResponse === '') {
                await updateMessageContent(aiPlaceholder.id, '我暂时无法回答这个问题。');
            }

        } catch (error) {
            const errorMessage = `抱歉，请求出错了: ${error instanceof Error ? error.message : String(error)}`;
            await updateMessageContent(aiPlaceholder.id, errorMessage);
        } finally {
            setIsLoading(false);
        }

    }, [input, isLoading, messages, config, addMessageToActiveConversation, updateMessageContent, getActiveProviderConfig, activeConversationId, renameConversation]);


    return (
        <div className="chat-view-panel">
            <div className="ai-panel-header">
                <div className="header-actions-left">
                    <Tooltip content={isConversationListCollapsed ? "展开会话列表" : "折叠会话列表"} position="right">
                        <Button
                            icon={<IconMenu style={{ color: '#8a8a8a' }} />}
                            type="tertiary"
                            theme="borderless"
                            onClick={toggleConversationList}
                            className="collapse-button"
                        />
                    </Tooltip>
                </div>
                <Typography.Text strong>当前模型: {getActiveModelName()}</Typography.Text>
                <Tooltip content="配置AI模型"><Button icon={<IconSetting style={{ color: '#8a8a8a' }} />} type="tertiary" theme="borderless" onClick={() => setSettingsVisible(true)} /></Tooltip>
            </div>
            <div className="messages-list">
                {messages.length === 0 ? (
                    // 如果没有消息，则显示欢迎界面
                    <WelcomeScreen onPromptClick={handleSuggestionClick} />
                ) : (
                    // 如果有消息，则正常渲染消息列表
                    messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className={`ai-input-form ${isInputExpanded ? 'expanded' : ''}`}>
                <div className="textarea-wrapper">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        disabled={isLoading}
                        placeholder="问一问 Thryve"
                    />
                    <Tooltip content={isInputExpanded ? "收起" : "展开"} position="top">
                        <button className="expand-toggle-button" onClick={toggleInputExpansion}>
                            {isInputExpanded ? <IconMinimize /> : <IconMaximize />}
                        </button>
                    </Tooltip>
                </div>
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