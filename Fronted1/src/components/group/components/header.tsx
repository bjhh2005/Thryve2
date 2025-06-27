import type { FC, ReactNode, MouseEvent, CSSProperties, TouchEvent } from 'react';

import { useWatch } from '@flowgram.ai/free-layout-editor';

import { GroupField } from '../constant';
import { defaultColor, groupColors } from '../color';

interface GroupHeaderProps {
  onDrag: (e: MouseEvent | TouchEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  children: ReactNode;
  style?: CSSProperties;
}

export const GroupHeader: FC<GroupHeaderProps> = ({ onDrag, onFocus, onBlur, children, style }) => {
  const colorName = useWatch<string>(GroupField.Color) ?? defaultColor;
  const color = groupColors[colorName];

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    e.preventDefault(); // 防止文本选择
    onDrag(e);
  };

  return (
    <div
      className="workflow-group-header"
      data-flow-editor-selectable="false"
      onMouseDown={handleDrag}
      onTouchStart={handleDrag}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        ...style,
        backgroundColor: color['50'],
        borderColor: color['300'],
        cursor: 'move', // 添加移动光标提示
      }}
    >
      {children}
    </div>
  );
};
