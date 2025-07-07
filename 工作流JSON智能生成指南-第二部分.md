# 工作流JSON智能生成指南 - 第二部分

## 11. 文本处理器模板

### 11.1 文本处理器基础结构
```json
{
  "id": "text_processor_[随机ID]",
  "type": "text-processor",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "Text Processor",
    "mode": "操作模式",
    "inputs": {
      "type": "object",
      "required": ["inputFile", "outputFolder", "outputFileName"],
      "properties": {
        "inputFile": {"type": "string", "title": "Input File", "description": "Select the text file to process"},
        "outputFolder": {"type": "string", "title": "Output Folder", "description": "Folder to write the content to"},
        "outputFileName": {"type": "string", "title": "Output File Name", "description": "Name of the output file"}
      }
    },
    "outputs": {
      "type": "object",
      "properties": {
        "outputFile": {"type": "string", "description": "Output file path"}
      }
    },
    "inputsValues": {
      "inputFile": {"type": "ref", "content": ["源节点ID", "变量名"]},
      "outputFolder": {"type": "ref", "content": ["文件夹节点ID", "变量名"]},
      "outputFileName": {"type": "constant", "content": "输出文件名"}
    }
  }
}
```

### 11.2 文本Append模式
```json
{
  "mode": "append",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "content", "outputFolder", "outputFileName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input File", "description": "Select the text file to process"},
      "content": {"type": "string", "title": "Content to Append", "description": "Content to be appended at the end of the file"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Folder to write the appended content to"},
      "outputFileName": {"type": "string", "title": "Output File Name", "description": "Name of the file to write the appended content to"}
    }
  },
  "inputsValues": {
    "content": {"type": "constant", "content": "要追加的内容"}
  }
}
```

### 11.3 文本Write模式
```json
{
  "mode": "write",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "content", "outputFolder", "outputFileName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input File", "description": "Select the text file to process"},
      "content": {"type": "string", "title": "Content to Write", "description": "Content to write to the file (will overwrite existing content)"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Folder to write the written content to"},
      "outputFileName": {"type": "string", "title": "Output File Name", "description": "Name of the file to write the written content to"}
    }
  },
  "inputsValues": {
    "content": {"type": "constant", "content": "要写入的内容"}
  }
}
```

### 11.4 文本Replace模式
```json
{
  "mode": "replace",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "searchText", "replaceText", "useRegex", "outputFolder", "outputFileName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input File", "description": "Select the text file to process"},
      "searchText": {"type": "string", "title": "Search Text", "description": "Text to search for"},
      "replaceText": {"type": "string", "title": "Replace Text", "description": "Text to replace with"},
      "useRegex": {"type": "boolean", "title": "Use Regular Expression", "description": "Enable regular expression for search and replace"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Folder to write the replaced content to"},
      "outputFileName": {"type": "string", "title": "Output File Name", "description": "Name of the file to write the replaced content to"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Output file path"},
      "replacementCount": {"type": "number", "title": "Replacement Count", "description": "Number of replacements made"}
    }
  },
  "inputsValues": {
    "searchText": {"type": "constant", "content": "搜索文本"},
    "replaceText": {"type": "constant", "content": "替换文本"},
    "useRegex": {"type": "constant", "content": false}
  }
}
```

### 11.5 文本WordFreq模式
```json
{
  "mode": "wordFreq",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "ignoreCase", "minLength", "outputFolder", "outputFileName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input File", "description": "Select the text file to process"},
      "ignoreCase": {"type": "boolean", "title": "Ignore Case", "description": "Ignore case when counting words"},
      "minLength": {"type": "integer", "title": "Minimum Word Length", "description": "Minimum length of words to count", "default": 1},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Folder to write the word frequency statistics to"},
      "outputFileName": {"type": "string", "title": "Output File Name", "description": "Name of the file to write the word frequency statistics to"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Output file path"},
      "statistics": {
        "type": "object",
        "title": "Statistics",
        "description": "Detailed word frequency statistics",
        "properties": {
          "totalWords": {"type": "number", "title": "Total Words", "description": "Total number of words in the file", "default": 0},
          "uniqueWords": {"type": "number", "title": "Unique Words", "description": "Number of unique words in the file", "default": 0},
          "frequencies": {"type": "object", "title": "Word Frequencies", "description": "Frequency count for each word"}
        }
      }
    }
  },
  "inputsValues": {
    "ignoreCase": {"type": "constant", "content": true},
    "minLength": {"type": "constant", "content": 1}
  }
}
```

## 12. JSON处理器模板

### 12.1 JSON处理器基础结构
```json
{
  "id": "json_processor_[随机ID]",
  "type": "json-processor",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "JSON Processor",
    "mode": "操作模式",
    "inputs": {
      "type": "object",
      "required": ["inputFile", "outputFolder", "outputName"],
      "properties": {
        "inputFile": {"type": "string", "title": "JSON Data", "description": "Data to process", "format": "json"},
        "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
        "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
      }
    },
    "inputsValues": {
      "inputFile": {"type": "ref", "content": ["源节点ID", "变量名"]},
      "outputFolder": {"type": "ref", "content": ["文件夹节点ID", "变量名"]},
      "outputName": {"type": "constant", "content": "输出文件名"}
    }
  }
}
```

### 12.2 JSON Query模式
```json
{
  "mode": "query",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "path", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "JSON Data", "description": "Data to query", "format": "json"},
      "path": {"type": "string", "title": "JSON Path", "description": "Query expression ($.path.to.field)"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Query result"},
      "result": {"type": "any", "description": "Query result"},
      "found": {"type": "boolean", "description": "Whether the path exists"}
    }
  },
  "inputsValues": {
    "path": {"type": "constant", "content": "$.data.items"}
  }
}
```

### 12.3 JSON Update模式
```json
{
  "mode": "update",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "path", "newValue", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "JSON Data", "description": "Data to update", "format": "json"},
      "path": {"type": "string", "title": "JSON Path", "description": "Update path ($.path.to.field)"},
      "newValue": {"type": "string", "title": "New Value", "description": "Value to set"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Updated JSON object"},
      "result": {"type": "object", "description": "Updated JSON object"},
      "success": {"type": "boolean", "description": "Whether the update was successful"}
    }
  },
  "inputsValues": {
    "path": {"type": "constant", "content": "$.data.name"},
    "newValue": {"type": "constant", "content": "新值"}
  }
}
```

### 12.4 JSON Validate模式
```json
{
  "mode": "validate",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "schema", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "JSON Data", "description": "Data to validate", "format": "json"},
      "schema": {"type": "string", "title": "JSON Schema", "description": "Validation schema", "format": "json"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Validation result"},
      "isValid": {"type": "boolean", "description": "Validation result"},
      "errors": {"type": "array", "description": "Validation errors if any"}
    }
  },
  "inputsValues": {
    "schema": {"type": "constant", "content": "{\"type\": \"object\", \"properties\": {\"name\": {\"type\": \"string\"}}}"}
  }
}
```

### 12.5 JSON Diff模式
```json
{
  "mode": "diff",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "compareData", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Original JSON", "description": "Original data", "format": "json"},
      "compareData": {"type": "string", "title": "Compare JSON", "description": "Data to compare", "format": "json"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Differences between JSONs"},
      "differences": {"type": "array", "description": "List of differences found"},
      "areEqual": {"type": "boolean", "description": "Whether the JSONs are equal"}
    }
  },
  "inputsValues": {
    "compareData": {"type": "ref", "content": ["比较数据节点ID", "变量名"]}
  }
}
```

## 13. CSV处理器模板

### 13.1 CSV处理器基础结构
```json
{
  "id": "csv_processor_[随机ID]",
  "type": "csv-processor",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "CSV Processor",
    "mode": "操作模式",
    "inputs": {
      "type": "object",
      "required": ["inputFile", "outputFolder", "outputName"],
      "properties": {
        "inputFile": {"type": "string", "title": "Input CSV File", "description": "Select the CSV file to process"},
        "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
        "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
      }
    },
    "inputsValues": {
      "inputFile": {"type": "ref", "content": ["源节点ID", "变量名"]},
      "outputFolder": {"type": "ref", "content": ["文件夹节点ID", "变量名"]},
      "outputName": {"type": "constant", "content": "输出文件名"}
    }
  }
}
```

### 13.2 CSV Filter模式
```json
{
  "mode": "filter",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "column", "condition", "value", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input CSV File", "description": "Select the CSV file to process"},
      "column": {"type": "string", "title": "Column", "description": "Target column"},
      "condition": {"type": "string", "title": "Condition", "description": " equals/contains/greater than/less than"},
      "value": {"type": "string", "title": "Value", "description": "Filter value"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Filtered CSV file"},
      "filteredData": {"type": "array", "description": "Filtered CSV data"},
      "rowCount": {"type": "number", "description": "Number of rows after filtering"}
    }
  },
  "inputsValues": {
    "column": {"type": "constant", "content": "列名"},
    "condition": {"type": "constant", "content": "equals"},
    "value": {"type": "constant", "content": "筛选值"}
  }
}
```

### 13.3 CSV Sort模式
```json
{
  "mode": "sort",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "column", "ascending", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input CSV File", "description": "Select the CSV file to process"},
      "column": {"type": "string", "title": "Sort Column", "description": "Column to sort"},
      "ascending": {"type": "boolean", "title": "Ascending Order", "description": "Sort ascending", "default": true},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Sorted CSV file"},
      "sortedData": {"type": "array", "description": "Sorted CSV data"}
    }
  },
  "inputsValues": {
    "column": {"type": "constant", "content": "列名"},
    "ascending": {"type": "constant", "content": true}
  }
}
```

### 13.4 CSV Aggregate模式
```json
{
  "mode": "aggregate",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "groupBy", "operation", "targetColumn", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input CSV File", "description": "Select the CSV file to process"},
      "groupBy": {"type": "string", "title": "Group By Column", "description": "Group by field"},
      "operation": {"type": "string", "title": "Operation", "description": "sum, avg, count, min, max"},
      "targetColumn": {"type": "string", "title": "Target Column", "description": "Column for operation"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Aggregated CSV file"},
      "result": {"type": "object", "description": "Aggregation results"}
    }
  },
  "inputsValues": {
    "groupBy": {"type": "constant", "content": "分组列名"},
    "operation": {"type": "constant", "content": "sum"},
    "targetColumn": {"type": "constant", "content": "目标列名"}
  }
}
```

## 14. Markdown处理器模板

### 14.1 Markdown处理器基础结构
```json
{
  "id": "markdown_processor_[随机ID]",
  "type": "markdown-processor",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "Markdown Processor",
    "mode": "操作模式",
    "inputs": {
      "type": "object",
      "required": ["inputFile", "outputFolder", "outputName"],
      "properties": {
        "inputFile": {"type": "string", "title": "Input File", "description": "Select MD file"},
        "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
        "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
      }
    },
    "inputsValues": {
      "inputFile": {"type": "ref", "content": ["源节点ID", "变量名"]},
      "outputFolder": {"type": "ref", "content": ["文件夹节点ID", "变量名"]},
      "outputName": {"type": "constant", "content": "输出文件名"}
    }
  }
}
```

### 14.2 Markdown Write模式
```json
{
  "mode": "write",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "content", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input File", "description": "Select MD file"},
      "content": {"type": "string", "title": "Content", "description": "MD content"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Path to output file"}
    }
  },
  "inputsValues": {
    "content": {"type": "constant", "content": "# 标题\n\n内容"}
  }
}
```

### 14.3 Markdown Append模式
```json
{
  "mode": "append",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "content", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input File", "description": "Select MD file"},
      "content": {"type": "string", "title": "Content", "description": "Content to append"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Path to output file"}
    }
  },
  "inputsValues": {
    "content": {"type": "constant", "content": "\n\n## 新增内容"}
  }
}
```

### 14.4 Markdown Convert模式
```json
{
  "mode": "convert",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "targetFormat", "options", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Markdown File", "description": "Select MD file"},
      "targetFormat": {"type": "string", "title": "Target Format", "description": "html/pdf", "enum": ["html", "pdf"], "default": "html"},
      "options": {
        "type": "object",
        "title": "Conversion Options",
        "properties": {
          "includeStylesheet": {"type": "boolean", "title": "Include Stylesheet", "description": "Add default styles", "default": true},
          "highlightCode": {"type": "boolean", "title": "Highlight Code", "description": "Enable highlighting", "default": true}
        }
      },
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "convertedFile": {"type": "string", "title": "Converted File", "description": "Path to converted file"}
    }
  },
  "inputsValues": {
    "targetFormat": {"type": "constant", "content": "html"},
    "options": {
      "type": "constant",
      "content": {
        "includeStylesheet": true,
        "highlightCode": true
      }
    }
  }
}
```

## 15. LLM处理器模板

### 15.1 LLM处理器结构
```json
{
  "id": "llm_[随机ID]",
  "type": "llm",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "LLM",
    "inputs": {
      "type": "object",
      "required": ["modelName", "apiKey", "apiHost", "temperature", "prompt"],
      "properties": {
        "inputFiles": {"type": "array", "description": "The files to process.", "items": {"type": "string"}},
        "modelName": {"type": "string", "description": "The name of the model to use."},
        "apiKey": {"type": "string", "description": "The API key to use."},
        "apiHost": {"type": "string", "description": "The API host to use."},
        "temperature": {"type": "number", "description": "The temperature to use."},
        "systemPrompt": {"type": "string", "description": "The system prompt to use."},
        "prompt": {"type": "string", "description": "The prompt to use."},
        "outputFolder": {"type": "string", "description": "The folder to save the output file.", "default": ""},
        "outputName": {"type": "string", "description": "The name of the output file.", "default": ""}
      }
    },
    "outputs": {
      "type": "object",
      "properties": {
        "result": {"type": "string"},
        "outputFile": {"type": "string"}
      }
    },
    "inputsValues": {
      "modelName": {"type": "constant", "content": "gpt-3.5-turbo"},
      "apiKey": {"type": "constant", "content": "your-api-key"},
      "apiHost": {"type": "constant", "content": "https://api.openai.com/v1"},
      "temperature": {"type": "constant", "content": 0.7},
      "systemPrompt": {"type": "constant", "content": "You are a helpful assistant."},
      "prompt": {"type": "constant", "content": "请分析这些文件的内容"},
      "inputFiles": {"type": "ref", "content": ["文件夹节点ID", "files变量名"]},
      "outputFolder": {"type": "ref", "content": ["文件夹节点ID", "变量名"]},
      "outputName": {"type": "constant", "content": "llm_output.txt"}
    }
  }
}
```

## 16. 控制流节点模板

### 16.1 Loop节点（数组循环）
```json
{
  "id": "loop_[随机ID]",
  "type": "loop",
  "meta": {"position": {"x": 1000, "y": 100}},
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
      "content": ["文件夹节点ID", "files变量名"]
    }
  },
  "blocks": [
    // 子节点数组
  ],
  "edges": [
    // 子节点连接
  ]
}
```

### 16.2 Loop节点（次数循环）
```json
{
  "id": "loop_[随机ID]",
  "type": "loop",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "Loop",
    "mode": "times",
    "inputs": {
      "type": "object",
      "required": ["times"],
      "properties": {
        "times": {"type": "number"}
      }
    },
    "times": 10
  },
  "blocks": [
    // 子节点数组
  ],
  "edges": [
    // 子节点连接
  ]
}
```

### 16.3 Condition节点
```json
{
  "id": "condition_[随机ID]",
  "type": "condition",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "Condition",
    "conditions": [
      {
        "value": {
          "left": {
            "type": "ref",
            "content": ["源节点ID", "变量名"]
          },
          "operator": "equals",
          "right": {
            "type": "constant",
            "content": "比较值"
          }
        },
        "key": "if_[随机ID]"
      }
    ]
  }
}
```

## 17. 常见场景模板

### 17.1 单文件处理模板
```json
{
  "nodes": [
    {/* Start节点 */},
    {/* File Input节点 */},
    {/* Folder Input节点 */},
    {/* 处理器节点 */},
    {/* End节点 */}
  ],
  "edges": [
    {"sourceNodeID": "start_0", "targetNodeID": "file_input_[ID]"},
    {"sourceNodeID": "file_input_[ID]", "targetNodeID": "folder_input_[ID]"},
    {"sourceNodeID": "folder_input_[ID]", "targetNodeID": "processor_[ID]"},
    {"sourceNodeID": "processor_[ID]", "targetNodeID": "end_0"}
  ]
}
```

### 17.2 批量文件处理模板（循环）
```json
{
  "nodes": [
    {/* Start节点 */},
    {/* Folder Input节点 */},
    {/* Loop节点 */},
    {/* End节点 */}
  ],
  "edges": [
    {"sourceNodeID": "start_0", "targetNodeID": "folder_input_[ID]"},
    {"sourceNodeID": "folder_input_[ID]", "targetNodeID": "loop_[ID]"},
    {"sourceNodeID": "loop_[ID]", "targetNodeID": "end_0"}
  ]
}
```

### 17.3 条件分支处理模板
```json
{
  "nodes": [
    {/* Start节点 */},
    {/* Input节点 */},
    {/* Condition节点 */},
    {/* 分支处理器1 */},
    {/* 分支处理器2 */},
    {/* End节点 */}
  ],
  "edges": [
    {"sourceNodeID": "start_0", "targetNodeID": "input_[ID]"},
    {"sourceNodeID": "input_[ID]", "targetNodeID": "condition_[ID]"},
    {"sourceNodeID": "condition_[ID]", "targetNodeID": "processor1_[ID]", "sourcePortID": "if_[条件1ID]"},
    {"sourceNodeID": "condition_[ID]", "targetNodeID": "processor2_[ID]", "sourcePortID": "if_[条件2ID]"},
    {"sourceNodeID": "processor1_[ID]", "targetNodeID": "end_0"},
    {"sourceNodeID": "processor2_[ID]", "targetNodeID": "end_0"}
  ]
}
```

## 18. 生成指导原则

### 18.1 节点ID生成规则
- 格式：`{节点类型}_{随机字符串}`
- 随机字符串：5-6位字母数字组合
- 示例：`pdf_processor_xwCue`, `img_processor_2X1vp`

### 18.2 位置坐标分配
- Start节点：(180, 100)
- 后续节点：每个节点x坐标递增460
- 分支节点：y坐标适当调整避免重叠

### 18.3 变量命名规范
- 文件变量：`文件名_扩展名`（去除特殊字符）
- 文件夹变量：`文件夹名`
- 文件列表变量：`文件夹名_files`

### 18.4 引用设置原则
- 文件输入：引用file-input节点的文件变量
- 输出文件夹：引用folder-input节点的文件夹变量
- 处理结果：引用前一个处理器的输出变量

### 18.5 错误避免
- 确保所有required字段都有值
- 确保引用的节点ID和变量名存在
- 确保条件节点的sourcePortID与conditions中的key匹配
- 确保循环节点有完整的blocks和edges数组 