import { ConversationList } from './ConversationList';
import { ChatView } from './ChatView';
import { useChat } from '../../../context/ChatProvider';
import './AIAssistantPanel.less';
import React, { memo } from 'react';

export const AIAssistantPanel = memo(() => {
    const { isConversationListCollapsed } = useChat();

    return (
        <div className={`ai-assistant-panel-container ${isConversationListCollapsed ? 'conversation-list-collapsed' : ''}`}>
            <ConversationList />
            <ChatView />
        </div>
    );
});