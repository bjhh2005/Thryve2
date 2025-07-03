import styled, { keyframes } from 'styled-components';
import { IconInfoCircle } from '@douyinfe/semi-icons';
import { WorkflowStatus } from '@flowgram.ai/runtime-interface';

// 定义一个呼吸灯/脉冲的动画
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

export const NodeWrapperStyle = styled.div<{ status?: WorkflowStatus }>`
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
  transition: border-color 0.3s ease, box-shadow 0.3s ease; /* 添加过渡效果 */

  &.selected {
    border: 1px solid #4e40e5;
  }
  
  /* 根据 status 属性应用不同样式 */
  ${({ status }) => {
    switch (status) {
      case WorkflowStatus.Processing:
        return `
          border-color: #4D53E8;
          animation: ${pulseAnimation} 2s infinite;
        `;
      case WorkflowStatus.Succeeded:
        return `
          border: 1px solid rgba(0, 178, 60, 1);
        `;
      case WorkflowStatus.Failed:
        return `
          border: 1px solid rgba(229, 50, 65, 1);
        `;
      default:
        return '';
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