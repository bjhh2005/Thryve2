import styled from 'styled-components';

import { IconMinimap } from '../../assets/icon-minimap';

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
