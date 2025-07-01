import { openDB, DBSchema } from 'idb';

// 定义数据库中存储的数据结构
export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
}

// 定义数据库的"模式" (Schema)
interface ChatDB extends DBSchema {
    conversations: {
        key: string;
        value: Conversation;
        indexes: { 'createdAt': number };
    };
    messages: {
        key: string;
        value: ChatMessage;
        indexes: { 'conversationId': string };
    };
}

// 初始化并打开数据库
async function initDB() {
    const db = await openDB<ChatDB>('ai-assistant-db', 1, {
        upgrade(db) {
            // 创建 "conversations" 表
            const conversationStore = db.createObjectStore('conversations', {
                keyPath: 'id',
            });
            conversationStore.createIndex('createdAt', 'createdAt');

            // 创建 "messages" 表
            const messageStore = db.createObjectStore('messages', {
                keyPath: 'id',
            });
            messageStore.createIndex('conversationId', 'conversationId');
        },
    });
    return db;
}

export const dbPromise = initDB();

// --- 下面是我们将要用到的数据库操作函数 ---

export async function getAllConversations() {
    const db = await dbPromise;
    // 按创建时间降序排列
    return db.getAllFromIndex('conversations', 'createdAt').then(res => res.reverse());
}

export async function getMessagesForConversation(conversationId: string) {
    const db = await dbPromise;
    const messages = await db.getAllFromIndex('messages', 'conversationId', conversationId);

    // 根据 createdAt 时间戳进行升序排序 (从旧到新) ---
    return messages.sort((a, b) => a.createdAt - b.createdAt);
}

export async function addConversation(conversation: Conversation) {
    const db = await dbPromise;
    return db.put('conversations', conversation);
}

export async function addMessage(message: ChatMessage) {
    const db = await dbPromise;
    return db.put('messages', message);
}

export async function updateMessage(message: ChatMessage) {
    const db = await dbPromise;
    // put 方法会智能地判断：如果主键已存在，则更新；如果不存在，则新增。
    return db.put('messages', message);
}

export async function renameConversation(id: string, newTitle: string) {
    const db = await dbPromise;
    const conversation = await db.get('conversations', id);
    if (conversation) {
        conversation.title = newTitle;
        return db.put('conversations', conversation);
    }
}

export async function deleteConversation(id: string) {
    const db = await dbPromise;
    // 使用事务来确保原子性：同时删除对话和其所有消息
    const tx = db.transaction(['conversations', 'messages'], 'readwrite');
    const conversationStore = tx.objectStore('conversations');
    const messageStore = tx.objectStore('messages');

    // 1. 删除对话本身
    await conversationStore.delete(id);

    // 2. 删除该对话的所有消息
    let cursor = await messageStore.index('conversationId').openCursor(id);
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }

    return tx.done;
}