@echo off
echo 开始打包流程...
chcp 65001

:: 1. 进入后端目录打包
echo 打包后端...
cd Backend
pip install -r requirements.txt
pyinstaller backend.spec
if %ERRORLEVEL% neq 0 (
    echo 后端打包失败!
    exit /b %ERRORLEVEL%
)

:: 验证后端可执行文件存在
if not exist "dist\backend\backend.exe" (
    echo 错误: backend.exe 文件未找到!
    exit /b 1
)
echo 后端打包完成!

:: 2. 进入前端目录打包
echo 打包前端...
cd ..\Fronted1
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo 前端打包失败!
    exit /b %ERRORLEVEL%
)
echo 前端打包完成!

:: 3. 打包 Electron 应用
echo 打包 Electron 应用...
:: 确保后端目录在正确位置
if not exist "..\Backend\dist\backend" (
    echo 错误: 后端打包目录未找到!
    exit /b 1
)

:: 直接打包应用
call npm run electron:build
if %ERRORLEVEL% neq 0 (
    echo Electron 打包失败!
    exit /b %ERRORLEVEL%
)

:: 4. 验证打包结果
echo 验证打包结果...
if not exist "release\win-unpacked\resources\backend" (
    echo 警告: 资源目录中没有找到后端文件夹，创建目录...
    mkdir "release\win-unpacked\resources\backend"
)

:: 确保后端文件已经被正确复制
if not exist "release\win-unpacked\resources\backend\backend.exe" (
    echo 警告: 后端可执行文件未被正确复制，手动复制...
    copy "..\Backend\dist\backend\backend.exe" "release\win-unpacked\resources\backend\"
    if %ERRORLEVEL% neq 0 (
        echo 复制后端文件失败!
        exit /b %ERRORLEVEL%
    )
)

echo Electron 打包完成!

:: 5. 完成
echo 打包流程已完成!
echo 应用安装包位于: Fronted1\release 目录

cd .. 