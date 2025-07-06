// src/components/Sidebar/MyProjectsPanel/ProjectCard.tsx

import React from 'react';
import { Card, Typography, Dropdown, Button } from '@douyinfe/semi-ui';
import { IconMore } from '@douyinfe/semi-icons';
import { Project, useProject } from '../../../context/ProjectProvider';
import './ProjectCard.less';

interface ProjectCardProps {
    project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const { Text } = Typography;
    const { loadProject, deleteProject, renameProject } = useProject();

    const handleRenameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        renameProject(project.id, project.name);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteProject(project.id);
    };

    return (
        // 修正 3: shadow -> shadows
        <Card className="project-card" shadows="hover" bodyStyle={{ padding: 0 }}>
            <div className="project-card-thumbnail-wrapper" onClick={() => loadProject(project.id)}>
                <img
                    src={project.thumbnail}
                    alt={project.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center'
                    }}
                    className='project-card-thumbnail'
                />
            </div>
            <div className="project-card-footer" onClick={() => loadProject(project.id)}>
                <Text ellipsis={{ showTooltip: true }} className="project-card-name">{project.name}</Text>
                <Dropdown
                    position="bottomRight"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    render={
                        <Dropdown.Menu>
                            {/* 修正：彻底移除 itemKey 属性 */}
                            <Dropdown.Item onClick={handleRenameClick}>
                                重命名
                            </Dropdown.Item>
                            <Dropdown.Item type="danger" onClick={handleDeleteClick}>
                                删除项目
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    }
                >
                    <Button icon={<IconMore />} type="tertiary" theme="borderless" className="project-card-more-btn" />
                </Dropdown>
            </div>
        </Card>
    );
};