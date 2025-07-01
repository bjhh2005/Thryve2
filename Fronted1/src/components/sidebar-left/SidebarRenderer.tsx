import React from 'react';
import { Button, ButtonGroup, Tooltip } from '@douyinfe/semi-ui';
import {
    IconChevronRight,
    IconComment,
    IconTerminal,
    IconPlusStroked,
    IconFolderStroked,
} from '@douyinfe/semi-icons';
import { useLeftSidebar } from './SidebarProvider';

// 1. 确认组件的导入路径是否与您的文件结构匹配
import { AIAssistantPanel } from './AIAssistant/AIAssistantPanel';
import { ConsolePanel } from './ConsolePanel/ConsolePanel';
import './sidebar-left.less';

// 2. 导入我们需要的两个 Provider
import { AIConfigProvider } from '../../context/AIConfigContext';
import { ChatProvider } from '../../context/ChatProvider';

// ActionBarButton 组件保持不变
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
    const { isCollapsed, activeTab, toggleSidebar, setActiveTab, width, startResizing, isDragging } = useLeftSidebar();

    const handleNewCanvas = () => {
        console.log('触发“新建画布”操作');
    };

    const handleMyProjects = () => {
        console.log('触发“我的项目”操作');
    };

    return (
        // Provider 的包裹顺序通常是外层包裹内层
        <AIConfigProvider>
            {/* 3. 在这里用 ChatProvider 包裹所有侧边栏UI */}
            <ChatProvider>
                <aside
                    className={`left-sidebar-container ${isCollapsed ? 'collapsed' : ''} ${isDragging ? 'is-resizing' : ''}`}
                    style={{ width: isCollapsed ? undefined : `${width}px` }}
                >
                    {/* 操作栏 */}
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

                    {/* 主面板 */}
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
                                {/* 这里渲染的 AIAssistantPanel 现在可以访问到 ChatProvider 提供的所有状态了 */}
                                <AIAssistantPanel />
                            </div>
                            <div className={`tab-pane ${activeTab === 'console' ? 'active' : ''}`}>
                                <ConsolePanel />
                            </div>
                        </div>
                    </div>

                    {/* 展开/折叠按钮 */}
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

                    {/* 拖拽缩放区域 */}
                    {!isCollapsed && (
                        <div className="sidebar-resizer-container">
                            <div
                                className="sidebar-resizer top"
                                onMouseDown={startResizing}
                            />
                            <div
                                className="sidebar-resizer bottom"
                                onMouseDown={startResizing}
                            />
                        </div>
                    )}
                </aside>
            </ChatProvider>
        </AIConfigProvider>
    );
};