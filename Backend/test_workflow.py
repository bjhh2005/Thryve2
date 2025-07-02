"""工作流代理测试脚本"""

import asyncio
import json
from agent.workflow_agent import WorkflowAgent

async def test_workflow():
    """测试工作流代理"""
    agent = WorkflowAgent()
    
    # 测试用例列表
    test_cases = [
        "我需要一个工作流来处理PDF文件，提取文本后进行关键词分析",
        "创建一个工作流，监控文件夹中的新图片，自动进行压缩和添加水印",
        """
        设计一个工作流处理客户反馈：
        1. 读取CSV文件中的客户评论
        2. 使用AI分析情感倾向
        3. 提取关键问题
        4. 生成分析报告
        """
    ]
    
    # 运行测试用例
    for i, requirement in enumerate(test_cases, 1):
        print(f"\n测试用例 {i}:")
        print(f"需求: {requirement}")
        print("-" * 50)
        
        try:
            result = await agent.process_requirement(requirement)
            
            # 打印分析结果
            if "analysis" in result:
                print("\n需求分析:")
                print(json.dumps(result["analysis"], ensure_ascii=False, indent=2))
            
            # 打印执行计划
            if "plan" in result:
                print("\n执行计划:")
                print(result["plan"])
            
            # 打印工作流JSON（只打印节点数量和边数量）
            if "workflow_json" in result:
                workflow = result["workflow_json"]
                print("\n工作流信息:")
                print(f"节点数量: {len(workflow['nodes'])}")
                print(f"连接数量: {len(workflow['edges'])}")
                
                # 打印节点类型统计
                node_types = {}
                for node in workflow["nodes"]:
                    node_type = node["type"]
                    node_types[node_type] = node_types.get(node_type, 0) + 1
                print("\n节点类型统计:")
                for node_type, count in node_types.items():
                    print(f"- {node_type}: {count}")
            
            # 打印错误信息
            if "error" in result:
                print("\n错误:")
                print(result["error"])
            
            print("\n结果已保存到 outputs 目录")
            
        except Exception as e:
            print(f"错误: {str(e)}")
        
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_workflow()) 