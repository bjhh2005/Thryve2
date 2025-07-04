import {
    EditorRenderer,
    FreeLayoutEditorProvider,
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

/**
 * 创建一个新的内部组件，用于消费 ExecutionProvider 提供的状态
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

export const Editor = () => {
    const editorProps = useEditorProps(initialData, nodeRegistries);
    return (
        <div className="doc-free-feature-overview">
            <FreeLayoutEditorProvider {...editorProps}>
                <ExecutionProvider>
                    <EditorLayout />
                </ExecutionProvider>
            </FreeLayoutEditorProvider>
        </div>
    );
};