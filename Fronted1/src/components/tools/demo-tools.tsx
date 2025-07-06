import React, { useState, useEffect } from 'react';
import { useClientContext, useRefresh } from '@flowgram.ai/free-layout-editor';
import { Tooltip, IconButton, Divider } from '@douyinfe/semi-ui';
import {
  IconUndo,
  IconRedo,
  IconGlobeStroke,         // 用于折叠状态的图标
  IconChevronLeft,  // 用于“折叠”操作的图标
} from '@douyinfe/semi-icons';

import { TestRunButton } from '../testrun/testrun-button';
import { AddNode } from '../add-node';
import { ZoomSelect } from './zoom-select';
import { SwitchLine } from './switch-line';
import { ToolContainer, ToolSection, CollapsedToolButton } from './styles';
import { Readonly } from './readonly';
import { MinimapSwitch } from './minimap-switch';
import { Minimap } from './minimap';
import { Interactive } from './interactive';
import { FitView } from './fit-view';
import { Comment } from './comment';
import { AutoLayout } from './auto-layout';
import { Upload } from './upload';
import { Download } from './download';
import { DraggableTools } from './draggable-tools';
import { Handle } from './handle';

export const DemoTools = () => {
  // --- 逻辑部分 ---
  const { history, playground } = useClientContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = (e: React.MouseEvent) => {
    // 点击折叠/展开按钮时不应触发拖动
    e.stopPropagation();
    setIsCollapsed(prev => !prev);
  };

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

  // --- 渲染部分 ---
  return (
    <DraggableTools>
      <ToolContainer isCollapsed={isCollapsed}>
        {isCollapsed ? (
          // --- 折叠状态UI ---
          // 4. 将 handleProps 赋予给应该被拖动的元素
          <CollapsedToolButton onClick={handleToggleCollapse} title="展开工具栏">
            <IconGlobeStroke style={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.9)' }} />
          </CollapsedToolButton>
        ) : (
          <ToolSection>
            <Handle />
            <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
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
            <Tooltip content="折叠工具栏">
              <IconButton
                icon={<IconChevronLeft />}
                type="tertiary"
                theme="borderless"
                onClick={handleToggleCollapse}
              />
            </Tooltip>
          </ToolSection>
        )}
      </ToolContainer>
    </DraggableTools>
  );
};