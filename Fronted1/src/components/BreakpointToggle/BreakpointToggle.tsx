// src/components/BreakpointToggle/BreakpointToggle.tsx (功能完整版)

import React from 'react';
import { useBreakpoints } from '../../context/BreakpointProvider'; // 1. 引入我们新的 Hook
import './BreakpointToggle.less'; // 假设您为它创建了样式文件

interface Props {
    nodeId: string;
}

export const BreakpointToggle: React.FC<Props> = ({ nodeId }) => {
    // 2. 从 Context 中获取断点状态和操作方法
    const { breakpoints, toggleBreakpoint } = useBreakpoints();

    // 3. 判断当前节点是否已设置断点
    const isActive = breakpoints.has(nodeId);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 防止触发节点的其他点击事件
        // 4. 调用 Context 中的方法来更新全局的断点状态
        toggleBreakpoint(nodeId);
    };

    return (
        <div
            className={`breakpoint-toggle ${isActive ? 'active' : ''}`}
            onClick={handleClick}
            title={isActive ? 'Remove Breakpoint' : 'Add Breakpoint'}
        />
    );
};