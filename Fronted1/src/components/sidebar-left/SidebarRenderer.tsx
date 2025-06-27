import React from 'react';
import { Button, ButtonGroup, Tooltip } from '@douyinfe/semi-ui';
import {
    IconChevronLeft,
    IconChevronRight,
    IconComment,
    IconTerminal,
    IconPlusStroked,
    IconFolderStroked,
} from '@douyinfe/semi-icons';
import { useLeftSidebar } from './SidebarProvider';
import { AIAssistantPanel } from './AIAssistantPanel';
import { ConsolePanel } from './ConsolePanel';
import './sidebar-left.less';

const ActionBarButton: React.FC<{ icon: React.ReactNode; tooltip: string; onClick?: () => void }> = ({ icon, tooltip, onClick }) => (
    <Tooltip content={tooltip} position="right" mouseEnterDelay={0}>
        <Button
            icon={icon}
            type="tertiary"
            theme="borderless"
            onClick={onClick}
            className="action-bar-button"
        />
    </Tooltip>
);

export const SidebarRenderer = () => {
    const { isCollapsed, activeTab, toggleSidebar, setActiveTab } = useLeftSidebar();

    const handleNewCanvas = () => {
        console.log('触发“新建画布”操作');
    };

    const handleMyProjects = () => {
        console.log('触发“我的项目”操作');
    };

    return (
        <aside className={`left-sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="action-bar">
                <ActionBarButton
                    icon={<IconPlusStroked size="large" />}
                    tooltip="新建画布"
                    onClick={handleNewCanvas}
                />
                <ActionBarButton
                    icon={<IconFolderStroked size="large" />}
                    tooltip="我的项目"
                    onClick={handleMyProjects}
                />
            </div>

            <div className="main-panel">
                <div className="left-sidebar-header">
                    <ButtonGroup>
                        <Tooltip content="AI 助手" position="bottom">
                            <Button
                                icon={<IconComment />}
                                type={activeTab === 'ai' ? 'primary' : 'tertiary'}
                                onClick={() => setActiveTab('ai')}
                            />
                        </Tooltip>
                        <Tooltip content="输出控制台" position="bottom">
                            <Button
                                icon={<IconTerminal />}
                                type={activeTab === 'console' ? 'primary' : 'tertiary'}
                                onClick={() => setActiveTab('console')}
                            />
                        </Tooltip>
                    </ButtonGroup>
                </div>

                <div className="left-sidebar-content-wrapper">
                    <div className={`tab-pane ${activeTab === 'ai' ? 'active' : ''}`}>
                        <AIAssistantPanel />
                    </div>
                    <div className={`tab-pane ${activeTab === 'console' ? 'active' : ''}`}>
                        <ConsolePanel />
                    </div>
                </div>
            </div>

            <Tooltip content={isCollapsed ? '展开' : '收起'} position="right" mouseEnterDelay={0.1}>
                <button
                    className="sidebar-edge-button"
                    onClick={toggleSidebar}
                    aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
                >
                    <div className="icon-wrapper">
                        <IconChevronRight />
                    </div>
                </button>
            </Tooltip>

        </aside>
    );
};