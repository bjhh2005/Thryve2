// src/context/ExecutionProvider.tsx (最终统一版)

import { createContext, useState, useContext, useCallback, ReactNode, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// --- 类型定义区 ---
export type NodeStatus = 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'IDLE';
export type NodeStatusMap = Record<string, NodeStatus>;

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'SYSTEM' | 'OUTPUT';
    message: string;
    nodeId?: string;
}

// 统一的 Context 类型
interface ExecutionContextType {
    logs: LogEntry[];
    isRunning: boolean;
    nodeStatuses: NodeStatusMap;
    startExecution: (documentData: any) => void;
    clearLogs: () => void;
}

const ExecutionContext = createContext<ExecutionContextType | undefined>(undefined);

export const ExecutionProvider = ({ children }: { children: ReactNode }) => {
    // --- 统一的状态管理 ---
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [nodeStatuses, setNodeStatuses] = useState<NodeStatusMap>({});
    const socketRef = useRef<Socket | null>(null);

    // addLog 函数保持不变
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

    // 组件卸载时的最终清理
    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    // --- 统一的执行函数 ---
    const startExecution = useCallback((documentData: any) => {
        if (socketRef.current) {
            console.warn("Execution blocked: An active socket instance already exists.");
            return;
        }

        clearLogs();
        // 重置所有状态
        setLogs([]);
        setNodeStatuses({});
        setIsRunning(true);
        addLog({ level: 'SYSTEM', message: 'Connecting to execution server...' });

        const socket = io('http://localhost:4000/workflow', {
            reconnection: false,
            transports: ['websocket'],
        });
        socketRef.current = socket;

        // 统一的清理函数
        const cleanup = () => {
            setIsRunning(false);
            if (socketRef.current === socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };

        // --- 统一的事件监听 ---
        socket.once('connect', () => {
            addLog({ level: 'SUCCESS', message: `Connected with ID: ${socket.id}. Starting workflow...` });
            socket.emit('start_process', documentData);
        });

        socket.on('node_status_change', (data: { nodeId: string; status: NodeStatus; error?: string }) => {
            // 同时更新节点状态和添加日志
            setNodeStatuses(prev => ({ ...prev, [data.nodeId]: data.status }));
            if (data.status === 'FAILED' && data.error) {
                addLog({ level: 'ERROR', message: `Node ${data.nodeId} failed: ${data.error}`, nodeId: data.nodeId });
            }
        });

        socket.on('nodes_output', (data) => {
            addLog({ level: 'OUTPUT', message: data.message, nodeId: data.data });
        });

        socket.on('over', (data) => {
            const level = data.status === 'success' ? 'SUCCESS' : 'ERROR';
            addLog({ level, message: data.message });
            cleanup();
        });

        // socket.on('disconnect', (reason) => {
        //     addLog({ level: 'WARN', message: `Disconnected from server: ${reason}` });
        //     cleanup();
        // });

        socket.on('connect_error', (error) => {
            addLog({ level: 'ERROR', message: `Connection failed: ${error.message}` });
            cleanup();
        });

    }, [addLog, clearLogs]);

    const value = { logs, isRunning, nodeStatuses, startExecution, clearLogs };

    return <ExecutionContext.Provider value={value}>{children}</ExecutionContext.Provider>;
};

// 统一的自定义 Hook
export const useExecution = () => {
    const context = useContext(ExecutionContext);
    if (!context) {
        throw new Error('useExecution must be used within an ExecutionProvider');
    }
    return context;
};