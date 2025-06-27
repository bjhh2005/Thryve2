import { createContext, useState, useContext, useCallback, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid'; // 用于生成唯一ID，需安装: npm install uuid @types/uuid

// 日志条目的类型定义
export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'SYSTEM' | 'OUTPUT';
    message: string;
    nodeId?: string;
}

// Context 的类型定义
interface ConsoleContextType {
    logs: LogEntry[];
    isRunning: boolean;
    addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
    startExecution: (documentData: any) => void; // 修改：由外部传入工作流数据
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export const ConsoleProvider = ({ children }: { children: ReactNode }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newLog: LogEntry = {
            ...log,
            id: uuidv4(),
            timestamp: new Date().toLocaleTimeString(),
        };
        setLogs(prevLogs => [...prevLogs, newLog]);
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const startExecution = useCallback((documentData: any) => {
        if (isRunning || socketRef.current) return;

        clearLogs(); // 每次开始前清空日志
        setIsRunning(true);
        addLog({ level: 'SYSTEM', message: '正在连接到执行服务器...' });

        const socket = io('http://localhost:4000/workflow', {
            reconnection: true, // 允许重连
            reconnectionAttempts: 3, // 最多重连3次
            reconnectionDelay: 1000, // 重连延迟1秒
            timeout: 5000, // 连接超时5秒
        });
        socketRef.current = socket;
// 监听后端发来的各种日志事件
        socket.on('info', (data) => addLog({ level: 'INFO', message: data.message, nodeId: data.nodeId }));
        socket.on('warning', (data) => addLog({ level: 'WARN', message: data.message, nodeId: data.nodeId }));
        socket.on('error', (data) => addLog({ level: 'ERROR', message: data.message, nodeId: data.nodeId }));

        socket.on('nodes_output', (data) => {
            
            addLog({
                level: 'OUTPUT',
                message: data.message,
                nodeId: data.nodeId
            });
        });

        socket.on('over', (data) => {
            addLog({ level: 'SUCCESS', message: `执行完成。${data.message}` });
            setIsRunning(false);
            socket.close();
            socketRef.current = null;
        });

        socket.on('connect_error', (error) => {
            addLog({ level: 'ERROR', message: `连接失败: ${error.message}` });
            setIsRunning(false);
            socketRef.current = null;
        });
        socket.on('connect', () => {
            addLog({ level: 'SUCCESS', message: '连接成功，正在启动工作流...' });
            socket.emit('start_process', documentData);
        });

        
    }, [isRunning, addLog, clearLogs]);

    const value = { logs, isRunning, addLog, clearLogs, startExecution };

    return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
};

// 自定义Hook
export const useConsole = () => {
    const context = useContext(ConsoleContext);
    if (!context) throw new Error('useConsole must be used within a ConsoleProvider');
    return context;
};