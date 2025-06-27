import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

export type LeftSidebarTab = 'ai' | 'console';

interface LeftSidebarContextType {
  isCollapsed: boolean;
  activeTab: LeftSidebarTab;
  toggleSidebar: () => void;
  setActiveTab: (tab: LeftSidebarTab) => void;
}

const LeftSidebarContext = createContext<LeftSidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false); // 默认展开
  const [activeTab, setActiveTab] = useState<LeftSidebarTab>('ai'); // 默认AI页面

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const value = {
    isCollapsed,
    activeTab,
    toggleSidebar,
    setActiveTab,
  };

  return <LeftSidebarContext.Provider value={value}>{children}</LeftSidebarContext.Provider>;
};

// 自定义Hook，方便子组件使用
export const useLeftSidebar = () => {
  const context = useContext(LeftSidebarContext);
  if (context === undefined) {
    throw new Error('useLeftSidebar must be used within the LeftSidebarProvider');
  }
  return context;
};