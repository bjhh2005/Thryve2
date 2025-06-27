import { useCallback } from 'react';

import { usePlayground, usePlaygroundTools } from '@flowgram.ai/free-layout-editor';
import { IconButton } from '@douyinfe/semi-ui';

import { IconAutoLayout } from '../../assets/icon-auto-layout';
import { AdaptiveTooltip } from './adaptive-tooltip';

export const AutoLayout = () => {
  const tools = usePlaygroundTools();
  const playground = usePlayground();
  const autoLayout = useCallback(async () => {
    await tools.autoLayout();
  }, [tools]);

  return (
    <AdaptiveTooltip content={'Auto Layout'}>
      <IconButton
        disabled={playground.config.readonly}
        type="tertiary"
        theme="borderless"
        onClick={autoLayout}
        icon={IconAutoLayout}
      />
    </AdaptiveTooltip>
  );
};
