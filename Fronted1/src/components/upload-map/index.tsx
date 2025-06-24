import React from 'react';
import uploadIcon from '../../assets/icon-upload.png';
import { WorkflowJSON } from '@flowgram.ai/free-layout-editor';

interface UploadMapProps {
  onUpload: (data: WorkflowJSON) => void;
}

export const UploadMap: React.FC<UploadMapProps> = ({ onUpload }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          onUpload(jsonData);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('无效的JSON文件格式');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ display: 'inline-block', cursor: 'pointer' }}>
      <label htmlFor="upload-json" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <img src={uploadIcon} alt="Upload" style={{ width: '24px', height: '24px', marginRight: '8px' }} />
        <input
          id="upload-json"
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
}; 