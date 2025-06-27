// 封装来自 @flowgram.ai/form-materials 的 JSON Schema 类型，用于定义节点输入输出的数据结构
import type { IJsonSchema, IBasicJsonSchema } from '@flowgram.ai/form-materials';
//IJsonSchema：表示完整的 JSON Schema 结构（通常用于描述复杂表单、对象结构、嵌套等）
//IBasicJsonSchema：表示更简单的 JSON Schema 类型（如 string、number、boolean 等基本类型）

export type BasicType = IBasicJsonSchema;
export type JsonSchema = IJsonSchema;
