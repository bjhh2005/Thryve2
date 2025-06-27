// 这个是核心类型定义文件，对原始 @flowgram.ai/free-layout-editor 的类型做了定制和增强

import {
  WorkflowNodeJSON as FlowNodeJSONDefault,
  WorkflowNodeRegistry as FlowNodeRegistryDefault,
  FreeLayoutPluginContext,
  FlowNodeEntity,
  type WorkflowEdgeJSON,
  WorkflowNodeMeta,
} from '@flowgram.ai/free-layout-editor';
import { IFlowValue } from '@flowgram.ai/form-materials';

import { type JsonSchema } from './json-schema';

// 定义：一个结点的完整 JSON 表达形式，包含逻辑数据、输入输出、位置、类型等。
/**
 * You can customize the data of the node, and here you can use JsonSchema to define the input and output of the node
 * 你可以自定义节点的 data 业务数据, 这里演示 通过 JsonSchema 来定义节点的输入/输出
 */
export interface FlowNodeJSON extends FlowNodeJSONDefault {
  data: {
    /**
     * Node title
     */
    title?: string;
    /**
     * Inputs data values
     */
    inputsValues?: Record<string, IFlowValue>;
    /**
     * Define the inputs data of the node by JsonSchema
     */
    inputs?: JsonSchema;  //输入字段类型定义
    /**
     * Define the outputs data of the node by JsonSchema
     */
    outputs?: JsonSchema; //输出字段类型定义
    /**
     * Rest properties
     */
    [key: string]: any;
  };
}

// 定义：节点的元数据，用于扩展额外的控制信息，影响编辑器行为。【“元数据”是描述节点本身行为/控制策略的额外信息，不参与业务逻辑】
/**
 * You can customize your own node meta
 * 你可以自定义节点的meta
 */
export interface FlowNodeMeta extends WorkflowNodeMeta {
  sidebarDisable?: boolean;
}

// 定义：节点类型的注册表，描述这个类型的节点该怎么被创建、删除、渲染等
/**
 * You can customize your own node registry
 * 你可以自定义节点的注册器
 */
export interface FlowNodeRegistry extends FlowNodeRegistryDefault {
  meta: FlowNodeMeta;
  info?: {
    icon: string;
    description: string;
  };
  canAdd?: (ctx: FreeLayoutPluginContext) => boolean;
  canDelete?: (ctx: FreeLayoutPluginContext, from: FlowNodeEntity) => boolean;
  onAdd?: (ctx: FreeLayoutPluginContext) => FlowNodeJSON;
}

// 定义：一个完整流程图的数据结构，包含所有节点和边。
export interface FlowDocumentJSON {
  nodes: FlowNodeJSON[];
  edges: WorkflowEdgeJSON[];
}
