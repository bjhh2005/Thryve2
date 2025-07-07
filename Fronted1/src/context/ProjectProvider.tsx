// src/context/ProjectProvider.tsx (完整代码)

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useService, WorkflowDocument } from '@flowgram.ai/free-layout-editor';
import { v4 as uuidv4 } from 'uuid';
import { Toast, Modal, Input } from '@douyinfe/semi-ui';
import * as ProjectDB from '../utils/ProjectDB';
import { initialData } from '../initial-data';

export type { Project } from '../utils/ProjectDB';
import DefaultThumbnail from '../assets/default-thumbnail.svg';

// 这是一个内联的Data URL，无需网络请求
const STATIC_PROJECT_THUMBNAIL = DefaultThumbnail;

const DEFAULT_PROJECT_ID = 'default-example-workflow-v1';

const defaultProjectObject: ProjectDB.Project = {
    id: DEFAULT_PROJECT_ID,
    name: '示例工作流',
    workflowData: initialData as any,
    thumbnail: STATIC_PROJECT_THUMBNAIL,
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000,
};

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
    const [projects, setProjects] = useState<ProjectDB.Project[]>([defaultProjectObject]);
    const [currentProject, setCurrentProject] = useState<ProjectDB.Project | null>(defaultProjectObject);

    useEffect(() => {
        const initializeApp = async () => {
            // 检查并创建默认项目
            const defaultProject = await ProjectDB.getProject(DEFAULT_PROJECT_ID);
            if (!defaultProject) {
                await ProjectDB.addProject(defaultProjectObject);
            }

            // 获取并更新完整的项目列表，但不会导致闪烁
            const allProjects = await ProjectDB.getAllProjects();
            setProjects(allProjects);
        };

        initializeApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 这个 effect 只在组件初次挂载时运行一次

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

    const loadProject = useCallback(async (id: string, silent = false) => {
        const projectToLoad = await ProjectDB.getProject(id);
        if (projectToLoad) {
            document.clear();
            setTimeout(() => {
                document.renderJSON(projectToLoad.workflowData);
                document.fitView(false);
                setCurrentProject(projectToLoad);
                if (!silent) {
                    Toast.info(`已加载项目: ${projectToLoad.name}`);
                }
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