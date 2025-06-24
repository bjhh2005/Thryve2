//控制侧边栏显隐 + 选中节点
import React from 'react';

export const SidebarContext = React.createContext<{
  visible: boolean;
  nodeId?: string;
  setNodeId: (node: string | undefined) => void;
}>({ visible: false, setNodeId: () => { } });

export const IsSidebarContext = React.createContext<boolean>(false);
