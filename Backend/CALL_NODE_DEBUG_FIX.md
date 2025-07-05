# Call节点调试功能修复说明

## 问题描述

当执行包含Call节点的多工作流时，在调试模式下存在以下问题：

1. **断点设置在子工作流中无效** - 用户在子工作流（如f1）的节点上设置断点，但工作流暂停在Call节点而不是子工作流的目标节点
2. **调试器重复执行Call节点** - 点击"运行下一个节点"时，工作流重复执行Call节点，而不是继续执行子工作流
3. **调试状态不正确** - 调试器显示暂停在Call节点，但实际上应该暂停在子工作流的断点节点

## 根本原因

在调试模式下，系统架构存在冲突：

- **主工作流**在 `WorkflowEngine` 中执行（支持断点调试）
- **Call节点调用的子工作流**需要通过 `WorkflowManager` 执行（原本不支持断点调试）
- **断点信息没有正确传递**给子工作流

## 修复方案

### 1. 修改 `app.py` 中的调试逻辑

**之前的实现**：
```python
# 只提取主工作流，使用WorkflowEngine
if isinstance(converted_data, dict) and "workflows" in converted_data:
    main_workflow_data = extract_main_workflow(converted_data)
    engine = WorkflowEngine(main_workflow_data, socketio, breakpoints)
```

**修复后的实现**：
```python
# 使用支持断点调试的WorkflowManager
if isinstance(converted_data, dict) and "workflows" in converted_data:
    manager = WorkflowManager(socketio)
    manager.breakpoints = set(breakpoints)
    manager.debug_mode = True
    manager.register_workflows(converted_data["workflows"])
    # 为每个工作流引擎设置断点
    for workflow_id, engine in manager.workflows.items():
        engine.breakpoints = set(breakpoints)
        engine.debug_mode = True
```

### 2. 增强 `WorkflowManager` 的调试支持

**添加的属性**：
```python
class WorkflowManager:
    def __init__(self, socketio_instance):
        # ... 其他属性
        self.breakpoints = set()  # 断点集合
        self.debug_mode = False   # 调试模式标志
```

**添加的调试方法**：
```python
def pause(self): """暂停当前工作流"""
def resume(self): """恢复当前工作流"""
def step_over(self): """单步执行当前工作流"""
def terminate(self): """终止当前工作流"""
```

### 3. 修改工作流注册逻辑

**关键修复**：在调试模式下，立即创建所有工作流引擎实例
```python
def register_workflows(self, workflows_data):
    # 注册工作流数据
    for workflow_id, data in workflows_data.items():
        # ... 注册逻辑
    
    # 在调试模式下，立即创建所有工作流引擎实例
    if self.debug_mode:
        for workflow_id in self.workflow_data.keys():
            self.workflows[workflow_id] = self.create_workflow_engine(workflow_id)
            # 设置断点和调试模式
            self.workflows[workflow_id].breakpoints = self.breakpoints
            self.workflows[workflow_id].debug_mode = True
```

### 4. 完善调试命令处理

**统一的调试接口**：
```python
@socketio.on('debug_command', namespace='/workflow')
def handle_debug_command(data):
    session = DEBUG_SESSIONS.get(run_id)
    if hasattr(session, 'pause') and hasattr(session, 'resume'):
        # 统一处理WorkflowEngine和WorkflowManager的调试命令
        if command == 'pause': session.pause()
        elif command == 'resume': session.resume()
        elif command == 'step_over': session.step_over()
        elif command == 'terminate': session.terminate()
```

## 修复效果

✅ **断点正确传递** - 断点信息正确传递给所有工作流（主工作流和子工作流）
✅ **调试状态正确** - 工作流在子工作流的断点节点正确暂停
✅ **调试命令正常** - 暂停/继续/单步执行/终止命令在多工作流环境中正常工作
✅ **向后兼容** - 单工作流的调试功能保持不变
✅ **架构统一** - 调试模式下的多工作流和单工作流使用统一的调试接口

## 测试验证

使用包含Call节点的多工作流JSON文件进行测试，验证：
- 子工作流中的断点能够正确触发
- 调试器正确暂停在子工作流的目标节点
- 调试命令（暂停/继续/单步）正常工作
- Call节点能够正确调用子工作流并传递数据

## 使用说明

1. **设置断点**：在任意工作流的节点上设置断点（包括子工作流）
2. **启动调试**：点击"Debug Run"按钮启动调试执行
3. **调试控制**：使用暂停/继续/单步/终止按钮控制执行流程
4. **查看状态**：在节点状态面板查看每个节点的执行结果

修复后的系统能够正确处理包含Call节点的多工作流调试场景。 