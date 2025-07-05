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
from workflows.WorkflowManager import WorkflowManager
from workflow_converter import convert_workflow_format

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
    
    logger.info("接收到前端工作流数据")
    
    try:
        # 检查是否是前端格式（包含nodes和edges）
        if isinstance(workflow_data, dict) and 'nodes' in workflow_data and 'edges' in workflow_data:
            logger.info("检测到前端格式，开始转换...")
            
            # 使用转换器将前端格式转换为后端格式
            backend_format = convert_workflow_format(workflow_data)
            
            logger.info(f"转换成功，生成 {len(backend_format['workflows'])} 个工作流")
            
            # 使用转换后的格式执行工作流
            converted_data = backend_format
        else:
            # 已经是后端格式，直接使用
            logger.info("检测到后端格式，直接使用")
            converted_data = workflow_data
        
        # Execute workflow in new thread to avoid blocking WebSocket
        thread = threading.Thread(target=execute_workflow_task, args=(converted_data,))
        thread.start()
        
    except Exception as e:
        logger.error(f"工作流数据处理失败: {str(e)}")
        # 发送错误消息到前端
        socketio.emit('over', {
            'message': f'工作流数据处理失败: {str(e)}', 
            'status': 'error'
        }, namespace='/workflow')
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