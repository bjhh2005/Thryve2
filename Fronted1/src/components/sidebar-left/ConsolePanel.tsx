import React from 'react';

export const ConsolePanel = () => {
    return (
        <div className="left-sidebar-panel">
            <div className="left-sidebar-panel-content">
                <pre>
                    <code>{`[${new Date().toLocaleTimeString()}] 工作流初始化...`}</code>
                    <br />
                    <code>{`[${new Date().toLocaleTimeString()}] 等待执行...`}</code>
                </pre>
            </div>
            <div className="left-sidebar-panel-footer">
                <button className="sidebar-button">清空日志</button>
            </div>
        </div>
    );
};