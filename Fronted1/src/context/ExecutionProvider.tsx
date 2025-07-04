import { createContext, useState, useContext, useCallback, ReactNode, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// --- 类型定义区 ---
export type NodeStatus = 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'IDLE' | 'PAUSED';

export interface NodeState {
    status: NodeStatus;
    payload?: any;
}
export type NodeStateMap = Record<string, NodeState>;

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'SYSTEM' | 'OUTPUT';
    message: string;
    nodeId?: string;
}

// 统一的、功能更丰富的 Context 类型
interface ExecutionContextType {
    // 原有状态
    logs: LogEntry[];
    isRunning: boolean;
    nodeStates: NodeStateMap;
    clearLogs: () => void;

    // 新增的调试状态
    isPaused: boolean;
    pausedOnNodeId: string | null;

    // 新的控制方法
    startExecution: (documentData: any) => void; // 保留“一键运行”
    startDebug: (documentData: any, breakpoints: string[]) => void; // 新增“调试运行”
    pauseExecution: () => void;
    resumeExecution: () => void;
    terminateExecution: () => void;
    stepOver: () => void;
}

const ExecutionContext = createContext<ExecutionContextType | undefined>(undefined);

export const ExecutionProvider = ({ children }: { children: ReactNode }) => {
    // --- 状态管理 ---
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [nodeStates, setNodeStates] = useState<NodeStateMap>({});

    // 新增的调试相关状态
    const [isPaused, setIsPaused] = useState(false);
    const [pausedOnNodeId, setPausedOnNodeId] = useState<string | null>(null);

    // Ref 用于存储不直接触发渲染的数据
    const socketRef = useRef<Socket | null>(null);
    const runIdRef = useRef<string | null>(null); // 存储当前调试会话的ID

    // --- 基础方法 ---
    const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newLog: LogEntry = {
            ...log,
            id: uuidv4(),
            timestamp: new Date().toLocaleTimeString(),
        };
        setLogs(prevLogs => [newLog, ...prevLogs]); // 将新日志放在最前面
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    // 统一的清理函数
    const cleanup = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsRunning(false);
        setIsPaused(false);
        setPausedOnNodeId(null);
        runIdRef.current = null;
    }, []);

    // 组件卸载时执行最终清理
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    // --- 核心执行与控制逻辑 ---

    const setupSocketListeners = (socket: Socket) => {
        // 所有事件都应检查 run_id 是否匹配，防止接收到旧会话的串线消息
        const checkRunId = (data: any) => !runIdRef.current || data.run_id === runIdRef.current;

        socket.on('node_status_change', (data) => {
            if (!checkRunId(data)) return;
            setNodeStates(prev => ({ ...prev, [data.nodeId]: { status: data.status, payload: data.payload } }));
            if (data.status === 'FAILED' && data.payload?.details) {
                addLog({ level: 'ERROR', message: `Node ${data.nodeId} failed: ${data.payload.details}`, nodeId: data.nodeId });
            }
        });

        socket.on('execution_paused', (data) => {
            if (!checkRunId(data)) return;
            setIsPaused(true);
            setPausedOnNodeId(data.nodeId);
            setNodeStates(prev => ({ ...prev, [data.nodeId]: { ...prev[data.nodeId], status: 'PAUSED' } }));
            addLog({ level: 'SYSTEM', message: `Execution paused at node ${data.nodeId}. Reason: ${data.reason}` });
        });

        socket.on('execution_terminated', (data) => {
            if (!checkRunId(data)) return;
            addLog({ level: 'WARN', message: `Execution terminated. Reason: ${data.reason}` });
            cleanup();
        });

        // 其他日志事件
        socket.on('info', (data) => addLog({ level: 'INFO', message: data.message, nodeId: data.data }));
        socket.on('warning', (data) => addLog({ level: 'WARN', message: data.message, nodeId: data.data }));
        socket.on('nodes_output', (data) => addLog({ level: 'OUTPUT', message: data.message, nodeId: data.data }));

        socket.on('over', (data) => {
            if (!checkRunId(data)) return;
            addLog({ level: data.status === 'success' ? 'SUCCESS' : 'ERROR', message: data.message });
            cleanup();
        });

        // socket.on('disconnect', (reason) => {
        //     addLog({ level: 'WARN', message: `Disconnected: ${reason}` });
        //     cleanup();
        // });
    };

    const startExecution = useCallback((documentData: any, isDebug = false, breakpoints: string[] = []) => {
        if (socketRef.current) return;

        // 重置所有状态
        clearLogs();
        setNodeStates({});
        setIsRunning(true);
        setIsPaused(false);
        setPausedOnNodeId(null);
        addLog({ level: 'SYSTEM', message: `Connecting for ${isDebug ? 'Debug' : 'Normal'} Run...` });

        const socket = io('http://localhost:4000/workflow', { transports: ['websocket'], reconnection: false });
        socketRef.current = socket;

        // 为这个新的 socket 实例绑定所有监听器
        setupSocketListeners(socket);

        socket.once('connect', () => {
            if (isDebug) {
                addLog({ level: 'SYSTEM', message: 'Connection successful. Starting debug session...' });
                socket.emit('start_debug', { documentData, breakpoints });
            } else {
                addLog({ level: 'SYSTEM', message: 'Connection successful. Starting normal run...' });
                socket.emit('start_process', documentData);
            }
        });

        // 监听后端返回的会话ID
        socket.once('debug_session_started', (data) => {
            runIdRef.current = data.run_id;
            addLog({ level: 'SYSTEM', message: `Debug session created with ID: ${data.run_id}` });
        });

    }, [addLog, clearLogs, cleanup]);

    // --- 暴露给 UI 的方法 ---

    const startDebug = (documentData: any, breakpoints: string[]) => {
        startExecution(documentData, true, breakpoints);
    };

    const sendCommand = (command: string) => {
        if (socketRef.current && runIdRef.current) {
            socketRef.current.emit('debug_command', { run_id: runIdRef.current, command });
            if (command === 'resume' || command === 'step_over') {
                setIsPaused(false);
                setPausedOnNodeId(null);
            }
            if (command === 'terminate') {
                cleanup();
            }
        }
    };

    const resumeExecution = () => sendCommand('resume');
    const pauseExecution = () => sendCommand('pause');
    const stepOver = () => sendCommand('step_over');
    const terminateExecution = () => sendCommand('terminate');

    const value = {
        logs,
        isRunning,
        nodeStates,
        isPaused,
        pausedOnNodeId,
        startExecution: (doc: any) => startExecution(doc, false), // 简化版，用于一键运行
        startDebug,
        clearLogs,
        resumeExecution,
        pauseExecution,
        stepOver,
        terminateExecution
    };

    return <ExecutionContext.Provider value={value}>{children}</ExecutionContext.Provider>;
};

export const useExecution = () => {
    const context = useContext(ExecutionContext);
    if (!context) {
        throw new Error('useExecution must be used within an ExecutionProvider');
    }
    return context;
};