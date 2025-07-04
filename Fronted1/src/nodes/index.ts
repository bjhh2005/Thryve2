import { FlowNodeRegistry } from '../typings';
import { StartNodeRegistry } from './start';
import { LoopNodeRegistry } from './loop';
import { LLMNodeRegistry } from './llm';
import { EndNodeRegistry } from './end';
import { WorkflowNodeType } from './constants';
import { ConditionNodeRegistry } from './condition';
import { CommentNodeRegistry } from './comment';
import { PrintNodeRegistry } from './print';
import { FileInputNodeRegistry } from './file-input';
import { FolderInputRegistry } from './folder-input';
import { TextProcessorNodeRegistry } from './text-processor';
import { CsvProcessorRegistry } from './csv-processor';
import { JsonProcessorRegistry } from './json-processor';
import { PdfProcessorRegistry } from './pdf-processor';
import { MarkdownProcessorRegistry } from './markdown-processor';
import { ImgProcessorRegistry } from './img-processor';
import { RelocationNodeRegistry } from './relocation';
import { SleepNodeRegistry } from './sleep';

export { WorkflowNodeType } from './constants';

export const nodeRegistries: FlowNodeRegistry[] = [
  ConditionNodeRegistry,
  StartNodeRegistry,
  FileInputNodeRegistry,
  FolderInputRegistry,
  EndNodeRegistry,
  LLMNodeRegistry,
  LoopNodeRegistry,
  CommentNodeRegistry,
  PrintNodeRegistry,
  TextProcessorNodeRegistry,
  CsvProcessorRegistry,
  JsonProcessorRegistry,
  PdfProcessorRegistry,
  MarkdownProcessorRegistry,
  ImgProcessorRegistry,
  RelocationNodeRegistry,
  SleepNodeRegistry,
];

/**
 * The list of nodes that are visible in the component panel for users to drag and drop.
 * 这里定义了哪些节点会显示在侧边栏的工具箱中。
 */
export const visibleNodeRegistries = nodeRegistries.filter(
  (r) => r.type !== WorkflowNodeType.Comment
);

export { FileInputNodeRegistry as fileInput } from './file-input';
export { FolderInputRegistry as folderInput } from './folder-input';