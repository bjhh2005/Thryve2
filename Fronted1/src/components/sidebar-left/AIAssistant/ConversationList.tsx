
import React, { useState, useEffect, useRef } from 'react';
import { List, Typography, Dropdown, Button, Input, Modal } from '@douyinfe/semi-ui';
import { /*IconNewChat, IconMessage,*/ IconMore } from '@douyinfe/semi-icons'; // 使用Semi图标
import { useChat } from '../../../context/ChatProvider';
import './ConversationList.less';
import { type Conversation } from '../../../utils/db'
import IconNewChat from '../../../assets/icon-newchat.svg';


export const ConversationList = () => {
    const { conversations, activeConversationId, createNewConversation, switchConversation, renameConversation, deleteConversation } = useChat();

    // 新增：用于处理重命名的状态
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const renameInputRef = useRef<HTMLInputElement>(null);

    const handleStartRename = (convo: Conversation) => {
        setRenamingId(convo.id);
        setRenameValue(convo.title);
        setTimeout(() => {
            renameInputRef.current?.focus();
            renameInputRef.current?.select(); // 可以顺便全选文字，方便修改
        }, 0);
    };

    const handleConfirmRename = () => {
        if (renamingId && renameValue.trim()) {
            renameConversation(renamingId, renameValue.trim());
        }
        setRenamingId(null);
    };

    const handleDeleteWithConfirm = (convo: Conversation) => {
        Modal.confirm({
            title: '确认删除对话？',
            content: `您确定要永久删除对话“${convo.title}”吗？此操作无法撤销。`,
            onOk: () => deleteConversation(convo.id),
        });
    };

    return (
        <div className="conversation-list-panel">
            <div className="new-chat-item" onClick={createNewConversation}>
                <span className="item-icon">
                    <img src={IconNewChat} alt="New Chat" />
                </span>
                <span className="item-title">新的对话</span>
            </div>
            <div className="recent-chats-label">
                <Typography.Text type="tertiary" size="small">近期对话</Typography.Text>
            </div>
            <List
                className="list-body"
                dataSource={conversations}
                renderItem={item => (
                    <List.Item
                        className={`convo-item ${item.id === activeConversationId ? 'active' : ''} ${item.id === renamingId ? 'renaming' : ''}`}
                        onClick={() => switchConversation(item.id)}
                    >
                        {/* <span className="item-icon"><IconMessage /></span> */}

                        {/* 根据是否在重命名状态，显示输入框或标题 */}
                        {renamingId === item.id ? (
                            <Input
                                // 将 ref 直接传递给 Input 组件
                                ref={renameInputRef as any}
                                value={renameValue}
                                onChange={setRenameValue}
                                onBlur={handleConfirmRename}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmRename();
                                    if (e.key === 'Escape') setRenamingId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="rename-input"
                            />
                        ) : (
                            <span className="convo-title">{item.title}</span>
                        )}

                        {renamingId !== item.id && (
                            <Dropdown
                                trigger="click"
                                position="bottomRight"
                                render={
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => handleStartRename(item)}>重命名</Dropdown.Item>
                                        <Dropdown.Item type="danger" onClick={() => handleDeleteWithConfirm(item)}>删除</Dropdown.Item>
                                    </Dropdown.Menu>
                                }
                            >
                                <Button
                                    type="tertiary"
                                    theme="borderless"
                                    icon={<IconMore />}
                                    className="item-actions-button"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Dropdown>
                        )}
                    </List.Item>
                )}
            />
        </div>
    );
};