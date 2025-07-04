import React, { useEffect, useRef, memo } from 'react';
import { useExecution, LogEntry } from '../../../context/ExecutionProvider';
import { IconTriangleDown } from '@douyinfe/semi-icons';
import './ConsolePanel.less';

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

export const ConsolePanel = memo(() => {
    const { logs, clearLogs } = useExecution();
    const logContainerRef = useRef<HTMLDivElement>(null);

    // 自动滚动逻辑保持不变
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
                        <span>Waiting for workflow execution...</span>
                    </div>
                ) : (
                    logs.map((log) => <LogEntryView key={log.id} log={log} />)
                )}
            </div>
            <div className="left-sidebar-panel-footer">
                <button className="sidebar-button" onClick={clearLogs}>Clear Logs</button>
            </div>
        </div>
    );
});