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

# 创建SocketIO实例，支持/workflow命名空间
socketio = SocketIO(app, cors_allowed_origins="*")

# 设置详细的日志记录
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
    

# 执行中连接
def engineConnect(engine : WorkflowEngine):

    # 这里的所有的message的传递应该都是str类型的
    engine.bus.on('workflow', lambda nodeId:socketio.emit('workflow', {"nodeId" : nodeId}, namespace='/workflow'))

    # 选择从 info , warning , error
    engine.bus.on('message', lambda event,nodeId,message:socketio.emit(event, {"data":nodeId, "message" : message},namespace='/workflow'))

    engine.bus.on("nodes_output", lambda nodeId, message: socketio.emit('nodes_output', {"data":nodeId, "message" : message} , namespace='/workflow'))


def execute_workflow_task(workflow_data):
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
        

@socketio.on('connect', namespace='/workflow')
def handle_connect():
    logger.info('Client connected to /workflow namespace')

@socketio.on('disconnect', namespace='/workflow')
def handle_disconnect():
    logger.info('Client disconnected from /workflow namespace')

@socketio.on('start_process', namespace='/workflow')
def handle_start_process(workflow_data):
    
    # Execute workflow in new thread to avoid blocking WebSocket
    thread = threading.Thread(target=execute_workflow_task, args=(workflow_data,))
    thread.start()


if __name__ == '__main__':
    logger.info("Starting workflow WebSocket server...")
    socketio.run(app, debug=True, port=4000)