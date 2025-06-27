import styled from 'styled-components';
import iconHandle from '../../assets/icon-handle.png';

const HandleIcon = styled.img`
  width: 16px;
  height: 16px;
  opacity: 0.6;
  margin: 8px;
  user-select: none;
  -webkit-user-drag: none;
`;

export const Handle = () => {
  return <HandleIcon src={iconHandle} alt="handle" draggable={false} />;
}; 