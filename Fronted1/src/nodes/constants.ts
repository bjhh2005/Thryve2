export enum WorkflowNodeType {
  Start = 'start',
  End = 'end',
  LLM = 'llm',
  Condition = 'condition',
  Loop = 'loop',
  Comment = 'comment',
  Print = 'print',
  FileInput = 'fileinput',
  TextProcessor = 'text_processor'
}
