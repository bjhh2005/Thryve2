# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask_cors import CORS
# from workflows.engine import WorkflowExecutor
import logging

app = Flask(__name__)
CORS(app)

# 设置详细的日志记录
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.route('/api/task/run', methods=['POST'])
def execute_workflow():

    logger.info("Received workflow execution request")
    workflow_data = request.json
    logger.info(f"Workflow data: {workflow_data}")

    return jsonify({"status" : 'success', "message" : "Hello World"})

if __name__ == '__main__':
    app.run(debug=True, port=4000)