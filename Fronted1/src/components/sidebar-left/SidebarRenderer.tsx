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

// 新增：内部组件，用于渲染操作栏的按钮
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
        // 这里的逻辑未来实现
        console.log('触发“新建画布”操作');
    };

    const handleMyProjects = () => {
        // 这里的逻辑未来实现
        console.log('触发“我的项目”操作');
    };

    return (
        <aside className={`left-sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
            {/* 操作栏：始终存在，但其内容会根据折叠状态调整 */}
            <div className="action-bar">
                {/* 这里放置折叠后也需要显示的功能按钮 */}
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

            {/* 主面板：包含之前的头部和内容区，只有在展开时可见 */}
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

            {/* 展开按钮 */}
            <div className="left-sidebar-footer">
                <Tooltip content={isCollapsed ? '展开' : '收起'} position="right">
                    <Button
                        onClick={toggleSidebar}
                        type="tertiary"
                        className="action-bar-button"
                        icon={
                            <span className="gradient-icon">
                                {isCollapsed ? <IconChevronRight size="large" /> : <IconChevronLeft size="large" />}
                            </span>
                        }
                    />
                </Tooltip>
            </div>
        </aside>
    );
};