import json
from typing import Dict, Any, List, Optional
from .MessageNode import MessageNode
from .Node import Node
from jsonpath_ng import parse as parse_jsonpath
from jsonschema import validate as validate_schema, ValidationError
import os

class JSONProcessError(Exception):
    """JSON处理错误"""
    pass

def deep_merge(dict1: Dict, dict2: Dict) -> Dict:
    """深度合并两个字典"""
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

def generate_output_path(output_folder: str, output_name: str) -> str:
    """生成输出文件路径"""
    if not output_name.endswith('.json'):
        output_name += '.json'
    return os.path.join(output_folder, output_name)

def save_json_to_file(data: Any, file_path: str, indent: int = 2) -> None:
    """保存JSON数据到文件"""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)

class JSONProcessor(MessageNode):
    def __init__(self, id: str, type: str, nextNodes: list, eventBus: Any, data: Dict[str, Any]):
        """
        初始化JSON处理节点
        
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

    def query_json(self) -> Dict[str, Any]:
        """查询JSON数据"""
        try:
            # 获取输入参数
            input_data = self._get_input_value(self.inputs.get("inputData"))
            path = self._get_input_value(self.inputs.get("path"))
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            
            self._eventBus.emit("message", "info", self._id, f"准备查询JSON，路径: {path}")

            if not all([input_data, path]):
                raise JSONProcessError("查询参数不完整")

            # 如果输入是字符串，先解析为JSON对象
            if isinstance(input_data, str):
                try:
                    input_data = json.loads(input_data)
                except json.JSONDecodeError as e:
                    raise JSONProcessError(f"输入JSON解析失败: {str(e)}")

            # 执行JSONPath查询
            try:
                jsonpath_expr = parse_jsonpath(path)
                matches = [match.value for match in jsonpath_expr.find(input_data)]
                
                # 保存查询结果到文件
                if output_folder and output_name and matches:
                    output_file = generate_output_path(output_folder, output_name)
                    save_json_to_file(matches[0], output_file)
                    self._eventBus.emit("message", "info", self._id, f"已保存查询结果到: {output_file}")
                
                self._eventBus.emit("message", "info", self._id, f"查询完成，找到 {len(matches)} 个匹配")
                
                return {
                    "result": matches[0] if matches else None,
                    "found": bool(matches),
                    "filePath": output_file if output_folder and output_name and matches else None
                }
            except Exception as e:
                raise JSONProcessError(f"JSONPath查询失败: {str(e)}")

        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"JSON查询操作失败: {str(e)}")
            raise JSONProcessError(f"JSON查询操作失败: {str(e)}")

    def update_json(self) -> Dict[str, Any]:
        """更新JSON数据"""
        try:
            # 获取输入参数
            input_data = self._get_input_value(self.inputs.get("inputData"))
            path = self._get_input_value(self.inputs.get("path"))
            new_value = self._get_input_value(self.inputs.get("newValue"))
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            
            self._eventBus.emit("message", "info", self._id, f"准备更新JSON，路径: {path}")

            if not all([input_data, path, new_value is not None]):
                raise JSONProcessError("更新参数不完整")

            # 如果输入是字符串，先解析为JSON对象
            if isinstance(input_data, str):
                try:
                    input_data = json.loads(input_data)
                except json.JSONDecodeError as e:
                    raise JSONProcessError(f"输入JSON解析失败: {str(e)}")

            # 尝试解析new_value为JSON对象（如果是JSON字符串）
            if isinstance(new_value, str):
                try:
                    new_value = json.loads(new_value)
                except json.JSONDecodeError:
                    # 如果解析失败，保持原字符串值
                    pass

            # 执行更新
            try:
                jsonpath_expr = parse_jsonpath(path)
                matches = jsonpath_expr.find(input_data)
                
                if not matches:
                    raise JSONProcessError(f"路径 {path} 未找到匹配项")
                
                # 更新所有匹配项
                for match in matches:
                    match.value = new_value

                # 保存更新后的数据到文件
                if output_folder and output_name:
                    output_file = generate_output_path(output_folder, output_name)
                    save_json_to_file(input_data, output_file)
                    self._eventBus.emit("message", "info", self._id, f"已保存更新后的数据到: {output_file}")

                self._eventBus.emit("message", "info", self._id, "更新成功")
                
                return {
                    "result": input_data,
                    "success": True,
                    "filePath": output_file if output_folder and output_name else None
                }
            except Exception as e:
                raise JSONProcessError(f"JSON更新失败: {str(e)}")

        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"JSON更新操作失败: {str(e)}")
            raise JSONProcessError(f"JSON更新操作失败: {str(e)}")

    def validate_json(self) -> Dict[str, Any]:
        """验证JSON数据"""
        try:
            # 获取输入参数
            input_data = self._get_input_value(self.inputs.get("inputData"))
            schema = self._get_input_value(self.inputs.get("schema"))
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            
            self._eventBus.emit("message", "info", self._id, "准备验证JSON")

            if not all([input_data, schema]):
                raise JSONProcessError("验证参数不完整")

            # 如果输入是字符串，解析为JSON对象
            if isinstance(input_data, str):
                try:
                    input_data = json.loads(input_data)
                except json.JSONDecodeError as e:
                    raise JSONProcessError(f"输入JSON解析失败: {str(e)}")

            # 如果schema是字符串，解析为JSON对象
            if isinstance(schema, str):
                try:
                    schema = json.loads(schema)
                except json.JSONDecodeError as e:
                    raise JSONProcessError(f"Schema解析失败: {str(e)}")

            # 执行验证
            try:
                validate_schema(instance=input_data, schema=schema)
                result = {
                    "isValid": True,
                    "errors": []
                }
                self._eventBus.emit("message", "info", self._id, "验证成功")
            except ValidationError as e:
                result = {
                    "isValid": False,
                    "errors": [str(e)]
                }
                self._eventBus.emit("message", "warning", self._id, f"验证失败: {str(e)}")

            # 保存验证结果到文件
            if output_folder and output_name:
                output_file = generate_output_path(output_folder, output_name)
                save_json_to_file(result, output_file)
                self._eventBus.emit("message", "info", self._id, f"已保存验证结果到: {output_file}")
                result["filePath"] = output_file

            return result

        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"JSON验证操作失败: {str(e)}")
            raise JSONProcessError(f"JSON验证操作失败: {str(e)}")

    def merge_json(self) -> Dict[str, Any]:
        """合并JSON数据"""
        try:
            # 获取输入参数
            input_data = self._get_input_value(self.inputs.get("inputData"))
            source_data = self._get_input_value(self.inputs.get("sourceData"))
            
            # 处理deep参数，如果未设置则默认为false
            deep_input = self.inputs.get("deep")
            if deep_input is None:
                deep = False
                self._eventBus.emit("message", "info", self._id, "未设置合并方式，默认使用浅合并(deep=false)")
            else:
                deep_value = self._get_input_value(deep_input)
                deep = deep_value.lower() == "true" if isinstance(deep_value, str) else bool(deep_value)
            
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            
            self._eventBus.emit("message", "info", self._id, f"准备合并JSON，深度合并: {deep}")

            if not all([input_data, source_data]):
                raise JSONProcessError("合并参数不完整")

            # 如果输入是字符串，解析为JSON对象
            if isinstance(input_data, str):
                try:
                    input_data = json.loads(input_data)
                except json.JSONDecodeError as e:
                    raise JSONProcessError(f"基础JSON解析失败: {str(e)}")

            if isinstance(source_data, str):
                try:
                    source_data = json.loads(source_data)
                except json.JSONDecodeError as e:
                    raise JSONProcessError(f"源JSON解析失败: {str(e)}")

            # 执行合并
            try:
                if deep:
                    result = deep_merge(input_data, source_data)
                else:
                    result = {**input_data, **source_data}
                
                # 保存合并结果到文件
                if output_folder and output_name:
                    output_file = generate_output_path(output_folder, output_name)
                    save_json_to_file(result, output_file)
                    self._eventBus.emit("message", "info", self._id, f"已保存合并结果到: {output_file}")
                
                self._eventBus.emit("message", "info", self._id, "合并成功")
                return {
                    "result": result,
                    "filePath": output_file if output_folder and output_name else None
                }
            except Exception as e:
                raise JSONProcessError(f"JSON合并失败: {str(e)}")

        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"JSON合并操作失败: {str(e)}")
            raise JSONProcessError(f"JSON合并操作失败: {str(e)}")

    def diff_json(self) -> Dict[str, Any]:
        """比较JSON数据差异"""
        try:
            # 获取输入参数
            input_data = self._get_input_value(self.inputs.get("inputData"))
            compare_data = self._get_input_value(self.inputs.get("compareData"))
            output_folder = self._get_input_value(self.inputs.get("outputFolder"))
            output_name = self._get_input_value(self.inputs.get("outputName"))
            
            self._eventBus.emit("message", "info", self._id, "准备比较JSON差异")

            if not all([input_data, compare_data]):
                raise JSONProcessError("比较参数不完整")

            # 如果输入是字符串，解析为JSON对象
            if isinstance(input_data, str):
                try:
                    input_data = json.loads(input_data)
                except json.JSONDecodeError as e:
                    raise JSONProcessError(f"原始JSON解析失败: {str(e)}")

            if isinstance(compare_data, str):
                try:
                    compare_data = json.loads(compare_data)
                except json.JSONDecodeError as e:
                    raise JSONProcessError(f"比较JSON解析失败: {str(e)}")

            # 执行差异比较
            differences = []
            self._compare_objects("", input_data, compare_data, differences)
            
            are_equal = len(differences) == 0
            result = {
                "differences": differences,
                "areEqual": are_equal
            }
            
            # 保存比较结果到文件
            if output_folder and output_name:
                output_file = generate_output_path(output_folder, output_name)
                save_json_to_file(result, output_file)
                self._eventBus.emit("message", "info", self._id, f"已保存比较结果到: {output_file}")
                result["filePath"] = output_file
            
            self._eventBus.emit("message", "info", self._id, 
                              "比较完成，" + ("无差异" if are_equal else f"发现 {len(differences)} 处差异"))
            
            return result

        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"JSON比较操作失败: {str(e)}")
            raise JSONProcessError(f"JSON比较操作失败: {str(e)}")

    def _compare_objects(self, path: str, obj1: Any, obj2: Any, differences: List[Dict[str, Any]]):
        """递归比较两个对象的差异"""
        if isinstance(obj1, dict) and isinstance(obj2, dict):
            # 比较字典
            all_keys = set(obj1.keys()) | set(obj2.keys())
            for key in all_keys:
                new_path = f"{path}.{key}" if path else key
                if key not in obj1:
                    differences.append({
                        "path": new_path,
                        "type": "missing_in_first",
                        "value": obj2[key]
                    })
                elif key not in obj2:
                    differences.append({
                        "path": new_path,
                        "type": "missing_in_second",
                        "value": obj1[key]
                    })
                else:
                    self._compare_objects(new_path, obj1[key], obj2[key], differences)
        elif isinstance(obj1, list) and isinstance(obj2, list):
            # 比较列表
            for i in range(max(len(obj1), len(obj2))):
                new_path = f"{path}[{i}]"
                if i >= len(obj1):
                    differences.append({
                        "path": new_path,
                        "type": "missing_in_first",
                        "value": obj2[i]
                    })
                elif i >= len(obj2):
                    differences.append({
                        "path": new_path,
                        "type": "missing_in_second",
                        "value": obj1[i]
                    })
                else:
                    self._compare_objects(new_path, obj1[i], obj2[i], differences)
        elif obj1 != obj2:
            # 比较基本类型
            differences.append({
                "path": path,
                "type": "value_different",
                "first_value": obj1,
                "second_value": obj2
            })

    def run(self):
        """
        执行JSON处理节点
        """
        try:
            # 根据模式执行相应操作
            result = None
            match self.mode:
                case "query":
                    result = self.query_json()
                case "update":
                    result = self.update_json()
                case "validate":
                    result = self.validate_json()
                case "merge":
                    result = self.merge_json()
                case "diff":
                    result = self.diff_json()
                case _:
                    raise JSONProcessError(f"不支持的操作模式: {self.mode}")

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
            return True

        except JSONProcessError as e:
            self._eventBus.emit("message", "error", self._id, str(e))
            raise Exception(f"JSON处理节点 {self._id} 执行错误: {str(e)}", 1)

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            self._eventBus.emit("message", "warning", self._id, "No next node")
            return
        self._next = self._nextNodes[0][1]
