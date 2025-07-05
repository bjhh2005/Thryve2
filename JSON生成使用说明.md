# JSON生成使用说明

## 快速开始

### 1. 分析用户需求
- **文件类型**：确定要处理的文件类型（PDF、图像、文本、CSV、JSON、Markdown）
- **操作类型**：确定具体操作（提取、转换、合并、分析等）
- **工作流类型**：单文件处理/批量处理/循环处理/条件分支

### 2. 选择合适的模板组合

#### 基础组合（必需）
```
Start节点 → 输入节点 → 处理节点 → End节点
```

#### 扩展组合
- **单文件**：Start → File Input → Folder Input → Processor → End
- **批量文件**：Start → Folder Input → Loop(包含处理节点) → End  
- **条件分支**：Start → Input → Condition → 多个Processor → End
- **连续处理**：Start → Input → Processor1 → Processor2 → ... → End

### 3. 按步骤生成JSON

#### 步骤1：创建基础结构
```json
{
  "nodes": [],
  "edges": []
}
```

#### 步骤2：添加基础节点
- Start节点（位置：180, 100）
- End节点（位置：根据工作流长度计算）

#### 步骤3：添加输入节点
- File Input（文件输入）
- Folder Input（文件夹输入，包含输出文件夹）

#### 步骤4：添加处理节点
根据文件类型和操作选择：
- **PDF处理**：extract/split/merge/encrypt/decrypt等
- **图像处理**：resize/compress/convert/rotate/crop/filter/watermark等  
- **文本处理**：append/write/replace/wordFreq等
- **JSON处理**：query/update/validate/diff等
- **CSV处理**：filter/sort/aggregate等
- **Markdown处理**：write/append/convert等
- **LLM处理**：分析/总结文件内容

#### 步骤5：添加控制节点（如需要）
- Loop节点（循环处理）
- Condition节点（条件判断）
- Relocation节点（变量重定位）

#### 步骤6：创建连接
按节点顺序创建edges数组

## 关键原则

### 1. 位置坐标计算
```javascript
x = 180 + (节点序号 * 460)  // 水平间距460
y = 100 + (分支偏移 * 100)  // 垂直间距100
```

### 2. 节点ID命名
```
{节点类型}_{5-6位随机字符串}
例：pdf_processor_xwCue, file_input_Dfue1
```

### 3. 变量引用格式
```json
// 引用其他节点输出
{"type": "ref", "content": ["节点ID", "变量名"]}

// 设置常量值  
{"type": "constant", "content": "具体值"}
```

### 4. 处理器mode选择
每个处理器必须指定正确的mode，并包含对应的inputs和inputsValues：

- **PDF**：extract, split, merge, encrypt, decrypt, compress, watermark, metadata
- **Image**：resize, compress, convert, rotate, crop, filter, watermark  
- **Text**：append, write, replace, wordFreq
- **JSON**：query, update, validate, diff
- **CSV**：filter, sort, aggregate
- **Markdown**：write, append, convert, frontMatter, toc, lint

## 实际生成示例

### 单个PDF文件提取文本
```json
{
  "nodes": [
    {/* Start节点 - 使用基础模板 */},
    {/* File Input节点 - 指定PDF文件 */},
    {/* Folder Input节点 - 指定输出文件夹 */},
    {/* PDF Processor节点 - mode: "extract" */},
    {/* End节点 */}
  ],
  "edges": [
    {"sourceNodeID": "start_0", "targetNodeID": "file_input_xxx"},
    {"sourceNodeID": "file_input_xxx", "targetNodeID": "folder_input_xxx"},
    {"sourceNodeID": "folder_input_xxx", "targetNodeID": "pdf_processor_xxx"},
    {"sourceNodeID": "pdf_processor_xxx", "targetNodeID": "end_0"}
  ]
}
```

### 批量图像处理（循环）
```json
{
  "nodes": [
    {/* Start节点 */},
    {/* Folder Input节点 - 包含多个图像文件 */},
    {
      /* Loop节点 - mode: "array", 包含：
         - Start子节点
         - Image Processor子节点(mode: "resize")  
         - End子节点
         以及对应的edges */
    },
    {/* End节点 */}
  ],
  "edges": [
    {"sourceNodeID": "start_0", "targetNodeID": "folder_input_xxx"},
    {"sourceNodeID": "folder_input_xxx", "targetNodeID": "loop_xxx"},
    {"sourceNodeID": "loop_xxx", "targetNodeID": "end_0"}
  ]
}
```

## 常见错误避免

1. **缺少required字段**：每个处理器的inputs中required字段必须在inputsValues中有对应值
2. **引用错误**：确保引用的节点ID和变量名存在
3. **位置重叠**：合理计算节点位置避免重叠
4. **条件节点连接**：条件节点的edges必须包含sourcePortID
5. **循环节点结构**：循环节点必须有完整的blocks和edges数组

## 优化建议

1. **复用文件夹节点**：输入和输出可以使用同一个folder-input节点的不同变量
2. **合理命名**：使用描述性的节点标题和变量名
3. **适当分组**：相关的处理步骤可以在循环内组合
4. **错误处理**：复杂工作流可以添加条件判断节点处理异常情况 