//FreeLayoutEditorProvider：上下文提供器，初始化整个编辑器环境
//EditorRenderer：实际渲染编辑器主界面的组件
import { EditorRenderer, FreeLayoutEditorProvider } from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { nodeRegistries } from './nodes';
import { initialData } from './initial-data';
import { useEditorProps } from './hooks';
import { DemoTools } from './components/tools';
// 一些附加操作按钮、调试工具等
import { SidebarProvider as RightSidebarProvider, SidebarRenderer as RightSidebarRenderer } from './components/sidebar';
import { SidebarProvider as LeftSidebarProvider, SidebarRenderer as LeftSidebarRenderer } from './components/sidebar-left';
// 上下文管理器，用于处理侧边栏状态；侧边栏内容的渲染器
// import { ConsoleProvider } from './context/ConsoleProvider';
// import { WorkflowStateProvider } from './context/WorkflowStateProvider';
import { ExecutionProvider } from './context/ExecutionProvider';

export const Editor = () => {
    const editorProps = useEditorProps(initialData, nodeRegistries);
    return (
        <div className="doc-free-feature-overview">
            <FreeLayoutEditorProvider {...editorProps}>
                <ExecutionProvider>
                    <RightSidebarProvider>
                        <LeftSidebarProvider>

                            <div className="demo-container">
                                <EditorRenderer className="demo-editor" />
                            </div>
                            <DemoTools />

                            <LeftSidebarRenderer />
                            <RightSidebarRenderer />
                        </LeftSidebarProvider>
                    </RightSidebarProvider>
                </ExecutionProvider>
            </FreeLayoutEditorProvider>
        </div>
    );
};
