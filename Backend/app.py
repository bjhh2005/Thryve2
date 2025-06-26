# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from workflows.Engine import WorkflowEngine


app = Flask(__name__)
CORS(app)

# 设置详细的日志记录
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.route('/api/task/run', methods=['POST'])
def execute_workflow():
    logger.info("Received workflow execution request")
    workflow_data = request.json

    enginner = WorkflowEngine(workflow_data)
    enginner.run()
    
    return jsonify({
        "status": "success",
        "data": enginner.nodes,
        "message": "Workflow processed successfully"
    })
    



if __name__ == '__main__':
    app.run(debug=True, port=4000)