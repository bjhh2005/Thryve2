import { Button, ButtonGroup, Tooltip } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconChevronRight, IconComment, IconTerminal } from '@douyinfe/semi-icons';
import { useLeftSidebar } from './SidebarProvider';
import { AIAssistantPanel } from './AIAssistantPanel';
import { ConsolePanel } from './ConsolePanel';
import './sidebar-left.less'; // 引入专属样式

export const SidebarRenderer = () => {
    const { isCollapsed, activeTab, toggleSidebar, setActiveTab } = useLeftSidebar();

    return (
        <aside className={`left-sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="left-sidebar-header">
                {!isCollapsed && (
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
                )}
            </div>

            <div className="left-sidebar-content-wrapper">
                <div className={`tab-pane ${activeTab === 'ai' ? 'active' : ''}`}>
                    <AIAssistantPanel />
                </div>
                <div className={`tab-pane ${activeTab === 'console' ? 'active' : ''}`}>
                    <ConsolePanel />
                </div>
            </div>

            <div className="left-sidebar-footer">
                <Tooltip content={isCollapsed ? '展开' : '收起'} position="right">
                    <Button
                        icon={isCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
                        onClick={toggleSidebar}
                        type="tertiary"
                    />
                </Tooltip>
            </div>
        </aside>
    );
};