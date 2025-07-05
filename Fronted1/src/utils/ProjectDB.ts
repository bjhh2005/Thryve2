// src/utils/ProjectDB.ts

import { openDB, DBSchema } from 'idb';
import { WorkflowJSON } from '@flowgram.ai/free-layout-editor'; // 假设编辑器导出的是这个类型

// 定义项目的数据结构
export interface Project {
    id: string; // 使用 UUID
    name: string;
    workflowData: WorkflowJSON; // 存储工作流的完整 JSON 数据
    thumbnail: string; // 存储缩略图的 Data URL (base64)
    createdAt: number;
    updatedAt: number;
}

// 定义数据库 Schema
interface ProjectDB extends DBSchema {
    projects: {
        key: string;
        value: Project;
        indexes: { 'updatedAt': number };
    };
}

// 初始化数据库
async function initProjectDB() {
    const db = await openDB<ProjectDB>('flowgram-projects-db', 1, {
        upgrade(db) {
            const store = db.createObjectStore('projects', {
                keyPath: 'id',
            });
            store.createIndex('updatedAt', 'updatedAt');
        },
    });
    return db;
}

export const dbPromise = initProjectDB();

// --- 数据库操作函数 ---

export async function getAllProjects(): Promise<Project[]> {
    const db = await dbPromise;
    // 按更新时间降序排列
    return db.getAllFromIndex('projects', 'updatedAt').then(res => res.reverse());
}

export async function getProject(id: string): Promise<Project | undefined> {
    const db = await dbPromise;
    return db.get('projects', id);
}

export async function addProject(project: Project): Promise<string> {
    const db = await dbPromise;
    return db.put('projects', project);
}

export async function updateProject(project: Project): Promise<string> {
    const db = await dbPromise;
    return db.put('projects', project);
}

export async function deleteProject(id: string): Promise<void> {
    const db = await dbPromise;
    return db.delete('projects', id);
}