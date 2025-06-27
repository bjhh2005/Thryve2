import { MouseEvent, TouchEvent, useEffect } from 'react';

import {
  FlowNodeFormData,
  Form,
  FormModelV2,
  useNodeRender,
} from '@flowgram.ai/free-layout-editor';
import { useNodeSize } from '@flowgram.ai/free-container-plugin';

import { HEADER_HEIGHT, HEADER_PADDING } from '../constant';
import { UngroupButton } from './ungroup';
import { GroupTools } from './tools';
import { GroupTips } from './tips';
import { GroupHeader } from './header';
import { GroupBackground } from './background';

export const GroupNodeRender = () => {
  const { node, selected, selectNode, nodeRef, startDrag, onFocus, onBlur } = useNodeRender();
  const nodeSize = useNodeSize();
  const formModel = node.getData(FlowNodeFormData).getFormModel<FormModelV2>();
  const formControl = formModel?.formControl;

  const { height, width } = nodeSize ?? {};
  const nodeHeight = height ?? 0;

  useEffect(() => {
    // prevent lines in outside cannot be selected - 防止外层线条不可选中
    const element = node.renderData.node;
    element.style.pointerEvents = 'none';
  }, [node]);

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation();
    startDrag(e as MouseEvent);
  };

  return (
    <div
      className={`workflow-group-render ${selected ? 'selected' : ''}`}
      ref={nodeRef}
      data-group-id={node.id}
      data-node-selected={String(selected)}
      onMouseDown={selectNode}
      onClick={(e) => {
        selectNode(e);
      }}
      style={{
        width,
        height,
      }}
    >
      <Form control={formControl}>
        <>
          <GroupHeader
            onDrag={handleDrag}
            onFocus={onFocus}
            onBlur={onBlur}
            style={{
              height: HEADER_HEIGHT,
              cursor: 'move', // 添加移动光标提示
            }}
          >
            <GroupTools />
          </GroupHeader>
          <GroupTips />
          <UngroupButton node={node} />
          <GroupBackground
            node={node}
            style={{
              top: HEADER_HEIGHT + HEADER_PADDING,
              height: nodeHeight - HEADER_HEIGHT - HEADER_PADDING,
            }}
          />
        </>
      </Form>
    </div>
  );
};
