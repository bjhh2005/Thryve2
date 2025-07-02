@echo off
echo 开始修复DLL问题...
chcp 65001

:: 获取安装目录
set /p INSTALL_DIR=请输入Thryve_front.exe所在的完整路径 (例如 F:\Thryve\Thryve_front): 

:: 检查目录是否存在
if not exist "%INSTALL_DIR%" (
    echo 错误: 指定的目录不存在!
    exit /b 1
)

:: 检查前端可执行文件是否存在
if not exist "%INSTALL_DIR%\Thryve_front.exe" (
    echo 错误: 在指定目录中找不到Thryve_front.exe!
    exit /b 1
)

echo 检测到Thryve_front.exe，开始修复...

:: 创建_internal目录
if not exist "%INSTALL_DIR%\_internal" (
    echo 创建_internal目录...
    mkdir "%INSTALL_DIR%\_internal"
)

:: 检查是否存在已构建的后端
if exist "Backend\dist\Thryve_back\_internal\python311.dll" (
    echo 从构建目录复制Python DLL...
    copy "Backend\dist\Thryve_back\_internal\python311.dll" "%INSTALL_DIR%\_internal\"
    copy "Backend\dist\Thryve_back\_internal\python311.dll" "%INSTALL_DIR%\"
    echo Python DLL已复制
    
    echo 复制其他必要的DLL文件...
    xcopy /E /I /Y "Backend\dist\Thryve_back\_internal\*.*" "%INSTALL_DIR%\_internal\"
    echo 其他DLL文件已复制
) else (
    echo 未找到构建的后端，尝试从Python安装目录复制...
    
    :: 检查Python安装
    where python >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        :: 获取Python路径
        for /f "tokens=*" %%i in ('python -c "import sys, os; print(os.path.dirname(sys.executable))"') do set PYTHON_DIR=%%i
        echo 找到Python安装目录: %PYTHON_DIR%
        
        if exist "%PYTHON_DIR%\python311.dll" (
            echo 从Python目录复制DLL...
            copy "%PYTHON_DIR%\python311.dll" "%INSTALL_DIR%\_internal\"
            copy "%PYTHON_DIR%\python311.dll" "%INSTALL_DIR%\"
            echo Python DLL已复制
        ) else (
            echo 在Python目录中未找到python311.dll
            
            :: 尝试从系统目录复制
            if exist "C:\Windows\System32\python311.dll" (
                echo 从系统目录复制DLL...
                copy "C:\Windows\System32\python311.dll" "%INSTALL_DIR%\_internal\"
                copy "C:\Windows\System32\python311.dll" "%INSTALL_DIR%\"
                echo Python DLL已复制
            ) else (
                echo 错误: 无法找到Python DLL!
                echo 请安装Python 3.11并重试。
                exit /b 1
            )
        )
    ) else (
        echo Python未安装，无法自动修复。
        echo 请安装Python 3.11并重试。
        exit /b 1
    )
)

:: 检查后端可执行文件
if not exist "%INSTALL_DIR%\Thryve_back.exe" (
    echo 警告: 在指定目录中找不到Thryve_back.exe
    
    if exist "Backend\dist\Thryve_back\Thryve_back.exe" (
        echo 复制后端可执行文件...
        copy "Backend\dist\Thryve_back\Thryve_back.exe" "%INSTALL_DIR%\"
        echo 后端可执行文件已复制
        
        :: 复制workflows目录
        if exist "Backend\dist\Thryve_back\workflows" (
            echo 复制workflows目录...
            xcopy /E /I /Y "Backend\dist\Thryve_back\workflows" "%INSTALL_DIR%\workflows\"
        )
    ) else {
        echo 找不到后端可执行文件源，请重新构建应用。
    }
)

echo 修复完成! 请尝试重新启动应用。
echo 如果问题仍然存在，请尝试重新构建整个应用。

pause 