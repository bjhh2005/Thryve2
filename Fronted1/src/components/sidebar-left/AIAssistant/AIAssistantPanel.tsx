// src/components/sidebar-left/AIAssistantPanel.tsx

import React from 'react';
import { ConversationList } from './ConversationList';
import { ChatView } from './ChatView';
import './AIAssistantPanel.less';

export const AIAssistantPanel = () => {
    return (
        <div className="ai-assistant-panel-container">
            <ConversationList />
            <ChatView />
        </div>
    );
};