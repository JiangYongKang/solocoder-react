import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DANMAKU_TYPES,
  DANMAKU_SCROLL_DURATION,
} from './constants.js';
import {
  createDanmaku,
  generateRandomCommentDanmaku,
  generateRandomPurchaseDanmaku,
  generateRandomLikeDanmaku,
  pushDanmaku,
} from './utils.js';

const SCROLLING_POOL_SIZE = 8;

export default function DanmakuArea({ currentProduct, onDanmakuChange, onPurchaseNotice }) {
  const [danmakuHistory, setDanmakuHistory] = useState([]);
  const [scrollingList, setScrollingList] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const scrollTracksRef = useRef(new Array(SCROLLING_POOL_SIZE).fill(0));
  const containerRef = useRef(null);
  const timersRef = useRef([]);

  const registerTimer = useCallback((id) => {
    if (id != null) timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => {
      if (typeof id === 'number' || typeof id === 'object') {
        clearTimeout(id);
        clearInterval(id);
      }
    });
    timersRef.current = [];
  }, []);

  useEffect(() => clearAllTimers, [clearAllTimers]);

  const findAvailableTrack = useCallback(() => {
    const now = Date.now();
    for (let i = 0; i < SCROLLING_POOL_SIZE; i++) {
      if (now - scrollTracksRef.current[i] > 1500) {
        scrollTracksRef.current[i] = now;
        return i;
      }
    }
    const idx = Math.floor(Math.random() * SCROLLING_POOL_SIZE);
    scrollTracksRef.current[idx] = now;
    return idx;
  }, []);

  const addDanmaku = useCallback((danmaku) => {
    if (!danmaku) return;
    const track = findAvailableTrack();
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const scrollingItem = {
      ...danmaku,
      track,
      startX: containerWidth,
    };
    setScrollingList((prev) => [...prev, scrollingItem]);
    setDanmakuHistory((prev) => pushDanmaku(prev, danmaku));

    registerTimer(setTimeout(() => {
      setScrollingList((prev) => prev.filter((x) => x.id !== danmaku.id));
      scrollTracksRef.current[track] = 0;
    }, DANMAKU_SCROLL_DURATION));
  }, [findAvailableTrack, registerTimer]);

  useEffect(() => {
    onDanmakuChange && onDanmakuChange(danmakuHistory);
  }, [danmakuHistory, onDanmakuChange]);

  useEffect(() => {
    for (let i = 0; i < 6; i++) {
      registerTimer(setTimeout(() => {
        addDanmaku(generateRandomCommentDanmaku());
      }, i * 400));
    }
  }, [addDanmaku, registerTimer]);

  useEffect(() => {
    const timer = setInterval(() => {
      const r = Math.random();
      let d;
      if (r < 0.7) d = generateRandomCommentDanmaku();
      else if (r < 0.9) d = generateRandomLikeDanmaku();
      else d = generateRandomPurchaseDanmaku(currentProduct?.name);
      addDanmaku(d);
    }, 1800);
    registerTimer(timer);
    return () => clearInterval(timer);
  }, [addDanmaku, currentProduct, registerTimer]);

  useEffect(() => {
    const timer = setInterval(() => {
      const d = generateRandomPurchaseDanmaku(currentProduct?.name || '热销商品');
      addDanmaku(d);
      onPurchaseNotice && onPurchaseNotice(d);
    }, 5200);
    registerTimer(timer);
    return () => clearInterval(timer);
  }, [addDanmaku, currentProduct, onPurchaseNotice, registerTimer]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() < 0.6) {
        addDanmaku(generateRandomLikeDanmaku());
      }
    }, 1200);
    registerTimer(timer);
    return () => clearInterval(timer);
  }, [addDanmaku, registerTimer]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const d = createDanmaku({
      type: DANMAKU_TYPES.COMMENT,
      content: trimmed.slice(0, 50),
      username: '我',
    });
    addDanmaku(d);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const recentHistory = danmakuHistory.slice(-15).reverse();

  return (
    <div className="ls-danmaku-area">
      <div className="ls-danmaku-header">
        <span className="ls-danmaku-title">💬 直播互动</span>
        <span className="ls-danmaku-count">{danmakuHistory.length} 条</span>
      </div>

      <div className="ls-danmaku-viewport" ref={containerRef}>
        {scrollingList.map((d) => {
          const typeLabel = {
            [DANMAKU_TYPES.COMMENT]: '',
            [DANMAKU_TYPES.PURCHASE]: '🛒 ',
            [DANMAKU_TYPES.LIKE]: '',
          }[d.type] || '';
          return (
            <div
              key={d.id}
              className={`ls-danmaku-scroll-item ls-danmaku--${d.type}`}
              style={{
                top: `${d.track * 32 + 6}px`,
                animationDuration: `${DANMAKU_SCROLL_DURATION}ms`,
                color: d.color,
              }}
            >
              <span className="ls-danmaku-user">{d.username}：</span>
              <span className="ls-danmaku-content">{typeLabel}{d.content}</span>
            </div>
          );
        })}
      </div>

      <div className="ls-danmaku-history">
        {recentHistory.map((d) => (
          <div key={d.id} className={`ls-danmaku-history-item ls-danmaku--${d.type}`}>
            <span className="ls-danmaku-user">{d.username}：</span>
            <span style={{ color: d.color }}>{d.content}</span>
          </div>
        ))}
      </div>

      <div className="ls-danmaku-input">
        <input
          type="text"
          placeholder="发条弹幕参与互动..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={50}
        />
        <button
          className="ls-btn-primary"
          onClick={handleSend}
          disabled={!inputValue.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
}
