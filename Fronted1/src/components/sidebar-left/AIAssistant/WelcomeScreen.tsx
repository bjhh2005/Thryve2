// src/components/ChatView/WelcomeScreen.tsx

import React from 'react';
// 引入您需要的功能建议图标
import { IconTerminal, IconEdit, IconComment, IconArticle } from '@douyinfe/semi-icons';
// 引入样式文件 (我们将在下一步创建它)
import './WelcomeScreen.less';

// 定义卡片的数据结构
interface SuggestionCard {
    icon: React.ReactNode;
    title: string;
    prompt: string;
}

// 定义功能建议卡片的内容，您可以轻松地在这里修改
const suggestionCards: SuggestionCard[] = [
    {
        icon: <IconTerminal />,
        title: '生成工作流',
        prompt: '帮我生成一个批量处理PDF文件的工作流，需要从文件夹读取所有PDF文件，提取文本内容并保存到输出文件夹',
    },
    {
        icon: <IconEdit />,
        title: '节点配置',
        prompt: '如何配置图像处理节点来批量调整图片尺寸？我需要将文件夹中的所有图片调整为800x600像素',
    },
    {
        icon: <IconArticle />,
        title: 'LLM文本总结',
        prompt: '帮我生成一个使用LLM节点对文件夹中的文本文件进行总结的工作流，需要读取所有文本文件并生成总结报告',
    },
    {
        icon: <IconComment />,
        title: '问题排查',
        prompt: '我的工作流在执行时出现错误，节点之间的数据传递好像有问题，应该如何排查？',
    },
];

// 定义组件的 Props 类型
interface WelcomeScreenProps {
    // 当用户点击卡片时，这个函数会被调用
    onPromptClick: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptClick }) => {
    return (
        <div className="welcome-screen-container">
            <div className="welcome-content">
                {/* 1. 炫酷的渐变字体标题 */}
                <h1 className="gradient-title">你好，我是你的AI助手</h1>

                {/* 2. 副标题 */}
                <p className="subtitle">今天我能为您做些什么？</p>

                {/* 3. 功能建议卡片网格 */}
                <div className="suggestion-grid">
                    {suggestionCards.map((card, index) => (
                        <div
                            key={index}
                            className="suggestion-card"
                            onClick={() => onPromptClick(card.prompt)}
                        >
                            <div className="card-icon">{card.icon}</div>
                            <div className="card-text">
                                <h3>{card.title}</h3>
                                <p>{card.prompt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};