import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useChat } from '../../../context/ChatProvider';
import { useAIConfig } from '../../../context/AIConfigContext';
import { MarkdownRenderer } from '../../markdown/MarkdownRenderer';
import { Spin, Tooltip, Button, Typography, Toast, Select, Tag } from '@douyinfe/semi-ui';
import { IconMember, IconCommand, IconSetting, IconSend, IconMenu, IconMaximize, IconMinimize, IconImport, IconCode, IconComment } from '@douyinfe/semi-icons';
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

// 定义AI模式类型
type AIMode = 'ask' | 'agent';

export const ChatView = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    const [aiMode, setAIMode] = useState<AIMode>('ask'); // 新增：AI模式状态

    const { messages, addMessageToActiveConversation, updateMessageContent, isConversationListCollapsed, toggleConversationList, activeConversationId, renameConversation, getMessagesWithSystemPrompt, conversations } = useChat();
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

    // 新增：处理工作流生成的函数
    const handleWorkflowGeneration = async (userMessageContent: string, aiPlaceholder: ChatMessage) => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const activeProviderConfig = getActiveProviderConfig();

        const response = await fetch(`${apiBaseUrl}/api/generate-workflow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requirement: userMessageContent,
                apiHost: activeProviderConfig.apiHost,
                apiKey: activeProviderConfig.apiKey,
                model: activeProviderConfig.model,
                temperature: config.temperature,
            }),
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            throw new Error(`工作流生成失败: ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiFullResponse = '';
        let workflowData = null;

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
                        
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                        
                        if (parsed.end) {
                            break;
                        }
                        
                        // 处理流式内容
                        if (parsed.content) {
                            aiFullResponse += parsed.content;
                            await updateMessageContent(aiPlaceholder.id, aiFullResponse);
                        }
                        
                        // 处理工作流数据
                        if (parsed.workflow && parsed.success) {
                            workflowData = parsed.workflow;
                        }
                        
                        // 处理警告信息
                        if (parsed.warning) {
                            console.warn('Workflow generation warning:', parsed.warning);
                        }

                    } catch (e) { 
                        console.error("Failed to parse stream data:", data, e); 
                    }
                }
            }
        }

        // 流式输出结束后，如果有工作流数据，确保JSON格式化
        if (workflowData && aiFullResponse) {
            // 如果AI回复中包含JSON，将其替换为格式化的版本
            const jsonRegex = /```json\s*\n(.*?)\n```/gs;
            const formattedJSON = JSON.stringify(workflowData, null, 2);
            
            if (jsonRegex.test(aiFullResponse)) {
                // 替换原有的JSON为格式化版本
                aiFullResponse = aiFullResponse.replace(jsonRegex, `\`\`\`json\n${formattedJSON}\n\`\`\``);
            } else {
                // 如果AI回复中没有JSON，则添加格式化的JSON
                aiFullResponse += `\n\n\`\`\`json\n${formattedJSON}\n\`\`\`\n\n您可以直接复制上面的JSON配置导入到Thryve中使用。`;
            }
            
            await updateMessageContent(aiPlaceholder.id, aiFullResponse);
        }

        if (aiFullResponse === '') {
            await updateMessageContent(aiPlaceholder.id, '工作流生成失败，请重试。');
        }
    };

    // 新增：处理普通聊天的函数
    const handleNormalChat = async (messagesForApi: any[], aiPlaceholder: ChatMessage) => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
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
    };

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessageContent = input;
        setInput('');
        setIsLoading(true);


        // 检查是否需要生成标题：当前会话标题是默认的"新的对话"时就生成标题
        const currentConversation = conversations.find(c => c.id === activeConversationId);
        const shouldGenerateTitle = currentConversation?.title === '新的对话';

        // 1. 先将用户消息添加到Context和数据库
        const userMessage = await addMessageToActiveConversation({ role: 'user', content: userMessageContent });

        // 2. 准备发送给API的上下文，使用包含系统提示词的消息列表
        const messagesForApi = getMessagesWithSystemPrompt([userMessage]);

        // 3. 添加一个AI占位消息，并获取其ID
        const aiPlaceholder = await addMessageToActiveConversation({ 
            role: 'assistant', 
            content: aiMode === 'agent' ? '正在生成工作流...' : 'Thinking...' 
        });

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

        // --- 在此处异步地、非阻塞地生成标题 ---
        // 我们只对新会话的第一条用户消息执行此操作
        if (shouldGenerateTitle && activeConversationId) {
            console.log('✅ [ChatView] 触发了标题生成，用户消息:', userMessageContent);
            console.log('✅ [ChatView] 当前会话ID:', activeConversationId);
            console.log('✅ [ChatView] 消息历史长度:', messages.length);
            console.log('✅ [ChatView] 标题生成条件:', {
                shouldGenerateTitle,
                currentConversationTitle: currentConversation?.title
            });
            
            fetch(`${apiBaseUrl}/api/generate-title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessageContent }),
            })
                .then(res => {
                    console.log('✅ [ChatView] 标题生成API响应状态:', res.status);
                    if (res.ok) return res.json();
                    // 如果API返回错误，则不继续执行
                    return Promise.reject(`API returned status ${res.status}`);
                })
                .then(data => {
                    console.log('✅ [ChatView] 收到后端生成的标题:', data);
                    if (data.title) {
                        console.log(`✅ [ChatView] 正在调用 renameConversation，ID: ${activeConversationId}, 新标题: ${data.title}`);
                        // 调用 renameConversation 更新UI和数据库中的标题
                        renameConversation(activeConversationId, data.title);
                    } else {
                        console.warn('✅ [ChatView] 后端返回的数据中没有title字段:', data);
                    }
                })
                .catch(err => {
                    console.error("❌ [ChatView] 标题生成错误:", err);
                    // 尝试获取更详细的错误信息
                    if (err instanceof Response) {
                        err.text().then(text => console.error("❌ [ChatView] 错误详情:", text));
                    }
                });
        } else {
            console.log('🔍 [ChatView] 跳过标题生成:', {
                shouldGenerateTitle,
                activeConversationId,
                currentConversationTitle: currentConversation?.title,
                messagesCount: messages.length,
                userMessagesCount: messages.filter(m => m.role === 'user').length
            });
        }

        try {
            // 根据模式选择不同的处理方式
            if (aiMode === 'agent') {
                // Agent模式：生成工作流
                await handleWorkflowGeneration(userMessageContent, aiPlaceholder);
            } else {
                // Ask模式：普通聊天
                await handleNormalChat(messagesForApi, aiPlaceholder);
            }

        } catch (error) {
            const errorMessage = `抱歉，请求出错了: ${error instanceof Error ? error.message : String(error)}`;
            await updateMessageContent(aiPlaceholder.id, errorMessage);
        } finally {
            setIsLoading(false);
        }

    }, [input, isLoading, messages, config, addMessageToActiveConversation, updateMessageContent, getActiveProviderConfig, activeConversationId, renameConversation, aiMode, getMessagesWithSystemPrompt, conversations]);

    // 新增：模式切换选项
    const modeOptions = [
        { value: 'ask', label: 'Ask 问答', icon: <IconComment /> },
        { value: 'agent', label: 'Agent 工作流', icon: <IconCode /> }
    ];

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
                <div className="header-center">
                    <Typography.Text strong>当前模型: {getActiveModelName()}</Typography.Text>
                    <div className="mode-selector">
                        <Select
                            value={aiMode}
                            onChange={(value) => setAIMode(value as AIMode)}
                            style={{ width: 140 }}
                            size="small"
                            renderSelectedItem={(option: any) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {option.icon}
                                    <span>{option.label}</span>
                                </div>
                            )}
                        >
                            {modeOptions.map(option => (
                                <Select.Option key={option.value} value={option.value}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </div>
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                </div>
                <Tooltip content="配置AI模型">
                    <Button 
                        icon={<IconSetting style={{ color: '#8a8a8a' }} />} 
                        type="tertiary" 
                        theme="borderless" 
                        onClick={() => setSettingsVisible(true)} 
                    />
                </Tooltip>
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
                <div className="mode-indicator">
                    <Tag 
                        color={aiMode === 'agent' ? 'blue' : 'green'} 
                        size="small"
                    >
                        {aiMode === 'agent' ? '🤖 Agent模式' : '💬 Ask模式'}
                    </Tag>
                </div>
                <div className="input-container">
                    <div className="textarea-wrapper">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            disabled={isLoading}
                            placeholder={aiMode === 'agent' ? "描述您想要的工作流..." : "问一问 Thryve"}
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
            </div>
            <AISettingsModal visible={isSettingsVisible} onClose={() => setSettingsVisible(false)} />
        </div>
    );
};