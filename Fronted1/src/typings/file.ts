/**
 * 新的、基于桌面端路径的文件引用类型
 */
export interface FileReference {
    filePath: string; // 核心变化：从 fileId 变为 filePath
    fileName: string;
    mimeType: string;
    size: number; // in bytes
    created?: Date;
    modified?: Date;
    accessed?: Date;
    metadata?: Record<string, any>;
}

/**
 * 桌面端 API (例如 Electron) 返回的文件详情
 */
export interface DesktopFilePayload {
    canceled: boolean;
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}