import { useCallback } from 'react';

import { useService, WorkflowLinesManager } from '@flowgram.ai/free-layout-editor';
import { IconButton } from '@douyinfe/semi-ui';

import { IconSwitchLine } from '../../assets/icon-switch-line';
import { AdaptiveTooltip } from './adaptive-tooltip';

export const SwitchLine = () => {
  const linesManager = useService(WorkflowLinesManager);
  const switchLine = useCallback(() => {
    linesManager.switchLineType();
  }, [linesManager]);

  return (
    <AdaptiveTooltip content={'Switch Line'}>
      <IconButton type="tertiary" theme="borderless" onClick={switchLine} icon={IconSwitchLine} />
    </AdaptiveTooltip>
  );
};
