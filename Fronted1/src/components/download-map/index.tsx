import React from 'react';
import downloadIcon from '../../assets/icon-download.png';
import { WorkflowJSON } from '@flowgram.ai/free-layout-editor';

interface DownloadMapProps {
  data: WorkflowJSON;
  filename?: string;
}

export const DownloadMap: React.FC<DownloadMapProps> = ({ data, filename = 'flow-map.json' }) => {
  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      onClick={handleDownload}
      style={{ display: 'inline-block', cursor: 'pointer' }}
    >
      <img 
        src={downloadIcon} 
        alt="Download" 
        style={{ width: '24px', height: '24px' }}
      />
    </div>
  );
}; 