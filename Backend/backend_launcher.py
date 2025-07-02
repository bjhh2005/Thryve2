import os
import sys
import subprocess
import signal
import logging
import locale
from threading import Thread

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 设置默认编码
def setup_encoding():
    """设置正确的编码环境"""
    try:
        # 记录当前编码信息，便于调试
        default_encoding = sys.getdefaultencoding()
        preferred_encoding = locale.getpreferredencoding()
        logger.info(f"Default encoding: {default_encoding}")
        logger.info(f"Preferred encoding: {preferred_encoding}")
        
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

# 获取资源路径
def resource_path(relative_path):
    """获取资源的绝对路径，支持开发环境和打包环境"""
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.abspath(relative_path)

# 启动 Flask 服务
def start_flask(port=4000, debug=False):
    try:
        # 导入 Flask 应用
        from app import app, socketio
        
        # 设置环境变量
        os.environ['FLASK_ENV'] = 'production'
        
        # 添加状态检查路由
        @app.route('/api/status', methods=['GET'])
        def status_check():
            from flask import jsonify
            return jsonify({
                'status': 'online',
                'service': 'backend',
                'version': '1.0.0'
            }), 200
        
        logger.info(f"Starting Flask server on port {port}")
        logger.info(f"API base URL: http://localhost:{port}/api")
        
        # 设置允许跨域，确保前端可以访问
        @app.after_request
        def after_request(response):
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
        
        # 使用try-except包装socketio.run以捕获可能的编码错误
        try:
            socketio.run(app, host='127.0.0.1', port=port, debug=debug)
        except UnicodeDecodeError as ue:
            logger.error(f"Unicode decode error in Flask server: {ue}")
            logger.info("Attempting to restart with strict encoding settings...")
            # 尝试重启，使用严格的编码设置
            setup_encoding()
            socketio.run(app, host='127.0.0.1', port=port, debug=debug)
    except Exception as e:
        logger.error(f"Failed to start Flask server: {e}")
        sys.exit(1)

# 主函数
def main():
    try:
        # 首先设置编码环境
        setup_encoding()
        
        # 解析命令行参数
        port = 4000  # 默认端口
        if len(sys.argv) > 1:
            try:
                port = int(sys.argv[1])
                logger.info(f"Using port from command line: {port}")
            except ValueError:
                logger.warning(f"Invalid port specified: {sys.argv[1]}, using default: {port}")
        
        # 输出当前工作目录，便于调试
        logger.info(f"Current working directory: {os.getcwd()}")
        
        # 检查是否在 PyInstaller 环境中
        if hasattr(sys, '_MEIPASS'):
            logger.info(f"Running in PyInstaller bundle. MEIPASS: {sys._MEIPASS}")
        
        # 启动 Flask 服务
        logger.info("Starting backend service...")
        start_flask(port=port, debug=False)
    except KeyboardInterrupt:
        logger.info("Backend service stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 