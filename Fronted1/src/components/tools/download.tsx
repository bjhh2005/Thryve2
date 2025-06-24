import { useCallback } from 'react';
import { useService, WorkflowDocument } from '@flowgram.ai/free-layout-editor';
import { IconButton, Tooltip } from '@douyinfe/semi-ui';

import downloadIcon from '../../assets/icon-download.png';

export const Download = () => {
  const document = useService(WorkflowDocument);

  const handleDownload = useCallback(() => {
    try {
      const data = document.toJSON();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.download = 'flow-map.json';
      window.document.body.appendChild(link);
      link.click();
      
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading flow:', error);
      alert('下载流程图失败');
    }
  }, [document]);

  return (
    <Tooltip content="Download Flow">
      <div style={{ display: 'inline-block' }}>
        <IconButton
          type="tertiary"
          theme="borderless"
          icon={<img src={downloadIcon} alt="Download" style={{ width: '16px', height: '16px' }} />}
          onClick={handleDownload}
        />
      </div>
    </Tooltip>
  );
}; 