import { usePlaygroundTools } from '@flowgram.ai/free-layout-editor';
import { IconButton } from '@douyinfe/semi-ui';
import { IconExpand } from '@douyinfe/semi-icons';
import { AdaptiveTooltip } from './adaptive-tooltip';

export const FitView = () => {
  const tools = usePlaygroundTools();
  return (
    <AdaptiveTooltip content="FitView">
      <IconButton
        icon={<IconExpand />}
        type="tertiary"
        theme="borderless"
        onClick={() => tools.fitView()}
      />
    </AdaptiveTooltip>
  );
};
