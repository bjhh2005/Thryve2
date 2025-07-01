import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import openai
import pandas
import numpy
import PyPDF2
import fitz  # PyMuPDF
import PIL
import markdown
import frontmatter
import pdfkit
import pypandoc
import dotenv

# 导入主应用
from app import app, socketio

if __name__ == '__main__':
    # 设置环境变量
    dotenv.load_dotenv()
    
    # 启动应用
    socketio.run(app, host='127.0.0.1', port=4000, allow_unsafe_werkzeug=True) 