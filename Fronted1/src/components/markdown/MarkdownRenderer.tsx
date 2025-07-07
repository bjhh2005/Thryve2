// src/components/MarkdownRenderer.tsx

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import './MarkdownRenderer.less';

// 复制按钮的 SVG 图标
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

// 一个独立的、带状态的 CodeBlock 组件，用于渲染代码块
const CodeBlock = ({ className, children }: { className?: string, children: React.ReactNode }) => {
    const [buttonText, setButtonText] = useState('复制');

    const language = /language-(\w+)/.exec(className || '')?.[1] || 'text';
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString).then(() => {
            setButtonText('已复制!');
            setTimeout(() => {
                setButtonText('复制');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setButtonText('复制失败');
            setTimeout(() => {
                setButtonText('复制');
            }, 2000);
        });
    };

    return (
        <div className="code-block-wrapper not-prose">
            <div className="code-block-header">
                <span className="language-name">{language}</span>
                <button className="copy-button" onClick={handleCopy}>
                    <CopyIcon />
                    <span>{buttonText}</span>
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                // style={{}}
                PreTag="div"
                useInlineStyles={false}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    );
};


interface MarkdownRendererProps {
    content: string;
}

// react-markdown 会传给 code 组件的属性
interface CustomCodeProps {
    node?: any;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <div className="markdown-renderer-container">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                            <CodeBlock className={className}>{children}</CodeBlock>
                        ) : (
                            <code>{children}</code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};