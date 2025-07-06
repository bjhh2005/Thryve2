import styled from 'styled-components';

import { IconMinimap } from '../../assets/icon-minimap';

export const ToolContainer = styled.div<{ isCollapsed: boolean }>`
  position: fixed;
  display: flex;
  justify-content: center;
  min-width: 360px;
  gap: 8px;
  z-index: 99;
  cursor: move;
  user-select: none;
  
  /* 默认位置在底部中间 */
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);

  /* 当被拖动时的样式会通过 style 属性覆盖这些默认值 */
  &[style*="left"] {
    bottom: auto;
    transform: none;
  }

  /* 为所有变化的属性添加平滑的过渡动画 */
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); // 一个有趣的回弹动画曲线

  /* 根据 isCollapsed 状态动态改变尺寸和形状 */
  width: ${props => (props.isCollapsed ? '52px' : 'auto')};
  height: ${props => (props.isCollapsed ? '52px' : '40px')};
  border-radius: ${props => (props.isCollapsed ? '50%' : '10px')};
  min-width: 0; // 折叠时取消最小宽度限制
`;

export const ToolSection = styled.div`
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid rgba(68, 83, 130, 0.25);
  border-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.02) 0px 4px 12px 0px;
  column-gap: 2px;
  height: 40px;
  padding: 0 4px;
  pointer-events: auto;
  
  &:hover {
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px 0px;
  }
`;

// 为折叠后的圆形按钮设计高级样式
export const CollapsedToolButton = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  // 使用渐变和阴影创造高级质感
  background: linear-gradient(145deg, #6b73ff, #4d53e8);
  box-shadow: 0 5px 15px rgba(77, 83, 232, 0.4), inset 0 2px 2px rgba(255, 255, 255, 0.2);
  
  cursor: pointer;
  transition: transform 0.2s ease-out;

  &:hover {
    transform: scale(1.1); // 悬浮放大效果
  }
  
  &:active {
    transform: scale(0.95); // 点击缩小效果
  }
`;

export const SelectZoom = styled.span`
  padding: 4px;
  border-radius: 8px;
  color: #474a4d;
  border: 1px solid rgba(68, 83, 130, 0.25);
  font-size: 12px;
  width: 50px;
  cursor: pointer;
`;

export const MinimapContainer = styled.div`
  position: absolute;
  bottom: 60px;
  width: 198px;
`;

export const UIIconMinimap = styled(IconMinimap) <{ visible: boolean }>`
  color: ${(props) => (props.visible ? undefined : '#060709cc')};
`;
