# Thryve - Visual Workflow Editor for Intelligent File Processing

English | [简体中文](README-ZH.md)

[![Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/your-username/Thryve2)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()
[![Contributors](https://img.shields.io/badge/contributors-5-orange.svg)]()
[![Made with React](https://img.shields.io/badge/React-18-%2361DAFB.svg?logo=react)](https://reactjs.org/)

Thryve is a powerful visual workflow editor designed specifically for intelligent file processing and automation. Through its intuitive node-based programming interface, users can easily create complex file processing workflows, such as batch file operations, format conversions, content analysis, and automated document processing. The project adopts a front-end and back-end separated architecture, providing a robust workflow execution engine with real-time processing feedback.

## Features

### 📂 **Intelligent File Processing System**
- **Batch Operations**: Process hundreds of files simultaneously with progress tracking and error handling
- **Universal Format Support**: Native support for PDF, DOC/DOCX, Markdown, CSV, JSON, TXT, and image formats
- **Smart Content Extraction**: Automatic text extraction, metadata parsing, and content structure analysis
- **Document Intelligence**: OCR capabilities, table recognition, and automated document classification
- **Format Conversion**: Seamless conversion between different file formats with preservation of structure
- **Content Analysis**: Text analysis, keyword extraction, sentiment analysis, and content summarization

### 🎨 **Visual Workflow Designer**
- **Drag-and-Drop Interface**: Intuitive node-based editor with snap-to-grid and auto-alignment
- **Smart Connection System**: Intelligent port detection and type-safe connections between nodes
- **Canvas Navigation**: Zoom, pan, and mini-map for large workflow visualization
- **Visual Feedback**: Real-time node status indicators, progress bars, and execution highlights
- **Customizable Layout**: Flexible node positioning with automatic layout suggestions
- **Export Capabilities**: Export workflows as images or printable diagrams

### 🔌 **Comprehensive Node Library**
- **Control Flow Nodes**: Start, End, Condition (with multiple output branches), Loop (for/while iterations)
- **Data Processing Nodes**: Variable assignment, data transformation, filtering, and sorting
- **File Operation Nodes**: File input/output, folder scanning, file copying, and batch processing
- **Text Processing Nodes**: String manipulation, regex operations, text formatting, and encoding conversion
- **Logic Nodes**: Mathematical operations, boolean logic, comparison operators, and conditional statements
- **Integration Nodes**: API calls, database connections, email sending, and webhook triggers

### 📝 **Real-time Execution Engine**
- **Live Status Updates**: Real-time node execution status with color-coded indicators (processing, success, error)
- **Progress Tracking**: Detailed progress bars for long-running operations with time estimates
- **Output Monitoring**: Live output streaming with syntax highlighting for different data types
- **Error Reporting**: Comprehensive error messages with stack traces and suggested solutions
- **Performance Metrics**: Execution time tracking, memory usage monitoring, and throughput statistics
- **Execution History**: Complete log of all workflow runs with searchable history

### 🔄 **Advanced Control Flow**
- **Conditional Branching**: Multiple output paths based on dynamic conditions with custom expressions
- **Loop Controls**: Support for nested loops, break/continue statements, and iteration variables
- **Parallel Execution**: Concurrent node execution with synchronization points and race condition handling
- **Error Handling**: Try-catch blocks, retry mechanisms, and graceful error recovery
- **Flow Control**: Jump to specific nodes, skip operations, and dynamic workflow routing
- **State Management**: Persistent state across workflow executions with variable scoping

### 💾 **Workflow Management**
- **Project Organization**: Hierarchical project structure with folders, tags, and search functionality
- **Version Control**: Built-in versioning system with diff visualization and rollback capabilities
- **Import/Export**: JSON-based workflow format with backward compatibility and migration tools
- **Template System**: Pre-built workflow templates for common use cases and industry standards
- **Sharing & Collaboration**: Export workflows for sharing with team members and community
- **Backup & Recovery**: Automatic backups with cloud sync and disaster recovery options

### 🖥️ **Cross-Platform Desktop Application**
- **Native Performance**: Electron-based desktop app with native OS integration
- **Multi-Monitor Support**: Drag workflows across multiple screens with independent zoom levels
- **Keyboard Shortcuts**: Comprehensive hotkey system for power users and accessibility
- **System Integration**: File association, system tray operation, and OS notification support
- **Offline Capability**: Full functionality without internet connection for sensitive workflows
- **Performance Optimization**: Hardware acceleration and memory management for large workflows

### 🌐 **Real-time Communication**
- **WebSocket Integration**: Bi-directional real-time communication between frontend and backend
- **Live Collaboration**: Multiple users can view workflow execution simultaneously
- **Remote Monitoring**: Monitor workflow execution from multiple devices and locations
- **Event Broadcasting**: Real-time notifications for workflow events and system status
- **Secure Communication**: Encrypted WebSocket connections with authentication and authorization
- **Connection Management**: Automatic reconnection and graceful degradation on network issues

### 🔍 **Integrated Testing & Validation**
- **Test Mode**: Dry-run execution without making actual changes to files or systems
- **Input Validation**: Pre-execution validation of node configurations and data types
- **Unit Testing**: Individual node testing with mock data and expected output verification
- **Integration Testing**: End-to-end workflow testing with real data and external dependencies
- **Performance Testing**: Load testing with large datasets and performance benchmarking
- **Regression Testing**: Automated testing of workflow changes against previous versions

### 🚀 **Advanced Workflow Features**
- **Function Calls**: Modular sub-workflow execution with parameter passing and return value handling
- **Memory Management**: Intelligent memory optimization with automatic cleanup and leak detection
- **Breakpoint Debugging**: Advanced debugging with conditional breakpoints, step execution, and variable inspection
- **AI Agent Integration**: Intelligent workflow automation with LLM-powered decision making and natural language processing

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

### Function Call System

Advanced sub-workflow execution with modular design:

- 🔄 **Modular Sub-workflows**:
  - Call Node: Execute sub-workflows as functions with parameter passing
  - Return value handling and data flow management
  - Stack-based execution context management

- 🔗 **Workflow Composition**:
  - Hierarchical workflow structures
  - Reusable workflow components
  - Dynamic workflow invocation with runtime parameters

- 📊 **Execution Management**:
  - Multi-workflow execution engine
  - Concurrent workflow processing
  - Advanced call stack management and debugging

### Memory Management System

Intelligent memory optimization for large-scale workflows:

- 🧠 **Automatic Memory Cleanup**:
  - Sub-workflow memory isolation and cleanup
  - Node instance lifecycle management
  - Garbage collection for completed workflows

- 📈 **Memory Monitoring**:
  - Real-time memory usage tracking
  - Memory consumption analysis per workflow
  - Memory leak detection and prevention

- ⚡ **Performance Optimization**:
  - Lazy node instantiation
  - Memory-efficient data structures
  - Automatic resource deallocation

### Advanced Debugging System

Professional debugging capabilities for complex workflows:

- 🔍 **Breakpoint System**:
  - Conditional breakpoints with custom expressions
  - Node-specific breakpoint management
  - Step-by-step execution control

- 🎯 **Debug Controls**:
  - Pause/Resume execution
  - Step Over functionality
  - Real-time variable inspection

- 📊 **Execution Analysis**:
  - Node execution timing
  - Data flow visualization
  - Error trace and stack analysis

### AI-Enhanced Workflow System

Advanced AI capabilities integrated for workflow intelligence:

- 🤖 **Dual-mode AI Assistant**:
  - Agent Auto-operation Mode: AI automated workflow execution
  - Ask Interactive Mode: Natural language interaction with AI assistant

- 🧠 **Intelligent Node Types**:
  - LLM Node: Large Language Model integration with OpenAI API
  - Document Analysis Node: Automated document understanding and processing
  - Text Processor Node: Advanced text processing with AI capabilities

- 📊 **Document Intelligence**:
  - Automatic document analysis and structuring
  - Intelligent information extraction from PDFs, Word docs, and more
  - Text summarization and key point extraction

- 🔄 **Intelligent Workflow Optimization**:
  - Automatic process optimization suggestions
  - Intelligent error diagnosis and recovery
  - Performance bottleneck detection and reporting

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
  - Workflow execution engine (Engine.py) with debugging support
  - Multi-workflow manager (WorkflowManager.py) with function call system
  - Event bus system (EventBus.py) for loose coupling
  - Node factory pattern implementation (Factory.py)
  - WebSocket server with real-time communication
  - Memory management system with automatic cleanup
  - Advanced debugging engine with breakpoint support

## Project Structure

```
Thryve2/
├── Backend/                # Backend service
│   ├── app.py             # Main application server
│   └── workflows/         # Workflow-related modules
│       ├── Engine.py      # Workflow execution engine with debugging
│       ├── WorkflowManager.py # Multi-workflow manager
│       ├── Factory.py     # Node factory
│       ├── events/        # Event handling
│       │   └── EventBus.py # Event bus implementation
│       └── nodes/         # Node type definitions
│           ├── CallNode.py     # Function call node
│           ├── LLM.py          # AI LLM integration
│           ├── TextProcessor.py # Text processing
│           ├── PdfProcessor.py # PDF processing
│           └── [+20 more nodes]
│
├── Fronted1/              # Frontend application
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   │   ├── BreakpointToggle/ # Debugging controls
│   │   │   ├── sidebar-left/    # AI Assistant panel
│   │   │   └── testrun/         # Test execution
│   │   ├── context/      # React Context
│   │   │   ├── BreakpointProvider.tsx # Debug context
│   │   │   └── ChatProvider.tsx      # AI chat context
│   │   ├── nodes/        # Node implementations
│   │   ├── plugins/      # Plugin system
│   │   │   ├── runtime-plugin/    # Runtime integration
│   │   │   └── sync-variable-plugin/ # Variable sync
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
git clone https://github.com/bjhh2005/Thryve2.git
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

## Key Feature Examples

### Using Function Calls

Create modular workflows by using the Call Node to execute sub-workflows:

```javascript
// Main workflow calls a sub-workflow for file processing
{
  "type": "call",
  "subworkflow_id": "file_processor",
  "input_parameters": {
    "file_path": "documents/input.pdf",
    "output_format": "markdown"
  }
}
```

### Setting Up Debugging

Enable breakpoints and step-through debugging:

1. Click the breakpoint toggle on any node
2. Use the debug panel to control execution
3. Monitor variable values in real-time
4. Step through workflow execution node by node

### AI Integration

Leverage AI capabilities in your workflows:

```javascript
// LLM Node for text processing
{
  "type": "llm",
  "model": "gpt-3.5-turbo",
  "prompt": "Summarize the following document: {input_text}",
  "max_tokens": 150
}
```

### Memory Management

Monitor and optimize workflow memory usage:

- Check memory usage in the console panel
- Automatic cleanup of completed sub-workflows
- Memory leak detection and warnings

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.