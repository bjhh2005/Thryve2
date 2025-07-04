# -*- coding: utf-8 -*-

# 1. 必须在所有其他导入之前执行猴子补丁
import eventlet
eventlet.monkey_patch()

# 2. 导入其他模块
import os
import json
import logging
import uuid # 新增：用于生成唯一的运行ID
from flask import Flask, request, Response
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from workflows.Engine import WorkflowEngine

load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-workflow-secret-key'

# 简化并加强 CORS 配置，应用于所有路由
CORS(app) 

# 明确告知 SocketIO 使用 eventlet，这是最稳妥的配置
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# --- 新增：全局字典，用于管理所有激活的调试会话 ---
DEBUG_SESSIONS = {}

def engineConnect(engine: WorkflowEngine, run_id: str):
    """
    连接引擎的事件总线，并将事件转发给前端。
    所有事件都附带 run_id，以便前端区分会话。
    """
    def create_emitter(event_name):
        return lambda data: socketio.emit(event_name, {**data, 'run_id': run_id}, namespace='/workflow')

    engine.bus.on('node_status_change', create_emitter('node_status_change'))
    engine.bus.on('execution_paused', create_emitter('execution_paused'))
    engine.bus.on('execution_terminated', create_emitter('execution_terminated'))
    engine.bus.on('over', create_emitter('over'))
    # 保留原有的日志和输出事件转发
    engine.bus.on('message', lambda event, nodeId, message: socketio.emit(event, {"nodeId": nodeId, "message": message, "run_id": run_id}, namespace='/workflow'))
    engine.bus.on("nodes_output", lambda nodeId, message: socketio.emit('nodes_output', {"nodeId": nodeId, "message": message, "run_id": run_id}, namespace='/workflow'))

def execute_debug_task(run_id, workflow_data, breakpoints):
    """
    在后台执行一个可调试的工作流任务。
    """
    logger.info(f"--- [TASK EXECUTION] Debug task started for Run ID: {run_id} ---")
    engine = WorkflowEngine(workflow_data, socketio, breakpoints)
    DEBUG_SESSIONS[run_id] = engine # 存储引擎实例
    engineConnect(engine, run_id)
    
    try:
        # 调用引擎新的 debug_run 方法
        engine.debug_run()
    except Exception as e:
        logger.error(f"An unhandled exception occurred in debug_run for {run_id}: {e}")
    finally:
        # 任务结束后（无论成功、失败还是终止），都从会话中移除
        if run_id in DEBUG_SESSIONS:
            del DEBUG_SESSIONS[run_id]
        logger.info(f"Debug session {run_id} finished and cleaned up.")

# --- Socket.IO 事件处理器 ---

@socketio.on('connect', namespace='/workflow')
def handle_connect():
    logger.info(f'Client connected to /workflow namespace')

@socketio.on('disconnect', namespace='/workflow')
def handle_disconnect():
    logger.info(f'Client disconnected from /workflow namespace')

# 保留：用于“一键运行”的非调试模式
@socketio.on('start_process', namespace='/workflow')
def handle_start_process(workflow_data):
    run_id = str(uuid.uuid4())
    logger.info(f"--- [RUN START] NON-DEBUG process received. Assigning Run ID: {run_id} ---")
    # 这里可以创建一个不同的后台任务，或者也用 debug_run 但不传递断点
    # 为简单起见，我们统一使用 debug_run
    socketio.start_background_task(execute_debug_task, run_id, workflow_data, [])


# 新增：用于“调试运行”模式
@socketio.on('start_debug', namespace='/workflow')
def handle_start_debug(data):
    run_id = str(uuid.uuid4())
    workflow_data = data.get('documentData')
    breakpoints = data.get('breakpoints', [])

    logger.info(f"--- [DEBUG RUN START] Received breakpoints from frontend: {breakpoints} ---")
    
    if not workflow_data:
        logger.error("start_debug event received without documentData.")
        return

    logger.info(f"--- [DEBUG RUN START] New debug process received. Assigning Run ID: {run_id} ---")
    # 返回 run_id 给前端，以便后续的指令可以识别是哪个任务
    emit('debug_session_started', {'run_id': run_id})
    socketio.start_background_task(execute_debug_task, run_id, workflow_data, breakpoints)


# 新增：接收并分发前端发来的调试指令
@socketio.on('debug_command', namespace='/workflow')
def handle_debug_command(data):
    run_id = data.get('run_id')
    command = data.get('command')
    engine = DEBUG_SESSIONS.get(run_id)

    if not engine:
        logger.warning(f"Received command '{command}' for non-existent or completed run_id '{run_id}'")
        return

    logger.info(f"Received command '{command}' for run_id '{run_id}'")
    if command == 'pause':
        engine.pause()
    elif command == 'resume':
        engine.resume()
    elif command == 'step_over':
        engine.step_over()
    elif command == 'terminate':
        engine.terminate()

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
    
if __name__ == '__main__':
    logger.info("Starting workflow WebSocket server with Eventlet...")
    socketio.run(app, debug=True, port=4000)