import {
    EditorRenderer,
    FreeLayoutEditorProvider,
    FreeLayoutProps, // 导入 FreeLayoutProps 类型
} from '@flowgram.ai/free-layout-editor';
import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';

import { nodeRegistries } from './nodes';
import { initialData } from './initial-data';
import { useEditorProps } from './hooks';
import { DemoTools } from './components/tools';
import { SidebarProvider as RightSidebarProvider, SidebarRenderer as RightSidebarRenderer } from './components/sidebar';
import { SidebarProvider as LeftSidebarProvider, SidebarRenderer as LeftSidebarRenderer } from './components/sidebar-left';
import { ExecutionProvider, useExecution } from './context/ExecutionProvider';

import { ProjectProvider } from './context/ProjectProvider';

/**
 * 创建一个新的内部组件，用于消费 ExecutionProvider 和 ProjectProvider 提供的状态
 */
const EditorLayout = () => {
    const { isRunning } = useExecution();

    return (
        <div className={`editor-layout-wrapper ${isRunning ? 'is-running' : ''}`}>
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
        </div>
    );
};


const EditorWrapper = () => {

    const editorProps = useEditorProps(initialData, nodeRegistries);

    return (
        <FreeLayoutEditorProvider {...editorProps}>
            <ExecutionProvider>
                <EditorLayout />
            </ExecutionProvider>
        </FreeLayoutEditorProvider>
    );
}


export const Editor = () => {
    return (
        <div className="doc-free-feature-overview">
            <ProjectProvider>
                <EditorWrapper />
            </ProjectProvider>
        </div>
    );
};