# -*- coding: utf-8 -*-

# 1. 必须在所有其他导入之前执行猴子补丁
import eventlet
eventlet.monkey_patch()

# 2. 导入其他模块
import os
import sys
import json
import logging
import locale
import codecs

import uuid # 新增：用于生成唯一的运行ID
import threading
from flask import Flask, request, Response
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from workflows.Engine import WorkflowEngine
from workflows.WorkflowManager import WorkflowManager
from workflow_converter import convert_workflow_format
from config.system_prompt import SYSTEM_PROMPT  # 导入系统提示词

# 设置详细的日志记录
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 尝试加载.env文件
logger.info("尝试加载环境变量文件...")

# 检查是否在PyInstaller环境中运行
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    logger.info("在PyInstaller打包环境中运行")
    
    # 在PyInstaller环境中，首先尝试从_internal目录加载.env文件
    internal_env_path = os.path.join(os.path.dirname(sys.executable), '_internal', '.env')
    if os.path.exists(internal_env_path):
        logger.info(f"从_internal目录加载.env文件: {internal_env_path}")
        load_dotenv(internal_env_path)
    else:
        logger.warning(f"_internal目录中未找到.env文件: {internal_env_path}")
else:
    logger.info("在普通Python环境中运行")
    # 在开发环境中，从当前目录加载.env文件
    load_dotenv()


# 设置编码相关
def setup_encoding():
    """设置正确的编码环境"""
    try:
        # 记录当前编码信息，便于调试
        default_encoding = sys.getdefaultencoding()
        preferred_encoding = locale.getpreferredencoding()
        logger.info(f"Default encoding: {default_encoding}")
        logger.info(f"Preferred encoding: {preferred_encoding}")
        logger.info(f"File system encoding: {sys.getfilesystemencoding()}")
        
        # 确保stdout和stderr使用UTF-8编码
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        
        # 设置环境变量
        os.environ['PYTHONIOENCODING'] = 'utf-8'
        
        # 在Windows上特别处理控制台编码
        if sys.platform == 'win32':
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleOutputCP(65001)  # 设置控制台代码页为UTF-8
                kernel32.SetConsoleCP(65001)
                logger.info("Windows console code page set to UTF-8")
            except Exception as e:
                logger.warning(f"Failed to set Windows console code page: {e}")
    except Exception as e:
        logger.warning(f"Error setting up encoding: {e}")

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# 简化并加强 CORS 配置，应用于所有路由
CORS(app) 

# 明确告知 SocketIO 使用 eventlet，这是最稳妥的配置
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 全局变量管理
current_workflow_manager = None
DEBUG_SESSIONS = {}  # 用于管理所有激活的调试会话

def engineConnect(engine, run_id=None):
    """
    连接引擎的事件总线，并将事件转发给前端。
    支持调试模式（带run_id）和普通模式。
    """
    if run_id:
        # 调试模式：所有事件都附带 run_id
        def create_emitter(event_name):
            return lambda data: socketio.emit(event_name, {**data, 'run_id': run_id}, namespace='/workflow')
        
        engine.bus.on('node_status_change', create_emitter('node_status_change'))
        engine.bus.on('execution_paused', create_emitter('execution_paused'))
        engine.bus.on('execution_terminated', create_emitter('execution_terminated'))
        engine.bus.on('over', create_emitter('over'))
        
        # 保留原有的日志和输出事件转发
        engine.bus.on('message', lambda event, nodeId, message: 
            socketio.emit(event, {"nodeId": nodeId, "message": message, "run_id": run_id}, namespace='/workflow'))
        engine.bus.on("nodes_output", lambda nodeId, message: 
            socketio.emit('nodes_output', {"nodeId": nodeId, "message": message, "run_id": run_id}, namespace='/workflow'))
    else:
        # 普通模式：不带run_id
        engine.bus.on('node_status_change', lambda data: socketio.emit('node_status_change', data, namespace='/workflow'))
        engine.bus.on('message', lambda event, nodeId, message: 
            socketio.emit(event, {"data": nodeId, "message": message}, namespace='/workflow'))
        engine.bus.on("nodes_output", lambda nodeId, message: 
            socketio.emit('nodes_output', {"data": nodeId, "message": message}, namespace='/workflow'))

def execute_debug_task(run_id, workflow_data, breakpoints):
    """
    在后台执行一个可调试的工作流任务。
    """
    logger.info(f"--- [TASK EXECUTION] Debug task started for Run ID: {run_id} ---")
    
    try:
        # 检查是否是前端格式（包含nodes和edges）
        if isinstance(workflow_data, dict) and 'nodes' in workflow_data and 'edges' in workflow_data:
            logger.info("检测到前端格式，开始转换...")
            
            # 使用转换器将前端格式转换为后端格式
            backend_format = convert_workflow_format(workflow_data)
            
            logger.info(f"转换成功，生成 {len(backend_format['workflows'])} 个工作流")
            
            # 使用转换后的格式
            converted_data = backend_format
        else:
            # 已经是后端格式，直接使用
            logger.info("检测到后端格式，直接使用")
            converted_data = workflow_data
        
        # 检查是否为多工作流数据格式
        if isinstance(converted_data, dict) and "workflows" in converted_data:
            logger.info("Debug mode: Using WorkflowManager with breakpoint support for multi-workflow execution")
            
            # 创建支持调试的WorkflowManager
            manager = WorkflowManager(socketio)
            
            # 设置断点支持
            manager.breakpoints = set(breakpoints) if breakpoints else set()
            manager.debug_mode = True
            
            # 存储管理器实例
            DEBUG_SESSIONS[run_id] = manager
            
            # 连接管理器事件，确保包含run_id
            manager.global_bus.on('message', lambda event, nodeId, message: 
                socketio.emit(event, {"data": nodeId, "message": message, "run_id": run_id}, namespace='/workflow'))
            manager.global_bus.on("nodes_output", lambda nodeId, message: 
                socketio.emit('nodes_output', {"data": nodeId, "message": message, "run_id": run_id}, namespace='/workflow'))
            
            # 添加调试事件监听，关键修复：包含run_id
            manager.global_bus.on("node_status_change", lambda event_data: 
                socketio.emit('node_status_change', {**event_data, 'run_id': run_id}, namespace='/workflow'))
            manager.global_bus.on("execution_paused", lambda event_data: 
                socketio.emit('execution_paused', {**event_data, 'run_id': run_id}, namespace='/workflow'))
            manager.global_bus.on("execution_terminated", lambda event_data: 
                socketio.emit('execution_terminated', {**event_data, 'run_id': run_id}, namespace='/workflow'))
            
            # 关键修复：添加execution_step_over事件转发，支持单步执行功能
            manager.global_bus.on("execution_step_over", lambda event_data: 
                socketio.emit('execution_step_over', {**event_data, 'run_id': run_id}, namespace='/workflow'))
            
            # 注册工作流，并为每个工作流传递断点信息
            manager.register_workflows(converted_data["workflows"])
            
            # 为每个工作流引擎设置断点
            for workflow_id, engine in manager.workflows.items():
                engine.breakpoints = set(breakpoints) if breakpoints else set()
                engine.debug_mode = len(breakpoints) > 0
                logger.info(f"设置工作流 {workflow_id} 的断点: {breakpoints}")
            
            logger.info(f"Debug session created with {len(breakpoints)} breakpoints: {breakpoints}")
            
            # 执行工作流
            success, message = manager.run()
        else:
            # 单工作流格式 - 直接使用WorkflowEngine
            logger.info("Using single WorkflowEngine for debug execution")
            engine = WorkflowEngine(converted_data, socketio, breakpoints)
            DEBUG_SESSIONS[run_id] = engine  # 存储引擎实例
            engineConnect(engine, run_id)
            
            logger.info(f"Debug session created with {len(breakpoints)} breakpoints: {breakpoints}")
            # 调用引擎的run方法（会自动判断是否使用调试模式）
            success, message = engine.run()
        
        if success:
            socketio.emit('over', {'message': message, 'status': 'success', 'run_id': run_id}, namespace='/workflow')
        else:
            socketio.emit('over', {'message': f'Workflow execution failed: {message}', 'status': 'error', 'run_id': run_id}, namespace='/workflow')
            
    except Exception as e:
        logger.error(f"An unhandled exception occurred in debug_run for {run_id}: {e}")
        socketio.emit('over', {'message': f'Workflow execution error: {str(e)}', 'status': 'error', 'run_id': run_id}, namespace='/workflow')
    finally:
        # 任务结束后（无论成功、失败还是终止），都从会话中移除
        if run_id in DEBUG_SESSIONS:
            del DEBUG_SESSIONS[run_id]
        logger.info(f"Debug session {run_id} finished and cleaned up.")

def execute_workflow_task(workflow_data):
    """Execute workflow task in background (non-debug mode)"""
    global current_workflow_manager
    try:
        logger.info("Starting workflow execution")
        
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
        
        # 检查是否为多工作流数据格式
        if isinstance(converted_data, dict) and "workflows" in converted_data:
            # 新的多工作流格式
            logger.info("Using WorkflowManager for multi-workflow execution")
            manager = WorkflowManager(socketio)
            current_workflow_manager = manager  # 保存全局引用
            
            # 连接管理器事件 - 包含所有必要的事件转发
            manager.global_bus.on('message', lambda event, nodeId, message: 
                socketio.emit(event, {"data": nodeId, "message": message}, namespace='/workflow'))
            manager.global_bus.on("nodes_output", lambda nodeId, message: 
                socketio.emit('nodes_output', {"data": nodeId, "message": message}, namespace='/workflow'))
            
            # 关键修复：添加节点状态变化事件转发，这是画布可视化的核心
            manager.global_bus.on("node_status_change", lambda event_data: 
                socketio.emit('node_status_change', event_data, namespace='/workflow'))
            
            # 注册工作流
            manager.register_workflows(converted_data["workflows"])
            
            # 执行工作流
            success, message = manager.run()
        else:
            # 兼容旧的单工作流格式
            logger.info("Using single WorkflowEngine for backward compatibility")
            current_workflow_manager = None  # 清空管理器引用
            engine = WorkflowEngine(converted_data, socketio)
            engineConnect(engine)
            success, message = engine.run()

        # Send appropriate signal based on execution result
        if success:
            socketio.emit('over', {'message': message, 'status': 'success'}, namespace='/workflow')
        else:
            socketio.emit('over', {'message': f'Workflow execution failed: {message}', 'status': 'error'}, namespace='/workflow')
            
    except UnicodeError as ue:
        logger.error(f"Unicode error in workflow execution: {ue}")
        socketio.emit('over', {
            'message': f'编码错误: {str(ue)}. 请检查输入数据是否包含不支持的字符。',
            'data': -2,
            'status': 'error'
        }, namespace='/workflow')
    except Exception as e:
        # Send failure signal to frontend
        socketio.emit('over', {'message': f'Workflow execution error: {str(e)}', 'status': 'error'}, namespace='/workflow')

# --- Socket.IO 事件处理器 ---

@socketio.on('connect', namespace='/workflow')
def handle_connect():
    logger.info(f'Client connected to /workflow namespace')

@socketio.on('disconnect', namespace='/workflow')
def handle_disconnect():
    logger.info(f'Client disconnected from /workflow namespace')

@socketio.on('start_process', namespace='/workflow')
def handle_start_process(workflow_data):
    """处理普通工作流执行请求"""
    logger.info("接收到前端工作流数据 (普通模式)")
    
    # Execute workflow in new thread to avoid blocking WebSocket
    thread = threading.Thread(target=execute_workflow_task, args=(workflow_data,))
    thread.start()

@socketio.on('start_debug', namespace='/workflow')
def handle_start_debug(data):
    """处理调试工作流执行请求"""
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

@socketio.on('debug_command', namespace='/workflow')
def handle_debug_command(data):
    """处理调试命令"""
    run_id = data.get('run_id')
    command = data.get('command')
    session = DEBUG_SESSIONS.get(run_id)

    if not session:
        logger.warning(f"Received command '{command}' for non-existent or completed run_id '{run_id}'")
        return

    logger.info(f"Received command '{command}' for run_id '{run_id}'")
    
    # 根据session类型执行不同的命令
    if hasattr(session, 'pause') and hasattr(session, 'resume'):  # 支持调试的session
        if command == 'pause':
            session.pause()
        elif command == 'resume':
            session.resume()
        elif command == 'step_over':
            session.step_over()
        elif command == 'terminate':
            session.terminate()
    else:
        logger.warning(f"Session {run_id} does not support debug commands")
        return

    # 发送命令确认
    socketio.emit('debug_command_ack', {
        'run_id': run_id,
        'command': command,
        'status': 'executed'
    }, namespace='/workflow')
    
    logger.info(f"Debug command '{command}' executed for run_id '{run_id}'")

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
    api_key = data.get("apiKey")
    base_url = data.get("apiHost")
    model_name = data.get("model")
    temperature = data.get("temperature", 0.7)
    messages = data.get("messages", [])
    
    # 确保messages列表中包含系统提示词
    if messages and messages[0].get("role") != "system":
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    # 2. 对内置模型的特殊处理：如果apiKey为空，则使用服务器的
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
                    try:
                        yield f"data: {json.dumps({'content': content})}\n\n"
                    except UnicodeEncodeError:
                        # 处理编码错误
                        sanitized_content = content.encode('utf-8', errors='replace').decode('utf-8')
                        yield f"data: {json.dumps({'content': sanitized_content})}\n\n"
            yield f"data: {json.dumps({'end': True})}\n\n"
        except UnicodeError as ue:
            logger.error(f"Unicode error in stream: {ue}")
            yield f"data: {json.dumps({'error': '编码错误，请检查输入内容'})}\n\n"
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
    
    title = completion.choices[0].message.content.strip().replace("\"", "").replace(""", "").replace(""", "")
    
    logger.info(f"Generated title: '{title}' for message: '{user_message[:30]}...'")
    return Response(json.dumps({"title": title}), status=200, mimetype='application/json')

    # except Exception as e:
    #     logger.error(f"An error occurred in /api/generate-title: {e}")
    #     return Response(json.dumps({"error": f"Failed to generate title: {str(e)}"}), status=500, mimetype='application/json')
    

# -------------------------------------------------------------------
#  新增：工作流生成API
# -------------------------------------------------------------------
@app.route("/api/generate-workflow", methods=["POST"])
def generate_workflow():
    """
    根据用户需求生成工作流JSON配置
    """
    data = request.get_json()
    
    if not data:
        return Response(json.dumps({"error": "Request body is missing"}), 
                       status=400, mimetype='application/json')
    
    user_requirement = data.get("requirement")
    if not user_requirement:
        return Response(json.dumps({"error": "Missing 'requirement' field"}), 
                       status=400, mimetype='application/json')
    
    # 获取AI配置
    api_key = data.get("apiKey")
    base_url = data.get("apiHost")
    model_name = data.get("model")
    temperature = data.get("temperature", 0.7)
    
    # 对内置模型的特殊处理
    if model_name and model_name.startswith('Qwen/'):
        if not api_key:
            api_key = os.getenv("SILICONFLOW_API_KEY")
    
    if not api_key:
        return Response(json.dumps({"error": "API key is missing"}), 
                       status=400, mimetype='application/json')
    if not model_name:
        return Response(json.dumps({"error": "Model name is missing"}), 
                       status=400, mimetype='application/json')
    if not base_url:
        return Response(json.dumps({"error": "API Host is missing"}), 
                       status=400, mimetype='application/json')
    
    # 构建专门的工作流生成提示
    workflow_prompt = f"""
请根据用户需求生成完整的工作流JSON配置。

用户需求：{user_requirement}

请按照以下格式回复：
1. 首先分析用户需求，说明工作流的目的和主要功能
2. 然后详细描述工作流的执行步骤和节点配置
3. 最后提供完整的JSON配置

技术要求：
1. 生成的JSON必须包含nodes和edges数组
2. 确保所有节点ID唯一
3. 正确设置节点位置坐标
4. 确保所有required字段都有值
5. 使用正确的变量引用格式

请用```json和```包围JSON代码块。
"""
    
    def stream_generator():
        try:
            client = OpenAI(api_key=api_key, base_url=base_url)
            
            stream = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": workflow_prompt}
                ],
                temperature=temperature,
                stream=True
            )
            
            full_response = ""
            for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    full_response += content
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            # 流式输出结束后，尝试提取和验证JSON
            import re
            json_match = re.search(r'```json\s*\n(.*?)\n```', full_response, re.DOTALL)
            
            if json_match:
                json_str = json_match.group(1)
                try:
                    # 验证JSON格式
                    workflow_json = json.loads(json_str)
                    
                    # 验证是否包含必要字段
                    if 'nodes' in workflow_json and 'edges' in workflow_json:
                        # 发送成功的工作流数据
                        yield f"data: {json.dumps({'workflow': workflow_json, 'success': True})}\n\n"
                    else:
                        yield f"data: {json.dumps({'error': 'Generated JSON is missing required fields'})}\n\n"
                        
                except json.JSONDecodeError as e:
                    yield f"data: {json.dumps({'error': f'Invalid JSON format: {str(e)}'})}\n\n"
            else:
                yield f"data: {json.dumps({'warning': 'No valid JSON found in response'})}\n\n"
            
            # 发送结束信号
            yield f"data: {json.dumps({'end': True})}\n\n"
            
        except Exception as e:
            logger.error(f"Error generating workflow: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(stream_generator(), mimetype="text/event-stream", headers={
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
    })

# -------------------------------------------------------------------
#  新增：断点调试控制API
# -------------------------------------------------------------------

@app.route("/api/debug/<run_id>/command", methods=["POST"])
def debug_command_api(run_id):
    """通过HTTP API发送调试命令"""
    data = request.get_json()
    
    if not data:
        return Response(json.dumps({"error": "Request body is missing"}), 
                       status=400, mimetype='application/json')
    
    command = data.get('command')
    if not command:
        return Response(json.dumps({"error": "Command is required"}), 
                       status=400, mimetype='application/json')
    
    # 验证命令类型
    valid_commands = ['pause', 'resume', 'step_over', 'terminate']
    if command not in valid_commands:
        return Response(json.dumps({"error": f"Invalid command. Valid commands: {valid_commands}"}), 
                       status=400, mimetype='application/json')
    
    # 查找调试会话
    session = DEBUG_SESSIONS.get(run_id)
    if not session:
        return Response(json.dumps({"error": f"Debug session {run_id} not found or has ended"}), 
                       status=404, mimetype='application/json')
    
    try:
        logger.info(f"[HTTP API] Received command '{command}' for run_id '{run_id}'")
        
        # 根据session类型执行不同的命令
        if hasattr(session, 'pause'):  # WorkflowEngine
            if command == 'pause':
                session.pause()
            elif command == 'resume':
                session.resume()
            elif command == 'step_over':
                session.step_over()
            elif command == 'terminate':
                session.terminate()
        elif hasattr(session, 'pause_workflow'):  # WorkflowManager
            workflow_id = session.main_workflow_id
            if command == 'pause':
                session.pause_workflow(workflow_id)
            elif command == 'resume':
                session.resume_workflow(workflow_id)
            elif command == 'terminate':
                # WorkflowManager目前没有terminate方法，可以考虑实现
                logger.warning("WorkflowManager does not support terminate command yet")
                return Response(json.dumps({"error": "Terminate command not supported for WorkflowManager"}), 
                               status=400, mimetype='application/json')
        
        return Response(json.dumps({"message": f"Command '{command}' executed successfully", "run_id": run_id}), 
                       status=200, mimetype='application/json')
        
    except Exception as e:
        logger.error(f"Error executing debug command '{command}' for run_id '{run_id}': {e}")
        return Response(json.dumps({"error": str(e)}), 
                       status=500, mimetype='application/json')

@app.route("/api/debug/<run_id>/status", methods=["GET"])
def get_debug_status(run_id):
    """获取调试会话状态"""
    session = DEBUG_SESSIONS.get(run_id)
    if not session:
        return Response(json.dumps({"error": f"Debug session {run_id} not found"}), 
                       status=404, mimetype='application/json')
    
    try:
        status_info = {
            "run_id": run_id,
            "session_type": "WorkflowEngine" if hasattr(session, 'pause') else "WorkflowManager",
            "is_running": hasattr(session, 'is_running') and session.is_running,
            "is_paused": hasattr(session, 'is_paused') and session.is_paused
        }
        
        return Response(json.dumps(status_info), status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error getting debug status for run_id '{run_id}': {e}")
        return Response(json.dumps({"error": str(e)}), 
                       status=500, mimetype='application/json')

@app.route("/api/debug/sessions", methods=["GET"])
def get_debug_sessions():
    """获取所有活跃的调试会话"""
    try:
        sessions_info = []
        for run_id, session in DEBUG_SESSIONS.items():
            session_info = {
                "run_id": run_id,
                "session_type": "WorkflowEngine" if hasattr(session, 'pause') else "WorkflowManager",
                "is_running": hasattr(session, 'is_running') and session.is_running,
                "is_paused": hasattr(session, 'is_paused') and session.is_paused
            }
            sessions_info.append(session_info)
        
        return Response(json.dumps({"sessions": sessions_info, "total": len(sessions_info)}), 
                       status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error getting debug sessions: {e}")
        return Response(json.dumps({"error": str(e)}), 
                       status=500, mimetype='application/json')

# -------------------------------------------------------------------
#  新增：多工作流管理API
# -------------------------------------------------------------------

@app.route("/api/workflows/status", methods=["GET"])
def get_workflows_status():
    """获取所有工作流的状态"""
    global current_workflow_manager
    
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No active workflow manager"}), status=404, mimetype='application/json')
    
    try:
        status = current_workflow_manager.get_all_workflow_status()
        return Response(json.dumps(status), status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error getting workflow status: {e}")
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/<workflow_id>/status", methods=["GET"])
def get_workflow_status(workflow_id):
    """获取指定工作流的状态"""
    global current_workflow_manager
    
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No active workflow manager"}), status=404, mimetype='application/json')
    
    try:
        status = current_workflow_manager.get_workflow_status(workflow_id)
        if status is None:
            return Response(json.dumps({"error": f"Workflow {workflow_id} not found"}), status=404, mimetype='application/json')
        
        return Response(json.dumps({"workflow_id": workflow_id, "status": status.value}), status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error getting workflow {workflow_id} status: {e}")
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/<workflow_id>/pause", methods=["POST"])
def pause_workflow(workflow_id):
    """暂停指定工作流"""
    global current_workflow_manager
    
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No active workflow manager"}), status=404, mimetype='application/json')
    
    try:
        current_workflow_manager.pause_workflow(workflow_id)
        return Response(json.dumps({"message": f"Workflow {workflow_id} paused successfully"}), status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error pausing workflow {workflow_id}: {e}")
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/<workflow_id>/resume", methods=["POST"])
def resume_workflow(workflow_id):
    """恢复指定工作流"""
    global current_workflow_manager
    
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No active workflow manager"}), status=404, mimetype='application/json')
    
    try:
        current_workflow_manager.resume_workflow(workflow_id)
        return Response(json.dumps({"message": f"Workflow {workflow_id} resumed successfully"}), status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error resuming workflow {workflow_id}: {e}")
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/memory", methods=["GET"])
def get_memory_usage():
    """获取工作流内存使用情况"""
    global current_workflow_manager
    
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No active workflow manager"}), status=404, mimetype='application/json')
    
    try:
        memory_info = current_workflow_manager.get_memory_usage_summary()
        return Response(json.dumps(memory_info), status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error getting memory usage: {e}")
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/memory/cleanup", methods=["POST"])
def force_cleanup_subworkflows():
    """强制清理所有子工作流内存"""
    global current_workflow_manager
    
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No active workflow manager"}), status=404, mimetype='application/json')
    
    try:
        # 获取清理前的内存信息
        before_cleanup = current_workflow_manager.get_memory_usage_summary()
        
        # 执行清理
        current_workflow_manager.force_cleanup_all_subworkflows()
        
        # 获取清理后的内存信息
        after_cleanup = current_workflow_manager.get_memory_usage_summary()
        
        cleanup_result = {
            "message": "Subworkflows cleanup completed",
            "before": before_cleanup,
            "after": after_cleanup,
            "cleaned_workflows": before_cleanup["total_workflows"] - after_cleanup["total_workflows"]
        }
        
        return Response(json.dumps(cleanup_result), status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

@app.route("/api/workflows/<workflow_id>/memory", methods=["GET"])
def get_workflow_memory(workflow_id):
    """获取指定工作流的内存使用情况"""
    global current_workflow_manager
    
    if current_workflow_manager is None:
        return Response(json.dumps({"error": "No active workflow manager"}), status=404, mimetype='application/json')
    
    try:
        memory_summary = current_workflow_manager.get_memory_usage_summary()
        
        # 查找指定工作流的内存信息
        workflow_memory = memory_summary["memory_details"].get(workflow_id)
        
        if workflow_memory is None:
            return Response(json.dumps({"error": f"Workflow {workflow_id} not found or not instantiated"}), 
                          status=404, mimetype='application/json')
        
        return Response(json.dumps(workflow_memory), status=200, mimetype='application/json')
    except Exception as e:
        logger.error(f"Error getting workflow {workflow_id} memory: {e}")
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')

if __name__ == '__main__':
    logger.info("Starting workflow WebSocket server...")
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
    except UnicodeError as ue:
        logger.error(f"Unicode error when starting server: {ue}")
        # 重新设置编码并尝试再次启动
        setup_encoding()
        socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
    # 使用 eventlet 作为 WSGI 服务器
