import React, { useEffect, useRef } from 'react';
import { useConsole, LogEntry } from '../../context/ConsoleProvider';
import { IconTriangleDown } from '@douyinfe/semi-icons';
import '../../context/console.css';

// 单条日志的渲染组件，用于实现不同级别的样式
const LogEntryView: React.FC<{ log: LogEntry }> = ({ log }) => {
    return (
        <div className={`console-log console-log-${log.level}`}>
            <span className="console-timestamp">{log.timestamp}</span>
            <span className="console-type">{log.level}</span>
            <span className="log-message">{log.message}</span>
            {log.nodeId && <span className="console-node-id">{log.nodeId}</span>}
        </div>
    );
};

export const ConsolePanel = () => {
    const { logs, clearLogs } = useConsole();
    const logContainerRef = useRef<HTMLDivElement>(null);

    // 实现自动滚动到底部的效果
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="left-sidebar-panel console-panel">
            <div className="left-sidebar-panel-content" ref={logContainerRef}>
                {logs.length === 0 ? (
                    <div className="console-placeholder">
                        <IconTriangleDown />
                        <span>等待工作流执行...</span>
                    </div>
                ) : (
                    logs.map((log) => <LogEntryView key={log.id} log={log} />)
                )}
            </div>
            <div className="left-sidebar-panel-footer">
                <button className="sidebar-button" onClick={clearLogs}>清空日志</button>
            </div>
        </div>
    );
};