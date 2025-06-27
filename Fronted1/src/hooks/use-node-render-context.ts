// 从 NodeRenderContext 上下文中取出当前节点的渲染信息，比如所在节点、父容器、编辑状态等

import { useContext } from 'react';

import { NodeRenderContext } from '../context';

export function useNodeRenderContext() {
    return useContext(NodeRenderContext);
}
