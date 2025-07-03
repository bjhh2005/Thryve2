// src/context/ExecutionProvider.tsx (支持高级可视化功能版)

import { createContext, useState, useContext, useCallback, ReactNode, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// --- 类型定义区 ---
export type NodeStatus = 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'IDLE';

// 1. 新增：定义单个节点的完整状态，包括 status 和 payload
export interface NodeState {
    status: NodeStatus;
    payload?: any; // 用于存储成功时的输出数据或失败时的错误详情
}
// 将原来的 NodeStatusMap 升级为 NodeStateMap
export type NodeStateMap = Record<string, NodeState>;

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'SYSTEM' | 'OUTPUT';
    message: string;
    nodeId?: string;
}

// 2. 修改 Context 类型定义，使用新的 NodeStateMap
interface ExecutionContextType {
    logs: LogEntry[];
    isRunning: boolean;
    nodeStates: NodeStateMap; // <-- 使用新的类型
    startExecution: (documentData: any) => void;
    clearLogs: () => void;
}

const ExecutionContext = createContext<ExecutionContextType | undefined>(undefined);

export const ExecutionProvider = ({ children }: { children: ReactNode }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    // 3. 修改 state 定义，使用新的 NodeStateMap
    const [nodeStates, setNodeStates] = useState<NodeStateMap>({});
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

    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    const startExecution = useCallback((documentData: any) => {
        if (socketRef.current) {
            return;
        }

        clearLogs();
        // 4. 重置状态时，使用 setNodeStates
        setNodeStates({});
        setIsRunning(true);
        addLog({ level: 'SYSTEM', message: 'Connecting to execution server...' });

        const socket = io('http://localhost:4000/workflow', {
            reconnection: false,
            transports: ['websocket'],
        });
        socketRef.current = socket;

        const cleanup = () => {
            setIsRunning(false);
            if (socketRef.current === socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };

        socket.once('connect', () => {
            addLog({ level: 'SUCCESS', message: `Connected with ID: ${socket.id}. Starting workflow...` });
            socket.emit('start_process', documentData);
        });

        // 5. 核心修改：更新 node_status_change 的监听器
        socket.on('node_status_change', (data: { nodeId: string; status: NodeStatus; payload?: any }) => {
            // 同时更新节点状态和产出数据
            setNodeStates(prev => ({
                ...prev,
                [data.nodeId]: { status: data.status, payload: data.payload }
            }));

            // 如果节点失败，并且 payload 中有错误信息，可以添加一条日志
            if (data.status === 'FAILED' && data.payload?.details) {
                addLog({ level: 'ERROR', message: `Node ${data.nodeId} failed: ${data.payload.details}`, nodeId: data.nodeId });
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

        socket.on('connect_error', (error) => {
            addLog({ level: 'ERROR', message: `Connection failed: ${error.message}` });
            cleanup();
        });

        // socket.on('disconnect', (reason) => {
        //     addLog({ level: 'WARN', message: `Disconnected from server: ${reason}` });
        //     cleanup();
        // });

    }, [addLog, clearLogs]);

    // 6. 将新的 nodeStates 共享出去
    const value = { logs, isRunning, nodeStates, startExecution, clearLogs };

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