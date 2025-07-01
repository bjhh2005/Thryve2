import React from 'react';
import { List, Typography } from '@douyinfe/semi-ui';
import { IconPlus, IconSidebar } from '@douyinfe/semi-icons';
import { useChat } from '../../../context/ChatProvider';
import './ConversationList.less';

import IconNewChat from '../../../assets/icon-newchat.svg';

export const ConversationList = () => {
    const { conversations, activeConversationId, createNewConversation, switchConversation, toggleConversationList } = useChat();


    return (
        <div className="conversation-list-panel">
            <div className="new-chat-item" onClick={createNewConversation}>
                <span className="item-icon">
                    <img src={IconNewChat} alt="New Chat" />
                </span>
                <span className="item-title">发起新对话</span>
            </div>

            <div className="recent-chats-label">
                <Typography.Text type="tertiary" size="small">近期对话</Typography.Text>
            </div>

            <List
                className="list-body"
                dataSource={conversations}
                renderItem={item => (
                    <List.Item
                        className={`convo-item ${item.id === activeConversationId ? 'active' : ''}`}
                        onClick={() => switchConversation(item.id)}
                    >
                        <span className="convo-title">{item.title}</span>
                    </List.Item>
                )}
            />
        </div>
    );
};