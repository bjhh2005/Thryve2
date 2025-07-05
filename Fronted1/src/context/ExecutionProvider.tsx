// src/context/ExecutionProvider.tsx (智能运行最终版 - 混合模式)

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

// 1. 简化并统一 Context 类型定义
interface ExecutionContextType {
    logs: LogEntry[];
    isRunning: boolean;
    nodeStates: NodeStateMap;
    isPaused: boolean;
    pausedOnNodeId: string | null;
    clearLogs: () => void;
    // 统一的启动入口
    startExecution: (documentData: any, breakpoints: string[]) => void;
    // 调试控制方法
    pauseExecution: () => void;
    resumeExecution: () => void;
    stepOver: () => void;
    terminateExecution: () => void;
}

const ExecutionContext = createContext<ExecutionContextType | undefined>(undefined);

export const ExecutionProvider = ({ children }: { children: ReactNode }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [nodeStates, setNodeStates] = useState<NodeStateMap>({});
    const [isPaused, setIsPaused] = useState(false);
    const [pausedOnNodeId, setPausedOnNodeId] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const runIdRef = useRef<string | null>(null);
    const isDebugModeRef = useRef<boolean>(false);

    // HTTP API 基础URL
    const apiBaseUrl = 'http://localhost:5000';

    const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newLog: LogEntry = { ...log, id: uuidv4(), timestamp: new Date().toLocaleTimeString() };
        setLogs(prevLogs => [...prevLogs, newLog]);
    }, []);

    const clearLogs = useCallback(() => { setLogs([]); }, []);

    const cleanup = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsRunning(false);
        setIsPaused(false);
        setPausedOnNodeId(null);
        runIdRef.current = null;
        isDebugModeRef.current = false;
    }, []);

    useEffect(() => { return cleanup; }, [cleanup]);

    // HTTP API 调试控制函数
    const sendDebugCommand = useCallback(async (command: string) => {
        if (!runIdRef.current) {
            console.warn('No active run ID for debug command');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/api/debug/${runIdRef.current}/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                addLog({ level: 'ERROR', message: `Debug command failed: ${errorText}` });
                return;
            }

            const result = await response.json();
            addLog({ level: 'INFO', message: `Debug command '${command}' sent successfully` });
            
            // 更新本地状态
            if (command === 'resume' || command === 'step_over') {
                setIsPaused(false);
                setPausedOnNodeId(null);
            }
            if (command === 'terminate') {
                cleanup();
            }
        } catch (error) {
            console.error('Debug command error:', error);
            addLog({ level: 'ERROR', message: `Debug command error: ${error}` });
        }
    }, [addLog, cleanup, apiBaseUrl]);

    const startExecution = useCallback((documentData: any, breakpoints: string[] = []) => {
        if (socketRef.current) {
            console.warn("Execution blocked: An active socket instance already exists.");
            return;
        }

        // 2. 智能判断：如果传入的 breakpoints 数组不为空，则为调试模式
        const isDebugRun = breakpoints.length > 0;
        isDebugModeRef.current = isDebugRun;

        // 重置所有状态
        clearLogs();
        setNodeStates({});
        setIsRunning(true);
        setIsPaused(false);
        setPausedOnNodeId(null);
        addLog({ level: 'SYSTEM', message: `Connecting for ${isDebugRun ? 'Debug' : 'Normal'} Run...` });

        const socket = io('http://localhost:5000/workflow', { transports: ['websocket'], reconnection: false });
        socketRef.current = socket;

        // --- 统一的事件监听逻辑 ---
        const setupSocketListeners = (sock: Socket) => {
            const checkRunId = (data: any) => !runIdRef.current || data.run_id === runIdRef.current;
            
            // 基础事件
            sock.on('node_status_change', (data) => { 
                if (checkRunId(data)) {
                    setNodeStates(prev => ({ ...prev, [data.nodeId]: { status: data.status, payload: data.payload } }));
                    if (data.status === 'PROCESSING') {
                        addLog({ level: 'INFO', message: `执行节点: ${data.nodeId}`, nodeId: data.nodeId });
                    }
                }
            });
            
            // 调试相关事件
            sock.on('execution_paused', (data) => { 
                if (checkRunId(data)) { 
                    setIsPaused(true); 
                    setPausedOnNodeId(data.nodeId); 
                    setNodeStates(prev => ({ ...prev, [data.nodeId]: { ...prev[data.nodeId], status: 'PAUSED' } })); 
                    addLog({ level: 'SYSTEM', message: `执行已暂停在节点 ${data.nodeId}: ${data.reason || '未知原因'}` }); 
                } 
            });
            
            sock.on('execution_resumed', (data) => { 
                if (checkRunId(data)) { 
                    setIsPaused(false); 
                    setPausedOnNodeId(null); 
                    addLog({ level: 'SYSTEM', message: `执行已恢复从节点 ${data.nodeId}: ${data.reason || '未知原因'}` }); 
                } 
            });
            
            sock.on('execution_step_over', (data) => { 
                if (checkRunId(data)) { 
                    addLog({ level: 'SYSTEM', message: `单步执行从节点 ${data.nodeId}` }); 
                } 
            });
            
            sock.on('execution_terminated', (data) => { 
                if (checkRunId(data)) { 
                    addLog({ level: 'WARN', message: `执行已终止: ${data.reason || '未知原因'}` }); 
                    cleanup(); 
                } 
            });
            
            // 完成事件
            sock.on('over', (data) => { 
                if (checkRunId(data)) { 
                    addLog({ level: data.status === 'success' ? 'SUCCESS' : 'ERROR', message: data.message }); 
                    cleanup(); 
                } 
            });
            
            // 输出和消息事件
            sock.on('nodes_output', (data) => addLog({ level: 'OUTPUT', message: data.message, nodeId: data.data }));
            sock.on('info', (data) => addLog({ level: 'INFO', message: data.message, nodeId: data.data }));
            sock.on('warning', (data) => addLog({ level: 'WARN', message: data.message, nodeId: data.data }));
            sock.on('error', (data) => addLog({ level: 'ERROR', message: data.message, nodeId: data.data }));
        };

        setupSocketListeners(socket);

        socket.once('connect', () => {
            addLog({ level: 'SUCCESS', message: `Connected with ID: ${socket.id}. Starting workflow...` });
            // 3. 根据 isDebugRun 的值，决定发送哪个事件
            if (isDebugRun) {
                addLog({ level: 'INFO', message: `Debug mode enabled. Breakpoints: ${breakpoints.join(', ')}` });
                socket.emit('start_debug', { documentData, breakpoints });
            } else {
                socket.emit('start_process', documentData);
            }
        });

        socket.once('debug_session_started', (data) => {
            runIdRef.current = data.run_id;
            addLog({ level: 'SYSTEM', message: `Debug session created with ID: ${data.run_id}` });
            addLog({ level: 'INFO', message: `Debug commands will be sent via HTTP API` });
        });

    }, [addLog, clearLogs, cleanup]);

    // --- 调试指令发送逻辑 (混合模式) ---
    const sendCommand = useCallback((command: string) => {
        if (!socketRef.current || !runIdRef.current) {
            console.warn('No active socket or run ID for command:', command);
            return;
        }

        // 如果是调试模式，使用HTTP API
        if (isDebugModeRef.current) {
            sendDebugCommand(command);
        } else {
            // 普通模式，使用WebSocket
            socketRef.current.emit('debug_command', { run_id: runIdRef.current, command });
            if (command === 'resume' || command === 'step_over') {
                setIsPaused(false);
                setPausedOnNodeId(null);
            }
            if (command === 'terminate') {
                cleanup();
            }
        }
    }, [sendDebugCommand, cleanup]);

    const resumeExecution = () => sendCommand('resume');
    const pauseExecution = () => sendCommand('pause');
    const stepOver = () => sendCommand('step_over');
    const terminateExecution = () => sendCommand('terminate');

    // 4. 构建最终对外暴露的 value 对象
    const value: ExecutionContextType = {
        logs,
        isRunning,
        nodeStates,
        isPaused,
        pausedOnNodeId,
        startExecution,
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