import styled from 'styled-components';

import { IconMinimap } from '../../assets/icon-minimap';
import { IconUndo, IconRedo, IconChevronRight, IconChevronLeft, IconIndentLeft, IconIndentRight } from '@douyinfe/semi-icons';

export const ToolContainer = styled.div`
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

  /* 折叠状态时移除最小宽度限制 */
  &.collapsed {
    min-width: auto;
  }
`;

export const ToolSection = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  /* 工具栏内容的过渡动画 */
  > * {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 1;
    width: auto;
    margin-right: 8px;
    
    &:last-child {
      margin-right: 0;
    }
  }

  .collapse-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 4px;
    border-radius: 4px;
    
    .semi-icon {
      font-size: 14px;
    }

    &:hover {
      background-color: var(--semi-color-fill-0);
    }
  }

  /* 折叠状态样式 */
  &.collapsed {
    padding: 4px;
    width: 32px;
    min-width: 32px;
    height: 32px;
    
    /* 保持折叠按钮可见 */
    .collapse-button {
      margin: 0;
      opacity: 1;
      width: 24px;
      height: 24px;
    }
    
    /* 隐藏其他所有内容 */
    > *:not(.collapse-button) {
      width: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
      pointer-events: none;
      display: none;
    }
  }
`;

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

export const UIIconMinimap = styled(IconMinimap)<{ visible: boolean }>`
  opacity: ${(props) => (props.visible ? 1 : 0.5)};
`;
