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
import { SidebarProvider, SidebarRenderer } from './components/sidebar';
// 上下文管理器，用于处理侧边栏状态；侧边栏内容的渲染器

export const Editor = () => {
    const editorProps = useEditorProps(initialData, nodeRegistries);
    return (
        <div className="doc-free-feature-overview">
            <FreeLayoutEditorProvider {...editorProps}>
                <SidebarProvider>
                    <div className="demo-container">
                        <EditorRenderer className="demo-editor" />
                    </div>
                    <DemoTools />
                    <SidebarRenderer />
                </SidebarProvider>
            </FreeLayoutEditorProvider>
        </div>
    );
};
