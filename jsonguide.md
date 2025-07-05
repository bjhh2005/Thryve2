# FlowMix 工作流JSON生成指南

## 1. 基本结构

每个工作流JSON必须包含以下基本结构：

```json
{
  "nodes": [], // 节点数组
  "edges": []  // 边数组，用于连接节点
}
```

## 2. 通用节点结构

每个节点都必须包含以下字段：

```json
{
  "id": "唯一ID",
  "type": "节点类型",
  "meta": {
    "position": {
      "x": 数值,
      "y": 数值
    }
  },
  "data": {
    "title": "节点标题",
    // 其他节点特定数据
  }
}
```

## 3. 基础节点类型

### 3.1 开始节点 (start)
```json
{
  "id": "start_0",
  "type": "start",
  "data": {
    "title": "Start",
    "outputs": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "default": "Hello Flow."
        },
        "enable": {
          "type": "boolean",
          "default": true
        }
      }
    }
  }
}
```

### 3.2 结束节点 (end)
```json
{
  "id": "end_0",
  "type": "end",
  "data": {
    "title": "End",
    "inputs": {
      "type": "object",
      "properties": {
        "result": {
          "type": "string"
        }
      }
    }
  }
}
```

## 4. 输入节点类型

### 4.1 文件输入节点 (file-input)
```json
{
  "id": "file_input_ID",
  "type": "file-input",
  "data": {
    "title": "File Input",
    "files": [
      {
        "id": "file_ID",
        "file": {
          "filePath": "文件路径",
          "fileName": "文件名",
          "mimeType": "文件类型"
        },
        "variableName": "变量名"
      }
    ],
    "outputs": {
      "type": "object",
      "properties": {
        "变量名": {
          "type": "string",
          "title": "文件名",
          "description": "File path",
          "isOutput": true,
          "default": "文件路径"
        }
      }
    }
  }
}
```

### 4.2 文件夹输入节点 (folder-input)
```json
{
  "id": "folder_input_ID",
  "type": "folder-input",
  "data": {
    "title": "Folder Input",
    "folders": [
      {
        "id": "folder_ID",
        "folder": {
          "folderPath": "文件夹路径",
          "folderName": "文件夹名",
          "files": [] // 文件列表
        },
        "variableName": "变量名"
      }
    ],
    "outputs": {
      "type": "object",
      "properties": {
        "变量名": {
          "type": "string",
          "title": "文件夹名",
          "description": "Folder path",
          "isOutput": true,
          "default": "文件夹路径"
        },
        "变量名_files": {
          "type": "array",
          "items": {"type": "string"},
          "title": "文件列表",
          "description": "File list in the folder",
          "isOutput": true
        }
      }
    }
  }
}
```

## 5. 处理器节点详细参数说明

### 5.1 PDF处理器 (pdf-processor)

#### 5.1.1 extract模式（提取文本和图片）
```json
{
  "inputs": {
    "type": "object",
    "required": ["inputFile", "pageRange", "extractImages", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {
        "type": "string",
        "title": "PDF File",
        "description": "Select PDF file"
      },
      "pageRange": {
        "type": "string",
        "title": "Page Range",
        "description": "Pages to extract (e.g., 1-5)",
        "default": ""
      },
      "extractImages": {
        "type": "boolean",
        "title": "Extract Images",
        "description": "Include images",
        "default": false
      },
      "outputFolder": {
        "type": "string",
        "title": "Output Folder",
        "description": "Save location"
      },
      "outputName": {
        "type": "string",
        "title": "Output Name",
        "description": "File name"
      }
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "Extracted text content"
      },
      "images": {
        "type": "array",
        "description": "Extracted images (if enabled)"
      }
    }
  }
}
```

#### 5.1.2 merge模式（合并PDF）
```json
{
  "inputs": {
    "type": "object",
    "required": ["inputFiles", "outputFolder", "outputName"],
    "properties": {
      "inputFiles": {
        "type": "array",
        "items": {"type": "string"},
        "title": "Input PDFs",
        "description": "PDFs to merge"
      },
      "outputFolder": {
        "type": "string",
        "title": "Output Folder",
        "description": "Save location"
      },
      "outputName": {
        "type": "string",
        "title": "Output Name",
        "description": "File name"
      }
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "mergedFile": {
        "type": "string",
        "description": "Path to merged PDF"
      }
    }
  }
}
```

### 5.2 图像处理器 (img-processor)

#### 5.2.1 resize模式（调整大小）
```json
{
  "inputs": {
    "type": "object",
    "required": ["inputFile", "width", "height", "maintainAspectRatio", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {
        "type": "string",
        "title": "Input Image",
        "description": "Select image file"
      },
      "width": {
        "type": "number",
        "title": "Width",
        "description": "Width (px) > 0",
        "minimum": 1
      },
      "height": {
        "type": "number",
        "title": "Height",
        "description": "Height (px) > 0",
        "minimum": 1
      },
      "maintainAspectRatio": {
        "type": "boolean",
        "title": "Aspect Ratio",
        "description": "Keep aspect ratio"
      },
      "outputFolder": {
        "type": "string",
        "title": "Output Folder",
        "description": "Save location"
      },
      "outputName": {
        "type": "string",
        "title": "Output Name",
        "description": "File name"
      }
    }
  }
}
```

#### 5.2.2 filter模式（滤镜）
```json
{
  "inputs": {
    "type": "object",
    "required": ["inputFile", "filterType", "intensity", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {
        "type": "string",
        "title": "Input Image",
        "description": "Select image file"
      },
      "filterType": {
        "type": "string",
        "title": "Filter",
        "description": "Filter type",
        "enum": ["grayscale", "sepia", "blur", "sharpen", "brightness", "contrast"],
        "default": "grayscale"
      },
      "intensity": {
        "type": "number",
        "title": "Intensity",
        "description": "Range: 1-100",
        "minimum": 1,
        "maximum": 100,
        "default": 50
      },
      "outputFolder": {
        "type": "string",
        "title": "Output Folder",
        "description": "Save location"
      },
      "outputName": {
        "type": "string",
        "title": "Output Name",
        "description": "File name"
      }
    }
  }
}
```

### 5.3 CSV处理器 (csv-processor)

#### 5.3.1 filter模式（过滤数据）
```json
{
  "inputs": {
    "type": "object",
    "required": ["inputFile", "column", "condition", "value", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {
        "type": "string",
        "title": "Input CSV File",
        "description": "Select the CSV file to process"
      },
      "column": {
        "type": "string",
        "title": "Column",
        "description": "Target column"
      },
      "condition": {
        "type": "string",
        "title": "Condition",
        "description": "equals/contains/greater than/less than"
      },
      "value": {
        "type": "string",
        "title": "Value",
        "description": "Filter value"
      },
      "outputFolder": {
        "type": "string",
        "title": "Output Folder",
        "description": "Save location"
      },
      "outputName": {
        "type": "string",
        "title": "Output Name",
        "description": "File name"
      }
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {
        "type": "string",
        "description": "Filtered CSV file"
      },
      "filteredData": {
        "type": "array",
        "description": "Filtered CSV data"
      },
      "rowCount": {
        "type": "number",
        "description": "Number of rows after filtering"
      }
    }
  }
}
```

### 5.4 JSON处理器 (json-processor)

#### 5.4.1 query模式（查询数据）
```json
{
  "inputs": {
    "type": "object",
    "required": ["inputFile", "path", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {
        "type": "string",
        "title": "JSON Data",
        "description": "Data to query",
        "format": "json"
      },
      "path": {
        "type": "string",
        "title": "JSON Path",
        "description": "Query expression ($.path.to.field)"
      },
      "outputFolder": {
        "type": "string",
        "title": "Output Folder",
        "description": "Save location"
      },
      "outputName": {
        "type": "string",
        "title": "Output Name",
        "description": "File name"
      }
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {
        "type": "string",
        "description": "Query result"
      },
      "result": {
        "type": "any",
        "description": "Query result"
      },
      "found": {
        "type": "boolean",
        "description": "Whether the path exists"
      }
    }
  }
}
```

### 5.5 Markdown处理器 (markdown-processor)

#### 5.5.1 write模式（写入内容）
```json
{
  "inputs": {
    "type": "object",
    "required": ["inputFile", "content", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {
        "type": "string",
        "title": "Input File",
        "description": "Select MD file"
      },
      "content": {
        "type": "string",
        "title": "Content",
        "description": "MD content"
      },
      "outputFolder": {
        "type": "string",
        "title": "Output Folder",
        "description": "Save location"
      },
      "outputName": {
        "type": "string",
        "title": "Output Name",
        "description": "File name"
      }
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {
        "type": "string",
        "description": "Path to output file"
      }
    }
  }
}
```

### 5.6 文本处理器 (text-processor)

#### 5.6.1 append模式（追加内容）
```json
{
  "inputs": {
    "type": "object",
    "required": ["inputFile", "content", "outputFolder", "outputFileName"],
    "properties": {
      "inputFile": {
        "type": "string",
        "title": "Input File",
        "description": "Select the text file to process"
      },
      "content": {
        "type": "string",
        "title": "Content to Append",
        "description": "Content to be appended at the end of the file"
      },
      "outputFolder": {
        "type": "string",
        "title": "Output Folder",
        "description": "Folder to write the appended content to"
      },
      "outputFileName": {
        "type": "string",
        "title": "Output File Name",
        "description": "Name of the file to write the appended content to"
      }
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {
        "type": "string",
        "description": "File to write the appended content to"
      }
    }
  }
}
```

### 5.7 LLM处理器 (llm)
```json
{
  "inputs": {
    "type": "object",
    "required": ["modelName", "apiKey", "apiHost", "temperature", "prompt"],
    "properties": {
      "inputFiles": {
        "type": "array",
        "description": "The files to process.",
        "items": {
          "type": "string"
        }
      },
      "modelName": {
        "type": "string",
        "description": "The name of the model to use."
      },
      "apiKey": {
        "type": "string",
        "description": "The API key to use."
      },
      "apiHost": {
        "type": "string",
        "description": "The API host to use."
      },
      "temperature": {
        "type": "number",
        "description": "The temperature to use."
      },
      "systemPrompt": {
        "type": "string",
        "description": "The system prompt to use."
      },
      "prompt": {
        "type": "string",
        "description": "The prompt to use."
      },
      "outputFolder": {
        "type": "string",
        "description": "The folder to save the output file.",
        "default": ""
      },
      "outputName": {
        "type": "string",
        "description": "The name of the output file.",
        "default": ""
      }
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "result": {
        "type": "string"
      },
      "outputFile": {
        "type": "string"
      }
    }
  }
}
```

### 5.8 参数值设置示例

对于所有处理器节点，参数值可以通过以下两种方式设置：

1. 常量值：
```json
{
  "inputsValues": {
    "参数名": {
      "type": "constant",
      "content": "具体值"
    }
  }
}
```

2. 引用其他节点的输出：
```json
{
  "inputsValues": {
    "参数名": {
      "type": "ref",
      "content": ["节点ID", "输出字段名"]
    }
  }
}
```


## 6. 控制流节点

### 6.1 循环节点 (loop)
```json
{
  "id": "loop_ID",
  "type": "loop",
  "data": {
    "title": "Loop",
    "mode": "array",
    "inputs": {
      "type": "object",
      "required": ["batchFor"],
      "properties": {
        "batchFor": {"type": "array"}
      }
    },
    "batchFor": {
      "type": "ref",
      "content": ["引用数组"]
    }
  },
  "blocks": [], // 循环体内的节点
  "edges": []   // 循环体内的边
}
```

### 6.2 条件节点 (condition)
```json
{
  "id": "condition_ID",
  "type": "condition",
  "data": {
    "title": "Condition",
    "conditions": [
      {
        "value": {
          "left": {"type": "ref", "content": ["左值引用"]},
          "operator": "操作符",
          "right": {"type": "constant", "content": "右值"}
        },
        "key": "分支ID"
      }
    ]
  }
}
```

### 6.3 重定位节点 (relocation)
```json
{
  "id": "relocation_ID",
  "type": "relocation",
  "data": {
    "title": "Relocation",
    "inputs": {
      "type": "object",
      "properties": {
        "input": {"type": "string"}
      }
    },
    "outputs": {
      "type": "object",
      "properties": {
        "output": {"type": "string"}
      }
    }
  }
}
```

## 7. 边的定义

边用于连接节点，格式如下：
```json
{
  "sourceNodeID": "源节点ID",
  "targetNodeID": "目标节点ID",
  "sourcePortID": "源端口ID"  // 可选，用于条件节点
}
```

## 8. 参数引用

### 8.1 常量值
```json
{
  "type": "constant",
  "content": "值"
}
```

### 8.2 引用值
```json
{
  "type": "ref",
  "content": ["节点ID", "输出字段"]
}
```

## 9. 注意事项

1. 所有节点ID必须唯一
2. 文件路径使用绝对路径
3. 每个处理器节点的mode决定了其必需参数
4. 引用值必须指向已存在的节点输出
5. 条件节点的每个分支必须有唯一的key
6. 循环节点必须包含完整的子工作流（blocks和edges）