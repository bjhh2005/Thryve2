// /components/node-panel/index.tsx

import { FC } from 'react';
import { NodePanelRenderProps } from '@flowgram.ai/free-node-panel-plugin';
import { Popover } from '@douyinfe/semi-ui';

import { NodeList } from './node-list';
// 不再需要 NodePlaceholder 和它的样式，可以删除
// import { NodePlaceholder } from './node-placeholder'; 
// import './index.less';

export const NodePanel: FC<NodePanelRenderProps> = (props) => {
  const { onSelect, position, onClose, panelProps } = props;
  // enableNodePlaceholder 不再需要，可以忽略
  // const { enableNodePlaceholder } = panelProps || {};

  return (
    <Popover
      trigger="custom" // 确保是 custom，由外部逻辑控制显示
      visible={true}
      onVisibleChange={(v) => (v ? null : onClose())} // 当popover消失时调用onClose
      // 核心修改：将 onClose 传递给 NodeList
      content={<NodeList onSelect={onSelect} onClose={onClose} />}
      position="right"
      // 其他 Popover 属性可以保持
      popupAlign={{ offset: [10, 0] }} // 调整一下偏移，使其更美观
      overlayStyle={{
        padding: 0, // 移除 Popover 的默认内边距
        overflow: 'hidden', // 确保圆角生效
        borderRadius: '8px', // 给 Popover 也加上圆角
      }}
      showArrow={false} // 不显示小箭头
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