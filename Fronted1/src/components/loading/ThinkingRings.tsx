import React from 'react';
import styled from 'styled-components';

const LoaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ThinkingText = styled.span`
  font-size: 12px;
  color: #666;
`;

const Loader = styled.div`
  animation: rotate 1s infinite;  
  height: 20px;
  width: 20px;
  position: relative;

  &:before,
  &:after {   
    border-radius: 50%;
    content: '';
    display: block;
    height: 8px;  
    width: 8px;
  }

  &:before {
    animation: ball1 1s infinite;  
    background-color: #cb2025;
    box-shadow: 12px 0 0 #f8b334;
    margin-bottom: 4px;
  }

  &:after {
    animation: ball2 1s infinite; 
    background-color: #00a096;
    box-shadow: 12px 0 0 #97bf0d;
  }

  @keyframes rotate {
    0% { 
      transform: rotate(0deg) scale(0.8); 
    }
    50% { 
      transform: rotate(360deg) scale(1.2); 
    }
    100% { 
      transform: rotate(720deg) scale(0.8); 
    }
  }

  @keyframes ball1 {
    0% {
      box-shadow: 12px 0 0 #f8b334;
    }
    50% {
      box-shadow: 0 0 0 #f8b334;
      margin-bottom: 0;
      transform: translate(6px,6px);
    }
    100% {
      box-shadow: 12px 0 0 #f8b334;
      margin-bottom: 4px;
    }
  }

  @keyframes ball2 {
    0% {
      box-shadow: 12px 0 0 #97bf0d;
    }
    50% {
      box-shadow: 0 0 0 #97bf0d;
      margin-top: -8px;
      transform: translate(6px,6px);
    }
    100% {
      box-shadow: 12px 0 0 #97bf0d;
      margin-top: 0;
    }
  }
`;

interface ThinkingRingsProps {
  visible: boolean;
}

export const ThinkingRings: React.FC<ThinkingRingsProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <LoaderContainer>
      <Loader />
      <ThinkingText>正在思考...</ThinkingText>
    </LoaderContainer>
  );
}; 