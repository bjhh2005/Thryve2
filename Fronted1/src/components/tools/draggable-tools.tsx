import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ToolContainer } from './styles';

interface Position {
  x: number;
  y: number;
}

interface DraggableToolsProps {
  children: React.ReactNode;
}

export const DraggableTools: React.FC<DraggableToolsProps> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position | null>(() => {
    // 在初始化时就读取localStorage，避免后续状态更新导致的闪现
    const savedPosition = localStorage.getItem('toolbarPosition');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      } catch (e) {
        localStorage.removeItem('toolbarPosition');
      }
    }
    return null;
  });
  const dragRef = useRef<HTMLDivElement>(null);
  const initialMousePos = useRef<Position>({ x: 0, y: 0 });
  const initialElementPos = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (position) {
      localStorage.setItem('toolbarPosition', JSON.stringify(position));
    }
  }, [position]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    e.preventDefault(); // 防止拖动时选中文本

    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    
    initialMousePos.current = {
      x: e.clientX,
      y: e.clientY
    };
    
    initialElementPos.current = {
      x: rect.left,
      y: rect.top
    };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - initialMousePos.current.x;
    const deltaY = e.clientY - initialMousePos.current.y;

    const newX = initialElementPos.current.x + deltaX;
    const newY = initialElementPos.current.y + deltaY;

    // 确保工具栏不会移出视窗
    const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <ToolContainer
      ref={dragRef}
      onMouseDown={handleMouseDown}
      style={position ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
      } : undefined}
    >
      {children}
    </ToolContainer>
  );
}; 