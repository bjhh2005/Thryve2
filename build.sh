#!/bin/bash
echo "开始打包流程..."

# 1. 进入后端目录打包
echo "打包后端..."
cd Backend
pip install -r requirements.txt
pyinstaller backend.spec
if [ $? -ne 0 ]; then
    echo "后端打包失败!"
    exit 1
fi
echo "后端打包完成!"

# 2. 进入前端目录打包
echo "打包前端..."
cd ../Fronted1
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "前端打包失败!"
    exit 1
fi
echo "前端打包完成!"

# 3. 打包 Electron 应用
echo "打包 Electron 应用..."
npm run electron:build
if [ $? -ne 0 ]; then
    echo "Electron 打包失败!"
    exit 1
fi
echo "Electron 打包完成!"

# 4. 完成
echo "打包流程已完成!"
echo "应用安装包位于: Fronted1/release 目录"

cd .. 