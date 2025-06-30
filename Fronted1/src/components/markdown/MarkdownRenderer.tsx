// src/components/MarkdownRenderer.tsx

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './MarkdownRenderer.less'; // 引入样式文件

interface MarkdownRendererProps {
    content: string;
}

//    我们在这里定义了所有 react-markdown 会传给 code 组件的属性
interface CustomCodeProps {
    node?: any;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <div className="markdown-renderer-container prose">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }: CustomCodeProps) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';

                        return !inline && match ? (
                            // 2. 解决冲突：在代码块外层包裹一个带 "not-prose" 的 div
                            //    这会告诉 Tailwind Typography 不要处理这个区域的样式
                            //    从而让 react-syntax-highlighter 完全接管代码块的渲染
                            <div className="not-prose">
                                <SyntaxHighlighter
                                    style={a11yDark as any}
                                    language={language}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};