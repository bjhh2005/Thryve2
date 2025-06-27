## 带解决列表

- 前后端的命名规范
- 后端节点测试
- 后端but监视规则命名规范

```python

    # 这里的所有的message的传递应该都是str类型的
    engine.bus.on('workflow', lambda nodeId:socketio.emit('workflow', {"nodeId" : nodeId}, namespace='/workflow'))

    # 选择从 info , warning , error
    engine.bus.on('message', lambda event,nodeId,message:socketio.emit(event, {"data":nodeId, "message" : message},namespace='/workflow'))

    engine.bus.on("nodes_output", lambda nodeId, message: socketio.emit('nodes_output', {"data":nodeId, "message" : message} , namespace='/workflow'))
    
    
        def run(self):
        print(self._nextNodes)
        self._eventBus.emit("workflow", self._id)
        self._eventBus.emit("message","info", self._id+":Executing")
        self.updateNext()
        self._eventBus.emit("message","info", self._id+":Executed")


```



- 节点run返回值设计

```python
    def run(self):
        """
        执行条件节点
        根据条件判断结果选择执行分支
        """
        # print(f"执行条件节点: {self._id}")
        self._eventBus.emit("workflow", self._id)
        # 遍历所有条件分支
        for branch_key, condition in self.conditions.items():
            # 如果条件满足，选择该分支
            if self._evaluate_condition(condition):
                self.current_branch = branch_key
                print(f"条件分支 {branch_key} 满足条件")
                break
        
        # 更新下一个节点
        self.updateNext()
        return True
```



- 乱七八糟的调试代码删除

```python

    logger.info("开始执行工作流任务")
    
    # 创建工作流引擎
    engine = WorkflowEngine(workflow_data)  
    engineConnect(engine)

    # 运行工作流（这里需要修改你的Engine类来支持回调）
    engine.run()

```

- 后端报错代码的设计

    目前一报错整个后端就死掉了, 这是不合理的

    