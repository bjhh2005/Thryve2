import React, { FC, useState, useMemo, useEffect, useRef } from 'react';
import { Input } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';
import { NodePanelRenderProps } from '@flowgram.ai/free-node-panel-plugin';
import { useClientContext, type WorkflowNodeJSON } from '@flowgram.ai/free-layout-editor';
import fuzzysort from 'fuzzysort';

import { FlowNodeRegistry } from '../../typings';
import { visibleNodeRegistries } from '../../nodes';
import styled from 'styled-components'; // 我们继续使用 styled-components

// --- 样式组件定义 ---
const NodeSearchContainer = styled.div`
    width: 280px;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
`;
const SearchInputWrapper = styled.div`
    padding: 8px;
    border-bottom: 1px solid var(--semi-color-border);
    flex-shrink: 0;
`;
const ResultsList = styled.ul`
    list-style: none;
    padding: 8px;
    margin: 0;
    max-height: 400px;
    overflow-y: auto;
    
    &::-webkit-scrollbar { width: 10px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
        background-color: #e0e0e0;
        border-radius: 5px;
        border: 2px solid transparent;
        background-clip: content-box;
        &:hover { background-color: #c7c7c7; }
    }
    scrollbar-width: thin;
    scrollbar-color: #e0e0e0 transparent;
`;

const ResultItem = styled.li<{ $active: boolean }>`
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: ${props => props.$active ? 'var(--semi-color-fill-0)' : 'transparent'};

    &:hover {
        background-color: var(--semi-color-fill-0);
    }
`;

const ResultIcon = styled.div`
    flex-shrink: 0;
    img {
        width: 16px;
        height: 16px;
        border-radius: 4px;
    }
`;

const ResultContent = styled.div`
    font-size: 14px;
    color: var(--semi-color-text-0);
    font-weight: 500;
    // 高亮字符的样式
    b {
        color: var(--semi-color-primary);
        font-weight: 600;
    }
`;

const NoResults = styled.div`
    padding: 20px;
    text-align: center;
    color: var(--semi-color-text-2);
`;

// --- 主组件逻辑 ---
interface NodeListProps {
  onSelect: NodePanelRenderProps['onSelect'];
  onClose: NodePanelRenderProps['onClose'];
}

export const NodeList: FC<NodeListProps> = (props) => {
  const { onSelect, onClose } = props;
  const context = useClientContext();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo((): Fuzzysort.KeyResults<FlowNodeRegistry> => {
    return fuzzysort.go(query, visibleNodeRegistries, {
      key: 'type',
      all: true, // 如果希望空字符串返回所有结果，可以明确加上此项，但通常是默认行为  
    });
  }, [query]);

  const handleNodeSelect = (registry: FlowNodeRegistry, event: React.MouseEvent) => {
    const json: WorkflowNodeJSON | undefined = registry.onAdd?.(context);
    onSelect({ nodeType: registry.type as string, selectEvent: event, nodeJSON: json });
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = (e.target as HTMLElement).closest('.node-search-palette')?.querySelector('.result-item.active');
        if (activeItem) {
          (activeItem as HTMLElement).click();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    const inputElement = inputRef.current;
    inputElement?.addEventListener('keydown', handleKeyDown);
    return () => inputElement?.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, searchResults, onClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <NodeSearchContainer className="node-search-palette">
      <SearchInputWrapper>
        <Input
          ref={inputRef as any}
          value={query}
          onChange={(v) => { setQuery(v); setActiveIndex(0); }}
          placeholder="搜索并添加节点..."
          prefix={<IconSearch />}
          autoFocus
        />
      </SearchInputWrapper>

      <ResultsList>
        {searchResults.length > 0 ? (
          searchResults.map((result, index) => (
            <ResultItem
              key={result.obj.type}
              className={index === activeIndex ? 'active' : ''}
              $active={index === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => handleNodeSelect(result.obj, e)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <ResultIcon>
                <img src={result.obj.info?.icon} alt="" />
              </ResultIcon>
              <ResultContent
                dangerouslySetInnerHTML={{
                  __html: result.highlight('<b>', '</b>') || result.target
                }}
              />
            </ResultItem>
          ))
        ) : (
          <NoResults>没有找到匹配的节点</NoResults>
        )}
      </ResultsList>
    </NodeSearchContainer>
  );
};