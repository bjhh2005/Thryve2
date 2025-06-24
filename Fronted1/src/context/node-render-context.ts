import React from 'react';

import type { NodeRenderReturnType } from '@flowgram.ai/free-layout-editor';

interface INodeRenderContext extends NodeRenderReturnType { }

/** 业务自定义节点上下文 */
export const NodeRenderContext = React.createContext<INodeRenderContext>({} as INodeRenderContext);

//类型：INodeRenderContext 是基于 NodeRenderReturnType（来自 @flowgram.ai/free-layout-editor）的一个扩展或直接使用。
//作用：在节点渲染时，提供共享的上下文信息，例如节点所在容器、节点状态（是否选中、是否正在编辑）等。