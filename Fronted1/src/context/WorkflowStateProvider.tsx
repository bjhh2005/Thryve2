// src/context/WorkflowStateProvider.tsx

import { createContext, useState, useContext, useCallback, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// 节点的可视化状态类型
export type NodeStatus = 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'IDLE';
// 一个存储所有节点状态的 Map，键是 nodeId
export type NodeStatusMap = Record<string, NodeStatus>;

// 定义 Context 需要共享的数据和方法
interface WorkflowStateContextType {
    isRunning: boolean;
    nodeStatuses: NodeStatusMap;
    startWorkflow: (documentData: any) => void;
    cancelWorkflow: () => void;
}

const WorkflowStateContext = createContext<WorkflowStateContextType | undefined>(undefined);

export const WorkflowStateProvider = ({ children }: { children: ReactNode }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [nodeStatuses, setNodeStatuses] = useState<NodeStatusMap>({});
    const socketRef = useRef<Socket | null>(null);

    // 更新单个节点状态的内部函数
    const updateNodeStatus = useCallback((nodeId: string, status: NodeStatus) => {
        setNodeStatuses(prevStatuses => ({
            ...prevStatuses,
            [nodeId]: status,
        }));
    }, []);

    // 清理函数，用于断开连接和重置状态
    const cleanup = useCallback(() => {
        socketRef.current?.close();
        socketRef.current = null;
        setIsRunning(false);
    }, []);

    const cancelWorkflow = useCallback(() => {
        cleanup();
        // 可以在这里添加一个 addLog，如果需要的话
        console.log('Workflow cancelled by user.');
        // 重置所有节点状态为 IDLE
        setNodeStatuses({});
    }, [cleanup]);

    const startWorkflow = useCallback((documentData: any) => {
        if (isRunning) return;

        // 1. 重置状态并开始运行
        setNodeStatuses({});
        setIsRunning(true);

        // 2. 建立新的 Socket.IO 连接
        const socket = io('http://localhost:4000/workflow');
        socketRef.current = socket;

        // 3. 监听核心的状态变化事件
        socket.on('node_status_change', (data: { nodeId: string; status: NodeStatus; error?: string }) => {
            console.log(`[WorkflowState] Status Change: Node ${data.nodeId} -> ${data.status}`);
            updateNodeStatus(data.nodeId, data.status);
        });

        // 4. 监听整个工作流结束事件
        socket.on('over', (data: { status: 'success' | 'error'; message: string }) => {
            console.log(`[WorkflowState] Workflow finished with status: ${data.status}`);
            cleanup();
        });

        // 5. 处理连接错误
        socket.on('connect_error', (error) => {
            console.error(`[WorkflowState] Connection failed: ${error.message}`);
            cleanup();
        });

        // 6. 连接成功后，发送 `start_process` 事件
        socket.on('connect', () => {
            console.log('[WorkflowState] Connected to server, starting workflow...');
            socket.emit('start_process', documentData);
        });

    }, [isRunning, updateNodeStatus, cleanup]);

    const value = { isRunning, nodeStatuses, startWorkflow, cancelWorkflow };

    return <WorkflowStateContext.Provider value={value}>{children}</WorkflowStateContext.Provider>;
};

// 创建一个自定义 Hook，方便子组件使用
export const useWorkflowState = () => {
    const context = useContext(WorkflowStateContext);
    if (!context) {
        throw new Error('useWorkflowState must be used within a WorkflowStateProvider');
    }
    return context;
};