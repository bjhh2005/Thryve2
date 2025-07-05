# 工作流JSON智能生成指南

## 概述
本指南旨在帮助AI智能生成格式正确、功能完整的工作流JSON文件。通过模块化设计和分层次结构，解决长JSON文件的复杂性问题。

## 1. 核心策略 - 解决长JSON问题

### 1.1 模块化生成策略
- **基础骨架**：先生成基本的start-end结构
- **节点插入**：按需插入具体的处理节点
- **参数填充**：根据mode填充对应的参数模板
- **连接优化**：自动计算节点位置和连接关系

### 1.2 分层次构建方法
1. **第一层**：确定工作流类型（单文件处理/批量处理/循环处理）
2. **第二层**：选择处理器类型和操作模式
3. **第三层**：填充具体参数和连接关系

### 1.3 预设模板策略
- **场景模板**：提供常见场景的完整模板
- **节点模板**：提供各类节点的标准模板
- **组合模板**：提供常见节点组合的模板

## 2. 基础JSON结构

### 2.1 完整结构
```json
{
  "nodes": [
    // 节点数组
  ],
  "edges": [
    // 连接数组
  ]
}
```

### 2.2 节点通用结构
```json
{
  "id": "node_type_随机ID",
  "type": "节点类型",
  "meta": {
    "position": {"x": x坐标, "y": y坐标}
  },
  "data": {
    "title": "节点标题",
    // 其他节点特定数据
  }
}
```

### 2.3 连接结构
```json
{
  "sourceNodeID": "源节点ID",
  "targetNodeID": "目标节点ID",
  "sourcePortID": "源端口ID（可选，条件节点需要）"
}
```

## 3. 节点类型分类

### 3.1 基础节点
- **start**: 工作流开始节点
- **end**: 工作流结束节点

### 3.2 输入节点
- **file-input**: 文件输入节点
- **folder-input**: 文件夹输入节点

### 3.3 处理节点（每种都有多个mode）
- **pdf-processor**: PDF处理器
- **img-processor**: 图像处理器
- **text-processor**: 文本处理器
- **json-processor**: JSON处理器
- **csv-processor**: CSV处理器
- **markdown-processor**: Markdown处理器
- **llm**: 大语言模型处理器

### 3.4 控制节点
- **loop**: 循环节点
- **condition**: 条件判断节点
- **relocation**: 重定位节点
- **print**: 打印节点

## 4. 位置坐标计算规则

### 4.1 标准间距
- **水平间距**：相邻节点x坐标差460
- **垂直间距**：相邻节点y坐标差100
- **起始位置**：start节点通常在(180, 100)

### 4.2 自动计算方法
```javascript
// 节点位置计算公式
x = 180 + (节点序号 * 460)
y = 100 + (分支偏移 * 100)
```

## 5. 引用系统

### 5.1 引用其他节点输出
```json
{
  "type": "ref",
  "content": ["源节点ID", "变量名"]
}
```

### 5.2 设置常量值
```json
{
  "type": "constant",
  "content": "具体值"
}
```

## 6. 基础节点模板

### 6.1 Start节点
```json
{
  "id": "start_0",
  "type": "start",
  "meta": {"position": {"x": 180, "y": 100}},
  "data": {
    "title": "Start",
    "outputs": {
      "type": "object",
      "properties": {
        "query": {"type": "string", "default": "Hello Flow."},
        "enable": {"type": "boolean", "default": true}
      }
    }
  }
}
```

### 6.2 End节点
```json
{
  "id": "end_0",
  "type": "end",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "End",
    "inputs": {
      "type": "object",
      "properties": {
        "result": {"type": "string"}
      }
    }
  }
}
```

## 7. 输入节点模板

### 7.1 File Input节点
```json
{
  "id": "file_input_[随机ID]",
  "type": "file-input",
  "meta": {"position": {"x": 640, "y": 100}},
  "data": {
    "title": "File Input",
    "files": [{
      "id": "file_[随机ID]",
      "file": {
        "filePath": "文件路径",
        "fileName": "文件名",
        "mimeType": "MIME类型",
        "size": 文件大小
      },
      "variableName": "变量名"
    }],
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

### 7.2 Folder Input节点
```json
{
  "id": "folder_input_[随机ID]",
  "type": "folder-input",
  "meta": {"position": {"x": 640, "y": 100}},
  "data": {
    "title": "Folder Input",
    "folders": [{
      "id": "folder_[随机ID]",
      "folder": {
        "folderPath": "文件夹路径",
        "folderName": "文件夹名",
        "files": [
          {
            "path": "文件路径",
            "name": "文件名",
            "isDirectory": false
          }
        ]
      },
      "variableName": "变量名"
    }],
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
          "title": "File List",
          "description": "File list in the folder",
          "isOutput": true
        }
      }
    }
  }
}
```

## 8. 控制节点模板

### 8.1 Print节点
```json
{
  "id": "print_[随机ID]",
  "type": "print",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "Print",
    "inputs": {
      "type": "object",
      "properties": {
        "input": {
          "type": "string",
          "title": "Input Text",
          "description": "Text from previous node"
        }
      }
    },
    "outputs": {
      "type": "object",
      "properties": {
        "result": {
          "type": "string",
          "title": "Printed Text",
          "description": "The text that was printed"
        }
      }
    },
    "inputsValues": {
      "input": {
        "type": "constant",
        "content": "要打印的文本"
      }
    }
  }
}
```

### 8.2 Relocation节点
```json
{
  "id": "relocation_[随机ID]",
  "type": "relocation",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "Relocation",
    "inputs": {
      "type": "object",
      "properties": {
        "sourceVariable": {
          "type": "string",
          "title": "Source Variable",
          "description": "Source variable to relocate"
        },
        "targetVariable": {
          "type": "string",
          "title": "Target Variable",
          "description": "Target variable to relocate to"
        }
      }
    },
    "inputsValues": {
      "sourceVariable": {
        "type": "ref",
        "content": ["源节点ID", "源变量名"]
      },
      "targetVariable": {
        "type": "ref",
        "content": ["目标节点ID", "目标变量名"]
      }
    }
  }
}
```

## 9. PDF处理器模板

### 9.1 PDF处理器基础结构
```json
{
  "id": "pdf_processor_[随机ID]",
  "type": "pdf-processor",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "PDF Processor",
    "mode": "操作模式",
    "inputs": {
      "type": "object",
      "required": ["inputFile", "outputFolder", "outputName"],
      "properties": {
        "inputFile": {
          "type": "string",
          "title": "PDF File",
          "description": "Select PDF file"
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
      "properties": {}
    },
    "inputsValues": {
      "inputFile": {"type": "ref", "content": ["源节点ID", "变量名"]},
      "outputFolder": {"type": "ref", "content": ["文件夹节点ID", "变量名"]},
      "outputName": {"type": "constant", "content": "输出文件名"}
    }
  }
}
```

### 9.2 PDF Extract模式
```json
{
  "mode": "extract",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "pageRange", "extractImages", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "PDF File", "description": "Select PDF file"},
      "pageRange": {"type": "string", "title": "Page Range", "description": "Pages to extract (e.g., 1-5)", "default": ""},
      "extractImages": {"type": "boolean", "title": "Extract Images", "description": "Include images", "default": false},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "text": {"type": "string", "description": "Extracted text content"},
      "images": {"type": "array", "description": "Extracted images (if enabled)"}
    }
  },
  "inputsValues": {
    "pageRange": {"type": "constant", "content": "1-5"},
    "extractImages": {"type": "constant", "content": true}
  }
}
```

### 9.3 PDF Split模式
```json
{
  "mode": "split",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "splitMethod", "value", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "PDF File", "description": "Select PDF file"},
      "splitMethod": {"type": "string", "title": "Split Method", "description": "byPage/bySize/byBookmark", "enum": ["byPage", "bySize", "byBookmark"], "default": "byPage"},
      "value": {"type": "string", "title": "Split Value", "description": "Pages/size (MB)"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFiles": {"type": "array", "description": "List of split PDF files"},
      "fileCount": {"type": "number", "description": "Number of files created"}
    }
  },
  "inputsValues": {
    "splitMethod": {"type": "constant", "content": "byPage"},
    "value": {"type": "constant", "content": "1"}
  }
}
```

### 9.4 PDF Merge模式
```json
{
  "mode": "merge",
  "inputs": {
    "type": "object",
    "required": ["inputFiles", "sortBy", "outputFolder", "outputName"],
    "properties": {
      "inputFiles": {"type": "array", "title": "PDF Files", "description": "Files to merge", "items": {"type": "string"}},
      "sortBy": {"type": "string", "title": "Sort By", "description": "name or date", "enum": ["name", "date"], "default": "name"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Path to merged PDF file"},
      "pageCount": {"type": "number", "description": "Total pages in merged file"}
    }
  },
  "inputsValues": {
    "inputFiles": {"type": "ref", "content": ["文件夹节点ID", "files变量名"]},
    "sortBy": {"type": "constant", "content": "name"}
  }
}
```

### 9.5 PDF Encrypt模式
```json
{
  "mode": "encrypt",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "password", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "PDF File", "description": "Select PDF file"},
      "password": {"type": "string", "title": "Password", "description": "Encryption key"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Encrypted PDF file"},
      "success": {"type": "boolean", "description": "Encryption success status"}
    }
  },
  "inputsValues": {
    "password": {"type": "constant", "content": "your_password"}
  }
}
```

### 9.6 PDF Decrypt模式
```json
{
  "mode": "decrypt",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "password", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "PDF File", "description": "Select encrypted PDF"},
      "password": {"type": "string", "title": "Password", "description": "Decryption key"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Decrypted PDF file"},
      "success": {"type": "boolean", "description": "Decryption success status"}
    }
  },
  "inputsValues": {
    "password": {"type": "constant", "content": "your_password"}
  }
}
```

### 9.7 PDF Convert模式
```json
{
  "mode": "convert",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "outputFormat", "dpi", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "PDF File", "description": "Select PDF file"},
      "outputFormat": {"type": "string", "title": "Output Format", "description": "png/jpg/text/html", "enum": ["png", "jpg", "text", "html"], "default": "png"},
      "dpi": {"type": "number", "title": "DPI", "description": "Resolution (72-600)", "default": 300},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Converted file"},
      "conversionLog": {"type": "string", "description": "Conversion process log"}
    }
  },
  "inputsValues": {
    "outputFormat": {"type": "constant", "content": "png"},
    "dpi": {"type": "constant", "content": 300}
  }
}
```

### 9.8 PDF Watermark模式
```json
{
  "mode": "watermark",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "watermarkText", "opacity", "position", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "PDF File", "description": "Select PDF file"},
      "watermarkText": {"type": "string", "title": "Watermark Text", "description": "Text content"},
      "opacity": {"type": "number", "title": "Opacity", "description": "Range: 0-100", "default": 30},
      "position": {"type": "string", "title": "Position", "description": "center/topLeft/topRight/bottomLeft/bottomRight", "enum": ["center", "topLeft", "topRight", "bottomLeft", "bottomRight"], "default": "center"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "Watermarked PDF file"}
    }
  },
  "inputsValues": {
    "watermarkText": {"type": "constant", "content": "Confidential"},
    "opacity": {"type": "constant", "content": 30},
    "position": {"type": "constant", "content": "center"}
  }
}
```

### 9.9 PDF Metadata模式
```json
{
  "mode": "metadata",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "title", "author", "subject", "keywords", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "PDF File", "description": "Select PDF file"},
      "title": {"type": "string", "title": "Title", "description": "Document title"},
      "author": {"type": "string", "title": "Author", "description": "Document author"},
      "subject": {"type": "string", "title": "Subject", "description": "Document subject"},
      "keywords": {"type": "string", "title": "Keywords", "description": "Document keywords"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "outputs": {
    "type": "object",
    "properties": {
      "outputFile": {"type": "string", "description": "PDF file with updated metadata"},
      "metadata": {"type": "object", "description": "Updated metadata information"}
    }
  },
  "inputsValues": {
    "title": {"type": "constant", "content": "Document Title"},
    "author": {"type": "constant", "content": "Author Name"},
    "subject": {"type": "constant", "content": "Document Subject"},
    "keywords": {"type": "constant", "content": "keyword1, keyword2"}
  }
}
```

## 10. 图像处理器模板

### 10.1 图像处理器基础结构
```json
{
  "id": "img_processor_[随机ID]",
  "type": "img-processor",
  "meta": {"position": {"x": 1000, "y": 100}},
  "data": {
    "title": "Image Processor",
    "mode": "操作模式",
    "inputs": {
      "type": "object",
      "required": ["inputFile", "outputFolder", "outputName"],
      "properties": {
        "inputFile": {"type": "string", "title": "Input Image", "description": "Select image file"},
        "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
        "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
      }
    },
    "outputs": {
      "type": "object",
      "properties": {
        "processedImage": {"type": "string", "title": "Image", "description": "Output path"},
        "width": {"type": "number", "title": "Width", "description": "Output width"},
        "height": {"type": "number", "title": "Height", "description": "Output height"},
        "format": {"type": "string", "title": "Format", "description": "Output format"},
        "size": {"type": "number", "title": "Size", "description": "File size (bytes)"}
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

### 10.2 图像Resize模式
```json
{
  "mode": "resize",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "width", "height", "maintainAspectRatio", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input Image", "description": "Select image file"},
      "width": {"type": "number", "title": "Width", "description": "Width (px) > 0", "minimum": 1},
      "height": {"type": "number", "title": "Height", "description": "Height (px) > 0", "minimum": 1},
      "maintainAspectRatio": {"type": "boolean", "title": "Aspect Ratio", "description": "Keep aspect ratio"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "inputsValues": {
    "width": {"type": "constant", "content": 800},
    "height": {"type": "constant", "content": 600},
    "maintainAspectRatio": {"type": "constant", "content": true}
  }
}
```

### 10.3 图像Compress模式
```json
{
  "mode": "compress",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "quality", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input Image", "description": "Select image file"},
      "quality": {"type": "number", "title": "Quality", "description": "Range: 1-100", "minimum": 1, "maximum": 100, "default": 80},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "inputsValues": {
    "quality": {"type": "constant", "content": 80}
  }
}
```

### 10.4 图像Convert模式
```json
{
  "mode": "convert",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "format", "quality", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input Image", "description": "Select image file"},
      "format": {"type": "string", "title": "Format", "description": "jpeg/png/webp/gif", "enum": ["jpeg", "png", "webp", "gif"], "default": "jpeg"},
      "quality": {"type": "number", "title": "Quality", "description": "Range: 1-100", "minimum": 1, "maximum": 100, "default": 90},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "inputsValues": {
    "format": {"type": "constant", "content": "jpeg"},
    "quality": {"type": "constant", "content": 90}
  }
}
```

### 10.5 图像Rotate模式
```json
{
  "mode": "rotate",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "angle", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input Image", "description": "Select image file"},
      "angle": {"type": "number", "title": "Angle", "description": "±90°/±180°/±270°", "enum": [-270, -180, -90, 90, 180, 270], "default": 90},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "inputsValues": {
    "angle": {"type": "constant", "content": 90}
  }
}
```

### 10.6 图像Crop模式
```json
{
  "mode": "crop",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "x", "y", "width", "height", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input Image", "description": "Select image file"},
      "x": {"type": "number", "title": "X Position", "description": "Start X (px) ≥ 0", "minimum": 0},
      "y": {"type": "number", "title": "Y Position", "description": "Start Y (px) ≥ 0", "minimum": 0},
      "width": {"type": "number", "title": "Width", "description": "Width (px) > 0", "minimum": 1},
      "height": {"type": "number", "title": "Height", "description": "Height (px) > 0", "minimum": 1},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "inputsValues": {
    "x": {"type": "constant", "content": 0},
    "y": {"type": "constant", "content": 0},
    "width": {"type": "constant", "content": 100},
    "height": {"type": "constant", "content": 100}
  }
}
```

### 10.7 图像Filter模式
```json
{
  "mode": "filter",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "filterType", "intensity", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input Image", "description": "Select image file"},
      "filterType": {"type": "string", "title": "Filter", "description": "grayscale/sepia/blur/sharpen/brightness/contrast", "enum": ["grayscale", "sepia", "blur", "sharpen", "brightness", "contrast"], "default": "grayscale"},
      "intensity": {"type": "number", "title": "Intensity", "description": "Range: 1-100", "minimum": 1, "maximum": 100, "default": 50},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "inputsValues": {
    "filterType": {"type": "constant", "content": "grayscale"},
    "intensity": {"type": "constant", "content": 50}
  }
}
```

### 10.8 图像Watermark模式
```json
{
  "mode": "watermark",
  "inputs": {
    "type": "object",
    "required": ["inputFile", "watermarkText", "fontSize", "opacity", "position", "outputFolder", "outputName"],
    "properties": {
      "inputFile": {"type": "string", "title": "Input Image", "description": "Select image file"},
      "watermarkText": {"type": "string", "title": "Text", "description": "Watermark content"},
      "fontSize": {"type": "number", "title": "Font Size", "description": "Size (px) > 0", "minimum": 1, "default": 24},
      "opacity": {"type": "number", "title": "Opacity", "description": "Range: 1-100", "minimum": 1, "maximum": 100, "default": 50},
      "position": {"type": "string", "title": "Position", "description": "center/topLeft/topRight/bottomLeft/bottomRight", "enum": ["center", "topLeft", "topRight", "bottomLeft", "bottomRight"], "default": "bottomRight"},
      "outputFolder": {"type": "string", "title": "Output Folder", "description": "Save location"},
      "outputName": {"type": "string", "title": "Output Name", "description": "File name"}
    }
  },
  "inputsValues": {
    "watermarkText": {"type": "constant", "content": "Watermark"},
    "fontSize": {"type": "constant", "content": 24},
    "opacity": {"type": "constant", "content": 50},
    "position": {"type": "constant", "content": "bottomRight"}
  }
}
``` 