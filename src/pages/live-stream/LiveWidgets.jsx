import { useEffect, useRef, useState } from 'react';
import {
  LIKE_FLOAT_DURATION,
  LIKE_MAX_FLOATING,
  LIVE_STATS_INITIAL,
  ONLINE_CHANGE_INTERVAL_MIN,
  ONLINE_CHANGE_INTERVAL_MAX,
} from './constants.js';
import {
  generateInitialOnlineCount,
  nextOnlineCount,
} from './utils.js';

const HEART_COLORS = ['#ff4d6d', '#ff006e', '#ff70a6', '#ff9770', '#ffd670', '#e9ff70', '#c77dff'];

export function LikeButton({ likeCount, setLikeCount }) {
  const [hearts, setHearts] = useState([]);
  const autoLikeRef = useRef(null);

  useEffect(() => {
    autoLikeRef.current = setInterval(() => {
      const inc = 1 + Math.floor(Math.random() * 3);
      setLikeCount((prev) => (prev || LIVE_STATS_INITIAL.likeCount) + inc);
    }, 1500);
    return () => autoLikeRef.current && clearInterval(autoLikeRef.current);
  }, [setLikeCount]);

  const spawnHeart = (originX, originY) => {
    const id = `heart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
    const offsetX = (Math.random() - 0.5) * 80;
    const scale = 0.7 + Math.random() * 0.8;
    const duration = LIKE_FLOAT_DURATION + Math.random() * 500;

    setHearts((prev) => {
      const next = [...prev, { id, color, offsetX, scale, duration, originX, originY }];
      return next.slice(-LIKE_MAX_FLOATING);
    });

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, duration + 100);
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
    const x = rect.left + rect.width / 2 - containerRect.left;
    const y = rect.top + rect.height / 2 - containerRect.top;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnHeart(x, y), i * 60);
    }
    setLikeCount((prev) => (prev || LIVE_STATS_INITIAL.likeCount) + 1);
  };

  const formatCount = (n) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  return (
    <div className="ls-like-container">
      <div className="ls-hearts-layer">
        {hearts.map((h) => (
          <span
            key={h.id}
            className="ls-heart-float"
            style={{
              left: h.originX,
              top: h.originY,
              color: h.color,
              '--offset-x': `${h.offsetX}px`,
              '--scale': h.scale,
              animationDuration: `${h.duration}ms`,
            }}
          >
            ❤
          </span>
        ))}
      </div>
      <button className="ls-like-btn" onClick={handleClick} aria-label="点赞">
        <span className="ls-like-icon">❤️</span>
        <span className="ls-like-count">{formatCount(likeCount || LIVE_STATS_INITIAL.likeCount)}</span>
      </button>
    </div>
  );
}

export function OnlineCounter() {
  const [count, setCount] = useState(() => generateInitialOnlineCount());
  const [isIncreasing, setIsIncreasing] = useState(true);

  useEffect(() => {
    let timer;
    const tick = () => {
      setCount((prev) => {
        const next = nextOnlineCount(prev);
        setIsIncreasing(next >= prev);
        return next;
      });
      const nextInterval =
        ONLINE_CHANGE_INTERVAL_MIN +
        Math.random() * (ONLINE_CHANGE_INTERVAL_MAX - ONLINE_CHANGE_INTERVAL_MIN);
      timer = setTimeout(tick, nextInterval);
    };
    timer = setTimeout(tick, 2000);
    return () => timer && clearTimeout(timer);
  }, []);

  return (
    <div className={`ls-online-counter ${isIncreasing ? 'is-up' : 'is-down'}`}>
      <span className="ls-online-dot" />
      <span className="ls-online-label">在线</span>
      <span className="ls-online-count">
        {count.toLocaleString()}
      </span>
      <span className="ls-online-arrow">{isIncreasing ? '↗' : '↘'}</span>
    </div>
  );
}

export function LiveHeader() {
  return (
    <div className="ls-live-header">
      <div className="ls-live-anchor">
        <div className="ls-anchor-avatar">🎤</div>
        <div className="ls-anchor-info">
          <div className="ls-anchor-name">好物优选直播间</div>
          <div className="ls-anchor-tag">
            <span className="ls-live-badge">LIVE</span>
            <span>官方认证主播</span>
          </div>
        </div>
        <button className="ls-follow-btn">+ 关注</button>
      </div>
    </div>
  );
}
