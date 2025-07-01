import { FC, useRef, useEffect } from 'react';
import { NodePanelRenderProps } from '@flowgram.ai/free-node-panel-plugin';
import { Popover } from '@douyinfe/semi-ui';

import { NodeList } from './node-list';

export const NodePanel: FC<NodePanelRenderProps> = (props) => {
  const { onSelect, position, onClose } = props;

  const popoverContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverContentRef.current && !popoverContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // 关键的清理步骤：在组件卸载（消失）时，务必移除事件监听，防止内存泄漏
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]); // 依赖项数组中放入 onClose，确保函数引用最新


  return (
    <Popover
      trigger="custom"
      visible={true}
      onVisibleChange={(v) => (v ? null : onClose())}
      position="right"
      popupAlign={{ offset: [10, 0] }}
      overlayStyle={{ padding: 0, overflow: 'hidden', borderRadius: '8px' }}
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