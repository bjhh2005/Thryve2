# -*- coding: utf-8 -*-
from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import threading
import logging
from workflows.Engine import WorkflowEngine

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-workflow-secret-key'
CORS(app)

# 创建SocketIO实例，支持/api命名空间
socketio = SocketIO(app, cors_allowed_origins="*")

# 设置详细的日志记录
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
    

# 执行中连接
def engineConnect(engine : WorkflowEngine):

    # 这里的所有的message的传递应该都是str类型的
    engine.bus.on('workflow', lambda nodeId:socketio.emit('workflow', nodeId, namespace='workflow'))

    # 选择从 info , warning , error
    engine.bus.on('message', lambda event,message:socketio.emit(event, message,namespace='workflow'))

    engine.bus.on("nodes_output", lambda message: socketio.emit('nodes_output', message , namespace='workflow'))


def execute_workflow_task(workflow_data):
    """在后台线程中执行工作流任务"""

    logger.info("开始执行工作流任务")
    
    # 创建工作流引擎
    engine = WorkflowEngine(workflow_data)
    
    engineConnect(engine)

    # 运行工作流（这里需要修改你的Engine类来支持回调）
    engine.run()

    # 发送结束信号
    socketio.emit('over', {
        'message': '工作流执行成功',
        'data': 0,
        'status': 'success'
    }, namespace='/api')
        

@socketio.on('connect', namespace='/api')
def handle_connect():
    logger.info('客户端连接到 /api 命名空间')

@socketio.on('disconnect', namespace='/api')
def handle_disconnect():
    logger.info('客户端从 /api 命名空间断开连接')

@socketio.on('start_process', namespace='/api')
def handle_start_process(workflow_data):
    
    # 在新线程中执行工作流，避免阻塞WebSocket
    thread = threading.Thread(target=execute_workflow_task, args=(workflow_data,))
    thread.start()


if __name__ == '__main__':
    logger.info("启动工作流WebSocket服务器...")
    socketio.run(app, debug=True, port=4000)