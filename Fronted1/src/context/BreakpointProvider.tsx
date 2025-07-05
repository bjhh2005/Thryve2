// src/context/BreakpointProvider.tsx

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

// 定义 Context 需要共享的数据和方法
interface BreakpointContextType {
    // 使用 Set 来存储断点，性能更好且能自动去重
    breakpoints: Set<string>;
    // 切换一个节点的断点状态
    toggleBreakpoint: (nodeId: string) => void;
    // 清空所有断点
    clearBreakpoints: () => void;
}

const BreakpointContext = createContext<BreakpointContextType | undefined>(undefined);

export const BreakpointProvider = ({ children }: { children: ReactNode }) => {
    const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());

    const toggleBreakpoint = useCallback((nodeId: string) => {
        setBreakpoints(prevBreakpoints => {
            const newBreakpoints = new Set(prevBreakpoints); // 创建一个副本以避免直接修改 state
            if (newBreakpoints.has(nodeId)) {
                newBreakpoints.delete(nodeId); // 如果已存在，则移除
            } else {
                newBreakpoints.add(nodeId); // 如果不存在，则添加
            }
            return newBreakpoints;
        });
    }, []);

    const clearBreakpoints = useCallback(() => {
        setBreakpoints(new Set());
    }, []);

    const value = { breakpoints, toggleBreakpoint, clearBreakpoints };

    return (
        <BreakpointContext.Provider value={value}>
            {children}
        </BreakpointContext.Provider>
    );
};

// 创建一个自定义 Hook，方便子组件使用
export const useBreakpoints = () => {
    const context = useContext(BreakpointContext);
    if (!context) {
        throw new Error('useBreakpoints must be used within a BreakpointProvider');
    }
    return context;
};