@echo off
echo 开始打包流程...
chcp 65001

:: 设置临时变量用于存储状态
SET BACKEND_BUILT=0
SET FRONTEND_BUILT=0

:: 检查PyInstaller版本
echo 检查PyInstaller版本...
pip show pyinstaller
if %ERRORLEVEL% neq 0 (
    echo PyInstaller未安装，正在安装...
    pip install pyinstaller==5.13.2
    if %ERRORLEVEL% neq 0 (
        echo 安装PyInstaller失败!
        exit /b %ERRORLEVEL%
    )
)

:: 清理之前的构建文件
echo 清理之前的构建文件...
cd Backend
if exist "build" rmdir /s /q build
if exist "dist" rmdir /s /q dist
if exist "__pycache__" rmdir /s /q __pycache__

:: 1. 进入后端目录打包
echo 打包后端...
pip install -r requirements.txt
pyinstaller backend.spec --clean
if %ERRORLEVEL% neq 0 (
    echo 后端打包失败!
    exit /b %ERRORLEVEL%
)

:: 验证后端可执行文件存在
if not exist "dist\Thryve_back\Thryve_back.exe" (
    echo 错误: Thryve_back.exe 文件未找到!
    exit /b 1
)
echo 后端打包完成!
SET BACKEND_BUILT=1

:: 复制workflows文件夹到dist目录，确保它存在
if not exist "dist\Thryve_back\workflows" (
    echo 复制workflows文件夹到dist目录...
    mkdir "dist\Thryve_back\workflows"
    xcopy /E /I /Y "workflows" "dist\Thryve_back\workflows"
)

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
SET FRONTEND_BUILT=1

:: 3. 打包 Electron 应用
echo 打包 Electron 应用...
:: 确保后端目录在正确位置
if not exist "..\Backend\dist\Thryve_back" (
    echo 错误: 后端打包目录未找到!
    exit /b 1
)

:: 询问用户选择打包模式
echo 请选择打包模式:
echo 1 - 安装包模式 (NSIS)
echo 2 - 便携版模式 (Portable)
echo 3 - 仅目录模式 (不打包)
SET /P PACK_MODE="请输入数字(默认:3): "

if "%PACK_MODE%"=="1" (
    echo 正在使用NSIS模式打包...
    call npm run electron:build:zrx
) else if "%PACK_MODE%"=="2" (
    echo 正在使用便携版模式打包...
    call npm run electron:build:portable
) else (
    echo 使用目录模式，不创建安装包...
    call npm run package:all
)

if %ERRORLEVEL% neq 0 (
    echo Electron 打包失败! 尝试使用目录模式...
    call npm run package:all
    if %ERRORLEVEL% neq 0 (
        echo 目录模式打包也失败! 检查日志获取更多信息。
        :: 继续执行以确保文件被复制
    )
)

:: 4. 验证打包结果
echo 验证打包结果...

:: 检查release\win-unpacked目录是否存在
if exist "release\win-unpacked" (
    echo 找到解压目录: release\win-unpacked
    SET UNPACK_DIR=release\win-unpacked
) else (
    echo 尝试查找其他可能的输出目录...
    if exist "dist\win-unpacked" (
        echo 找到解压目录: dist\win-unpacked
        SET UNPACK_DIR=dist\win-unpacked
    ) else if exist "dist\win" (
        echo 找到解压目录: dist\win
        SET UNPACK_DIR=dist\win
    ) else (
        echo 警告: 未找到解压目录，创建临时目录...
        mkdir "dist\win-unpacked"
        SET UNPACK_DIR=dist\win-unpacked
    )
)

if not exist "%UNPACK_DIR%\resources\backend" (
    echo 警告: 资源目录中没有找到后端文件夹，创建目录...
    mkdir "%UNPACK_DIR%\resources\backend"
)

:: 确保后端文件已经被正确复制
if not exist "%UNPACK_DIR%\resources\backend\Thryve_back.exe" (
    echo 警告: 后端可执行文件未被正确复制，手动复制...
    xcopy /E /I /Y "..\Backend\dist\Thryve_back" "%UNPACK_DIR%\resources\backend\"
    if %ERRORLEVEL% neq 0 (
        echo 复制后端文件失败!
        exit /b %ERRORLEVEL%
    )
)

:: 确保后端文件也复制到前端EXE同级目录
echo 复制后端文件到前端EXE同级目录...
xcopy /E /I /Y "..\Backend\dist\Thryve_back" "%UNPACK_DIR%\"

:: 确保_internal目录和Python DLL在前端EXE同级目录
echo 检查_internal目录和Python DLL...
if not exist "%UNPACK_DIR%\_internal" (
    echo 复制_internal目录到前端EXE同级目录...
    if exist "..\Backend\dist\Thryve_back\_internal" (
        xcopy /E /I /Y "..\Backend\dist\Thryve_back\_internal" "%UNPACK_DIR%\_internal\"
    ) else (
        echo 警告: _internal目录未找到!
    )
)

:: 检查Python DLL
if not exist "%UNPACK_DIR%\_internal\python311.dll" (
    echo 查找并复制Python DLL...
    if exist "..\Backend\dist\Thryve_back\_internal\python311.dll" (
        copy "..\Backend\dist\Thryve_back\_internal\python311.dll" "%UNPACK_DIR%\_internal\"
        copy "..\Backend\dist\Thryve_back\_internal\python311.dll" "%UNPACK_DIR%\"
        echo Python DLL已复制
    ) else (
        echo 警告: Python DLL未找到!
    )
)

:: 输出成功信息
echo 打包完成!
if "%PACK_MODE%"=="1" (
    echo NSIS安装包位于 Fronted1\release 目录
) else if "%PACK_MODE%"=="2" (
    echo 便携版可执行文件位于 Fronted1\release 目录
) else (
    echo 应用位于 Fronted1\%UNPACK_DIR% 目录
)

cd .. 