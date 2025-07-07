// src/context/ChatProvider.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAllConversations, getMessagesForConversation, addConversation, addMessage, updateMessage, renameConversation, deleteConversation, Conversation, ChatMessage } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { useAIConfig } from './AIConfigContext';  // 添加 AIConfig 引用

interface ChatContextType {
    conversations: Conversation[];
    activeConversationId: string | null;
    messages: ChatMessage[];
    isHistoryLoading: boolean;
    isConversationListCollapsed: boolean;
    toggleConversationList: () => void;
    createNewConversation: () => Promise<void>;
    switchConversation: (id: string) => Promise<void>;
    // 返回值改为Promise<ChatMessage>，以便获取新消息的ID
    addMessageToActiveConversation: (message: Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt'>) => Promise<ChatMessage>;
    // 用于更新消息内容的函数
    updateMessageContent: (messageId: string, newContent: string) => Promise<void>;
    renameConversation: (id: string, newTitle: string) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    getMessagesWithSystemPrompt: (additionalMessages?: ChatMessage[]) => { role: string; content: string; }[];  // 添加新方法
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { getActiveProviderConfig } = useAIConfig();  // 获取 AI 配置
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(false);

    // 添加获取带系统提示词的消息列表的方法
    const getMessagesWithSystemPrompt = (additionalMessages: ChatMessage[] = []) => {
        const config = getActiveProviderConfig();
        const systemPrompt = config.systemPrompt || "你是Thryve项目的专业AI助手，一个专门为可视化工作流设计的智能助手。你需要帮助用户更好地使用Thryve的各项功能。";
        
        const allMessages = [...messages, ...additionalMessages];
        
        return [
            { role: "system", content: systemPrompt },
            ...allMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];
    };

    const createNewConversation = async () => {
        const newConvo: Conversation = {
            id: uuidv4(),
            title: '新的对话',
            createdAt: Date.now(),
        };
        await addConversation(newConvo);
        setConversations(prev => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        setMessages([]);
    };

    // 初始化加载
    useEffect(() => {
        async function loadInitialData() {
            const allConvos = await getAllConversations();
            setConversations(allConvos);
            if (allConvos.length > 0) {
                await switchConversation(allConvos[0].id);
            } else {
                await createNewConversation();
            }
            setIsHistoryLoading(false);
        }
        loadInitialData();
    }, []);

    const switchConversation = async (id: string) => {
        setActiveConversationId(id);
        const convoMessages = await getMessagesForConversation(id);
        setMessages(convoMessages);
    };

    const addMessageToActiveConversation = async (messageData: Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt'>): Promise<ChatMessage> => {
        if (!activeConversationId) throw new Error("No active conversation to add message to.");

        const newMessage: ChatMessage = {
            ...messageData,
            id: uuidv4(),
            conversationId: activeConversationId,
            createdAt: Date.now(),
        };
        await addMessage(newMessage);
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    };

    const updateMessageContent = async (messageId: string, newContent: string) => {
        //    从当前 React state 中找到要更新的消息
        //    使用 `find` 可能会找到一个旧状态的引用，更安全的方式是直接从 `setMessages` 的回调中获取最新状态
        let messageToUpdate: ChatMessage | undefined;

        setMessages(currentMessages => {
            const updatedMessages = currentMessages.map(msg => {
                if (msg.id === messageId) {
                    messageToUpdate = { ...msg, content: newContent };
                    return messageToUpdate;
                }
                return msg;
            });
            return updatedMessages;
        });

        // 如果找到了要更新的消息，则将其完整地保存到数据库
        if (messageToUpdate) {
            await updateMessage(messageToUpdate);
        } else {
            console.error("Could not find message to update in state:", messageId);
        }
    };

    const toggleConversationList = () => {
        setIsConversationListCollapsed(prev => !prev);
    };

    const handleRenameConversation = async (id: string, newTitle: string) => {
        console.log(`✅ [ChatProvider] 接收到重命名请求, ID: ${id}, 新标题: ${newTitle}`);

        await renameConversation(id, newTitle);
        // 更新UI state
        setConversations(prev =>
            prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
        );
    };

    const handleDeleteConversation = async (id: string) => {
        await deleteConversation(id);
        const remainingConvos = conversations.filter(c => c.id !== id);
        setConversations(remainingConvos);

        // 如果删除的是当前激活的对话，则切换到另一个或新建一个
        if (activeConversationId === id) {
            if (remainingConvos.length > 0) {
                await switchConversation(remainingConvos[0].id);
            } else {
                await createNewConversation();
            }
        }
    };

    const value = {
        conversations,
        activeConversationId,
        messages,
        isHistoryLoading,
        isConversationListCollapsed,
        toggleConversationList,
        createNewConversation,
        switchConversation,
        addMessageToActiveConversation,
        updateMessageContent,
        renameConversation: handleRenameConversation,
        deleteConversation: handleDeleteConversation,
        getMessagesWithSystemPrompt,  // 添加到 context value 中
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};