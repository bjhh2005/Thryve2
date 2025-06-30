export interface IElectronAPI {
  selectFile: () => Promise<{
    canceled: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
  readFile: (filePath: string) => Promise<{
    success: boolean;
    content: string | null;
    error: string | null;
  }>;
  getFileInfo: (filePath: string) => Promise<{
    success: boolean;
    info: {
      size: number;
      created: Date;
      modified: Date;
      accessed: Date;
    } | null;
    error: string | null;
  }>;
  selectFolder: () => Promise<{
    canceled: boolean;
    folderPath: string;
    folderName: string;
    files: string[];
  }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 