// src/components/NodeResultDisplay.tsx

import React, { useState } from 'react';
import { IconTickCircle, IconPlusCircle, IconChevronDown } from '@douyinfe/semi-icons';
import { NodeState } from '../../context/ExecutionProvider';

// 为这个组件创建一个简单的 CSS 文件或 Less 文件
import './NodeResultDisplay.less';

interface Props {
    nodeState: NodeState;
}

// 一个小巧的 JSON 格式化展示组件
const JsonViewer: React.FC<{ data: any }> = ({ data }) => {
    let content;
    try {
        // 如果是对象或数组，格式化显示；否则直接显示
        content = typeof data === 'object' && data !== null
            ? JSON.stringify(data, null, 2)
            : String(data);
    } catch (e) {
        content = 'Error formatting data.';
    }
    return <pre className="json-viewer">{content}</pre>;
};

export const NodeResultDisplay: React.FC<Props> = ({ nodeState }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!nodeState || nodeState.status === 'IDLE' || nodeState.status === 'PROCESSING') {
        return null; // 只在成功或失败时显示
    }

    const isSuccess = nodeState.status === 'SUCCEEDED';
    const hasPayload = nodeState.payload !== undefined && nodeState.payload !== null;

    return (
        <div className={`node-result-display ${isSuccess ? 'success' : 'failed'}`}>
            <div className="result-header" onClick={() => hasPayload && setIsExpanded(!isExpanded)}>
                {isSuccess ? <IconTickCircle className="icon-success" /> : <IconPlusCircle className="icon-failed" />}
                <span className="result-status-text">{isSuccess ? 'Succeeded' : 'Failed'}</span>
                {hasPayload && (
                    <IconChevronDown className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
                )}
            </div>
            {isExpanded && hasPayload && (
                <div className="result-payload">
                    <JsonViewer data={nodeState.payload} />
                </div>
            )}
        </div>
    );
};