# -*- coding: utf-8 -*-
import os
import json
import threading
import logging

from flask import Flask, request, Response
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI  # 新增：导入OpenAI库

from workflows.Engine import WorkflowEngine

# --- 新增：加载 .env 文件中的环境变量 ---
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-workflow-secret-key'
CORS(app)

# 创建SocketIO实例，支持/workflow命名空间
socketio = SocketIO(app, cors_allowed_origins="*")

# 设置详细的日志记录
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
#  大模型聊天API路由
# -------------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
def chat():
    """
    处理来自前端的聊天请求，并以流式响应返回模型回答。
    """
    # 1. 从前端请求中获取JSON数据
    data = request.get_json()
    
    # 2. 安全地获取API Key
    # 优先使用前端用户在设置中填写的Key，如果未提供，则使用服务器环境变量中的
    api_key = data.get("apiKey") or os.getenv("SILICONFLOW_API_KEY")
    if not api_key:
        return Response(json.dumps({"error": "API key is required."}), status=400, mimetype='application/json')

    # 3. 准备调用模型所需的参数
    model_name = data.get("model")
    messages = data.get("messages")
    temperature = data.get("temperature", 0.7)
    
    # 硅基流动的API基地址
    # 注意：前端也可以通过apiHost参数传递这个值，这里提供一个默认值
    base_url = data.get("apiHost") or "https://api.siliconflow.cn/v1"

    def stream_generator():
        """这是一个生成器函数，用于流式返回数据"""
        try:
            # 4. 初始化客户端，关键在于指定 base_url
            client = OpenAI(
                api_key=api_key,
                base_url=base_url
            )

            # 5. 以流式模式调用聊天接口
            stream = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=temperature,
                stream=True  # 开启流式响应
            )

            # 6. 遍历返回的数据流，并按SSE格式yield给前端
            for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    # SSE (Server-Sent Events) 格式: "data: <json_string>\n\n"
                    sse_data = f"data: {json.dumps({'content': content})}\n\n"
                    yield sse_data
            
            # 标记流结束
            yield f"data: {json.dumps({'end': True})}\n\n"

        except Exception as e:
            logger.error(f"Error calling SiliconFlow API: {e}")
            error_message = f"data: {json.dumps({'error': str(e)})}\n\n"
            yield error_message

    # 7. 返回一个流式响应
    return Response(stream_generator(), mimetype="text/event-stream")


# -------------------------------------------------------------------
#  工作流逻辑 
# -------------------------------------------------------------------
def engineConnect(engine : WorkflowEngine):
    engine.bus.on('workflow', lambda nodeId:socketio.emit('workflow', {"nodeId" : nodeId}, namespace='/workflow'))
    engine.bus.on('message', lambda event,nodeId,message:socketio.emit(event, {"data":nodeId, "message" : message},namespace='/workflow'))
    engine.bus.on("nodes_output", lambda nodeId, message: socketio.emit('nodes_output', {"data":nodeId, "message" : message} , namespace='/workflow'))

def execute_workflow_task(workflow_data):
<<<<<<< Updated upstream
    """Execute workflow task in background"""
    try:
        logger.info("Starting workflow execution")
        
        # Create workflow engine
        engine = WorkflowEngine(workflow_data)  
        engineConnect(engine)

        # Run workflow
        success, message = engine.run()

        # Send appropriate signal based on execution result
        if success:
            socketio.emit('over', {
                'message': message,
                'data': 0,
                'status': 'success'
            }, namespace='/workflow')
        else:
            socketio.emit('over', {
                'message': f'Workflow execution failed: {message}',
                'data': ['workflow_incomplete'],
                'status': 'error'
            }, namespace='/workflow')
            
    except Exception as e:
        # Send failure signal to frontend
        socketio.emit('over', {
            'message': f'Workflow execution error: {str(e)}',
            'data': e.args,
            'status': 'error'
        }, namespace='/workflow')
        
=======
    logger.info("开始执行工作流任务")
    engine = WorkflowEngine(workflow_data)
    engineConnect(engine)
    engine.run()
    socketio.emit('over', {
        'message': '工作流执行成功',
        'data': 0,
        'status': 'success'
    }, namespace='/workflow')
>>>>>>> Stashed changes

@socketio.on('connect', namespace='/workflow')
def handle_connect():
    logger.info('Client connected to /workflow namespace')

@socketio.on('disconnect', namespace='/workflow')
def handle_disconnect():
    logger.info('Client disconnected from /workflow namespace')

@socketio.on('start_process', namespace='/workflow')
def handle_start_process(workflow_data):
<<<<<<< Updated upstream
    
    # Execute workflow in new thread to avoid blocking WebSocket
=======
>>>>>>> Stashed changes
    thread = threading.Thread(target=execute_workflow_task, args=(workflow_data,))
    thread.start()


if __name__ == '__main__':
<<<<<<< Updated upstream
    logger.info("Starting workflow WebSocket server...")
=======
    # 注意：这里的端口4000需要和前端API请求的端口一致
    # socketio.run会同时启动一个支持HTTP和WebSocket的服务器
    logger.info("启动服务器，同时支持工作流(WebSocket)和AI聊天(HTTP)...")
>>>>>>> Stashed changes
    socketio.run(app, debug=True, port=4000)