# -*- coding: utf-8 -*-
import eventlet
eventlet.monkey_patch()

import os
import json
import threading
import logging

from flask import Flask, request, Response
from flask_socketio import SocketIO
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from workflows.Engine import WorkflowEngine
from workflows.WorkflowManager import WorkflowManager

load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-workflow-secret-key'

CORS(app, resources={r"/api/*": {"origins": "*"}})

#    这是解决此问题的最直接、最可靠的方法
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# 设置详细的日志记录
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
    
# 执行中连接
def engineConnect(engine : WorkflowEngine):

    # 监听并转发节点状态变化
    engine.bus.on('node_status_change', lambda data: socketio.emit('node_status_change', data, namespace='/workflow'))
    
    # 这里的所有的message的传递应该都是str类型的
    # 选择从 info , warning , error
    engine.bus.on('message', lambda event,nodeId,message:socketio.emit(event, {"data":nodeId, "message" : message},namespace='/workflow'))

    engine.bus.on("nodes_output", lambda nodeId, message: socketio.emit('nodes_output', {"data":nodeId, "message" : message} , namespace='/workflow'))


def execute_workflow_task(workflow_data):
    """Execute workflow task in background"""
    global current_workflow_manager
    try:
        logger.info("Starting workflow execution")
        
        # 检查是否为多工作流数据格式
        if isinstance(workflow_data, dict) and "workflows" in workflow_data:
            # 新的多工作流格式
            logger.info("Using WorkflowManager for multi-workflow execution")
            manager = WorkflowManager(socketio)
            current_workflow_manager = manager  # 保存全局引用
            
            # 连接管理器事件
            manager.global_bus.on('message', lambda event, nodeId, message: 
                socketio.emit(event, {"data": nodeId, "message": message}, namespace='/workflow'))
            manager.global_bus.on("nodes_output", lambda nodeId, message: 
                socketio.emit('nodes_output', {"data": nodeId, "message": message}, namespace='/workflow'))
            
            # 注册工作流
            manager.register_workflows(workflow_data["workflows"])
            
            # 执行工作流
            success, message = manager.run()
        else:
            # 兼容旧的单工作流格式
            logger.info("Using single WorkflowEngine for backward compatibility")
            current_workflow_manager = None  # 清空管理器引用
            engine = WorkflowEngine(workflow_data, socketio)
            engineConnect(engine)
            success, message = engine.run()

        # Send appropriate signal based on execution result
        if success:
            socketio.emit('over', {'message': message, 'status': 'success'}, namespace='/workflow')
        else:
            socketio.emit('over', {'message': f'Workflow execution failed: {message}', 'status': 'error'}, namespace='/workflow')
            
    except Exception as e:
        # Send failure signal to frontend
        socketio.emit('over', {'message': f'Workflow execution error: {str(e)}', 'status': 'error'}, namespace='/workflow')
        

@socketio.on('connect', namespace='/workflow')
def handle_connect():
    logger.info('Client connected to /workflow namespace')

@socketio.on('disconnect', namespace='/workflow')
def handle_disconnect():
    logger.info('Client disconnected from /workflow namespace')

@socketio.on('start_process', namespace='/workflow')
def handle_start_process(workflow_data):
    
    logger.info("Hello")
    # Execute workflow in new thread to avoid blocking WebSocket
    thread = threading.Thread(target=execute_workflow_task, args=(workflow_data,))
    thread.start()

# -------------------------------------------------------------------
#  新增：大模型聊天API路由
# -------------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
def chat():
    """
    处理来自前端的聊天请求，并以流式响应返回模型回答。
    """
    # 1. 从前端请求中获取JSON数据
    data = request.get_json()   
    print(data)
    api_key = data.get("apiKey")
    base_url = data.get("apiHost")
    model_name = data.get("model")
    temperature = data.get("temperature", 0.7)
    messages = data.get("messages", [])

    # 2. 对内置模型的特殊处理：如果apiKey为空，则使用服务器的
    #    这里我们约定，内置模型的apiKey由前端传一个空字符串过来
    if model_name and model_name.startswith('Qwen/'): # 或者其他您定义的内置模型标识
        if not api_key:
            api_key = os.getenv("SILICONFLOW_API_KEY")

    # 3. 统一的校验和API调用
    if not api_key:
        return Response(json.dumps({"error": "API key is missing."}), status=400, mimetype='application/json')
    if not model_name:
        return Response(json.dumps({"error": "Model name is missing."}), status=400, mimetype='application/json')
    if not base_url:
        return Response(json.dumps({"error": "API Host is missing."}), status=400, mimetype='application/json')

    def stream_generator():
        try:
            client = OpenAI(api_key=api_key, base_url=base_url)
            stream = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=temperature,
                stream=True
            )
            for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            yield f"data: {json.dumps({'end': True})}\n\n"
        except Exception as e:
            logger.error(f"Error calling external API: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(stream_generator(), mimetype="text/event-stream")

# -------------------------------------------------------------------
#  新增：生成对话标题API路由
# -------------------------------------------------------------------
@app.route("/api/generate-title", methods=["POST"])
def generate_title():
    # try:
    data = request.get_json()
    if not data:
        raise ValueError("Request body is not a valid JSON.")

    user_message = data.get("message")
    if not user_message:
        raise ValueError("Missing 'message' field in request body.")

    api_key = os.getenv("SILICONFLOW_API_KEY")
    base_url = "https://api.siliconflow.cn/v1"
    model_name = "Qwen/Qwen2-7B-Instruct" 

    if not api_key:
            raise ValueError("Server API key (SILICONFLOW_API_KEY) is not configured.")

    client = OpenAI(api_key=api_key, base_url=base_url)
    
    completion = client.chat.completions.create(
        model=model_name,
        messages=[
            {
                "role": "system", 
                "content": "你是一个文本摘要专家，请根据用户输入，为这段对话生成一个非常简短、不超过8个字的精炼标题。请不要添加任何多余的解释或标点符号，直接输出标题本身。"
            },
            {
                "role": "user", 
                "content": user_message
            }
        ],
        temperature=0.2,
        stream=False
    )
    
    title = completion.choices[0].message.content.strip().replace("\"", "").replace("“", "").replace("”", "")
    
    logger.info(f"Generated title: '{title}' for message: '{user_message[:30]}...'")
    return Response(json.dumps({"title": title}), status=200, mimetype='application/json')

    # except Exception as e:
    #     logger.error(f"An error occurred in /api/generate-title: {e}")
    #     return Response(json.dumps({"error": f"Failed to generate title: {str(e)}"}), status=500, mimetype='application/json')
    

# -------------------------------------------------------------------
#  新增：多工作流管理API
# -------------------------------------------------------------------

# 全局工作流管理器实例（用于状态查询）
current_workflow_manager = None

@app.route("/api/workflows/status", methods=["GET"])
def get_workflows_status():
    """获取所有工作流的状态"""
    global current_workflow_manager
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No workflow manager instance"}), status=404, mimetype='application/json')
    
    try:
        status = current_workflow_manager.get_all_workflow_status()
        return Response(json.dumps({"status": status}), status=200, mimetype='application/json')
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/<workflow_id>/status", methods=["GET"])
def get_workflow_status(workflow_id):
    """获取指定工作流的状态"""
    global current_workflow_manager
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No workflow manager instance"}), status=404, mimetype='application/json')
    
    try:
        status = current_workflow_manager.get_workflow_status(workflow_id)
        if status is None:
            return Response(json.dumps({"error": f"Workflow {workflow_id} not found"}), status=404, mimetype='application/json')
        
        return Response(json.dumps({"workflow_id": workflow_id, "status": status.value}), status=200, mimetype='application/json')
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/<workflow_id>/pause", methods=["POST"])
def pause_workflow(workflow_id):
    """暂停指定工作流"""
    global current_workflow_manager
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No workflow manager instance"}), status=404, mimetype='application/json')
    
    try:
        current_workflow_manager.pause_workflow(workflow_id)
        return Response(json.dumps({"message": f"Workflow {workflow_id} paused"}), status=200, mimetype='application/json')
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/<workflow_id>/resume", methods=["POST"])
def resume_workflow(workflow_id):
    """恢复指定工作流"""
    global current_workflow_manager
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No workflow manager instance"}), status=404, mimetype='application/json')
    
    try:
        current_workflow_manager.resume_workflow(workflow_id)
        return Response(json.dumps({"message": f"Workflow {workflow_id} resumed"}), status=200, mimetype='application/json')
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/memory", methods=["GET"])
def get_memory_usage():
    """获取所有工作流的内存使用情况"""
    global current_workflow_manager
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No workflow manager instance"}), status=404, mimetype='application/json')
    
    try:
        memory_summary = current_workflow_manager.get_memory_usage_summary()
        return Response(json.dumps(memory_summary), status=200, mimetype='application/json')
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/memory/cleanup", methods=["POST"])
def force_cleanup_subworkflows():
    """强制清理所有子工作流的内存（调试用）"""
    global current_workflow_manager
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No workflow manager instance"}), status=404, mimetype='application/json')
    
    try:
        # 获取清理前的内存信息
        before_cleanup = current_workflow_manager.get_memory_usage_summary()
        
        # 执行清理
        current_workflow_manager.force_cleanup_all_subworkflows()
        
        # 获取清理后的内存信息
        after_cleanup = current_workflow_manager.get_memory_usage_summary()
        
        return Response(json.dumps({
            "message": "All subworkflows cleaned up",
            "before_cleanup": before_cleanup,
            "after_cleanup": after_cleanup
        }), status=200, mimetype='application/json')
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/<workflow_id>/memory", methods=["GET"])
def get_workflow_memory(workflow_id):
    """获取指定工作流的内存使用详情"""
    global current_workflow_manager
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No workflow manager instance"}), status=404, mimetype='application/json')
    
    try:
        if workflow_id not in current_workflow_manager.workflows:
            return Response(json.dumps({"error": f"Workflow {workflow_id} not found or not instantiated"}), status=404, mimetype='application/json')
        
        engine = current_workflow_manager.workflows[workflow_id]
        memory_info = engine.get_memory_usage_info()
        
        return Response(json.dumps({
            "workflow_id": workflow_id,
            "memory_info": memory_info,
            "workflow_type": current_workflow_manager.workflow_types[workflow_id].value,
            "workflow_status": current_workflow_manager.workflow_status[workflow_id].value
        }), status=200, mimetype='application/json')
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

if __name__ == '__main__':
    logger.info("Starting workflow WebSocket server with Eventlet...")
    socketio.run(app, debug=True, port=4000)