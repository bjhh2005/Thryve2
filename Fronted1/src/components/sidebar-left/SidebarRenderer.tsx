import React, { ReactNode } from 'react';
import { Button, ButtonGroup, Tooltip, Modal, Input } from '@douyinfe/semi-ui';
import {
    IconSave,
    IconChevronRight,
    IconComment,
    IconTerminal,
    IconPlusStroked,
    IconFolderStroked,
} from '@douyinfe/semi-icons';
import { useLeftSidebar } from './SidebarProvider';

import { AIAssistantPanel } from './AIAssistant/AIAssistantPanel';
import { ConsolePanel } from './ConsolePanel/ConsolePanel';
import { MyProjectsPanel } from './MyProjectsPanel/MyProjectsPanel';
import { ProjectProvider, useProject } from '../../context/ProjectProvider';
import './sidebar-left.less';

import { AIConfigProvider } from '../../context/AIConfigContext';
import { ChatProvider } from '../../context/ChatProvider';

const ActionBarButton: React.FC<{ icon: ReactNode; tooltip: string; onClick?: () => void; isActive?: boolean }> = ({ icon, tooltip, onClick, isActive }) => (
    <Tooltip content={tooltip} position="right" mouseEnterDelay={0}>
        <Button
            icon={icon}
            type="tertiary"
            theme="borderless"
            onClick={onClick}
            className={`action-bar-button ${isActive ? 'active' : ''}`}
        />
    </Tooltip>
);

// 新建一个内部组件，以便能访问 useProject 上下文
const SidebarContent = () => {
    const { isCollapsed, activeTab, toggleSidebar, setActiveTab, width, startResizing, isDragging } = useLeftSidebar();
    // 2. 使用 useProject hook
    const { createNewProject, getCurrentProjectName, saveCurrentProject, currentProject } = useProject();

    const handleNewCanvas = () => {
        let projectName = '';
        Modal.confirm({
            title: '新建画布',
            content: (
                <Input
                    // 修正 1: autofocus -> autoFocus
                    autoFocus
                    placeholder="请输入项目名称"
                    // 修正 9: 为参数 value 添加 string 类型
                    onChange={(value: string) => { projectName = value; }}
                />
            ),
            onOk: () => {
                if (!projectName || projectName.trim() === '') {
                    // 如果用户没有输入，给一个默认名称
                    projectName = `未命名画布 ${new Date().toLocaleTimeString()}`;
                }
                createNewProject(projectName);
                // 创建后自动切换到 AI 助手视图
                setActiveTab('ai');
            },
        });
    };

    const handleMyProjects = () => {
        // 如果当前已是 projects tab，则切换回 ai tab，否则切换到 projects tab
        if (activeTab === 'projects') {
            setActiveTab('ai');
        } else {
            setActiveTab('projects');
        }
    };

    // 我们还需要一个地方显示当前项目名称, 可以在这里，也可以在主界面顶部
    const currentProjectName = getCurrentProjectName();


    return (
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
                    isActive={activeTab === 'projects'}
                />
            </div>

            {/* 主面板 */}
            <div className="main-panel">
                <div className="left-sidebar-header">
                    {/* 显示当前项目名称 */}
                    <div className="current-project-name">{currentProjectName}</div>
                    <Tooltip content="保存当前项目" position="bottom">
                        <Button
                            icon={<IconSave />}
                            onClick={() => saveCurrentProject()}
                            disabled={!currentProject}
                            type="tertiary"
                            theme="borderless"
                        />
                    </Tooltip>
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
                    {/* 3. 添加我的项目面板 */}
                    <div className={`tab-pane ${activeTab === 'projects' ? 'active' : ''}`}>
                        <MyProjectsPanel />
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
    );
}


export const SidebarRenderer = () => {
    return (
        <ProjectProvider>
            <AIConfigProvider>
                <ChatProvider>
                    <SidebarContent />
                </ChatProvider>
            </AIConfigProvider>
        </ProjectProvider>
    );
};