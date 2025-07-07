// node-panel/index.tsx

import { FC, useRef, useEffect, useMemo } from 'react'; // 1. 引入 useMemo
import { NodePanelRenderProps } from '@flowgram.ai/free-node-panel-plugin';
import { Popover } from '@douyinfe/semi-ui';

import { NodeList } from './node-list';

// 2. 将菜单的宽度定义为一个常量，方便计算和维护
const POPOVER_WIDTH = 280;

export const NodePanel: FC<NodePanelRenderProps> = (props) => {
  const { onSelect, position, onClose } = props;

  const popoverContentRef = useRef<HTMLDivElement>(null);

  // --- 核心修改：在这里计算最佳位置 ---
  const placement = useMemo(() => {
    // 检查预期的右侧位置是否会超出屏幕
    // position.x 是鼠标点击的横坐标
    // POPOVER_WIDTH 是菜单的宽度
    // 10 是我们设置的 offset
    if (position.x + POPOVER_WIDTH + 10 > window.innerWidth) {
      // 如果会超出，就返回一个在左侧显示的配置
      return {
        position: 'left',
        align: { offset: [-10, 0] } // 向左偏移
      };
    }

    // 默认情况下，还是在右侧显示
    return {
      position: 'right',
      align: { offset: [10, 0] } // 向右偏移
    };
  }, [position]); // 仅当 position 变化时才重新计算


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverContentRef.current && !popoverContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);


  return (
    <Popover
      trigger="custom"
      visible={true}
      onVisibleChange={(v) => (v ? null : onClose())}

      // --- 3. 应用我们手动计算出的结果 ---
      position={placement.position as 'left' | 'right'} // 动态设置 position
      popupAlign={placement.align} // 动态设置对齐和偏移

      getPopupContainer={() => document.body}

      autoAdjustOverflow={true}

      overlayStyle={{ padding: 0, overflow: 'hidden', borderRadius: '8px', width: `${POPOVER_WIDTH}px` }}
      showArrow={false}
      content={
        <div ref={popoverContentRef}>
          <NodeList onSelect={onSelect} onClose={onClose} />
        </div>
      }
    >
      {/* 触发器：一个在右键位置的、不可见的点 */}
      <div
        style={{
          position: 'absolute',
          top: position.y,
          left: position.x,
          width: 0,
          height: 0,
        }}
      />
    </Popover>
  );
};