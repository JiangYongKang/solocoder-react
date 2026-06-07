import { useRef, useState, useCallback, useEffect } from 'react';
import { formatDate } from './data.js';

const ACTION_WIDTH = 140;

export default function ListItem({ item, onEdit, onDelete }) {
  const contentRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const touchStartX = useRef(null);
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const setBothOffset = useCallback((value) => {
    offsetRef.current = value;
    setOffset(value);
  }, []);

  useEffect(() => {
    const reset = () => {
      setBothOffset(0);
      setIsOpen(false);
    };
    const id = setTimeout(reset, 0);
    return () => clearTimeout(id);
  }, [item.id, setBothOffset]);

  const finalize = useCallback(() => {
    const curOffset = offsetRef.current;
    const shouldOpen = curOffset < -ACTION_WIDTH / 2;
    setBothOffset(shouldOpen ? -ACTION_WIDTH : 0);
    setIsOpen(shouldOpen);
    touchStartX.current = null;
    isDragging.current = false;
  }, [setBothOffset]);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    startOffset.current = offsetRef.current;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    let next = startOffset.current + delta;
    next = Math.max(-ACTION_WIDTH, Math.min(0, next));
    setBothOffset(next);
  }, [setBothOffset]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;
    finalize();
  }, [finalize]);

  const handleMouseDown = useCallback((e) => {
    touchStartX.current = e.clientX;
    startOffset.current = offsetRef.current;
    isDragging.current = true;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (touchStartX.current === null || !isDragging.current) return;
    const delta = e.clientX - touchStartX.current;
    let next = startOffset.current + delta;
    next = Math.max(-ACTION_WIDTH, Math.min(0, next));
    setBothOffset(next);
  }, [setBothOffset]);

  const handleMouseUp = useCallback(() => {
    if (touchStartX.current === null) return;
    finalize();
  }, [finalize]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging.current) {
        finalize();
      } else {
        touchStartX.current = null;
      }
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [finalize]);

  return (
    <div className="li-wrapper">
      <div
        className="li-content"
        ref={contentRef}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="li-main">
          <h3 className="li-title">{item.title}</h3>
          <p className="li-desc">{item.description}</p>
          <span className="li-time">{formatDate(item.createdAt)}</span>
        </div>
      </div>
      <div className="li-actions" style={{ width: isOpen ? ACTION_WIDTH : 0 }}>
        <button
          type="button"
          className="li-btn li-btn-edit"
          onClick={() => {
            setBothOffset(0);
            setIsOpen(false);
            onEdit(item);
          }}
        >
          编辑
        </button>
        <button
          type="button"
          className="li-btn li-btn-delete"
          onClick={() => {
            setBothOffset(0);
            setIsOpen(false);
            onDelete(item);
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}
