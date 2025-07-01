import { ConversationList } from './ConversationList';
import { ChatView } from './ChatView';
import { useChat } from '../../../context/ChatProvider';
import './AIAssistantPanel.less';

export const AIAssistantPanel = () => {
    const { isConversationListCollapsed } = useChat();

    return (
        <div className={`ai-assistant-panel-container ${isConversationListCollapsed ? 'conversation-list-collapsed' : ''}`}>
            <ConversationList />
            <ChatView />
        </div>
    );
};