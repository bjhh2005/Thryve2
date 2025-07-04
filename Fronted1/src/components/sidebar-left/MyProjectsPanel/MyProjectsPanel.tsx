// src/components/Sidebar/MyProjectsPanel/MyProjectsPanel.tsx

import React, { memo } from 'react';
import { useProject } from '../../../context/ProjectProvider';
import { ProjectCard } from './ProjectCard';
import { Empty } from '@douyinfe/semi-ui';
import { IconFolder } from '@douyinfe/semi-icons';
import './MyProjectsPanel.less';

export const MyProjectsPanel: React.FC = memo(() => {
    const { projects } = useProject();

    return (
        <div className="my-projects-panel">
            {projects.length > 0 ? (
                <div className="projects-grid">
                    {projects.map(p => (
                        <ProjectCard key={p.id} project={p} />
                    ))}
                </div>
            ) : (
                <Empty
                    image={<IconFolder size="extra-large" style={{ color: 'var(--semi-color-disabled-text)' }} />}
                    title="没有项目"
                    description="点击左侧“新建画布”按钮开始你的第一个项目吧！"
                />
            )}
        </div>
    );
});