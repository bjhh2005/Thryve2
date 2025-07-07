import time
from .Node import Node
import logging

# 配置日志记录器
logger = logging.getLogger(__name__)

class SleepNodeError(Exception):
    """Sleep节点执行时的自定义异常"""
    pass

class Sleep(Node):
    def __init__(self, id, type, nextNodes, eventBus, data):
        """
        初始化Sleep节点
        :param id: 节点唯一标识符
        :param type: 节点类型
        :param nextNodes: 邻接节点信息
        :param eventBus: 事件总线
        :param data: 节点数据
        """
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.sleep_time_config = None
        
        if not isinstance(data, dict):
            raise SleepNodeError(f"节点 {id}: 数据格式错误", 8)
        
        if "inputsValues" in data and "sleepTime" in data["inputsValues"]:
            self.sleep_time_config = data["inputsValues"]["sleepTime"]
        else:
            self.sleep_time_config = {
                "type": "constant",
                "content": 10 
            }

    def run(self):
        """
        执行休眠操作
        根据 sleepTime 的值暂停执行，并更新节点状态
        """
        sleep_duration = 0
        try:
            if self.sleep_time_config["type"] == "constant":
                sleep_duration = self.sleep_time_config.get("content", 10)
            elif self.sleep_time_config["type"] == "ref":
                content = self.sleep_time_config.get("content")
                if not isinstance(content, list) or len(content) != 2:
                    raise SleepNodeError(f"节点 {self._id}: 引用值格式错误", 8)
                
                ref_node_id = content[0]
                if ref_node_id.endswith("_locals"):
                    ref_node_id = ref_node_id[:-7]
                ref_property = content[1]
                
                value = self._eventBus.emit("askMessage", ref_node_id, ref_property)
                if value is None:
                    raise SleepNodeError(f"节点 {self._id}: 无法获取引用节点 {ref_node_id} 的值", 8)
                sleep_duration = value
            
            try:
                sleep_duration = float(sleep_duration)
                if sleep_duration < 0:
                    raise ValueError("Sleep time cannot be negative.")
            except (ValueError, TypeError):
                raise SleepNodeError(f"节点 {self._id}: 'sleepTime' 必须是一个有效的数字，但收到了 '{sleep_duration}'", 8)

            self._eventBus.emit("message", "info", self._id, f"开始休眠 {sleep_duration} 秒...")
            logger.info(f"Node {self._id}: Sleeping for {sleep_duration} seconds.")
            time.sleep(sleep_duration)
            self._eventBus.emit("message", "info", self._id, "休眠结束。")
            logger.info(f"Node {self._id}: Sleep finished.")
            
            # [修正] 将输出从对象修改为字符串，以便React可以渲染
            self._eventBus.emit("nodes_output", self._id, str(sleep_duration))

        except Exception as e:
            logger.error(f"Node {self._id} run failed: {e}")
            self._eventBus.emit("message", "error", self._id, str(e))
            return False

        self.updateNext()
        return True

    def updateNext(self):
        """更新下一个要执行的节点"""
        if not self._nextNodes and not self._is_loop_internal:
            logger.warning(f"Node {self._id}: No next node configured.")
            return
        self._next = self._nextNodes[0][1]