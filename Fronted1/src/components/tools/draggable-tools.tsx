import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';

interface Position {
  x: number;
  y: number;
}

interface DraggableToolsProps {
  children: React.ReactNode;
  className?: string;
}

const DraggableContainer = styled.div<{ isDragging: boolean }>`
  position: fixed;
  z-index: 1000;
  transition: ${props => props.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};
  
  /* 默认位置在底部中间 */
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);

  /* 当被拖动时的样式会通过 style 属性覆盖这些默认值 */
  &[style*="left"] {
    bottom: auto;
    transform: none;
  }
`;

export const DraggableTools: React.FC<DraggableToolsProps> = ({ children, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position | null>(() => {
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
    
    // 如果点击的是按钮或其他交互元素，不启动拖拽
    if ((e.target as HTMLElement).tagName === 'BUTTON' || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }

    e.preventDefault();
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
    <DraggableContainer
      ref={dragRef}
      className={className}
      isDragging={isDragging}
      onMouseDown={handleMouseDown}
      style={position ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
      } : undefined}
    >
      {children}
    </DraggableContainer>
  );
}; 