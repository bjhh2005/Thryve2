import { useState, useEffect } from 'react';

import { useRefresh } from '@flowgram.ai/free-layout-editor';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Tooltip, IconButton, Divider } from '@douyinfe/semi-ui';
import { IconUndo, IconRedo, IconChevronRight, IconAppCenter } from '@douyinfe/semi-icons';

import { TestRunButton } from '../testrun/testrun-button';
import { AddNode } from '../add-node';
import { ZoomSelect } from './zoom-select';
import { SwitchLine } from './switch-line';
import { ToolsContainer, ToolSection, ToolsContentWrapper } from './styles';
import { Readonly } from './readonly';
import { MinimapSwitch } from './minimap-switch';
import { Minimap } from './minimap';
import { Interactive } from './interactive';
import { FitView } from './fit-view';
import { Comment } from './comment';
import { AutoLayout } from './auto-layout';
import { Upload } from './upload';
import { Download } from './download';

export const DemoTools = () => {
  const { history, playground } = useClientContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(true);

  // 从 localStorage 读取初始折叠状态
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('toolbarCollapsed');
    return saved ? JSON.parse(saved) : true;
  });

  // 当折叠状态改变时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('toolbarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const disposable = history.undoRedoService.onChange(() => {
      setCanUndo(history.canUndo());
      setCanRedo(history.canRedo());
    });
    return () => disposable.dispose();
  }, [history]);

  const refresh = useRefresh();

  useEffect(() => {
    const disposable = playground.config.onReadonlyOrDisabledChange(() => refresh());
    return () => disposable.dispose();
  }, [playground]);

  return (
    <ToolsContainer>
      <ToolSection isCollapsed={isCollapsed}>
        <ToolsContentWrapper>

          {/* 工具栏内容 */}
          {/* <Divider layout="vertical" style={{ height: '16px' }} margin={3} /> */}
          <Interactive />
          <AutoLayout />
          <SwitchLine />
          <ZoomSelect />
          <FitView />
          <MinimapSwitch minimapVisible={minimapVisible} setMinimapVisible={setMinimapVisible} />
          <Minimap visible={minimapVisible} />
          <Readonly />
          <Comment />
          <Tooltip content="Undo">
            <IconButton
              type="tertiary"
              theme="borderless"
              icon={<IconUndo />}
              disabled={!canUndo || playground.config.readonly}
              onClick={() => history.undo()}
            />
          </Tooltip>
          <Tooltip content="Redo">
            <IconButton
              type="tertiary"
              theme="borderless"
              icon={<IconRedo />}
              disabled={!canRedo || playground.config.readonly}
              onClick={() => history.redo()}
            />
          </Tooltip>
          <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
          <AddNode disabled={playground.config.readonly} />
          <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
          <TestRunButton />
          <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
          <Upload />
          <Download />
        </ToolsContentWrapper>
        <IconButton
          className="collapse-button"
          type="tertiary"
          theme="borderless"
          size="small"
          icon={isCollapsed ? <IconAppCenter size="large" style={{ color: '#5b5ff3' }} /> : <IconChevronRight size="large" />}
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      </ToolSection>
    </ToolsContainer>
  );
}; 