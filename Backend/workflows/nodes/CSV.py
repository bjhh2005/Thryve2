import pandas as pd
from typing import Dict, Any, List, Optional
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

class CSVProcessor(Node):
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
        super().__init__(id, type, nextNodes, eventBus)
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
                    param_name = content[1]
                    result = self._eventBus.emit("askMessage", node_id, param_name)
                    self._eventBus.emit("message", "info", self._id, f"获取引用值 {node_id}.{param_name} = {result}")
                    return result
            elif value.get("type") == "constant":
                return str(value.get("content", ""))
        return str(value) if value is not None else ""

    def read_csv(self) -> Dict[str, Any]:
        """读取CSV文件"""
        try:
            # 获取并记录输入参数
            input_file = self._get_input_value(self.inputs.get("inputFile"))
            self._eventBus.emit("message", "info", self._id, f"准备读取文件: {input_file}")
            
            delimiter = self.inputs.get("delimiter", ",")
            encoding = self.inputs.get("encoding", "UTF-8")
            has_header = self._get_input_value(self.inputs.get("hasHeader", True))

            if not input_file:
                raise CSVProcessError("未指定输入文件")

            # 读取CSV文件
            self._eventBus.emit("message", "info", self._id, f"开始读取CSV文件，使用分隔符: {delimiter}, 编码: {encoding}, 包含表头: {has_header}")
            df = pd.read_csv(
                input_file,
                delimiter=delimiter,
                encoding=encoding,
                header=0 if has_header else None
            )

            # 准备输出数据
            data = df.values.tolist()
            column_names = df.columns.tolist() if has_header else [f"Column{i}" for i in range(len(df.columns))]
            
            self._eventBus.emit("message", "info", self._id, f"成功读取CSV文件，共{len(data)}行，{len(column_names)}列")

            return {
                "data": data,
                "columnNames": column_names
            }
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"读取CSV文件失败: {str(e)}")
            raise CSVProcessError(f"读取CSV文件失败: {str(e)}")

    def write_csv(self) -> Dict[str, Any]:
        """写入CSV文件"""
        try:
            # 获取并记录输入参数
            input_file = self._get_input_value(self.inputs.get("inputFile"))
            self._eventBus.emit("message", "info", self._id, f"准备读取源文件: {input_file}")
            
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            output_file = generate_output_path(output_folder, output_name)
            
            self._eventBus.emit("message", "info", self._id, f"准备写入目标文件: {output_file}")
            
            delimiter = self.inputs.get("delimiter", ",")
            include_header = self._get_input_value(self.inputs.get("includeHeader", True))

            if not input_file or not output_folder or not output_name:
                raise CSVProcessError("未指定输入文件或输出路径")

            # 确保输出目录存在
            os.makedirs(output_folder, exist_ok=True)

            # 读取输入文件
            self._eventBus.emit("message", "info", self._id, f"开始读取源CSV文件")
            df = pd.read_csv(input_file)
            
            # 写入输出文件
            self._eventBus.emit("message", "info", self._id, f"开始写入CSV文件，使用分隔符: {delimiter}, 包含表头: {include_header}")
            df.to_csv(
                output_file,
                sep=delimiter,
                index=False,
                header=include_header
            )
            
            self._eventBus.emit("message", "info", self._id, f"成功写入CSV文件: {output_file}")

            return {
                "success": True,
                "filePath": output_file
            }
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"写入CSV文件失败: {str(e)}")
            raise CSVProcessError(f"写入CSV文件失败: {str(e)}")

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
            self._eventBus.emit("message", "info", self._id, f"准备读取文件: {input_file}")
            
            column = self.inputs.get("column")
            ascending = self._get_input_value(self.inputs.get("ascending", True))
            
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            output_file = generate_output_path(output_folder, output_name)
            
            self._eventBus.emit("message", "info", self._id, f"排序参数: 列名={column}, 升序={ascending}")

            if not all([input_file, column, output_folder, output_name]):
                raise CSVProcessError("排序参数不完整")

            # 确保输出目录存在
            os.makedirs(output_folder, exist_ok=True)

            # 读取CSV文件
            self._eventBus.emit("message", "info", self._id, "开始读取CSV文件")
            df = pd.read_csv(input_file)
            
            # 验证列名是否存在
            if column not in df.columns:
                raise CSVProcessError(f"列名 '{column}' 不存在")
            
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
                case "read":
                    result = self.read_csv()
                case "write":
                    result = self.write_csv()
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
            
            # 将结果转换为字符串
            result_str = json.dumps(result, ensure_ascii=False)
            
            # 发送处理结果
            self._eventBus.emit("nodes_output", self._id, result_str)
            
            # 更新下一个节点
            self.updateNext()
            return True

        except CSVProcessError as e:
            self._eventBus.emit("message", "error", self._id, str(e))
            raise Exception(f"CSV处理节点 {self._id} 执行错误: {str(e)}", 1)

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            self._eventBus.emit("message", "warning", self._id, "No next node")
            return
        self._next = self._nextNodes[0][1]
