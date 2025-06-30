from __future__ import annotations
from dotenv import load_dotenv
load_dotenv()

"""workflow_agent.py
最小可用 Demo：
输入自然语言 requirement → 生成 Flow 画布 JSON（nodes / edges）。
依赖：langgraph、langchain-openai、openai 等见 requirements.txt
"""

import time
import uuid
import json
import os
from typing import Dict, Any, List, TypedDict
from pathlib import Path

from langgraph.graph import StateGraph
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI


# ---------------------------
#   状态数据结构
# ---------------------------
class WFState(TypedDict, total=False):
    """工作流生成过程中在各节点间传递的数据格式"""

    requirement: str  # 用户需求（输入）
    plan: str         # LLM 拆解后的步骤文本
    workflow_json: Dict[str, Any]  # 生成的画布 JSON


# 初始化一次 LLM（可按需换模型 / 温度）
api_key = os.getenv("SILICONFLOW_API_KEY")
# 修改：使用 OPENAI_BASE_URL，因为 ChatOpenAI 默认找这个变量
base_url = os.getenv("OPENAI_BASE_URL") or "https://api.siliconflow.cn/v1"

if not api_key:
    raise ValueError("API key not found. Please set SILICONFLOW_API_KEY in your .env file.")

model_name_on_siliconflow = "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B" 

print(f"Using base_url: {base_url}")  # 添加调试信息
print(f"Using model: {model_name_on_siliconflow}")  # 添加调试信息

# 修改：将模型名称从 "gpt-3.5-turbo" 改为 SiliconFlow 支持的模型
# 请在此处填入你实际在 SiliconFlow 上使用的模型名称
# 例如: "Qwen/Qwen2-7B-Instruct", "deepseek-ai/deepseek-v2-chat" 等


llm = ChatOpenAI(
    model=model_name_on_siliconflow, 
    temperature=0.5, 
    api_key=api_key,
    base_url=base_url
)



def planner(state: WFState) -> WFState:  # type: ignore[override]
    """把需求拆分为可读的步骤列表"""
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一名流程工程师，你会把需求拆成若干原子步骤，每行一个步骤，中文回复。"),
            ("human", "{requirement}")
        ]
    )
    rsp = llm.invoke(prompt.format_messages(requirement=state["requirement"]))
    return {"plan": rsp.content}


def translator(state: WFState) -> WFState:  # type: ignore[override]
    """把 plan 翻译成符合前端要求的 JSON"""
    steps: List[str] = [s.strip() for s in state["plan"].split("\n") if s.strip()]

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    cur_x, cur_y = 100, 100  # 简单排版坐标

    def gen_id(prefix: str) -> str:
        return f"{prefix}_{uuid.uuid4().hex[:6]}"

    # Start 节点
    start_id = gen_id("start")
    nodes.append(
        {
            "id": start_id,
            "type": "start",
            "meta": {"position": {"x": cur_x, "y": cur_y}},
            "data": {"title": "Start", "outputs": {"type": "object", "properties": {}}},
        }
    )
    prev_id = start_id
    cur_x += 280

    # 逐步创建其它节点（简化映射规则）
    for step in steps:
        # 例：包含"替换"关键词 → text_processor 节点
        if "替换" in step and ("文本" in step or "文件" in step):
            node_id = gen_id("textp")
            nodes.append(
                {
                    "id": node_id,
                    "type": "text_processor",
                    "meta": {"position": {"x": cur_x, "y": cur_y}},
                    "data": {
                        "title": "TextReplace",
                        "mode": "replace",
                        "inputsValues": {
                            "inputFile": {"type": "constant", "content": "sample.txt"},
                            "searchText": {"type": "constant", "content": "hhy"},
                            "replaceText": {"type": "constant", "content": "wz"},
                            "useRegex": {"type": "constant", "content": False},
                        },
                    },
                }
            )
        else:
            # 未识别的步骤 → print 节点
            node_id = gen_id("print")
            nodes.append(
                {
                    "id": node_id,
                    "type": "print",
                    "meta": {"position": {"x": cur_x, "y": cur_y}},
                    "data": {"title": "Print", "inputsValues": {"content": {"type": "constant", "content": step}}},
                }
            )
        edges.append({"sourceNodeID": prev_id, "targetNodeID": node_id})
        prev_id = node_id
        cur_x += 280

    # End 节点
    end_id = gen_id("end")
    nodes.append(
        {
            "id": end_id,
            "type": "end",
            "meta": {"position": {"x": cur_x, "y": cur_y}},
            "data": {"title": "End", "inputs": {"type": "object", "properties": {}}},
        }
    )
    edges.append({"sourceNodeID": prev_id, "targetNodeID": end_id})

    return {"workflow_json": {"nodes": nodes, "edges": edges}}


def verifier(state: WFState) -> WFState:  # type: ignore[override]
    """最简单校验，确保至少包含 start / end"""
    node_types = {n["type"] for n in state["workflow_json"]["nodes"]}
    if not ({"start", "end"} <= node_types):
        raise ValueError("缺少 start/end 节点")
    return {}


# ---------------------------
#   构建 StateGraph
# ---------------------------
_graph = StateGraph(WFState)
_graph.add_node("planner_node", planner)
_graph.add_node("translator_node", translator)
_graph.add_node("verifier_node", verifier)
_graph.add_edge("planner_node", "translator_node")
_graph.add_edge("translator_node", "verifier_node")
_graph.set_entry_point("planner_node")
_graph.set_finish_point("verifier_node")
agent = _graph.compile()


# ---------------------------
#   CLI Demo 方便本地测试
# ---------------------------
if __name__ == "__main__":
    import sys

    # 创建 outputs 目录（如果不存在）
    output_dir = Path("outputs")
    output_dir.mkdir(exist_ok=True)
    
    # 获取用户输入或使用默认值
    requirement = sys.argv[1] if len(sys.argv) > 1 else "我希望把一个文本文件中的hhy都换成wz"
    
    # 生成工作流
    result = agent.invoke({"requirement": requirement})
    
    # 生成输出文件名（使用时间戳避免重名）
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_file = output_dir / f"workflow_{timestamp}.json"
    
    # 保存 JSON 到文件
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result["workflow_json"], f, ensure_ascii=False, indent=2)
    
    print(f"\n工作流已保存到: {output_file}")
    print("\n文件内容预览:")
    print(json.dumps(result["workflow_json"], ensure_ascii=False, indent=2)) 