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

interface ToolSectionProps {
  isCollapsed: boolean;
}

export const ToolSection = styled.div<ToolSectionProps>`
  display: flex;
  align-items: center;
  justify-content: space-between; /* 让内容和按钮分布在两端 */
  background: #fff;
  height: 44px; /* 固定高度 */
  padding: 0 8px 0 16px; /* 调整内边距 */
  border-radius: 50px; /* 默认使用胶囊形状，过渡到圆形更自然 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden; /* 必须有这个，配合 content wrapper 的动画 */
  
  /* 关键改动：过渡动画的目标属性更明确 */
  transition: width 0.4s cubic-bezier(0.65, 0, 0.35, 1), 
              border-radius 0.4s cubic-bezier(0.65, 0, 0.35, 1),
              padding 0.4s cubic-bezier(0.65, 0, 0.35, 1);

  .collapse-button {
    flex-shrink: 0; /* 防止按钮被压缩 */
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    
    .semi-icon {
      transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1); /* 图标旋转动画 */
    }

    &:hover {
      background-color: var(--semi-color-fill-0);
    }
  }

  /* 关键改动：折叠状态的样式 */
  ${({ isCollapsed }) => isCollapsed && `
    width: 44px;
    min-width: 44px;
    border-radius: 50%;
    padding: 0;
    justify-content: center;

    ${ToolsContentWrapper} {
      max-width: 0;
      opacity: 0;
      pointer-events: none;
    }

    .collapse-button .semi-icon {
      transform: rotate(180deg);
    }
  `}
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

export const UIIconMinimap = styled(IconMinimap) <{ visible: boolean }>`
  opacity: ${(props) => (props.visible ? 1 : 0.5)};
`;

export const ToolsContentWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0; /* 防止在 flex 容器中被压缩 */
  max-width: 1000px; /* 设定一个足够大的最大宽度 */
  opacity: 1;
  overflow: hidden;
  transition: max-width 0.4s cubic-bezier(0.65, 0, 0.35, 1),
              opacity 0.2s cubic-bezier(0.65, 0, 0.35, 1) 0.1s; /* 动画效果 */

  > * {
    margin-right: 8px; /* 保持元素间距 */
  }
`;