# 🚀 工作流编辑器性能优化指南

## 已实现的优化策略

### 1. React.memo 组件优化
我们已经对关键组件实现了 `React.memo` 优化，有效防止不必要的重渲染：

- ✅ `AIAssistantPanel` - AI助手面板
- ✅ `ConsolePanel` - 控制台面板  
- ✅ `BaseNode` - 所有节点组件的基础包装器
- ✅ `BreakpointToggle` - 断点切换组件

### 2. 关注点分离的状态管理
系统采用了多个独立的 Context Provider，避免了单一巨大状态导致的性能问题：

- `ExecutionProvider` - 执行状态管理
- `BreakpointProvider` - 断点状态管理
- `ProjectProvider` - 项目管理
- `ChatProvider` - 聊天状态管理

### 3. 事件系统优化
#### 后端优化
- 使用 `eventlet` 和猴子补丁确保高并发性能
- WebSocket 连接池管理，避免连接阻塞
- 异步事件处理，保持界面响应性

#### 前端优化
- Socket.IO 事件监听器合理分组
- 防止重复连接的安全锁机制
- 智能重连策略

## 性能监控和调试

### 1. 开发者工具
在浏览器控制台中可用的调试函数：

```javascript
// 查看可用工作流
debugWorkflows.getAvailableWorkflows()

// 查看工作流预览
debugWorkflows.getWorkflowPreview()

// 调试工作流状态
debugWorkflows.debugWorkflows()
```

### 2. 内存监控
后端提供了完整的内存监控 API：

```http
GET /api/workflows/memory          # 全局内存使用情况
GET /api/workflows/{id}/memory     # 特定工作流内存使用
POST /api/workflows/memory/cleanup # 强制清理子工作流内存
```

## 最佳实践建议

### 1. 组件开发规范

#### 使用 React.memo 的场景
✅ **应该使用:**
- 重渲染频繁的叶子组件
- props 变化较少的容器组件
- 渲染成本较高的组件（如大列表、复杂计算）

❌ **不需要使用:**
- props 经常变化的组件
- 已经是子组件且父组件已优化的情况
- 简单的展示组件（优化成本 > 收益）

#### memo 使用示例
```typescript
import React, { memo } from 'react';

// 良好的 memo 使用
export const ExpensiveComponent = memo(({ data, config }) => {
  // 复杂的渲染逻辑
  return <div>{/* ... */}</div>;
});

// 自定义比较函数（谨慎使用）
export const OptimizedComponent = memo(({ items, settings }) => {
  return <div>{/* ... */}</div>;
}, (prevProps, nextProps) => {
  // 只在 items 长度变化时重渲染
  return prevProps.items.length === nextProps.items.length;
});
```

### 2. 状态管理优化

#### 避免过度订阅
```typescript
// ❌ 不好：订阅了整个执行状态
const { ...allExecutionState } = useExecution();

// ✅ 好：只订阅需要的状态
const { isRunning, nodeStates } = useExecution();
```

#### 合理使用 useCallback 和 useMemo
```typescript
import { useCallback, useMemo } from 'react';

export const OptimizedComponent = ({ items, filter }) => {
  // 缓存计算结果
  const filteredItems = useMemo(() => {
    return items.filter(item => item.status === filter);
  }, [items, filter]);

  // 缓存回调函数
  const handleItemClick = useCallback((itemId) => {
    // 处理点击事件
  }, []);

  return (
    <div>
      {filteredItems.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
};
```

### 3. 大列表优化

#### 虚拟滚动（推荐）
对于超过 100 个项目的列表，考虑使用虚拟滚动：

```typescript
import { FixedSizeList as List } from 'react-window';

export const VirtualizedProjectList = ({ projects }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ProjectCard project={projects[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={projects.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

#### 分页加载
```typescript
export const PaginatedProjectList = () => {
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState([]);
  
  const loadMoreProjects = useCallback(async () => {
    const newProjects = await fetchProjects(page, 20);
    setProjects(prev => [...prev, ...newProjects]);
    setPage(prev => prev + 1);
  }, [page]);

  return (
    <InfiniteScroll
      hasMore={hasMoreProjects}
      loadMore={loadMoreProjects}
    >
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </InfiniteScroll>
  );
};
```

### 4. 动画性能优化

#### CSS 动画优化
```css
/* ✅ 使用 transform 和 opacity，这些属性不触发重排 */
.node-animation {
  transform: translateX(100px);
  opacity: 0.5;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* ❌ 避免动画会触发重排的属性 */
.bad-animation {
  left: 100px;  /* 触发重排 */
  width: 200px; /* 触发重排 */
}

/* 🚀 使用 will-change 提示浏览器优化 */
.optimized-node {
  will-change: transform, opacity;
}
```

#### JavaScript 动画优化
```typescript
// 使用 requestAnimationFrame
const animateNode = useCallback(() => {
  const animate = (timestamp) => {
    // 动画逻辑
    if (needsContinue) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
}, []);
```

## 性能监控指标

### 关键指标
1. **First Contentful Paint (FCP)** < 1.5s
2. **Largest Contentful Paint (LCP)** < 2.5s  
3. **Cumulative Layout Shift (CLS)** < 0.1
4. **First Input Delay (FID)** < 100ms

### 监控工具
```typescript
// 性能监控钩子
export const usePerformanceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration}ms`);
      }
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
    
    return () => observer.disconnect();
  }, []);
};
```

## 调试性能问题

### 1. React DevTools Profiler
- 启用 Profiler 标签页
- 录制交互过程
- 查找不必要的重渲染

### 2. Chrome DevTools
```javascript
// 标记性能关键代码
performance.mark('workflow-execution-start');
// ... 工作流执行代码
performance.mark('workflow-execution-end');
performance.measure(
  'workflow-execution', 
  'workflow-execution-start', 
  'workflow-execution-end'
);
```

### 3. 内存泄漏检测
```typescript
// 组件卸载时清理
useEffect(() => {
  const cleanup = () => {
    // 清理定时器
    clearInterval(intervalId);
    // 取消 WebSocket 连接
    socket?.disconnect();
    // 清理事件监听器
    document.removeEventListener('click', handler);
  };
  
  return cleanup;
}, []);
```

## 生产环境优化

### 1. 构建优化
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          editor: ['@flowgram.ai/free-layout-editor'],
          ui: ['@douyinfe/semi-ui']
        }
      }
    }
  }
});
```

### 2. 资源优化
- 图片懒加载
- SVG 图标优化
- 字体子集化
- Gzip/Brotli 压缩

### 3. CDN 和缓存策略
```typescript
// 静态资源缓存
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000',
  'ETag': generateETag(content)
};
```

---

## 总结

当前系统已经实现了基础的性能优化策略，包括：
- ✅ 组件级别的 React.memo 优化
- ✅ 合理的状态管理分离
- ✅ 高效的事件系统
- ✅ 完善的内存管理

继续保持这些最佳实践，并根据实际使用情况进行针对性优化，可以确保工作流编辑器在处理复杂场景时依然保持流畅的用户体验。 