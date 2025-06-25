from flask import Flask, jsonify, Response
from flask_cors import CORS
import time
import json
import threading
import uuid

app = Flask(__name__)
CORS(app)

tasks = {}

def process_task(task_id):
    try:
        tasks[task_id]['status'] = 'running'
        
        for i in range(1, 11):
            if task_id not in tasks or tasks[task_id]['status'] == 'cancelled':
                break
                
            time.sleep(1)
            tasks[task_id]['progress'] = i * 10
            tasks[task_id]['message'] = f'正在处理: {i}/10'
            
        if task_id in tasks and tasks[task_id]['status'] != 'cancelled':
            tasks[task_id]['status'] = 'completed'
            tasks[task_id]['progress'] = 100
            tasks[task_id]['message'] = '完成!'
            
    except Exception as e:
        if task_id in tasks:
            tasks[task_id]['status'] = 'error'
            tasks[task_id]['message'] = f'错误: {str(e)}'

@app.route('/start-task', methods=['POST'])
def start_task():
    task_id = str(uuid.uuid4())
    
    tasks[task_id] = {
        'status': 'pending',
        'progress': 0,
        'message': '开始处理...'
    }
    
    thread = threading.Thread(target=process_task, args=(task_id,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'task_id': task_id})

@app.route('/task-status/<task_id>')
def get_task_status(task_id):
    def generate():
        while task_id in tasks:
            task_info = tasks[task_id].copy()
            yield f"data: {json.dumps(task_info)}\n\n"
            
            if task_info['status'] in ['completed', 'error', 'cancelled']:
                break
                
            time.sleep(0.5)
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    )

if __name__ == '__main__':
    print("Flask服务器启动在: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)