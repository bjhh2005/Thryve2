import { useEffect, useState, useRef } from 'react';

import {
  usePlaygroundTools,
  type InteractiveType as IdeInteractiveType,
} from '@flowgram.ai/free-layout-editor';
import { Tooltip, Popover } from '@douyinfe/semi-ui';

import { MousePadSelector } from './mouse-pad-selector';
import { calculatePopoverPosition } from '../../utils';

export const CACHE_KEY = 'workflow_prefer_interactive_type';
export const SHOW_KEY = 'show_workflow_interactive_type_guide';
export const IS_MAC_OS = /(Macintosh|MacIntel|MacPPC|Mac68K|iPad)/.test(navigator.userAgent);

export enum InteractiveType {
  Mouse = 'MOUSE',
  Pad = 'PAD'
}

export function getPreferInteractiveType() {
  const data = localStorage.getItem(CACHE_KEY) as string;
  if (data && [InteractiveType.Mouse, InteractiveType.Pad].includes(data as InteractiveType)) {
    return data;
  }
  return IS_MAC_OS ? InteractiveType.Pad : InteractiveType.Mouse;
}

export function setPreferInteractiveType(type: InteractiveType) {
  localStorage.setItem(CACHE_KEY, type);
}

export const Interactive = () => {
  const tools = usePlaygroundTools();
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [interactiveType, setInteractiveType] = useState<InteractiveType>(
    () => getPreferInteractiveType() as InteractiveType
  );

  const [showInteractivePanel, setShowInteractivePanel] = useState(false);

  const mousePadTooltip =
    interactiveType === InteractiveType.Mouse ? 'Mouse-Friendly' : 'Touchpad-Friendly';

  useEffect(() => {
    // 不需要设置滚动速度，使用默认值
    // tools.setMouseScrollDelta((zoom) => zoom / 20);

    // read from localStorage
    const preferInteractiveType = getPreferInteractiveType();
    tools.setInteractiveType(preferInteractiveType as IdeInteractiveType);
  }, [tools]);

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <Popover 
      trigger="custom" 
      position={containerRef.current ? calculatePopoverPosition(containerRef.current) : 'top'} 
      visible={visible} 
      onClickOutSide={handleClose}
    >
      <Tooltip
        content={mousePadTooltip}
        style={{ display: showInteractivePanel ? 'none' : 'block' }}
      >
        <div ref={containerRef} className="workflow-toolbar-interactive">
          <MousePadSelector
            value={interactiveType}
            onChange={(value) => {
              setInteractiveType(value);
              setPreferInteractiveType(value);
              tools.setInteractiveType(value as unknown as IdeInteractiveType);
            }}
            onPopupVisibleChange={setShowInteractivePanel}
            containerStyle={{
              border: 'none',
              height: '32px',
              width: '32px',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2px',
              padding: '4px',
              borderRadius: 'var(--small, 6px)',
            }}
            iconStyle={{
              margin: '0',
              width: '16px',
              height: '16px',
            }}
            arrowStyle={{
              width: '12px',
              height: '12px',
            }}
          />
        </div>
      </Tooltip>
    </Popover>
  );
};
