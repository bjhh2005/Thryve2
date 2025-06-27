import { useCallback } from 'react';
import { usePlayground, useService, WorkflowDocument } from '@flowgram.ai/free-layout-editor';
import { IconButton, Tooltip } from '@douyinfe/semi-ui';

import uploadIcon from '../../assets/icon-upload.png';

export const Upload = () => {
  const playground = usePlayground();
  const document = useService(WorkflowDocument);

  const handleUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (playground.config.readonly) {
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          // 1. 先清空当前流程图
          document.clear();  // 这会清空所有节点和连线
          
          // 2. 等待一下确保清空完成
          setTimeout(() => {
            try {
              // 3. 验证并加载新数据
              if (!jsonData || !Array.isArray(jsonData.nodes) || !Array.isArray(jsonData.edges)) {
                throw new Error('无效的流程图数据格式');
              }
              
              // 4. 渲染新的流程图
              document.renderJSON(jsonData);
              
              // 5. 调整视图以显示完整流程图
              document.fitView(false);
            } catch (error) {
              console.error('Error importing flow:', error);
              alert('导入流程图失败，请检查JSON格式是否正确');
            }
          }, 100);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('无效的JSON文件格式');
        }
      };
      reader.readAsText(file);
    }
    // 重置 input 的值，这样相同的文件可以再次选择
    event.target.value = '';
  }, [document, playground.config.readonly]);

  const handleClick = useCallback(() => {
    const input = window.document.getElementById('flow-upload');
    if (input) {
      input.click();
    }
  }, []);

  return (
    <Tooltip content="Upload Flow">
      <div style={{ display: 'inline-block' }}>
        <input
          id="flow-upload"
          type="file"
          accept=".json"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <IconButton
          type="tertiary"
          theme="borderless"
          icon={<img src={uploadIcon} alt="Upload" style={{ width: '16px', height: '16px' }} />}
          onClick={handleClick}
        />
      </div>
    </Tooltip>
  );
}; 