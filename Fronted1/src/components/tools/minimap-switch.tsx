import { IconButton } from '@douyinfe/semi-ui';
import { UIIconMinimap } from './styles';
import { AdaptiveTooltip } from './adaptive-tooltip';

export const MinimapSwitch = (props: {
  minimapVisible: boolean;
  setMinimapVisible: (visible: boolean) => void;
}) => {
  const { minimapVisible, setMinimapVisible } = props;

  return (
    <AdaptiveTooltip content="Minimap">
      <IconButton
        type="tertiary"
        theme="borderless"
        icon={<UIIconMinimap visible={minimapVisible} />}
        onClick={() => setMinimapVisible(!minimapVisible)}
      />
    </AdaptiveTooltip>
  );
};
