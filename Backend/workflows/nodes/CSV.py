import csv
from typing import Dict, Any, List, Optional
from .MessageNode import MessageNode
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

def read_csv_file(file_path: str) -> List[Dict[str, str]]:
    """读取CSV文件并返回字典列表"""
    try:
        with open(file_path, 'r', encoding='utf-8', newline='') as f:
            reader = csv.DictReader(f)
            return list(reader)
    except Exception as e:
        raise CSVProcessError(f"读取CSV文件失败: {str(e)}")

def write_csv_file(file_path: str, data: List[Dict[str, str]], fieldnames: List[str]) -> None:
    """将数据写入CSV文件"""
    try:
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
    except Exception as e:
        raise CSVProcessError(f"写入CSV文件失败: {str(e)}")

def convert_value(value: str, column: str) -> Any:
    """尝试将字符串值转换为数值类型"""
    try:
        # 尝试转换为整数
        if value.isdigit():
            return int(value)
        # 尝试转换为浮点数
        return float(value)
    except ValueError:
        # 如果转换失败，返回原始字符串
        return value

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
            data = read_csv_file(input_file)
            
            # 验证列名是否存在
            if not data:
                raise CSVProcessError("CSV文件为空")
            
            if column not in data[0].keys():
                raise CSVProcessError(f"列名 '{column}' 不存在，可用的列名有: {', '.join(data[0].keys())}")
            
            # 排序
            try:
                # 转换值类型并排序
                sorted_data = sorted(data, 
                                  key=lambda x: convert_value(x[column], column),
                                  reverse=not ascending)
                
                self._eventBus.emit("message", "info", self._id, "排序完成")
                
                # 保存排序后的数据
                write_csv_file(output_file, sorted_data, list(data[0].keys()))
                self._eventBus.emit("message", "info", self._id, f"已保存排序后的数据到: {output_file}")
            except Exception as e:
                raise CSVProcessError(f"排序失败: {str(e)}")

            return {
                "sortedData": sorted_data,
                "filePath": output_file
            }
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"排序CSV数据失败: {str(e)}")
            raise CSVProcessError(f"排序CSV数据失败: {str(e)}")

    def filter_csv(self) -> Dict[str, Any]:
        """过滤CSV数据"""
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
                raise CSVProcessError("过滤列名为空")
            
            condition = self._get_input_value(self.inputs.get("condition"))
            if not condition:
                raise CSVProcessError("过滤条件为空")
            
            value = self._get_input_value(self.inputs.get("value"))
            if value is None:
                raise CSVProcessError("过滤值为空")
            
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            
            if not output_folder or not output_name:
                raise CSVProcessError("输出路径参数不完整")
            
            output_file = generate_output_path(output_folder, output_name)
            
            self._eventBus.emit("message", "info", self._id, f"过滤条件: {column} {condition} {value}")

            # 确保输出目录存在
            os.makedirs(output_folder, exist_ok=True)

            # 读取CSV文件
            self._eventBus.emit("message", "info", self._id, "开始读取CSV文件")
            data = read_csv_file(input_file)
            
            # 验证列名是否存在
            if not data:
                raise CSVProcessError("CSV文件为空")
            
            if column not in data[0].keys():
                raise CSVProcessError(f"列名 '{column}' 不存在，可用的列名有: {', '.join(data[0].keys())}")
            
            # 过滤数据
            try:
                filtered_data = []
                for row in data:
                    row_value = convert_value(row[column], column)
                    filter_value = convert_value(value, column)
                    
                    if condition == "equals":
                        if row_value == filter_value:
                            filtered_data.append(row)
                    elif condition == "contains":
                        if str(row_value).find(str(filter_value)) != -1:
                            filtered_data.append(row)
                    elif condition == "greater than":
                        if isinstance(row_value, (int, float)) and row_value > filter_value:
                            filtered_data.append(row)
                    elif condition == "less than":
                        if isinstance(row_value, (int, float)) and row_value < filter_value:
                            filtered_data.append(row)
                    else:
                        raise CSVProcessError(f"不支持的过滤条件: {condition}")
                
                self._eventBus.emit("message", "info", self._id, f"过滤完成，结果包含 {len(filtered_data)} 行数据")
                
                # 保存过滤后的数据
                write_csv_file(output_file, filtered_data, list(data[0].keys()))
                self._eventBus.emit("message", "info", self._id, f"已保存过滤后的数据到: {output_file}")
            except Exception as e:
                raise CSVProcessError(f"过滤失败: {str(e)}")

            return {
                "filteredData": filtered_data,
                "rowCount": len(filtered_data),
                "filePath": output_file
            }
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"过滤CSV数据失败: {str(e)}")
            raise CSVProcessError(f"过滤CSV数据失败: {str(e)}")

    def aggregate_csv(self) -> Dict[str, Any]:
        """聚合CSV数据"""
        try:
            # 获取并记录输入参数
            input_file = self._get_input_value(self.inputs.get("inputFile"))
            if not input_file:
                raise CSVProcessError("输入文件路径为空")
            self._eventBus.emit("message", "info", self._id, f"准备读取文件: {input_file}")
            
            # 检查文件是否存在
            if not os.path.exists(input_file):
                raise CSVProcessError(f"输入文件不存在: {input_file}")
            
            group_by = self._get_input_value(self.inputs.get("groupBy"))
            if not group_by:
                raise CSVProcessError("分组列名为空")
            
            operation = self._get_input_value(self.inputs.get("operation"))
            if not operation:
                raise CSVProcessError("聚合操作为空")
            
            target_column = self._get_input_value(self.inputs.get("targetColumn"))
            if not target_column:
                raise CSVProcessError("目标列名为空")
            
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            
            if not output_folder or not output_name:
                raise CSVProcessError("输出路径参数不完整")
            
            output_file = generate_output_path(output_folder, output_name)
            
            self._eventBus.emit("message", "info", self._id, 
                              f"聚合参数: 分组列={group_by}, 操作={operation}, 目标列={target_column}")

            # 确保输出目录存在
            os.makedirs(output_folder, exist_ok=True)

            # 读取CSV文件
            self._eventBus.emit("message", "info", self._id, "开始读取CSV文件")
            data = read_csv_file(input_file)
            
            # 验证列名是否存在
            if not data:
                raise CSVProcessError("CSV文件为空")
            
            if group_by not in data[0].keys():
                raise CSVProcessError(f"分组列名 '{group_by}' 不存在，可用的列名有: {', '.join(data[0].keys())}")
            
            if target_column not in data[0].keys():
                raise CSVProcessError(f"目标列名 '{target_column}' 不存在，可用的列名有: {', '.join(data[0].keys())}")
            
            # 执行聚合操作
            try:
                # 按分组列组织数据
                groups = {}
                for row in data:
                    group_value = row[group_by]
                    if group_value not in groups:
                        groups[group_value] = []
                    groups[group_value].append(convert_value(row[target_column], target_column))
                
                # 计算聚合结果
                result = []
                for group_value, values in groups.items():
                    if not all(isinstance(v, (int, float)) for v in values):
                        raise CSVProcessError(f"目标列 '{target_column}' 包含非数值数据，无法进行聚合操作")
                    
                    if operation == "sum":
                        agg_value = sum(values)
                    elif operation == "average":
                        agg_value = sum(values) / len(values)
                    elif operation == "count":
                        agg_value = len(values)
                    else:
                        raise CSVProcessError(f"不支持的聚合操作: {operation}")
                    
                    result.append({
                        group_by: group_value,
                        f"{operation}_{target_column}": agg_value
                    })
                
                self._eventBus.emit("message", "info", self._id, f"聚合完成，共 {len(result)} 个分组")
                
                # 保存聚合结果
                fieldnames = [group_by, f"{operation}_{target_column}"]
                write_csv_file(output_file, result, fieldnames)
                self._eventBus.emit("message", "info", self._id, f"已保存聚合结果到: {output_file}")
                
            except Exception as e:
                raise CSVProcessError(f"聚合操作失败: {str(e)}")

            return {
                "result": result,
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
