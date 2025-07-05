// Editor.tsx (支持暂停状态版)

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
import { ProjectProvider } from './context/ProjectProvider';
import { BreakpointProvider } from './context/BreakpointProvider';

const EditorLayout = () => {
    // 1. 同时获取 isRunning 和 isPaused 状态
    const { isRunning, isPaused } = useExecution();

    // 2. 构建动态的 className 字符串
    const wrapperClasses = [
        'editor-layout-wrapper',
        isRunning ? 'is-running' : '',
        isPaused ? 'is-paused' : ''
    ].filter(Boolean).join(' '); // filter(Boolean) 会移除空字符串

    return (
        <div className={wrapperClasses}>
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
            <ProjectProvider>
                <FreeLayoutEditorProvider {...editorProps}>
                    <BreakpointProvider>
                        <ExecutionProvider>
                            <EditorLayout />
                        </ExecutionProvider>
                    </BreakpointProvider>
                </FreeLayoutEditorProvider>
            </ProjectProvider>
        </div>
    );
};