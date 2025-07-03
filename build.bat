@echo off
echo 开始打包流程...
chcp 65001

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

echo 后端打包完成!

:: 2. 进入前端目录准备打包
echo 准备前端打包环境...
cd ..\Fronted1
call npm install
if %ERRORLEVEL% neq 0 (
    echo 安装前端依赖失败!
    exit /b %ERRORLEVEL%
)

:: 3. 直接使用electron:build:zrx进行打包
echo 开始打包前端和应用...
:: 确保后端目录存在
if not exist "..\Backend\dist\Thryve_back" (
    echo 错误: 后端打包目录未找到!
    exit /b 1
)

echo 正在打包应用...
call npm run electron:build:zrx
if %ERRORLEVEL% neq 0 (
    echo Electron 打包失败!
    exit /b %ERRORLEVEL%
)

@REM :: 4. 验证打包结果并进行后续处理
@REM echo 验证打包结果...

@REM :: 检查各种可能的输出目录
@REM if exist "release\win-unpacked" (
@REM     echo 找到解压目录: release\win-unpacked
@REM     SET UNPACK_DIR=release\win-unpacked
@REM ) else (
@REM     echo 尝试查找其他可能的输出目录...
@REM     if exist "dist\win-unpacked" (
@REM         echo 找到解压目录: dist\win-unpacked
@REM         SET UNPACK_DIR=dist\win-unpacked
@REM     ) else if exist "dist\win" (
@REM         echo 找到解压目录: dist\win
@REM         SET UNPACK_DIR=dist\win
@REM     ) else (
@REM         echo 警告: 未找到解压目录，创建临时目录...
@REM         mkdir "dist\win-unpacked"
@REM         SET UNPACK_DIR=dist\win-unpacked
@REM     )
@REM )

@REM :: 确保后端资源正确集成
@REM echo 检查和补充后端资源文件...

@REM :: 确保backend目录存在
@REM if not exist "%UNPACK_DIR%\resources\backend" (
@REM     echo 创建backend资源目录...
@REM     mkdir "%UNPACK_DIR%\resources\backend"
@REM )

@REM :: 确保后端文件已经被正确复制
@REM if not exist "%UNPACK_DIR%\resources\backend\Thryve_back.exe" (
@REM     echo 复制后端可执行文件到resources/backend...
@REM     xcopy /E /I /Y "..\Backend\dist\Thryve_back" "%UNPACK_DIR%\resources\backend\"
@REM     if %ERRORLEVEL% neq 0 (
@REM         echo 复制后端文件失败!
@REM         exit /b %ERRORLEVEL%
@REM     )
@REM )

@REM :: 确保后端文件也复制到前端EXE同级目录
@REM echo 复制后端文件到前端EXE同级目录...
@REM xcopy /E /I /Y "..\Backend\dist\Thryve_back" "%UNPACK_DIR%\"

@REM :: 确保_internal目录和Python DLL在前端EXE同级目录
@REM echo 检查_internal目录和Python DLL...
@REM if not exist "%UNPACK_DIR%\_internal" (
@REM     echo 复制_internal目录到前端EXE同级目录...
@REM     if exist "..\Backend\dist\Thryve_back\_internal" (
@REM         xcopy /E /I /Y "..\Backend\dist\Thryve_back\_internal" "%UNPACK_DIR%\_internal\"
@REM     ) else (
@REM         echo 警告: _internal目录未找到!
@REM     )
@REM )

@REM :: 检查Python DLL
@REM if not exist "%UNPACK_DIR%\_internal\python311.dll" (
@REM     echo 查找并复制Python DLL...
@REM     if exist "..\Backend\dist\Thryve_back\_internal\python311.dll" (
@REM         copy "..\Backend\dist\Thryve_back\_internal\python311.dll" "%UNPACK_DIR%\_internal\"
@REM         copy "..\Backend\dist\Thryve_back\_internal\python311.dll" "%UNPACK_DIR%\"
@REM         echo Python DLL已复制
@REM     ) else (
@REM         echo 警告: Python DLL未找到!
@REM     )
@REM )

:: 输出成功信息和最终应用位置
echo ========================================
echo 打包完成!
echo NSIS安装包位于: Fronted1\release 目录
echo ========================================

:: 返回到原始目录
cd .. 