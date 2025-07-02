import os
import sys
import subprocess
import signal
import logging
import locale
from threading import Thread
import socket
import json
import time
import platform
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.serving import run_simple

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("backend.log")
    ]
)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 记录启动信息
logger.info(f"Python版本: {sys.version}")
logger.info(f"操作系统: {platform.system()} {platform.release()}")
logger.info(f"工作目录: {os.getcwd()}")
logger.info(f"命令行参数: {sys.argv}")

# 全局变量用于记录状态
app_status = {
    "status": "initializing",
    "start_time": time.time(),
    "port": None,
    "platform": platform.system(),
    "errors": []
}

# 健康检查端点
@app.route('/api/status', methods=['GET'])
def health_check():
    """返回后端当前状态"""
    uptime = time.time() - app_status["start_time"]
    
    return jsonify({
        "status": app_status["status"],
        "uptime": uptime,
        "port": app_status["port"],
        "platform": app_status["platform"],
        "cwd": os.getcwd(),
        "errors": app_status["errors"][-5:] if app_status["errors"] else []
    })

# 错误处理
@app.errorhandler(Exception)
def handle_exception(e):
    """记录所有异常，并返回友好的错误信息"""
    error_msg = str(e)
    logger.error(f"发生错误: {error_msg}", exc_info=True)
    
    # 记录错误到状态
    app_status["errors"].append({
        "time": time.time(),
        "message": error_msg
    })
    
    return jsonify({
        "error": error_msg,
        "status": "error"
    }), 500

# 测试路径端点
@app.route('/api/test_path', methods=['POST'])
def test_path():
    """测试文件路径是否存在并可访问"""
    data = request.get_json()
    if not data or 'path' not in data:
        return jsonify({"error": "Missing path parameter"}), 400
    
    path = data['path']
    logger.info(f"测试路径: {path}")
    
    try:
        # 规范化路径
        normalized_path = os.path.normpath(path)
        exists = os.path.exists(normalized_path)
        is_file = os.path.isfile(normalized_path) if exists else False
        is_dir = os.path.isdir(normalized_path) if exists else False
        readable = os.access(normalized_path, os.R_OK) if exists else False
        writable = os.access(normalized_path, os.W_OK) if exists else False
        
        return jsonify({
            "path": path,
            "normalized_path": normalized_path,
            "exists": exists,
            "is_file": is_file,
            "is_dir": is_dir,
            "readable": readable,
            "writable": writable
        })
    except Exception as e:
        logger.error(f"测试路径时出错: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

def find_free_port():
    """找到一个可用的端口"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def run_flask_app(port):
    """在指定端口运行Flask应用"""
    try:
        logger.info(f"正在启动后端服务，端口: {port}")
        app_status["status"] = "starting"
        app_status["port"] = port
        
        # 启动Flask应用
        run_simple('localhost', port, app, threaded=True, use_reloader=False)
    except Exception as e:
        logger.error(f"启动Flask应用时出错: {str(e)}", exc_info=True)
        app_status["status"] = "error"
        app_status["errors"].append({
            "time": time.time(),
            "message": str(e)
        })
        sys.exit(1)

def main():
    """主函数，解析命令行参数并启动服务"""
    try:
        # 使用命令行参数指定的端口，或者默认使用4000
        port = 4000
        if len(sys.argv) > 1:
            try:
                port = int(sys.argv[1])
            except ValueError:
                logger.warning(f"无效的端口号: {sys.argv[1]}，使用默认端口4000")
        
        logger.info(f"使用端口: {port}")
        
        # 更新状态
        app_status["status"] = "running"
        app_status["port"] = port
        
        # 启动Flask应用
        run_flask_app(port)
    except Exception as e:
        logger.error(f"后端启动失败: {str(e)}", exc_info=True)
        app_status["status"] = "error"
        app_status["errors"].append({
            "time": time.time(),
            "message": str(e)
        })
        sys.exit(1)

if __name__ == "__main__":
    main() 