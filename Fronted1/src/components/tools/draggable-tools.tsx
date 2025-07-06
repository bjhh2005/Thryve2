// src/components/tools/draggable-tools.tsx (最终健壮版)

import React, { createContext, useContext, useCallback, useRef } from 'react';

// 1. 我们不再需要一个完整的 Provider，一个简单的 Wrapper 组件就足够了
interface DraggableToolsProps {
  children: React.ReactNode;
}

export const DraggableTools: React.FC<DraggableToolsProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    isDragging: false,
    initialMouseX: 0,
    initialMouseY: 0,
    initialLeft: 0,
    initialTop: 0,
  });

  const handleMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    // 拖动结束后，移除全局监听器
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current.isDragging || !containerRef.current) return;

    const deltaX = e.clientX - dragState.current.initialMouseX;
    const deltaY = e.clientY - dragState.current.initialMouseY;

    const newX = dragState.current.initialLeft + deltaX;
    const newY = dragState.current.initialTop + deltaY;

    // 直接操作 DOM style，高效且能避免 React 重渲染
    const style = containerRef.current.style;
    style.left = `${newX}px`;
    style.top = `${newY}px`;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.button !== 0) return; // 只响应鼠标左键
    e.preventDefault();
    e.stopPropagation();

    const state = dragState.current;
    state.isDragging = true;
    state.initialMouseX = e.clientX;
    state.initialMouseY = e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    state.initialLeft = rect.left;
    state.initialTop = rect.top;

    // 关键：在开始拖动时，立即覆盖 transform 和 bottom 样式
    const style = containerRef.current.style;
    style.transform = 'none';
    style.bottom = 'auto';
    // 将初始位置也设置一下，防止跳动
    style.left = `${rect.left}px`;
    style.top = `${rect.top}px`;

    // 拖动开始后，才添加全局监听器
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
  }, [handleMouseMove, handleMouseUp]);

  // 2. 将 onMouseDown 直接传递给子组件
  // 我们使用 React.cloneElement 来为子组件注入 ref 和 onMouseDown
  const child = React.Children.only(children) as React.ReactElement;
  return React.cloneElement(child, {
    ref: containerRef,
    onMouseDown: handleMouseDown,
  });
};