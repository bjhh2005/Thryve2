import styled, { keyframes, css } from 'styled-components';
import { IconInfoCircle } from '@douyinfe/semi-icons';
import { NodeStatus } from '../../context/WorkflowStateProvider';

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(77, 83, 232, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(77, 83, 232, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(77, 83, 232, 0);
  }
`;

export const NodeWrapperStyle = styled.div<{ status?: NodeStatus }>`
  align-items: flex-start;
  background-color: #fff;
  border: 1px solid rgba(6, 7, 9, 0.15);
  border-radius: 8px;
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.04), 0 4px 12px 0 rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-width: 360px;
  width: 100%;
  height: auto;

  &.selected {
    border: 1px solid #4e40e5;
  }
    ${({ status }) => {
    switch (status) {
      case 'PROCESSING':
        // 2. 将返回的字符串用 css`` 包裹起来
        return css`
          border-color: #4D53E8;
          animation: ${pulseAnimation} 2s infinite;
        `;
      case 'SUCCEEDED':
        // 虽然这里没有动画，但保持一致性，也使用 css 辅助函数是好习惯
        return css`
          border: 1px solid rgba(0, 178, 60, 1);
        `;
      case 'FAILED':
        return css`
          border: 1px solid rgba(229, 50, 65, 1);
        `;
      default:
        return null; // 返回 null 或空字符串
    }
  }}
`;

export const ErrorIcon = () => (
  <IconInfoCircle
    style={{
      position: 'absolute',
      color: 'red',
      left: -6,
      top: -6,
      zIndex: 1,
      background: 'white',
      borderRadius: 8,
    }}
  />
);
