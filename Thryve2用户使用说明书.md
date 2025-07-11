# Thryve2 智能文件处理可视化工作流编辑器
## 用户手册

**版本：** 1.0  
**发布日期：** 2024年  
**文档类型：** 用户手册  

---

## 📋 目录

### 第一部分：系统安装手册
1. [系统概述](#1-系统概述)
2. [软硬件环境要求](#2-软硬件环境要求)
3. [系统安装配置](#3-系统安装配置)
4. [数据库配置](#4-数据库配置)
5. [环境验证](#5-环境验证)

### 第二部分：用户使用指导
6. [登录界面操作](#6-登录界面操作)
7. [主界面介绍](#7-主界面介绍)
8. [基础功能操作](#8-基础功能操作)
9. [高级功能应用](#9-高级功能应用)
10. [常见问题解决](#10-常见问题解决)

---

# 第一部分：系统安装手册

## 1. 系统概述

### 1.1 系统简介
Thryve2 是一个专为智能文件处理设计的可视化工作流编辑器，采用前后端分离架构。系统通过直观的拖拽式界面，让用户能够轻松创建复杂的文件处理工作流，实现批量文件操作、格式转换、内容分析和自动化文档处理等功能。

### 1.2 系统架构
- **前端**: 基于React 18 + TypeScript的Web应用
- **后端**: 基于Python Flask的API服务
- **通信**: WebSocket实时通信 + RESTful API
- **桌面应用**: 基于Electron的跨平台桌面客户端

### 1.3 核心功能
- 可视化工作流设计器
- 智能文件处理系统  
- 实时执行引擎
- AI助手集成
- 断点调试功能
- 内存管理优化

## 2. 软硬件环境要求

### 2.1 硬件要求

#### 最低配置要求
- **CPU**: Intel Core i3 或 AMD Ryzen 3 及以上
- **内存**: 4GB RAM
- **硬盘**: 2GB 可用空间
- **网络**: 支持TCP/IP协议的网络连接

#### 推荐配置要求  
- **CPU**: Intel Core i5 或 AMD Ryzen 5 及以上
- **内存**: 8GB RAM 或更高
- **硬盘**: 5GB 可用空间（SSD推荐）
- **网络**: 稳定的互联网连接（用于AI功能）

### 2.2 软件环境要求

#### 操作系统支持
- **Windows**: Windows 10 版本 1809 或更高版本
- **macOS**: macOS 10.14 (Mojave) 或更高版本  
- **Linux**: Ubuntu 18.04 LTS 或其他主流发行版

#### 依赖软件
- **Node.js**: 16.0 或更高版本
- **Python**: 3.8 或更高版本
- **npm**: 8.0 或更高版本
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 3. 系统安装配置

### 3.1 环境准备

#### 3.1.1 安装Node.js和npm
1. 访问 [Node.js官网](https://nodejs.org/) 下载LTS版本
2. 运行安装程序，按照提示完成安装
3. 验证安装：
```bash
node --version  # 应显示 v16.0.0 或更高
npm --version   # 应显示 8.0.0 或更高
```

#### 3.1.2 安装Python环境
1. 访问 [Python官网](https://python.org/) 下载Python 3.8+
2. 安装时勾选"Add Python to PATH"选项
3. 验证安装：
```bash
python --version  # 应显示 Python 3.8.0 或更高
pip --version     # 确认pip可用
```

### 3.2 获取源代码
```bash
# 克隆代码仓库（或从压缩包解压）
git clone [repository-url] Thryve2
cd Thryve2
```

### 3.3 后端配置与安装

#### 3.3.1 安装Python依赖
```bash
# 进入后端目录
cd Backend

# 安装依赖包
pip install -r requirements.txt
```

#### 3.3.2 配置后端服务
1. 复制配置文件模板：
```bash
cp config/system_prompt.py.example config/system_prompt.py
```

2. 编辑配置文件 `config/system_prompt.py`：
```python
# API配置
API_HOST = "localhost"
API_PORT = 5000
DEBUG = True

# AI模型配置
AI_MODEL_API_KEY = "your-api-key"  # 设置您的AI模型API密钥
AI_MODEL_URL = "https://api.example.com"  # AI服务地址
```

#### 3.3.3 启动后端服务
```bash
# 在Backend目录下执行
python app.py
```

**启动成功标志**：
- 控制台显示：`* Running on http://localhost:5000`
- 无错误信息输出

### 3.4 前端配置与安装

#### 3.4.1 安装前端依赖
```bash
# 进入前端目录
cd Fronted1

# 安装npm依赖
npm install
```

#### 3.4.2 配置前端连接
编辑文件 `src/services/index.ts`，确认后端API地址：
```typescript
const API_BASE_URL = 'http://localhost:5000';
```

#### 3.4.3 启动前端服务
```bash
# 开发模式启动
npm run dev
```

**启动成功标志**：
- 控制台显示：`Local: http://localhost:3000`
- 浏览器自动打开应用页面

### 3.5 桌面应用配置（可选）

#### 3.5.1 构建桌面应用
```bash
# 在Fronted1目录下执行
npm run build
npm run electron:pack
```

#### 3.5.2 运行桌面应用
```bash
npm run electron
```

## 4. 数据库配置

### 4.1 数据存储说明
Thryve2系统采用文件系统存储，主要数据存储包括：

#### 4.1.1 工作流数据存储
- **位置**: `Backend/workflows/`
- **格式**: JSON文件
- **备份**: 建议定期备份此目录

#### 4.1.2 用户项目存储  
- **位置**: `Fronted1/src/utils/db.ts`
- **存储方式**: LocalStorage + IndexedDB
- **配置**: 无需额外配置

#### 4.1.3 日志文件存储
- **位置**: `Backend/logs/`
- **配置**: 在 `app.py` 中配置日志级别

### 4.2 存储空间规划
```
项目根目录/
├── Backend/
│   ├── workflows/        # 工作流定义文件
│   ├── logs/            # 系统日志文件  
│   └── temp/            # 临时文件存储
└── Fronted1/
    └── dist/            # 构建输出文件
```

### 4.3 数据备份建议
1. **定期备份工作流文件**：
```bash
# 创建备份脚本
tar -czf backup_$(date +%Y%m%d).tar.gz Backend/workflows/
```

2. **清理临时文件**：
```bash
# 清理临时文件
rm -rf Backend/temp/*
```

## 5. 环境验证

### 5.1 服务连通性检查

#### 5.1.1 后端服务检查
访问 `http://localhost:5000/api/health`，应返回：
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

#### 5.1.2 前端服务检查  
访问 `http://localhost:3000`，应显示登录界面

#### 5.1.3 WebSocket连接检查
在浏览器开发者工具Network标签中，确认WebSocket连接状态为"101 Switching Protocols"

### 5.2 功能验证清单

- [ ] 后端API服务正常启动
- [ ] 前端Web应用正常访问
- [ ] WebSocket连接建立成功
- [ ] 文件上传功能可用
- [ ] 工作流创建功能可用
- [ ] AI助手功能可用（需要API密钥）

### 5.3 常见安装问题

#### 5.3.1 端口占用问题
```bash
# 检查端口占用
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# 终止占用进程
taskkill /PID [进程ID] /F
```

#### 5.3.2 依赖安装失败
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules
npm install
```

#### 5.3.3 Python依赖问题
```bash
# 升级pip
python -m pip install --upgrade pip

# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

---

# 第二部分：用户使用指导

## 6. 登录界面操作

### 6.1 访问系统
1. 打开Web浏览器
2. 在地址栏输入：`http://localhost:3000`
3. 等待页面加载完成

**【截图说明：此处应添加登录界面截图，显示系统LOGO和登录入口】**

### 6.2 登录方式
Thryve2系统采用免登录设计，用户可直接进入主界面使用。

**操作步骤**：
- 页面加载完成后自动进入主工作界面
- 如需重新访问，刷新浏览器页面即可

## 7. 主界面介绍

### 7.1 主界面布局

**【截图说明：此处应添加主界面整体截图，标注各功能区域】**

主界面采用分区布局设计：

```
┌─────────────────────────────────────────────────────────────────┐
│ ①工具栏                    │ ②右侧属性面板                      │
├─────────────────────────────────────────────────────────────────┤
│ ③左侧功能面板  │                                                │
│ - 项目管理     │         ④主画布区域                           │
│ - AI助手       │       (工作流编辑区)                          │
│ - 控制台       │                                                │
│ - 调试工具     │                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 功能区域详解

#### 7.2.1 工具栏区域（①）
**【截图说明：此处应添加工具栏详细截图，标注各按钮功能】**

- **文件操作区**：
  - 新建工作流按钮
  - 打开工作流按钮  
  - 保存工作流按钮
  - 导出/导入按钮

- **编辑操作区**：
  - 撤销/重做按钮
  - 复制/粘贴按钮
  - 删除选中节点按钮

- **视图控制区**：
  - 缩放控制滑块
  - 适应画布按钮
  - 网格显示开关

- **执行控制区**：
  - 运行工作流按钮（绿色播放图标）
  - 暂停执行按钮（黄色暂停图标）
  - 停止执行按钮（红色停止图标）
  - 调试模式按钮（虫子图标）

#### 7.2.2 右侧属性面板（②）
**【截图说明：此处应添加属性面板截图，显示节点配置界面】**

属性面板显示当前选中节点的详细配置：
- **节点基本信息**：节点类型、标题、描述
- **输入参数配置**：各项输入参数的设置
- **输出参数配置**：节点输出变量的定义
- **高级设置**：节点特定的高级配置选项

#### 7.2.3 左侧功能面板（③）

**项目管理区域**
**【截图说明：此处应添加项目管理面板截图】**
- 我的项目列表
- 项目搜索功能
- 项目创建/删除操作
- 项目导入/导出功能

**AI助手区域**  
**【截图说明：此处应添加AI助手界面截图】**
- AI对话输入框
- 历史对话记录
- 模式切换按钮（自动操作/交互问答）
- AI建议和帮助信息

**控制台区域**
**【截图说明：此处应添加控制台界面截图，显示执行日志】**
- 实时执行日志显示
- 日志级别筛选
- 错误信息高亮显示
- 日志清空和导出功能

#### 7.2.4 主画布区域（④）
**【截图说明：此处应添加画布区域截图，显示工作流节点和连接线】**

- **节点显示**：工作流中的各个处理节点
- **连接线**：节点间的数据流向连接
- **节点状态指示**：不同颜色表示节点执行状态
- **右键菜单**：节点操作的上下文菜单

### 7.3 节点面板操作

#### 7.3.1 节点面板位置
**【截图说明：此处应添加节点面板位置截图】**

节点面板通常位于界面顶部或右侧，包含以下节点分类：

#### 7.3.2 节点分类说明
**【截图说明：此处应添加节点分类展开截图】**

1. **基础节点**：
   - Start（开始）- 绿色圆形图标
   - End（结束）- 红色圆形图标  
   - Print（打印）- 打印机图标

2. **输入节点**：
   - File Input（文件输入）- 文件图标
   - Folder Input（文件夹输入）- 文件夹图标

3. **处理节点**：
   - Text Processor（文本处理）- 文本图标
   - PDF Processor（PDF处理）- PDF图标
   - Image Processor（图像处理）- 图片图标
   - JSON Processor（JSON处理）- JSON图标

4. **控制节点**：
   - Condition（条件）- 菱形图标
   - Loop（循环）- 环形箭头图标
   - Call（调用）- 电话图标

## 8. 基础功能操作

### 8.1 创建第一个工作流

#### 8.1.1 新建工作流
**【截图说明：此处应添加新建工作流对话框截图】**

1. 点击工具栏中的"新建工作流"按钮
2. 在弹出对话框中输入工作流名称，如"我的第一个工作流"
3. 点击"确定"按钮

#### 8.1.2 添加开始节点
**【截图说明：此处应添加拖拽开始节点到画布的截图】**

1. 从节点面板的"基础节点"分类中找到"Start"节点
2. 用鼠标左键按住"Start"节点图标
3. 拖拽到画布中央位置
4. 松开鼠标完成节点添加

#### 8.1.3 添加文件输入节点
**【截图说明：此处应添加文件输入节点配置截图】**

1. 从"输入节点"分类中拖拽"File Input"节点到画布
2. 将"File Input"节点放置在"Start"节点右侧
3. 点击"File Input"节点选中
4. 在右侧属性面板中配置：
   - 点击"选择文件"按钮
   - 从文件浏览器中选择一个文本文件
   - 确认文件路径显示正确

#### 8.1.4 添加文本处理节点
**【截图说明：此处应添加文本处理节点配置截图】**

1. 从"处理节点"分类拖拽"Text Processor"节点到画布
2. 选中"Text Processor"节点
3. 在属性面板中设置：
   - 模式选择：`read_text`
   - 输入文件：选择引用"File Input"节点的输出

#### 8.1.5 连接节点
**【截图说明：此处应添加连接节点操作的截图】**

1. 将鼠标悬停在"Start"节点的右侧边缘
2. 当出现连接点时，按住鼠标左键拖拽
3. 将连接线拖拽到"File Input"节点的左侧连接点
4. 松开鼠标建立连接
5. 重复操作连接"File Input"到"Text Processor"

#### 8.1.6 添加结束节点
**【截图说明：此处应添加完整工作流截图】**

1. 拖拽"End"节点到"Text Processor"右侧
2. 连接"Text Processor"到"End"节点
3. 完整的工作流应该是：Start → File Input → Text Processor → End

### 8.2 执行工作流

#### 8.2.1 运行工作流
**【截图说明：此处应添加运行工作流时的状态截图】**

1. 点击工具栏中的绿色"运行"按钮
2. 观察节点状态变化：
   - 蓝色：等待执行
   - 黄色：正在执行
   - 绿色：执行成功
   - 红色：执行失败

#### 8.2.2 查看执行结果
**【截图说明：此处应添加查看执行结果的截图】**

1. 点击"Text Processor"节点
2. 在属性面板底部查看"输出结果"区域
3. 或在左侧控制台面板查看详细日志

### 8.3 保存和管理工作流

#### 8.3.1 保存工作流
**【截图说明：此处应添加保存工作流截图】**

1. 点击工具栏中的"保存"按钮
2. 工作流会自动保存到项目中
3. 在左侧项目管理面板中可以看到保存的工作流

#### 8.3.2 导出工作流
**【截图说明：此处应添加导出选项截图】**

1. 点击"文件"菜单中的"导出"选项
2. 选择导出格式（JSON格式）
3. 选择保存位置并确认

### 8.4 文件处理实例

#### 8.4.1 批量文件处理示例
**【截图说明：此处应添加批量处理工作流截图】**

创建一个批量处理PDF文件的工作流：

1. **添加文件夹输入**：
   - 拖拽"Folder Input"节点到画布
   - 选择包含PDF文件的文件夹

2. **添加循环节点**：
   - 拖拽"Loop"节点，配置遍历文件列表
   - 设置循环变量名为"current_file"

3. **添加PDF处理器**：
   - 在循环内添加"PDF Processor"节点
   - 设置模式为"extract_text"
   - 输入文件引用循环变量"current_file"

4. **连接和运行**：
   - 正确连接所有节点
   - 运行工作流查看批量处理结果

## 9. 高级功能应用

### 9.1 AI助手功能

#### 9.1.1 AI助手界面
**【截图说明：此处应添加AI助手界面完整截图】**

AI助手位于左侧功能面板，提供两种工作模式：

#### 9.1.2 自动操作模式使用
**【截图说明：此处应添加AI自动操作模式截图】**

1. **启用自动操作模式**：
   - 在AI助手面板点击"Agent Auto-operation"模式
   - 输入框中输入需求，如："帮我创建一个批量转换PDF为Word的工作流"

2. **AI自动构建工作流**：
   - AI会自动分析需求
   - 自动添加相应节点到画布
   - 自动配置节点参数
   - 自动建立节点连接

3. **查看AI建议**：
   - AI会在对话框中说明创建的工作流逻辑
   - 提供使用建议和注意事项

#### 9.1.3 交互问答模式使用
**【截图说明：此处应添加AI交互问答截图】**

1. **切换到问答模式**：
   - 点击"Ask Interactive"模式按钮
   - 输入问题，如："如何使用条件节点实现分支处理？"

2. **获取AI回答**：
   - AI会提供详细的操作指导
   - 包含具体的步骤说明
   - 提供相关的最佳实践建议

### 9.2 断点调试功能

#### 9.2.1 设置断点
**【截图说明：此处应添加断点设置截图，显示节点上的断点标记】**

1. **选择节点**：点击要调试的节点
2. **启用断点**：
   - 点击属性面板中的"断点"按钮
   - 或右键点击节点选择"设置断点"
3. **断点标记**：节点左上角会显示红色断点标记

#### 9.2.2 条件断点设置
**【截图说明：此处应添加条件断点配置截图】**

1. **高级断点设置**：
   - 右键点击已设置断点的节点
   - 选择"条件断点"
   - 输入触发条件，如：`file_count > 10`

#### 9.2.3 调试模式执行
**【截图说明：此处应添加调试模式执行截图】**

1. **启动调试模式**：
   - 点击工具栏中的调试按钮（虫子图标）
   - 工作流会在断点处自动暂停

2. **调试控制操作**：
   - **继续执行**：点击"Continue"按钮
   - **单步执行**：点击"Step Over"按钮
   - **查看变量**：在属性面板查看当前变量值

### 9.3 函数化工作流

#### 9.3.1 创建主工作流
**【截图说明：此处应添加主工作流创建截图】**

1. **新建主工作流**：
   - 新建工作流并命名为"主工作流"
   - 添加Start节点和End节点

2. **添加调用节点**：
   - 拖拽"Call"节点到画布
   - 在属性面板中配置要调用的子工作流ID

#### 9.3.2 创建子工作流
**【截图说明：此处应添加子工作流创建截图】**

1. **新建子工作流**：
   - 创建新工作流，命名为"文件处理子流程"
   - 设计具体的文件处理逻辑

2. **配置调用关系**：
   - 在主工作流的Call节点中指定子工作流名称
   - 设置参数传递关系

### 9.4 高级节点配置

#### 9.4.1 条件节点高级用法
**【截图说明：此处应添加条件节点配置截图】**

1. **复杂条件设置**：
   - 选中Condition节点
   - 在属性面板设置多个条件分支
   - 配置不同条件对应的输出端口

2. **条件表达式**：
   - 支持JavaScript表达式
   - 示例：`file.size > 1024 && file.type === 'pdf'`

#### 9.4.2 循环节点高级配置
**【截图说明：此处应添加循环节点配置截图】**

1. **循环类型选择**：
   - For循环：指定循环次数
   - While循环：基于条件循环
   - ForEach循环：遍历数组或对象

2. **循环控制**：
   - 设置最大循环次数防止死循环
   - 配置循环变量和索引变量

## 10. 常见问题解决

### 10.1 安装和启动问题

#### 10.1.1 前端无法访问
**【截图说明：此处应添加前端错误页面截图】**

**问题现象**：浏览器显示"无法访问此网站"或"连接被拒绝"

**解决方案**：
1. **检查前端服务状态**：
   ```bash
   # 确认前端服务是否正在运行
   npm run dev
   ```

2. **检查端口占用**：
   ```bash
   # Windows系统
   netstat -ano | findstr :3000
   # Mac/Linux系统  
   lsof -i :3000
   ```

3. **清理缓存重新启动**：
   ```bash
   # 清理node_modules重新安装
   rm -rf node_modules
   npm install
   npm run dev
   ```

#### 10.1.2 后端API连接失败
**【截图说明：此处应添加网络错误截图】**

**问题现象**：前端界面显示"API连接失败"或网络错误

**解决方案**：
1. **验证后端服务**：
   - 访问 `http://localhost:5000/api/health`
   - 应返回JSON格式的健康状态信息

2. **检查防火墙设置**：
   - Windows：在防火墙中允许Python.exe
   - Mac：系统偏好设置 → 安全性与隐私 → 防火墙

3. **重启后端服务**：
   ```bash
   cd Backend
   python app.py
   ```

### 10.2 工作流执行问题

#### 10.2.1 节点执行失败
**【截图说明：此处应添加节点错误状态截图】**

**问题现象**：节点显示红色错误状态，执行失败

**常见原因及解决**：

1. **文件路径错误**：
   - 检查文件是否存在
   - 确认路径格式正确（避免中文路径）
   - 使用绝对路径替代相对路径

2. **参数配置错误**：
   - 检查必填参数是否已填写
   - 确认参数类型匹配
   - 查看属性面板的参数验证提示

3. **依赖文件缺失**：
   - 确认依赖的Python库已安装
   - 检查requirements.txt中的依赖版本

#### 10.2.2 工作流卡住不执行
**【截图说明：此处应添加卡住状态的工作流截图】**

**问题现象**：工作流开始执行后长时间无响应

**解决方案**：
1. **检查循环节点**：
   - 确认循环条件能够正常退出
   - 设置最大循环次数限制

2. **检查文件大小**：
   - 大文件处理可能需要较长时间
   - 考虑使用批量处理模式

3. **重启服务**：
   - 停止当前执行
   - 重启后端服务

### 10.3 AI助手问题

#### 10.3.1 AI助手无响应
**【截图说明：此处应添加AI助手无响应截图】**

**问题现象**：输入问题后AI助手没有回复

**解决方案**：
1. **检查API配置**：
   - 确认AI模型API密钥已正确配置
   - 检查网络连接状态

2. **重新连接**：
   - 刷新页面重新建立连接
   - 检查WebSocket连接状态

#### 10.3.2 AI建议不准确
**【截图说明：此处应添加AI建议界面截图】**

**解决方案**：
1. **明确描述需求**：
   - 使用具体、详细的描述
   - 包含文件类型、处理目标等信息

2. **分步骤提问**：
   - 将复杂需求分解为多个简单问题
   - 逐步获取AI建议

### 10.4 性能优化问题

#### 10.4.1 处理大文件时内存不足
**【截图说明：此处应添加内存使用监控截图】**

**解决方案**：
1. **启用内存管理**：
   ```bash
   # 查看内存使用情况
   GET /api/workflows/memory
   ```

2. **优化工作流设计**：
   - 使用分批处理模式
   - 及时清理临时变量
   - 避免在循环中保存大量数据

3. **系统优化**：
   - 增加系统内存
   - 关闭其他大内存应用
   - 使用SSD提高IO性能

#### 10.4.2 工作流执行缓慢
**解决方案**：
1. **节点优化**：
   - 减少不必要的节点
   - 合并相似的处理步骤
   - 使用并行处理

2. **文件优化**：
   - 压缩大文件
   - 使用高效的文件格式
   - 清理临时文件

### 10.5 数据备份与恢复

#### 10.5.1 工作流数据丢失
**【截图说明：此处应添加数据恢复界面截图】**

**预防措施**：
1. **定期备份**：
   ```bash
   # 备份工作流数据
   cp -r Backend/workflows/ backup/workflows_$(date +%Y%m%d)/
   ```

2. **导出重要工作流**：
   - 定期导出为JSON文件
   - 保存到云存储或外部设备

**恢复方法**：
1. **从备份恢复**：
   ```bash
   # 恢复备份数据
   cp -r backup/workflows_20240101/ Backend/workflows/
   ```

2. **从导出文件恢复**：
   - 使用导入功能重新导入JSON文件

### 10.6 技术支持联系方式

#### 10.6.1 获取帮助的途径
1. **在线文档**：查看最新的使用文档和API说明
2. **社区论坛**：在用户社区发布问题和交流经验
3. **技术支持**：通过邮件或在线客服获取专业技术支持
4. **GitHub Issues**：在项目仓库提交bug报告或功能建议

#### 10.6.2 问题反馈建议
提交问题时请包含以下信息：
- 操作系统版本和浏览器信息
- 具体的错误信息或截图
- 重现问题的具体步骤
- 相关的工作流配置文件

---

**附录A：键盘快捷键列表**
- Ctrl+N：新建工作流
- Ctrl+S：保存工作流
- Ctrl+Z：撤销操作
- Ctrl+Y：重做操作
- F5：运行工作流
- F10：调试模式
- Delete：删除选中节点

**附录B：支持的文件格式**
- 文档：PDF, DOC, DOCX, TXT, RTF, ODT
- 数据：JSON, CSV, XML, YAML, XLS, XLSX
- 图像：PNG, JPG, JPEG, GIF, BMP, TIFF, SVG
- 其他：ZIP, RAR, 7Z, MD, HTML

**附录C：系统日志位置**
- 前端日志：浏览器开发者工具Console
- 后端日志：`Backend/logs/app.log`
- 工作流日志：左侧控制台面板

---

**版权声明：** 本用户手册版权归Thryve2开发团队所有，仅供用户学习和使用参考。

**文档版本：** 1.0  
**最后更新：** 2024年  
**总页数：** 约20页 