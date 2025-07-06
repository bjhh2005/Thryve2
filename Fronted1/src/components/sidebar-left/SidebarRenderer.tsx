import React, { ReactNode } from 'react';
import { Button, ButtonGroup, Tooltip, Modal, Input } from '@douyinfe/semi-ui';
import {
    IconSave,
    IconChevronRight,
    IconComment,
    IconTerminal,
    IconGlobeStroke,
} from '@douyinfe/semi-icons';
import AiIcon from '../../assets/icon-ai-assistant.png'
import FileIcon from '../../assets/icon-myfile.png'
import { useLeftSidebar } from './SidebarProvider';

import { AIAssistantPanel } from './AIAssistant/AIAssistantPanel';
import { ConsolePanel } from './ConsolePanel/ConsolePanel';
import { MyProjectsPanel } from './MyProjectsPanel/MyProjectsPanel';
import { ProjectProvider, useProject } from '../../context/ProjectProvider';
import './sidebar-left.less';

import { AIConfigProvider } from '../../context/AIConfigContext';
import { ChatProvider } from '../../context/ChatProvider';
import logo from '../../assets/icon-work.png'

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


    const handleClickAndExpand = (action: () => void) => {
        // 执行按钮本身的功能
        action();
        // 如果侧边栏是折叠的，就展开它
        if (isCollapsed) {
            toggleSidebar();
        }
    };

    const handleNewCanvas = () => {
        let projectName = '';
        Modal.confirm({
            title: '新建画布',
            content: (
                <Input
                    autoFocus
                    placeholder="请输入项目名称"
                    // 为参数 value 添加 string 类型
                    onChange={(value: string) => { projectName = value; }}
                />
            ),
            onOk: () => {
                if (!projectName || projectName.trim() === '') {
                    projectName = `未命名画布 ${new Date().toLocaleTimeString()}`;
                }
                createNewProject(projectName);
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
                    icon={<IconGlobeStroke size="large" />}
                    tooltip="新建画布"
                    onClick={handleNewCanvas}
                />
                <ActionBarButton
                    icon={<img src={FileIcon} alt="AI" className="action-bar-icon" />}
                    tooltip="我的项目"
                    onClick={() => handleClickAndExpand(handleMyProjects)}
                    isActive={activeTab === 'projects'}
                />
                <ActionBarButton
                    icon={<img src={AiIcon} alt="AI" className="action-bar-icon" />}
                    tooltip="AI 助手"
                    onClick={() => handleClickAndExpand(() => setActiveTab('ai'))}
                    isActive={activeTab === 'ai'}
                />
                <ActionBarButton
                    icon={<IconTerminal size="large" />}
                    tooltip="输出控制台"
                    onClick={() => handleClickAndExpand(() => setActiveTab('console'))}
                    isActive={activeTab === 'console'}
                />
            </div>

            {/* 主面板 */}
            <div className="main-panel">
                <div className="left-sidebar-header">
                    {/* 显示当前项目名称 */}
                    <div className="project-title-container">
                        <img src={logo} className="project-logo" />
                        <div className="current-project-name">{currentProjectName || '未命名项目'}</div>
                    </div>

                    <div className="header-actions">
                        <Tooltip content="保存当前项目" position="bottom">
                            <Button
                                icon={<IconSave />}
                                onClick={() => saveCurrentProject()}
                                disabled={!currentProject}
                                type="tertiary"
                                theme="borderless"
                                className='top-button' // 使用新的 class 名
                            />
                        </Tooltip>
                        <ButtonGroup className='top-group'>
                            <Tooltip content="AI 助手" position="bottom">
                                <Button
                                    icon={<IconComment />}
                                    type={activeTab === 'ai' ? 'primary' : 'tertiary'}
                                    onClick={() => setActiveTab('ai')}
                                    className='top-button' // 使用新的 class 名
                                />
                            </Tooltip>
                            <Tooltip content="输出控制台" position="bottom">
                                <Button
                                    icon={<IconTerminal />}
                                    type={activeTab === 'console' ? 'primary' : 'tertiary'}
                                    onClick={() => setActiveTab('console')}
                                    className='top-button' // 使用新的 class 名
                                />
                            </Tooltip>
                        </ButtonGroup>
                    </div>
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
            {activeTab !== 'projects' && !isCollapsed && (
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