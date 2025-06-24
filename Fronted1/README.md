# Fronted1 项目文档

这是一个基于 React 的流程图编辑器前端项目，使用 TypeScript 开发。

## 项目架构

```
Fronted1/
├── public/                 # 静态资源目录
├── src/                    # 源代码目录
│   ├── assets/            # 图标和图片资源
│   ├── components/        # 组件目录
│   │   ├── add-node/     # 添加节点的核心功能组件
│   │   ├── base-node/    # 节点的基础结构和行为定义
│   │   ├── comment/      # 注释节点的完整功能实现
│   │   ├── group/        # 节点分组功能的实现
│   │   ├── line-add-button/ # 连线添加的交互组件
│   │   ├── node-menu/    # 节点上下文菜单
│   │   ├── node-panel/   # 节点选择和管理面板
│   │   ├── selector-box-popover/ # 多选框和相关弹出层
│   │   ├── sidebar/      # 侧边栏的完整实现
│   │   ├── testrun/      # 流程测试运行的功能组件
│   │   └── tools/        # 工具栏组件集合（见下方详细说明）
│   ├── context/          # React Context 上下文
│   ├── form-components/  # 表单相关组件
│   ├── hooks/           # 自定义 React Hooks
│   ├── nodes/           # 节点类型定义和实现
│   ├── plugins/         # 插件实现
│   ├── services/        # 服务层实现
│   ├── shortcuts/       # 快捷键功能实现
│   ├── styles/          # 全局样式
│   ├── typings/         # TypeScript 类型定义
│   └── utils/           # 工具函数
├── .gitignore           # Git 忽略配置
├── package.json         # 项目依赖配置
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 构建配置
```

## 主要组件说明

### 核心组件

- **Editor (src/editor.tsx)**
  - 整个编辑器的核心组件
  - 负责初始化编辑器环境和渲染主界面

### 组件结构

项目的组件分为两个主要类别：

#### 1. 核心功能组件 (src/components/)

这些组件构成了流程图编辑器的主体结构和核心功能：

- **base-node/**: 所有节点的基础实现
  - 定义节点的基本结构和行为
  - 提供节点的通用功能

- **add-node/**: 节点添加功能
  - 处理节点的创建和初始化
  - 提供节点添加的用户界面

- **group/**: 节点分组功能
  - 实现节点的分组管理
  - 处理分组的拖拽和调整

- **node-panel/**: 节点管理面板
  - 显示可用节点类型
  - 提供节点搜索和选择功能

- **sidebar/**: 侧边栏功能
  - 提供属性编辑
  - 显示节点详细信息

- **testrun/**: 流程测试功能
  - 实现流程的模拟运行
  - 提供运行状态展示

#### 2. 工具栏组件 (src/components/tools/)

这些组件提供了各种辅助功能和快捷操作：

- **Upload/Download**: 流程图的导入导出
  - 支持 JSON 格式的导入导出
  - 处理文件的读写操作

- **AutoLayout**: 自动布局功能
  - 优化节点排列
  - 自动调整连线

- **Comment**: 注释功能
  - 添加和编辑注释
  - 注释的显示控制

- **FitView**: 视图控制
  - 自适应视图大小
  - 居中显示内容

- **Interactive**: 交互模式
  - 切换鼠标/触控板模式
  - 优化不同设备的操作体验

- **Minimap**: 小地图导航
  - 提供整体视图预览
  - 快速定位和导航

- **SwitchLine**: 连线样式
  - 切换不同的连线样式
  - 自定义连线外观

### 插件系统 (src/plugins/)

- **context-menu-plugin/**: 右键菜单插件
- **runtime-plugin/**: 运行时插件
- **sync-variable-plugin/**: 变量同步插件

### 服务层 (src/services/)

- **custom-service.ts**: 自定义服务实现
- 提供核心功能的服务层抽象

### 类型系统 (src/typings/)

- **node.ts**: 节点相关类型定义
- **json-schema.ts**: JSON Schema 类型定义
- **index.ts**: 通用类型定义

## 主要功能

1. **流程图编辑**
   - 节点的添加、删除、移动
   - 节点之间的连线
   - 分组管理
   - 注释添加

2. **交互功能**
   - 自动布局
   - 缩放控制
   - 小地图导航
   - 快捷键支持

3. **数据管理**
   - 流程图的导入导出
   - JSON 格式的数据存储
   - 变量同步

4. **可扩展性**
   - 插件系统
   - 自定义节点支持
   - 自定义服务集成

## 开发指南

### 环境要求

- Node.js >= 14
- TypeScript >= 4.5
- React >= 17

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 技术栈

- React
- TypeScript
- Vite
- Semi Design UI
- @flowgram.ai/free-layout-editor
