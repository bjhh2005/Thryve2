# Thryve - Visual Workflow Editor for Intelligent File Processing

English | [简体中文](README-ZH.md)

[![Version](https://img.shields.io/badge/version-0.5-blue.svg)](https://github.com/your-username/Thryve2)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()
[![Contributors](https://img.shields.io/badge/contributors-5-orange.svg)]()
[![Made with React](https://img.shields.io/badge/React-18-%2361DAFB.svg?logo=react)](https://reactjs.org/)

Thryve is a powerful visual workflow editor designed specifically for intelligent file processing and automation. Through its intuitive node-based programming interface, users can easily create complex file processing workflows, such as batch file operations, format conversions, content analysis, and automated document processing. The project adopts a front-end and back-end separated architecture, providing a robust workflow execution engine with real-time processing feedback.

## Features

- 📂 **Intelligent File Processing**:
  - Batch file operations and transformations
  - Multiple file format support
  - Content extraction and analysis
  - Automated document processing

- 🎨 Intuitive visual workflow design interface
- 🔌 Rich node type support (Start, End, Condition, Loop, File Processing, etc.)
- 📝 Real-time workflow execution and status feedback
- 🔄 Support for complex conditional branching and loop logic
- 💾 Workflow save, import, and export capabilities
- 🖥️ Cross-platform desktop application support (Windows, macOS, Linux)
- 🌐 Real-time communication based on Socket.IO
- 🔍 Built-in debugging and test run functionality

## Technical Highlights

### Event Bus Architecture

The backend implements an event bus architecture with the following advantages:

- 🔄 **Loose Coupling**: Node decoupling through event bus, each node is an independent component
- 📢 **Event-Driven**: Publish-subscribe pattern supporting asynchronous communication
- 🏭 **Factory Pattern**: Unified node creation and lifecycle management
- 🔌 **Extensibility**: Easy addition of new node types without modifying existing code
- 🎯 **Precise Control**: Support for complex scenarios like multi-output ports and loop control
- 🔍 **State Tracking**: Real-time monitoring of workflow execution status

```python
# Event Bus Example
class WorkflowEngine:
    def __init__(self):
        self.bus = EventBus()
        self.bus.on("askMessage", self.askMessage)
        self.bus.on("putStack", self.putStack)
        # ... more event listeners
```

### Smart Variable Sync System

The frontend implements an intelligent variable synchronization system with:

- 🔄 **Real-time Sync**: Node output synchronization through plugin mechanism
- 🔍 **Type Safety**: JSON Schema-based type system ensuring variable type correctness
- 🎯 **Smart Naming**: Automatic generation of readable variable names
- 🖼️ **Visual Enhancement**: Icons and metadata for variables
- 🛡️ **Data Validation**: Built-in data validity checking
- 📦 **Special Type Handling**: Customized processing for special node types

### Real-time Logging System

Socket.IO-based real-time logging system featuring:

- 🔄 **Real-time Feedback**: WebSocket-based workflow execution status push
- 🎨 **Hierarchical Display**: Multiple log levels (INFO, WARN, ERROR, SUCCESS, SYSTEM, OUTPUT)
- 🎯 **Node Tracking**: Each log entry traceable to specific nodes
- 💫 **Dynamic Updates**: Auto-scrolling and real-time updating log interface
- 🎭 **Styled Display**: Unique visual styles for each log type
- 🛡️ **Error Handling**: Complete error capture and display mechanism

### AI-Enhanced Workflow System 🚧

> 🔥 Upcoming Feature

Advanced AI capabilities integrated for workflow intelligence:

- 🤖 **Dual-mode AI Assistant**:
  - Agent Auto-operation Mode: AI automated workflow execution
  - Ask Interactive Mode: Natural language interaction with AI assistant

- 🧠 **Intelligent Node Types**:
  - LLM Node: Large Language Model integration
  - VLLM Node: Multi-modal content processing
  - Document Analysis Node: Automated document understanding

- 📊 **Document Intelligence**:
  - Automatic document analysis and structuring
  - Intelligent information extraction
  - Text summarization and key point extraction

- 🔄 **Intelligent Workflow Optimization**:
  - Automatic process optimization suggestions
  - Intelligent error diagnosis
  - Performance bottleneck detection

### Node Recommendation System 🚧

> 🔥 Innovation Feature Planning

Intelligent recommendation system based on user behavior and workflow patterns:

- 🎯 **Context-aware Recommendations**:
  - Next node suggestions based on current node type
  - Smart recognition of common node combinations
  - Automatic node configuration suggestions

- 📊 **Usage Pattern Analysis**:
  - Anonymous workflow usage data collection
  - Best practice and common pattern analysis
  - Optimization suggestions for users

### Collaborative Editing 🚧

Support for real-time collaborative workflow editing:

- 👥 **Real-time Collaboration**:
  - Multi-user simultaneous editing
  - Real-time change synchronization
  - Edit conflict resolution

- 📝 **Version Control**:
  - Workflow version history
  - Change comparison and rollback
  - Branch management and merging

### Workflow Template Marketplace 🚧

Community-driven workflow template ecosystem:

- 🏪 **Template Market**:
  - Pre-built industry standard workflow templates
  - User-defined template sharing
  - Template rating and review system

- 🔄 **One-click Reuse**:
  - Quick template import
  - Automatic parameter adaptation
  - Template combination and customization

### Smart Debugging System 🚧

Enhanced debugging capabilities:

- 🔍 **Smart Breakpoints**:
  - Conditional breakpoint setting
  - Variable watching
  - Execution time analysis

- 📊 **Visual Debugging**:
  - Data flow visualization
  - Real-time node status display
  - Performance bottleneck marking

### Adaptive Layout System 🚧

Intelligent interface layout optimization:

- 📱 **Responsive Design**:
  - Screen size adaptation
  - Smart node arrangement
  - Automatic node overlap avoidance

- 🎨 **Smart Beautification**:
  - Automatic alignment and distribution
  - Intelligent connection path planning
  - Node group auto-layout

## Technical Architecture

### Frontend (Fronted1)

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Desktop Support**: Electron
- **Key Dependencies**:
  - @flowgram.ai series components (layout editor, plugins, etc.)
  - Socket.IO client
  - React ecosystem

### Backend (Backend)

- **Framework**: Python
- **Key Modules**:
  - Workflow execution engine (Engine.py)
  - Event bus system (EventBus.py)
  - Node factory pattern implementation (Factory.py)
  - WebSocket server

## Project Structure

```
Thryve2/
├── Backend/                # Backend service
│   ├── app.py             # Main application server
│   └── workflows/         # Workflow-related modules
│       ├── Engine.py      # Workflow execution engine
│       ├── Factory.py     # Node factory
│       ├── events/        # Event handling
│       └── nodes/         # Node type definitions
│
├── Fronted1/              # Frontend application
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   ├── context/      # React Context
│   │   ├── nodes/        # Node implementations
│   │   ├── plugins/      # Plugin system
│   │   └── services/     # Service layer
│   └── electron/         # Electron related
```

## Quick Start

### Requirements

- Node.js >= 14
- Python >= 3.8
- npm or yarn

### Installation

1. Clone repository
```bash
git clone https://github.com/your-username/Thryve2.git
cd Thryve2
```

2. Install frontend dependencies
```bash
cd Fronted1
npm install
```

3. Install backend dependencies
```bash
cd ../Backend
pip install -r requirements.txt
```

### Development Environment Setup

1. Start backend service
```bash
cd Backend
python app.py
```

2. Start frontend development server
```bash
cd Fronted1
npm run dev          # Web version
# or
npm run electron:dev # Desktop version
```

### Production Build

```bash
cd Fronted1
npm run electron:build
```

The generated installation package will be located in the `Fronted1/release` directory.

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.