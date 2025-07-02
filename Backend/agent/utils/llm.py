"""LLM工具类"""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# 加载环境变量
load_dotenv()

class LLMUtil:
    """LLM工具类"""
    
    def __init__(self):
        """初始化LLM"""
        api_key = os.getenv("SILICONFLOW_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL") or "https://api.siliconflow.cn/v1"
        
        if not api_key:
            raise ValueError("API key not found. Please set SILICONFLOW_API_KEY in your .env file.")
            
        self.model_name = "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B"
        self.llm = ChatOpenAI(
            model=self.model_name,
            temperature=0.5,
            api_key=api_key,
            base_url=base_url
        )
        
    def invoke(self, system_prompt: str, human_input: str) -> str:
        """调用LLM
        
        Args:
            system_prompt: 系统提示词
            human_input: 用户输入
            
        Returns:
            str: LLM响应
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", human_input)
        ])
        
        response = self.llm.invoke(prompt.format_messages(
            requirement=human_input
        ))
        
        return response.content 