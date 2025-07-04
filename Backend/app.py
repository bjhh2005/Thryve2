# -*- coding: utf-8 -*-
import eventlet
eventlet.monkey_patch()

import os
import json
import threading
import logging

from flask import Flask, request, Response, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from workflows.Engine import WorkflowEngine
from workflows.scheduler.Scheduler import WorkflowScheduler
from workflows.events.EventBus import EventBus

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
    try:
        logger.info("Starting workflow execution")
        
        # Create workflow engine
        engine = WorkflowEngine(workflow_data, socketio)  
        engineConnect(engine)

        # Run workflow
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
    
# 创建事件总线实例
event_bus = EventBus()

# 创建工作流引擎实例
engine = WorkflowEngine({}, socketio)  # 传入空的工作流数据作为初始状态

# 创建调度器实例
scheduler = WorkflowScheduler(event_bus)

@app.before_request
def init_app():
    """初始化应用"""
    if not app.config.get('SCHEDULER_STARTED'):
        scheduler.start()
        app.config['SCHEDULER_STARTED'] = True

@app.teardown_appcontext
def cleanup_app(exception):
    """清理应用"""
    if app.config.get('SCHEDULER_STARTED'):
        scheduler.stop()
        app.config['SCHEDULER_STARTED'] = False

# 调度器管理API
@app.route('/api/schedules', methods=['GET'])
def list_schedules():
    """列出所有调度任务"""
    workflow_id = request.args.get('workflow_id')
    schedules = scheduler.list_schedules(workflow_id)
    return jsonify(schedules)

@app.route('/api/schedules/<schedule_id>', methods=['GET'])
def get_schedule(schedule_id):
    """获取调度任务详情"""
    schedule = scheduler.get_schedule(schedule_id)
    if schedule:
        return jsonify(schedule)
    return jsonify({'error': '调度任务不存在'}), 404

@app.route('/api/schedules/<schedule_id>', methods=['PUT'])
def update_schedule(schedule_id):
    """更新调度任务"""
    data = request.get_json()
    if scheduler.update_schedule(schedule_id, data.get('schedule_config', {})):
        return jsonify({'message': '调度任务已更新'})
    return jsonify({'error': '调度任务不存在'}), 404

@app.route('/api/schedules/<schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    """删除调度任务"""
    if scheduler.remove_schedule(schedule_id):
        return jsonify({'message': '调度任务已删除'})
    return jsonify({'error': '调度任务不存在'}), 404

if __name__ == '__main__':
    logger.info("Starting workflow WebSocket server with Eventlet...")
    socketio.run(app, debug=True, port=4000)