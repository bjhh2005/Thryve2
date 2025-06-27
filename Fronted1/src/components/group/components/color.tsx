import { FC, useRef } from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { Popover, Tooltip } from '@douyinfe/semi-ui';

import { GroupField } from '../constant';
import { defaultColor, groupColors } from '../color';
import { calculatePopoverPosition } from '../../../utils';

export const GroupColor: FC = () => (
  <Field<string> name={GroupField.Color}>
    {({ field }) => {
      const colorName = field.value ?? defaultColor;
      const containerRef = useRef<HTMLSpanElement>(null);
      
      return (
        <Popover
          position={containerRef.current ? calculatePopoverPosition(containerRef.current) : 'top'}
          mouseLeaveDelay={300}
          content={
            <div className="workflow-group-color-palette">
              {Object.entries(groupColors).map(([name, color]) => (
                <Tooltip content={name} key={name} mouseEnterDelay={300}>
                  <span
                    className="workflow-group-color-item"
                    key={name}
                    style={{
                      backgroundColor: color['300'],
                      borderColor: name === colorName ? color['400'] : '#fff',
                    }}
                    onClick={() => field.onChange(name)}
                  />
                </Tooltip>
              ))}
            </div>
          }
        >
          <span
            ref={containerRef}
            className="workflow-group-color"
            style={{
              backgroundColor: groupColors[colorName]['300'],
            }}
          />
        </Popover>
      );
    }}
  </Field>
);
