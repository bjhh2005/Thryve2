import { createContext, useState, useContext, useCallback, ReactNode, useRef, useEffect } from 'react';
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
    startExecution: (documentData: any, clickId: string) => void;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export const ConsoleProvider = ({ children }: { children: ReactNode }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // 这对于防止热重载和严格模式下的内存泄漏至关重要
    useEffect(() => {
        // 这个返回的函数就是“清理函数”
        return () => {
            if (socketRef.current) {
                console.log('[ConsoleProvider] Unmounting, closing existing socket.');
                socketRef.current.disconnect();
                socketRef.current.close();
            }
        };
    }, []); // 空依赖数组意味着这个 effect 只在组件挂载和卸载时运行一次


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

    const startExecution = useCallback((documentData: any, clickId: string) => {
        // if (isRunning) {
        //     console.warn("An execution is already in progress.");
        //     return;
        // }

        console.log(`%c[Provider] startExecution invoked with Click ID: ${clickId}`, 'color: red; font-weight: bold;');

        //  在创建新连接之前，先显式地关闭并清理任何可能存在的旧连接
        if (socketRef.current) {
            console.warn("Execution blocked: A connection is already active or connecting.");
            return;
        }

        clearLogs(); // 每次开始前清空日志
        setIsRunning(true);
        addLog({ level: 'SYSTEM', message: 'Connecting to execution server...' });

        const socket = io('http://localhost:4000/workflow', {
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            timeout: 5000,
        });
        socketRef.current = socket;

        const cleanup = () => {
            console.log(`[ConsoleProvider] Cleaning up socket ${socket.id}`);
            setIsRunning(false);
            // 只在 ref 中存储的确实是当前这个 socket 时才清理
            // 防止后续操作错误地清理了一个新的 socket
            if (socketRef.current === socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };

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
            const level = data.status === 'success' ? 'SUCCESS' : 'ERROR';
            addLog({ level, message: data.message });
            // setIsRunning(false);
            // socket.close();
            // socketRef.current = null;
            cleanup();
        });

        socket.on('connect_error', (error) => {
            addLog({ level: 'ERROR', message: `Connection failed: ${error.message}` });
            // setIsRunning(false);
            // socketRef.current = null;
            cleanup();
        });
        socket.once('connect', () => {
            addLog({ level: 'SUCCESS', message: 'Connected successfully, starting workflow...' });
            socket.emit('start_process', documentData);
        });

        socket.on('disconnect', (reason) => {
            addLog({ level: 'WARN', message: `Disconnected from server: ${reason}` });
            cleanup();
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