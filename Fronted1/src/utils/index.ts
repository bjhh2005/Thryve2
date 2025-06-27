export { onDragLineEnd } from './on-drag-line-end';

/**
 * 计算弹出层的位置
 * @param triggerElement 触发元素的DOM节点
 * @returns 应该显示的位置 'top' | 'bottom'
 */
export const calculatePopoverPosition = (triggerElement: HTMLElement): 'top' | 'bottom' => {
  if (!triggerElement) return 'top';
  
  const rect = triggerElement.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const elementMiddle = rect.top + rect.height / 2;
  
  // 如果元素在窗口上半部分，弹出层显示在下方
  // 如果元素在窗口下半部分，弹出层显示在上方
  return elementMiddle < windowHeight / 2 ? 'bottom' : 'top';
};
