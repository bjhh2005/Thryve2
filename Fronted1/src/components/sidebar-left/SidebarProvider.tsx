import React, { useState, useCallback, useContext, createContext, useRef, useEffect } from 'react';

// 初始宽度和最小/最大宽度限制
const INITIAL_WIDTH = 600;
const MIN_WIDTH = 312;
const MAX_WIDTH = 1000;
const LOCAL_STORAGE_KEY = 'sidebarWidth';
const PROJECTS_FIXED_WIDTH = 600;

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
  const [activeTab, setOriginalActiveTab] = useState('ai');
  const [width, setWidth] = useState(() => {
    try {
      const savedWidth = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedWidth ? parseInt(savedWidth, 10) : INITIAL_WIDTH;
    } catch (error) {
      return INITIAL_WIDTH;
    }
  });
  const [isDragging, setIsDragging] = useState(false);

  // 使用 useRef 来“记住”用户在切换到固定宽度前的最后一个可变宽度
  const lastResizableWidth = useRef(width);

  // 使用 useEffect 实时更新 lastResizableWidth 的值
  useEffect(() => {
    if (activeTab !== 'projects') {
      lastResizableWidth.current = width;
    }
  }, [width, activeTab]);

  // 当宽度变化且不处于拖拽状态时，将宽度保存到 localStorage
  useEffect(() => {
    try {
      if (!isDragging && activeTab !== 'projects') { // 只保存可变宽度
        window.localStorage.setItem(LOCAL_STORAGE_KEY, String(width));
      }
    } catch (error) {
      console.error("无法保存侧边栏宽度到 localStorage", error);
    }
  }, [width, isDragging, activeTab]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const isResizing = useRef(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    if (activeTab === 'projects') {
      return; // 如果是 'projects' 标签，则不允许开始拖拽
    }
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
  }, [activeTab]);

  const setActiveTab = useCallback((tab: string) => {
    // 使用函数式更新，可以安全地获取到上一个状态
    setOriginalActiveTab(prevTab => {
      // 如果即将切换到 'projects' 并且当前不在 'projects'
      if (tab === 'projects' && prevTab !== 'projects') {
        setWidth(PROJECTS_FIXED_WIDTH);
      }
      // 如果从 'projects' 切换走
      else if (tab !== 'projects' && prevTab === 'projects') {
        // 恢复到之前记住的宽度
        setWidth(lastResizableWidth.current);
      }
      return tab;
    });
  }, []); // 依赖项为空，因为它通过 ref 和函数式更新来处理，不会产生陈旧闭包


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