import React, { useRef, useEffect, useState } from 'react';
import { Tooltip, TooltipProps } from '@douyinfe/semi-ui';
import { calculatePopoverPosition } from '../../utils';

export interface AdaptiveTooltipProps extends Omit<TooltipProps, 'position'> {
  children: React.ReactElement;
}

export const AdaptiveTooltip: React.FC<AdaptiveTooltipProps> = ({ children, ...props }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        setPosition(calculatePopoverPosition(containerRef.current));
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'inline-block' }}>
      <Tooltip {...props} position={position}>
        {children}
      </Tooltip>
    </div>
  );
}; 