import React, { useState, useCallback, useContext, createContext, useRef, useEffect } from 'react';

// 初始宽度和最小/最大宽度限制
const INITIAL_WIDTH = 600;
const MIN_WIDTH = 312;
const MAX_WIDTH = 1000;
const LOCAL_STORAGE_KEY = 'sidebarWidth'; // 定义用于 localStorage 的键

interface LeftSidebarContextType {
  isCollapsed: boolean;
  activeTab: string;
  width: number;
  isDragging: boolean;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  startResizing: (e: React.MouseEvent) => void;
}

const LeftSidebarContext = createContext<LeftSidebarContextType | null>(null);

export const useLeftSidebar = () => {
  const context = useContext(LeftSidebarContext);
  if (!context) {
    throw new Error('useLeftSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const [width, setWidth] = useState(() => {
    try {
      const savedWidth = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      // 如果有保存的值，则使用它，否则使用初始值
      return savedWidth ? parseInt(savedWidth, 10) : INITIAL_WIDTH;
    } catch (error) {
      // 如果出错（例如在SSR环境中），则使用初始值
      return INITIAL_WIDTH;
    }
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    try {
      // 我们只在拖拽结束或初次加载后保存，避免在拖拽过程中频繁写入
      if (!isDragging) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, String(width));
      }
    } catch (error) {
      console.error("无法保存侧边栏宽度到 localStorage", error);
    }
  }, [width, isDragging]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const isResizing = useRef(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizing.current = true;
    setIsDragging(true);

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      mouseMoveEvent.preventDefault();
      if (isResizing.current) {
        const newWidth = Math.max(MIN_WIDTH, Math.min(mouseMoveEvent.clientX, MAX_WIDTH));
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      isResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      // 移除全局事件监听器
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    // 在 window 上添加事件监听器，确保鼠标移出侧边栏也能继续拖拽
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const value = {
    isCollapsed,
    activeTab,
    width,
    isDragging,
    toggleSidebar,
    setActiveTab,
    startResizing,
  };

  return (
    <LeftSidebarContext.Provider value={value}>
      {children}
    </LeftSidebarContext.Provider>
  );
};