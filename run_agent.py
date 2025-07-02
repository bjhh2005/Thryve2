"""工作流代理入口脚本"""

import asyncio
import json
import sys

from Backend.agent.workflow_agent import WorkflowAgent

async def main():
    # 创建代理
    agent = WorkflowAgent()
    
    # 获取用户输入或使用默认值
    requirement = sys.argv[1] if len(sys.argv) > 1 else "我需要一个工作流来处理PDF文件，提取文本后进行关键词分析"
    
    # 处理需求
    result = await agent.process_requirement(requirement)
    
    # 打印结果
    print("\n处理结果:")
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(main()) 