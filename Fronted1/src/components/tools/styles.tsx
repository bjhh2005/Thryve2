import styled from 'styled-components';
import { IconMinimap } from '../../assets/icon-minimap';

// 顶层容器，负责固定定位在右下角
export const ToolsContainer = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 99;
`;

// 包裹所有可折叠工具的容器
export const ToolsContentWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  max-width: 1000px;
  opacity: 1;
  overflow: hidden;
  transition: max-width 0.4s cubic-bezier(0.65, 0, 0.35, 1),
              opacity 0.2s cubic-bezier(0.65, 0, 0.35, 1) 0.1s;

  > * {
    margin-right: 8px;
  }
`;

// 为 ToolSection 组件定义 props 类型
interface ToolSectionProps {
  isCollapsed: boolean;
}

// 工具栏的主体部分
export const ToolSection = styled.div<ToolSectionProps>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: #fff;
  height: 44px;
  padding: 0 8px 0 16px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  
  transition: width 0.4s cubic-bezier(0.65, 0, 0.35, 1), 
              border-radius 0.4s cubic-bezier(0.65, 0, 0.35, 1),
              padding 0.4s cubic-bezier(0.65, 0, 0.35, 1);

  .collapse-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;

    &:hover {
      background-color: var(--semi-color-fill-0);
    }
  }

  // 折叠状态下的样式
  ${({ isCollapsed }) => isCollapsed && `
    width: 44px;
    min-width: 44px;
    border-radius: 50%;
    padding: 0;
    justify-content: center;

    // 隐藏内容区域
    ${ToolsContentWrapper} {
      max-width: 0;
      opacity: 0;
      pointer-events: none;
    }

    .collapse-button {
      width: 100%;  /* 新增：让按钮宽度填满父容器（44px）*/
      height: 100%; /* 新增：让按钮高度填满父容器（44px）*/
    } 

  `}
`;


/* 其他未改动的样式组件保持不变 */

export const SelectZoom = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  color: #333;
  font-size: 12px;
  background-color: var(--semi-color-fill-0);
  min-width: 60px;
  text-align: center;

  &:hover {
    background-color: var(--semi-color-fill-1);
  }
`;

export const MinimapContainer = styled.div`
  position: absolute;
  bottom: 60px;
  width: 198px;
`;

export const UIIconMinimap = styled(IconMinimap) <{ visible: boolean }>`
  opacity: ${(props) => (props.visible ? 1 : 0.5)};
`;