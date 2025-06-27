import React from 'react';
import { BaseNode } from '../base-node';
import { WorkflowNodeType } from '../../nodes/constants';
import type { FlowNodeRenderProps } from '../../typings';

export const CommentRender: React.FC<FlowNodeRenderProps> = (props) => {
  return (
    <BaseNode
      {...props}
      type={WorkflowNodeType.Comment}
      style={{
        background: '#FFF9E6',
        border: '1px solid #FFE58F',
        padding: '12px',
        minWidth: '200px',
        minHeight: '100px',
        borderRadius: '4px',
      }}
    >
      <div style={{ whiteSpace: 'pre-wrap' }}>{props.node.data?.note || ''}</div>
    </BaseNode>
  );
}; 