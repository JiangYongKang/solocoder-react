const STORAGE_KEY = 'infinite-list-data';
const TITLES = [
  '探索 React 19 新特性',
  '深入理解虚拟 DOM',
  '性能优化最佳实践',
  '前端工程化指南',
  '状态管理方案对比',
  '响应式布局技巧',
  '组件设计模式',
  'TypeScript 进阶',
  '构建高可用 Web 应用',
  '现代 CSS 布局方案',
  '异步编程深入解析',
  '浏览器工作原理',
  'Web 安全防护指南',
  '前端监控体系搭建',
  '微前端架构实践',
];
const DESCRIPTIONS = [
  '这是一条模拟数据，用于展示列表功能的完整实现。包含标题、描述、创建时间等字段。',
  '在实际项目中，这些数据会从后端接口获取。这里使用随机生成的方式来模拟真实场景。',
  '虚拟滚动可以显著提升渲染性能，特别适合处理大量数据的列表场景。',
  '下拉刷新和上拉加载更多是移动端常见的交互模式，提升了用户体验。',
  '左滑操作在 iOS 应用中非常流行，为列表项提供了快捷的操作入口。',
  '数据持久化是提升用户体验的重要手段，确保用户刷新页面后数据不丢失。',
  '实时搜索过滤可以帮助用户快速定位到需要的内容，减少查找时间。',
  '单元测试能够保证纯逻辑函数的正确性，降低回归风险。',
];

let idCounter = 0;
export function generateId() {
  idCounter += 1;
  return 'item-' + Date.now().toString(36) + '-' + idCounter.toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

export function generateItem(idOverride) {
  const id = idOverride || generateId();
  const title = TITLES[Math.floor(Math.random() * TITLES.length)] + ' #' + Math.floor(Math.random() * 10000);
  const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
  const createdAt = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
  return { id, title, description, createdAt };
}

export function generateItems(count = 100) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(generateItem());
  }
  return items;
}

export function ensureInitialData(count = 10000) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  const initial = generateItems(count);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items;
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function filterItems(items, keyword) {
  if (!keyword || typeof keyword !== 'string') return items;
  const lower = keyword.toLowerCase().trim();
  if (!lower) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower)
  );
}

export function updateItemTitle(items, id, newTitle) {
  const title = (newTitle || '').trim();
  if (!title) return items;
  return items.map((item) =>
    item.id === id ? { ...item, title } : item
  );
}

export function deleteItem(items, id) {
  return items.filter((item) => item.id !== id);
}

export function prependItems(items, newItems) {
  return [...newItems, ...items];
}

export function appendItems(items, newItems) {
  return [...items, ...newItems];
}

export function formatDate(timestamp) {
  const d = new Date(timestamp);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
