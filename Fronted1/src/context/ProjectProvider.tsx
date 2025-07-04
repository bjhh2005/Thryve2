// src/context/ProjectProvider.tsx (完整代码)

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useService, WorkflowDocument } from '@flowgram.ai/free-layout-editor';
import { v4 as uuidv4 } from 'uuid';
import { Toast, Modal, Input } from '@douyinfe/semi-ui';
import * as ProjectDB from '../utils/ProjectDB';

export type { Project } from '../utils/ProjectDB';

// 1. 定义一个固定的、美观的SVG作为所有项目的缩略图
// 这是一个内联的Data URL，无需网络请求
const STATIC_PROJECT_THUMBNAIL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxNjAgMTIwJyB3aWR0aD0nMTYwJyBoZWlnaHQ9JzEyMCc+IDxyZWN0IHdpZHRoPScxNjAnIGhlaWdodD0nMTIwJyBmaWxsPScjZjBmMmY1Jy8+IDxyZWN0IHg9JzIwJyB5PSc0MCcgd2lkdGg9JzMwJyBoZWlnaHQ9JzIwJyByeD0nMycgZmlsbD0nI2ZmZmZmZicgc3Ryb2tlPScjZDlkOWQ5JyBzdHJva2Utd2lkdGg9JzInLz4gPHJlY3QgeD0nNzAnIHk9JzIwJyB3aWR0aD0nNTAnIGhlaWdodD0nMjAnIHJ4PSczJyBmaWxsPScjZmZmZmZmJyBzdHJva2U9JyNkOWQ5ZDknIHN0cm9rZS13aWR0aD0nMicvPiA8cmVjdCB4PSc3MCcgeT0nODAnIHdpZHRoPSc1MCcgaGVpZ2h0PScyMCcgcng9JzMnIGZpbGw9JyNmZmZmZmYnIHN0cm9rZT0nI2Q5ZDlkOScgc3Ryb2tlLXdpZHRoPScyJy8+IDxwYXRoIGQ9J001MCA1MCBDIDcwIDUwLCA3MCAzMCwgNzAgMzAnIHN0cm9rZT0nI2EwYTBhMCcgc3Ryb2tlLXdpZHRoPScxLjUnIGZpbGw9J25vbmUnLz4gPHBhdGggZD0nTTUwIDUwIEMgNzAgNTAsIDcwIDkwLCA3MCA5MCcgc3Ryb2tlPScjYTBhMGExJyBzdHJva2Utd2lkdGg9JzEuNScgZmlsbD0nbm9uZScvPiA8L3N2Zz4=";


interface ProjectContextType {
    projects: ProjectDB.Project[];
    currentProject: ProjectDB.Project | null;
    loadProject: (id: string) => Promise<void>;
    createNewProject: (name: string) => Promise<void>;
    saveCurrentProject: (options?: { silent?: boolean }) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    renameProject: (id: string, oldName: string) => Promise<void>;
    getCurrentProjectName: () => string;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const document = useService(WorkflowDocument);
    const [projects, setProjects] = useState<ProjectDB.Project[]>([]);
    const [currentProject, setCurrentProject] = useState<ProjectDB.Project | null>(null);

    const fetchAllProjects = useCallback(async () => {
        const allProjects = await ProjectDB.getAllProjects();
        setProjects(allProjects);
    }, []);

    useEffect(() => {
        fetchAllProjects();
    }, [fetchAllProjects]);

    const createNewProject = useCallback(async (name: string) => {
        document.clear();
        const newProject: ProjectDB.Project = {
            id: uuidv4(),
            name,
            workflowData: { nodes: [], edges: [] },
            // 2. 创建新项目时，直接使用固定的缩略图
            thumbnail: STATIC_PROJECT_THUMBNAIL,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await ProjectDB.addProject(newProject);
        setCurrentProject(newProject);
        await fetchAllProjects();
        Toast.success(`项目 "${name}" 创建成功!`);
    }, [document, fetchAllProjects]);

    const getCurrentProjectName = useCallback(() => {
        return currentProject?.name || '未命名画布';
    }, [currentProject]);

    const loadProject = useCallback(async (id: string) => {
        const projectToLoad = await ProjectDB.getProject(id);
        if (projectToLoad) {
            document.clear();
            setTimeout(() => {
                document.renderJSON(projectToLoad.workflowData);
                document.fitView(false);
                setCurrentProject(projectToLoad);
                Toast.info(`已加载项目: ${projectToLoad.name}`);
            }, 100);
        } else {
            Toast.error('项目加载失败');
        }
    }, [document]);

    const saveCurrentProject = useCallback(async (options: { silent?: boolean } = {}) => {
        if (!currentProject) {
            if (!options.silent) {
                Toast.warning('没有活动的画布可以保存');
            }
            return;
        }

        const updatedProject: ProjectDB.Project = {
            ...currentProject,
            workflowData: document.toJSON(),
            updatedAt: Date.now(),
        };

        await ProjectDB.updateProject(updatedProject);
        await fetchAllProjects();

        // 手动保存时，我们希望看到提示，所以不使用 silent: true
        if (!options.silent) {
            Toast.success(`项目 "${updatedProject.name}" 已保存`);
        }
    }, [currentProject, document, fetchAllProjects]);

    const renameProject = useCallback(async (id: string, oldName: string) => {
        let newName = '';
        Modal.confirm({
            title: '重命名项目',
            content: (
                <Input
                    autoFocus
                    defaultValue={oldName}
                    placeholder="请输入新的项目名称"
                    onChange={(val: string) => { newName = val; }}
                />
            ),
            onOk: async () => {
                if (!newName || newName.trim() === '') {
                    Toast.error('项目名称不能为空');
                    return;
                }
                const projectToUpdate = await ProjectDB.getProject(id);
                if (projectToUpdate) {
                    const updatedProject = { ...projectToUpdate, name: newName, updatedAt: Date.now() };
                    await ProjectDB.updateProject(updatedProject);
                    if (currentProject?.id === id) {
                        setCurrentProject(updatedProject);
                    }
                    await fetchAllProjects();
                    Toast.success('项目已重命名');
                }
            },
        });
    }, [currentProject, fetchAllProjects]);

    const deleteProject = useCallback(async (id: string) => {
        await ProjectDB.deleteProject(id);
        if (currentProject?.id === id) {
            document.clear();
            setCurrentProject(null);
        }
        await fetchAllProjects();
        Toast.success('项目已删除');
    }, [currentProject, document, fetchAllProjects]);

    const value = {
        projects,
        currentProject,
        loadProject,
        createNewProject,
        saveCurrentProject,
        deleteProject,
        renameProject,
        getCurrentProjectName,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};