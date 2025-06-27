import { useState, useEffect } from 'react';

import { useRefresh } from '@flowgram.ai/free-layout-editor';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { IconButton, Divider } from '@douyinfe/semi-ui';
import { IconUndo, IconRedo } from '@douyinfe/semi-icons';

import { TestRunButton } from '../testrun/testrun-button';
import { AddNode } from '../add-node';
import { ZoomSelect } from './zoom-select';
import { SwitchLine } from './switch-line';
import { ToolSection } from './styles';
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
import { AdaptiveTooltip } from './adaptive-tooltip';

export const DemoTools = () => {
  const { history, playground } = useClientContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(true);
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
    <DraggableTools>
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
        <AdaptiveTooltip content="Undo">
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconUndo />}
            disabled={!canUndo || playground.config.readonly}
            onClick={() => history.undo()}
          />
        </AdaptiveTooltip>
        <AdaptiveTooltip content="Redo">
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconRedo />}
            disabled={!canRedo || playground.config.readonly}
            onClick={() => history.redo()}
          />
        </AdaptiveTooltip>
        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
        <AddNode disabled={playground.config.readonly} />
        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
        <TestRunButton disabled={playground.config.readonly} />
        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
        <Upload />
        <Download />
      </ToolSection>
    </DraggableTools>
  );
}; 