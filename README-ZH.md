# Thryve - 智能文件处理可视化工作流编辑器

[English](README.md) | 简体中文

[![Version](https://img.shields.io/badge/version-0.5-blue.svg)](https://github.com/your-username/Thryve2)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()
[![Contributors](https://img.shields.io/badge/contributors-5-orange.svg)]()
[![Made with React](https://img.shields.io/badge/React-18-%2361DAFB.svg?logo=react)](https://reactjs.org/)

Thryve 是一个专注于智能文件处理的可视化工作流编辑器。通过直观的节点式编程界面，用户可以轻松创建复杂的文件处理工作流，如批量文件操作、格式转换、内容分析和自动化文档处理。项目采用前后端分离架构，提供强大的工作流执行引擎和实时处理反馈。

## 功能特点

- 📂 **智能文件处理**:
  - 批量文件操作与转换
  - 多种文件格式支持
  - 内容提取与分析
  - 自动化文档处理

- 🎨 直观的可视化工作流设计界面
- 🔌 丰富的节点类型支持（开始、结束、条件、循环、文件处理等）
- 📝 实时工作流执行和状态反馈
- 🔄 支持复杂的条件分支和循环逻辑
- 💾 工作流的保存、导入和导出
- 🖥️ 跨平台桌面应用支持 (Windows, macOS, Linux)
- 🌐 基于 Socket.IO 的实时通信
- 🔍 内置调试和测试运行功能

## 技术亮点

### 事件总线架构 (Event Bus Architecture)

后端采用事件总线架构设计，具有以下优势：

- 🔄 **松耦合设计**: 通过事件总线实现节点间的解耦，每个节点都是独立的组件
- 📢 **事件驱动**: 采用发布-订阅模式，支持节点间的异步通信
- 🏭 **工厂模式**: 使用节点工厂统一管理节点的创建和生命周期
- 🔌 **可扩展性**: 轻松添加新节点类型，无需修改现有代码
- 🎯 **精确控制**: 支持条件节点多输出端口、循环节点流程控制等复杂场景
- 🔍 **状态追踪**: 通过事件总线实现工作流执行状态的实时监控

```python
# 事件总线示例
class WorkflowEngine:
    def __init__(self):
        self.bus = EventBus()
        self.bus.on("askMessage", self.askMessage)
        self.bus.on("putStack", self.putStack)
        # ... 更多事件监听
```

### 智能变量同步系统 (Smart Variable Sync System)

前端实现了一套智能的变量同步系统，具有以下特点：

- 🔄 **实时同步**: 通过插件机制实现节点输出的实时变量同步
- 🔍 **类型安全**: 基于 JSON Schema 的类型系统，确保变量类型的正确性
- 🎯 **智能命名**: 自动根据节点标题生成易读的变量名称
- 🖼️ **可视化增强**: 为变量添加图标和元数据，提升用户体验
- 🛡️ **数据验证**: 内置数据合法性检查，防止无效数据传递
- 📦 **特殊类型处理**: 针对文件输入等特殊节点类型的定制化处理

```typescript
// 变量同步示例
export const createSyncVariablePlugin = definePluginCreator({
  onInit(ctx) {
    ctx.document.onNodeCreate(({ node }) => {
      // 监听节点创建和更新事件
      const variableData = node.getData(FlowNodeVariableData);
      
      // 自动同步节点输出到变量系统
      variableData.setVar(
        ASTFactory.createVariableDeclaration({
          meta: { title, icon },
          key: nodeId,
          type: typeAST
        })
      );
    });
  }
});
```

这种设计不仅简化了用户的使用体验，还通过类型系统和数据验证确保了工作流的可靠性。变量同步系统作为前后端之间的桥梁，大大提升了数据流的可维护性和稳定性。

### 实时日志反馈系统 (Real-time Logging System)

基于 Socket.IO 实现的实时日志反馈系统，具有以下特点：

- 🔄 **实时反馈**: 通过 WebSocket 实现工作流执行状态的实时推送
- 🎨 **分级展示**: 支持多种日志级别（INFO、WARN、ERROR、SUCCESS、SYSTEM、OUTPUT）
- 🎯 **节点定位**: 每条日志都可以追踪到具体的节点
- 💫 **动态更新**: 自动滚动和实时更新的日志界面
- 🎭 **样式美化**: 每种日志类型都有独特的视觉样式
- 🛡️ **错误处理**: 完整的错误捕获和展示机制

```typescript
// 前端日志处理示例
socket.on('info', (data) => addLog({ 
    level: 'INFO', 
    message: data.message, 
    nodeId: data.nodeId 
}));

// 后端日志发送示例
engine.bus.on('workflow', lambda nodeId: 
    socketio.emit('workflow', {
        "nodeId": nodeId
    }, namespace='/workflow')
)
```

这种设计让用户能够实时监控工作流的执行过程，快速定位问题，提供了优秀的调试体验。系统不仅能显示执行状态，还能展示每个节点的输出结果，大大提升了工作流开发和调试的效率。

### AI 增强工作流系统 (AI-Enhanced Workflow System) 🚧

> 🔥 即将推出的新功能

集成了先进的 AI 能力，为工作流提供智能化支持：

- 🤖 **双模式 AI 助手**:
  - Agent 自动操作模式：AI 自动执行工作流任务
  - Ask 交互式对话模式：通过自然语言与 AI 助手交互

- 🧠 **智能节点类型**:
  - LLM 节点：集成大语言模型能力
  - VLLM 节点：支持多模态内容处理
  - 文档分析节点：自动化文档理解与处理

- 📊 **文档智能处理**:
  - 自动文档分析与结构化
  - 智能信息提取
  - 文本摘要与重点提取

- 🔄 **智能工作流优化**:
  - 自动流程优化建议
  - 智能错误诊断
  - 性能瓶颈检测


这套 AI 增强系统将为用户提供更智能、更高效的工作流处理能力，显著提升自动化程度和处理效率。

### 智能节点推荐系统 (Node Recommendation System) 🚧

> 🔥 创新特性规划

基于用户行为和工作流模式的智能推荐系统：

- 🎯 **上下文感知推荐**:
  - 基于当前节点类型推荐下一个最可能需要的节点
  - 智能识别常用节点组合模式
  - 自动补全节点配置建议

- 📊 **使用模式分析**:
  - 收集匿名的工作流使用数据
  - 分析最佳实践和常用模式
  - 为用户提供优化建议

### 协同编辑系统 (Collaborative Editing) 🚧

支持多人实时协作编辑工作流：

- 👥 **实时协作**:
  - 多用户同时编辑支持
  - 实时变更同步
  - 编辑冲突解决

- 📝 **版本控制**:
  - 工作流版本历史记录
  - 变更对比和回滚
  - 分支管理与合并

### 工作流模板市场 (Workflow Template Marketplace) 🚧

社区驱动的工作流模板生态系统：

- 🏪 **模板市场**:
  - 预置行业标准工作流模板
  - 用户自定义模板分享
  - 模板评分和评论系统

- 🔄 **一键复用**:
  - 模板快速导入
  - 参数自动适配
  - 模板组合与定制

### 智能调试系统 (Smart Debugging System) 🚧

增强的调试能力：

- 🔍 **智能断点**:
  - 条件断点设置
  - 变量监视
  - 执行时间分析

- 📊 **可视化调试**:
  - 数据流可视化
  - 节点状态实时展示
  - 性能瓶颈标注

### 自适应布局系统 (Adaptive Layout System) 🚧

智能的界面布局优化：

- 📱 **响应式设计**:
  - 自适应屏幕大小
  - 智能节点排列
  - 自动避免节点重叠

- 🎨 **智能美化**:
  - 自动对齐和分布
  - 智能连线路径规划
  - 节点组自动布局

这些创新特性将进一步提升 Thryve2 的易用性和功能性，为用户提供更智能、更高效的工作流开发体验。每个子系统都专注于解决特定的用户痛点，共同构建一个完整的智能工作流生态系统。

## 技术架构

### 前端 (Fronted1)

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **桌面支持**: Electron
- **主要依赖**:
  - @flowgram.ai 系列组件（布局编辑器、插件等）
  - Socket.IO 客户端
  - React 相关生态

### 后端 (Backend)

- **框架**: Python
- **主要模块**:
  - 工作流执行引擎 (Engine.py)
  - 事件总线系统 (EventBus.py)
  - 节点工厂模式实现 (Factory.py)
  - WebSocket 服务器

## 项目结构

```
Thryve2/
├── Backend/                # 后端服务
│   ├── app.py             # 主应用服务器
│   └── workflows/         # 工作流相关模块
│       ├── Engine.py      # 工作流执行引擎
│       ├── Factory.py     # 节点工厂
│       ├── events/        # 事件处理
│       └── nodes/         # 节点类型定义
│
├── Fronted1/              # 前端应用
│   ├── src/              # 源代码
│   │   ├── components/   # UI组件
│   │   ├── context/      # React Context
│   │   ├── nodes/        # 节点实现
│   │   ├── plugins/      # 插件系统
│   │   └── services/     # 服务层
│   └── electron/         # Electron 相关
```

## 快速开始

### 环境要求

- Node.js >= 14
- Python >= 3.8
- npm 或 yarn

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/bjhh2005/Thryve2.git
cd Thryve2
```

2. 安装前端依赖
```bash
cd Fronted1
npm install
```

3. 安装后端依赖
```bash
cd ../Backend
pip install -r requirements.txt
```

### 启动开发环境

1. 启动后端服务
```bash
cd Backend
python app.py
```

2. 启动前端开发服务器
```bash
cd Fronted1
npm run dev          # 网页版
# 或
npm run electron:dev # 桌面应用版
```

### 构建生产版本

```bash
cd Fronted1
npm run electron:build
```

生成的安装包将位于 `Fronted1/release` 目录。