// src/context/ChatProvider.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAllConversations, getMessagesForConversation, addConversation, addMessage, updateMessage, Conversation, ChatMessage } from '../utils/db'; import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
    conversations: Conversation[];
    activeConversationId: string | null;
    messages: ChatMessage[];
    isHistoryLoading: boolean;
    createNewConversation: () => Promise<void>;
    switchConversation: (id: string) => Promise<void>;
    // 返回值改为Promise<ChatMessage>，以便获取新消息的ID
    addMessageToActiveConversation: (message: Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt'>) => Promise<ChatMessage>;
    // 新增：用于更新消息内容的函数
    updateMessageContent: (messageId: string, newContent: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);

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


    const value = {
        conversations,
        activeConversationId,
        messages,
        isHistoryLoading,
        createNewConversation,
        switchConversation,
        addMessageToActiveConversation,
        updateMessageContent,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};