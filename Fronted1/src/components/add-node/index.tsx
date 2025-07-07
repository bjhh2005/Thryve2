// AddNode.tsx

import { Button } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';

import { useAddNode } from './use-add-node';
// 1. 引入新的样式文件 (我们将在下一步创建它)
import './AddNode.less';

export const AddNode = (props: { disabled: boolean }) => {
  const addNode = useAddNode();
  return (
    <Button
      data-testid="demo.free-layout.add-node"
      icon={<IconPlus />}
      className="advanced-add-node-button"

      disabled={props.disabled}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        addNode(rect);
      }}
    >
      Add Node
    </Button>
  );
};