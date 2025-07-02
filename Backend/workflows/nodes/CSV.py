import pandas as pd
from typing import Dict, Any, List, Optional
from .MessageNode import MessageNode
from .Node import Node
import json
import os

class CSVProcessError(Exception):
    """CSV处理错误"""
    pass

def generate_output_path(output_folder: str, output_name: str) -> str:
    """生成输出文件路径"""
    if not output_name.endswith('.csv'):
        output_name += '.csv'
    return os.path.join(output_folder, output_name)

class CSVProcessor(MessageNode):
    def __init__(self, id: str, type: str, nextNodes: list, eventBus: Any, data: Dict[str, Any]):
        """
        初始化CSV处理节点
        
        Args:
            id: 节点ID
            type: 节点类型
            nextNodes: 下一个节点列表
            eventBus: 事件总线
            data: 节点数据
        """
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.mode = data.get("mode", "")
        self.inputs = data.get("inputsValues", {})
        self.MessageList = {}

    def _get_input_value(self, value):
        """获取输入值，处理引用类型"""
        if isinstance(value, dict):
            if value.get("type") == "ref":
                content = value.get("content", [])
                if len(content) >= 2:
                    node_id = content[0]
                    if node_id.endswith("_locals"):
                        node_id = node_id[:-7]
                    param_name = content[1]
                    result = self._eventBus.emit("askMessage", node_id, param_name)
                    self._eventBus.emit("message", "info", self._id, f"获取引用值 {node_id}.{param_name} = {result}")
                    return result
            elif value.get("type") == "constant":
                return str(value.get("content", ""))
        return str(value) if value is not None else ""

    def filter_csv(self) -> Dict[str, Any]:
        """过滤CSV数据"""
        try:
            # 获取并记录输入参数
            input_file = self._get_input_value(self.inputs.get("inputFile"))
            self._eventBus.emit("message", "info", self._id, f"准备读取文件: {input_file}")
            
            column = self.inputs.get("column")
            condition = self.inputs.get("condition")
            value = self._get_input_value(self.inputs.get("value"))
            
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            output_file = generate_output_path(output_folder, output_name)
            
            self._eventBus.emit("message", "info", self._id, f"过滤条件: {column} {condition} {value}")

            if not all([input_file, column, condition, value, output_folder, output_name]):
                raise CSVProcessError("过滤参数不完整")

            # 确保输出目录存在
            os.makedirs(output_folder, exist_ok=True)

            # 读取CSV文件
            self._eventBus.emit("message", "info", self._id, "开始读取CSV文件")
            df = pd.read_csv(input_file)

            # 验证列名是否存在
            if column not in df.columns:
                raise CSVProcessError(f"列名 '{column}' 不存在")

            # 根据条件过滤
            try:
                if condition == "equals":
                    filtered_df = df[df[column] == value]
                elif condition == "contains":
                    filtered_df = df[df[column].astype(str).str.contains(str(value))]
                elif condition == "greater than":
                    filtered_df = df[df[column] > float(str(value))]
                elif condition == "less than":
                    filtered_df = df[df[column] < float(str(value))]
                else:
                    raise CSVProcessError(f"不支持的过滤条件: {condition}")
            except (ValueError, TypeError) as e:
                raise CSVProcessError(f"值类型转换失败: {str(e)}")
                
            self._eventBus.emit("message", "info", self._id, f"过滤完成，结果包含 {len(filtered_df)} 行数据")

            # 保存过滤后的数据
            filtered_df.to_csv(output_file, index=False)
            self._eventBus.emit("message", "info", self._id, f"已保存过滤后的数据到: {output_file}")

            return {
                "filteredData": filtered_df.values.tolist(),
                "rowCount": len(filtered_df),
                "filePath": output_file
            }
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"过滤CSV数据失败: {str(e)}")
            raise CSVProcessError(f"过滤CSV数据失败: {str(e)}")

    def sort_csv(self) -> Dict[str, Any]:
        """排序CSV数据"""
        try:
            # 获取并记录输入参数
            input_file = self._get_input_value(self.inputs.get("inputFile"))
            if not input_file:
                raise CSVProcessError("输入文件路径为空")
            self._eventBus.emit("message", "info", self._id, f"准备读取文件: {input_file}")
            
            # 检查文件是否存在
            if not os.path.exists(input_file):
                raise CSVProcessError(f"输入文件不存在: {input_file}")
            
            column = self._get_input_value(self.inputs.get("column"))
            if not column:
                raise CSVProcessError("排序列名为空")
            
            # 处理ascending参数，如果未设置则默认为false
            ascending_input = self.inputs.get("ascending")
            if ascending_input is None:
                ascending = False
                self._eventBus.emit("message", "info", self._id, "未设置排序方向，默认使用降序(ascending=false)")
            else:
                ascending_value = self._get_input_value(ascending_input)
                ascending = ascending_value.lower() == "true" if isinstance(ascending_value, str) else bool(ascending_value)
            
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            
            if not output_folder or not output_name:
                raise CSVProcessError("输出路径参数不完整")
            
            output_file = generate_output_path(output_folder, output_name)
            
            self._eventBus.emit("message", "info", self._id, f"排序参数: 列名={column}, 升序={ascending}")

            # 确保输出目录存在
            os.makedirs(output_folder, exist_ok=True)

            # 读取CSV文件
            self._eventBus.emit("message", "info", self._id, "开始读取CSV文件")
            try:
                df = pd.read_csv(input_file)
            except Exception as e:
                raise CSVProcessError(f"读取CSV文件失败: {str(e)}")
            
            # 验证列名是否存在
            if column not in df.columns:
                raise CSVProcessError(f"列名 '{column}' 不存在，可用的列名有: {', '.join(df.columns)}")
            
            # 排序
            try:
                sorted_df = df.sort_values(by=column, ascending=ascending)
                self._eventBus.emit("message", "info", self._id, "排序完成")
                
                # 保存排序后的数据
                sorted_df.to_csv(output_file, index=False)
                self._eventBus.emit("message", "info", self._id, f"已保存排序后的数据到: {output_file}")
            except Exception as e:
                raise CSVProcessError(f"排序失败: {str(e)}")

            return {
                "sortedData": sorted_df.values.tolist(),
                "filePath": output_file
            }
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"排序CSV数据失败: {str(e)}")
            raise CSVProcessError(f"排序CSV数据失败: {str(e)}")

    def aggregate_csv(self) -> Dict[str, Any]:
        """聚合CSV数据"""
        try:
            # 获取并记录输入参数
            input_file = self._get_input_value(self.inputs.get("inputFile"))
            self._eventBus.emit("message", "info", self._id, f"准备读取文件: {input_file}")
            
            group_by = self.inputs.get("groupBy")
            operation = self.inputs.get("operation")
            target_column = self.inputs.get("targetColumn")
            
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            output_file = generate_output_path(output_folder, output_name)
            
            self._eventBus.emit("message", "info", self._id, f"聚合参数: 分组列={group_by}, 操作={operation}, 目标列={target_column}")

            if not all([input_file, group_by, operation, target_column, output_folder, output_name]):
                raise CSVProcessError("聚合参数不完整")

            # 确保输出目录存在
            os.makedirs(output_folder, exist_ok=True)

            # 读取CSV文件
            self._eventBus.emit("message", "info", self._id, "开始读取CSV文件")
            df = pd.read_csv(input_file)
            
            # 验证列名是否存在
            if group_by not in df.columns:
                raise CSVProcessError(f"分组列名 '{group_by}' 不存在")
            if target_column not in df.columns:
                raise CSVProcessError(f"目标列名 '{target_column}' 不存在")

            # 执行聚合操作
            try:
                grouped = df.groupby(group_by)
                
                if operation == "sum":
                    result = grouped[target_column].sum()
                elif operation == "average":
                    result = grouped[target_column].mean()
                elif operation == "count":
                    result = grouped[target_column].count()
                else:
                    raise CSVProcessError(f"不支持的聚合操作: {operation}")
                    
                self._eventBus.emit("message", "info", self._id, f"聚合完成，共 {len(result)} 个分组")
                
                # 将结果转换为DataFrame并保存
                result_df = result.reset_index()
                result_df.columns = [group_by, f"{operation}_{target_column}"]
                result_df.to_csv(output_file, index=False)
                self._eventBus.emit("message", "info", self._id, f"已保存聚合结果到: {output_file}")
                
            except Exception as e:
                raise CSVProcessError(f"聚合操作失败: {str(e)}")

            return {
                "result": result.to_dict(),
                "filePath": output_file
            }
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"聚合CSV数据失败: {str(e)}")
            raise CSVProcessError(f"聚合CSV数据失败: {str(e)}")

    def run(self):
        """
        执行CSV处理节点
        """
        try:
            # 根据模式执行相应操作
            result = None
            match self.mode:
                case "filter":
                    result = self.filter_csv()
                case "sort":
                    result = self.sort_csv()
                case "aggregate":
                    result = self.aggregate_csv()
                case _:
                    raise CSVProcessError(f"不支持的操作模式: {self.mode}")

            # 更新MessageList
            self.MessageList.update(result)
            
            # 如果生成了文件，确保文件路径被单独存储
            if "filePath" in result:
                self.MessageList["outputFile"] = result["filePath"]
            
            # 将结果转换为字符串
            result_str = json.dumps(result, ensure_ascii=False)
            
            # 发送处理结果
            self._eventBus.emit("nodes_output", self._id, result_str)
            
            # 更新下一个节点
            self.updateNext()
            return self.MessageList

        except CSVProcessError as e:
            self._eventBus.emit("message", "error", self._id, str(e))
            raise Exception(f"CSV处理节点 {self._id} 执行错误: {str(e)}", 1)

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            self._eventBus.emit("message", "warning", self._id, "No next node")
            return
        self._next = self._nextNodes[0][1]
