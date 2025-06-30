export enum WorkflowNodeType {
  Start = 'start',
  End = 'end',
  LLM = 'llm',
  Condition = 'condition',
  Loop = 'loop',
  Comment = 'comment',
  Print = 'print',
  FileInput = 'fileinput',
  FolderInput = 'folderinput',
  ExportVariable = 'export_variable',

  // 基础文本处理
  TextProcessor = 'text_processor',
  CsvProcessor = 'csv_processor',
  JsonProcessor = 'json_processor',
  XmlProcessor = 'xml_processor',
  YamlProcessor = 'yaml_processor',
  
  // 文档处理
  PdfProcessor = 'pdf_processor',
  WordProcessor = 'word_processor',
  ExcelProcessor = 'excel_processor',
  PptProcessor = 'ppt_processor',
  MarkdownProcessor = 'markdown_processor',
  
  // 多媒体处理
  ImgProcessor = 'img_processor',
  AudioProcessor = 'audio_processor',
  VideoProcessor = 'video_processor',
  
  // 数据处理
  TableProcessor = 'table_processor',
  DatabaseProcessor = 'database_processor',
  ApiProcessor = 'api_processor',
  
  // 代码处理
  CodeProcessor = 'code_processor',
  HtmlProcessor = 'html_processor',
  
  // 压缩文件处理
  ZipProcessor = 'zip_processor',
  RarProcessor = 'rar_processor',
  
  // 邮件处理
  EmailProcessor = 'email_processor',
  
  // 数据转换
  FormatConverter = 'format_converter',
  
  // 数据验证
  DataValidator = 'data_validator',
  
  // 数据过滤
  DataFilter = 'data_filter',
}
