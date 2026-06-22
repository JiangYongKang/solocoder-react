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
  const heartsLayerRef = useRef(null);
  const btnRef = useRef(null);
  const heartTimersRef = useRef([]);

  useEffect(() => {
    autoLikeRef.current = setInterval(() => {
      const inc = 1 + Math.floor(Math.random() * 3);
      setLikeCount((prev) => (prev || LIVE_STATS_INITIAL.likeCount) + inc);
    }, 1500);
    return () => {
      autoLikeRef.current && clearInterval(autoLikeRef.current);
      heartTimersRef.current.forEach((id) => clearTimeout(id));
      heartTimersRef.current = [];
    };
  }, [setLikeCount]);

  const registerHeartTimer = (id) => {
    if (id != null) heartTimersRef.current.push(id);
    return id;
  };

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

    registerHeartTimer(setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, duration + 100));
  };

  const handleClick = () => {
    const layerRect = heartsLayerRef.current?.getBoundingClientRect();
    const btnRect = btnRef.current?.getBoundingClientRect();
    if (!layerRect || !btnRect) return;

    const centerX = btnRect.left + btnRect.width / 2;
    const centerY = btnRect.top + btnRect.height / 2;
    const x = centerX - layerRect.left;
    const y = centerY - layerRect.top;

    for (let i = 0; i < 3; i++) {
      registerHeartTimer(setTimeout(() => spawnHeart(x, y), i * 60));
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
      <div className="ls-hearts-layer" ref={heartsLayerRef}>
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
      <button className="ls-like-btn" ref={btnRef} onClick={handleClick} aria-label="点赞">
        <span className="ls-like-icon">❤️</span>
        <span className="ls-like-count">{formatCount(likeCount || LIVE_STATS_INITIAL.likeCount)}</span>
      </button>
    </div>
  );
}

export function OnlineCounter() {
  const [count, setCount] = useState(() => generateInitialOnlineCount());
  const [isIncreasing, setIsIncreasing] = useState(true);
  const timersRef = useRef([]);
  const prevValueRef = useRef(count);

  useEffect(() => {
    const registerTimer = (id) => {
      if (id != null) timersRef.current.push(id);
      return id;
    };

    const tick = () => {
      const prev = prevValueRef.current;
      const next = nextOnlineCount(prev);
      setIsIncreasing(next >= prev);
      prevValueRef.current = next;
      setCount(next);
      const nextInterval =
        ONLINE_CHANGE_INTERVAL_MIN +
        Math.random() * (ONLINE_CHANGE_INTERVAL_MAX - ONLINE_CHANGE_INTERVAL_MIN);
      registerTimer(setTimeout(tick, nextInterval));
    };

    registerTimer(setTimeout(tick, 2000));

    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
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
