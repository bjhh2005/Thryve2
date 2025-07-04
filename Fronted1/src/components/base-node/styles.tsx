import styled, { keyframes, css } from 'styled-components';
import { IconInfoCircle } from '@douyinfe/semi-icons';
import { NodeStatus } from '../../context/ExecutionProvider';

// 流光动画 (Iridescent Glow / Aurora)
const auroraAnimation = keyframes`
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
`;

// 抖动动画 (Shake)
const shakeAnimation = keyframes`
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
  40%, 60% { transform: translate3d(3px, 0, 0); }
`;

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

  &::before {
    content: '';
    position: absolute;
    top: -3px; left: -3px; right: -3px; bottom: -3px;
    border-radius: 11px; // 比节点本身的 8px 稍大
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  ${({ status }) => {
    switch (status) {
      case 'PROCESSING':
        return css`
          border-color: #A49BFF; // 换一个更亮的边框色
          &::before {
            opacity: 1;
            // 应用流光动画
            background: linear-gradient(90deg, #A49BFF, #7A6AFF, #A49BFF, #D1C4E9);
            background-size: 300% 300%;
            animation: ${auroraAnimation} 3s ease infinite;
          }
        `;
      case 'SUCCEEDED':
        return css`
          border-color: #4CAF50;
          &::before {
            opacity: 0.7;
            // 静态的成功光晕
            box-shadow: 0 0 12px rgba(76, 175, 80, 0.8);
          }
        `;
      case 'FAILED':
        return css`
          border-color: #F44336;
          // 应用抖动动画
          animation: ${shakeAnimation} 0.7s cubic-bezier(.36,.07,.19,.97) both;
          &::before {
            opacity: 0.7;
            // 静态的失败光晕
            box-shadow: 0 0 12px rgba(244, 67, 54, 0.8);
          }
        `;
      default:
        return null;
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
