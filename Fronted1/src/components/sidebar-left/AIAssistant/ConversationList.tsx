import React from 'react';
import { Button, List } from '@douyinfe/semi-ui';
import { IconPlus, IconImage } from '@douyinfe/semi-icons';
import { useChat } from '../../../context/ChatProvider';
import './ConversationList.less';

export const ConversationList = () => {
    const { conversations, activeConversationId, createNewConversation, switchConversation } = useChat();

    return (
        <div className="conversation-list-panel">
            <div className="list-header">
                <Button icon={<IconPlus />} block onClick={createNewConversation}>
                    新的对话
                </Button>
            </div>
            <List
                className="list-body"
                dataSource={conversations}
                renderItem={item => (
                    <List.Item
                        className={`convo-item ${item.id === activeConversationId ? 'active' : ''}`}
                        onClick={() => switchConversation(item.id)}
                    >
                        <IconImage style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />
                        <span className="convo-title">{item.title}</span>
                    </List.Item>
                )}
            />
        </div>
    );
};