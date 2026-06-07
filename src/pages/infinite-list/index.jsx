import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VirtualList from './VirtualList.jsx';
import ListItem from './ListItem.jsx';
import EditDialog from './EditDialog.jsx';
import {
  ensureInitialData,
  saveItems,
  filterItems,
  updateItemTitle,
  deleteItem,
  prependItems,
  appendItems,
  generateItems,
} from './data.js';
import './index.css';

const ITEM_HEIGHT = 120;
const REFRESH_COUNT = 20;
const LOAD_MORE_COUNT = 50;

export default function InfiniteListPage() {
  const [items, setItems] = useState(() => ensureInitialData(10000));
  const [keyword, setKeyword] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const listRef = useRef(null);

  const filteredItems = useMemo(() => filterItems(items, keyword), [items, keyword]);

  useEffect(() => {
    listRef.current?.resetScroll();
  }, [keyword]);

  const persist = useCallback((next) => {
    saveItems(next);
    setItems(next);
  }, []);

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 800));
    const newItems = generateItems(REFRESH_COUNT);
    const next = prependItems(items, newItems);
    persist(next);
  }, [items, persist]);

  const handleLoadMore = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    const newItems = generateItems(LOAD_MORE_COUNT);
    const next = appendItems(items, newItems);
    persist(next);
  }, [items, persist]);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, []);

  const handleEditSubmit = useCallback((newTitle) => {
    if (!editingItem) return;
    const next = updateItemTitle(items, editingItem.id, newTitle);
    persist(next);
    setDialogOpen(false);
    setEditingItem(null);
  }, [items, editingItem, persist]);

  const handleDelete = useCallback((item) => {
    const next = deleteItem(items, item.id);
    persist(next);
  }, [items, persist]);

  const renderItem = useCallback((item) => (
    <ListItem
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ), [handleEdit, handleDelete]);

  return (
    <div className="il-page">
      <header className="il-header">
        <Link to="/" className="il-back">← 返回</Link>
        <h1 className="il-title">无限滚动列表</h1>
        <span className="il-count">共 {filteredItems.length} 条</span>
      </header>
      <div className="il-search-wrap">
        <input
          type="search"
          className="il-search"
          placeholder="搜索标题或描述..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <VirtualList
        ref={listRef}
        items={filteredItems}
        itemHeight={ITEM_HEIGHT}
        renderItem={renderItem}
        onPullRefresh={handleRefresh}
        onScrollBottom={handleLoadMore}
        className="il-list"
      />
      <EditDialog
        open={dialogOpen}
        initialTitle={editingItem?.title}
        onClose={() => {
          setDialogOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
