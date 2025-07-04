
class EventBus:

    def __init__(self):
        self.listeners = {}

    def on(self, eventName, callback):
        if eventName not in self.listeners:
            self.listeners[eventName] = []
        self.listeners[eventName].append(callback)

    def emit(self, eventName, *args, **kwargs):
        if eventName not in self.listeners:
            return None
        
        results = []
        for callback in self.listeners[eventName]:
            try:
                result = callback(*args, **kwargs)
                results.append(result)
            except Exception as e:
                # 记录错误但继续执行其他监听器
                import logging
                logging.error(f"EventBus事件 {eventName} 的监听器执行失败: {e}")
        
        # 如果只有一个结果，直接返回；否则返回列表
        if len(results) == 1:
            return results[0]
        elif len(results) > 1:
            return results
        else:
            return None
    