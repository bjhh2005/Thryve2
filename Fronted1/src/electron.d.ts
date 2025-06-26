export interface IElectronAPI {
  selectFile: () => Promise<{
    canceled: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 