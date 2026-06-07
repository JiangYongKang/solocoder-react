import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

const BUFFER = 5;

export default forwardRef(function VirtualList({
  items,
  itemHeight,
  renderItem,
  onScrollBottom,
  onPullRefresh,
  className = '',
}, ref) {
  const containerRef = useRef(null);
  const scrollTopRef = useRef(0);
  const rafRef = useRef(null);
  const [, setRenderTick] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const touchStartY = useRef(null);
  const touchStartScroll = useRef(0);
  const isPulling = useRef(false);
  const pullDistanceRef = useRef(0);

  useImperativeHandle(ref, () => ({
    resetScroll() {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      scrollTopRef.current = 0;
      setRenderTick((t) => t + 1);
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setViewportHeight(container.clientHeight);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const scheduleRender = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setRenderTick((t) => t + 1);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTopRef.current / itemHeight) - BUFFER);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + BUFFER * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = [];
  for (let i = startIndex; i < endIndex; i++) {
    visibleItems.push({ index: i, item: items[i] });
  }

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    scrollTopRef.current = container.scrollTop;
    scheduleRender();
    if (onScrollBottom && !isLoadingMoreRef.current) {
      const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distance < 100) {
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
        const res = onScrollBottom();
        if (res && typeof res.finally === 'function') {
          res.finally(() => {
            isLoadingMoreRef.current = false;
            setIsLoadingMore(false);
          });
        } else {
          isLoadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      }
    }
  }, [onScrollBottom, scheduleRender]);

  const handleTouchStart = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartScroll.current = container.scrollTop;
    isPulling.current = container.scrollTop <= 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return;
    const container = containerRef.current;
    if (!container) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (isPulling.current && deltaY > 0 && !isRefreshing && onPullRefresh) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, 120);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    }
  }, [isRefreshing, onPullRefresh]);

  const handleTouchEnd = useCallback(() => {
    if (isRefreshing || !onPullRefresh) {
      touchStartY.current = null;
      return;
    }
    if (pullDistanceRef.current >= 60) {
      setIsRefreshing(true);
      setPullDistance(60);
      const res = onPullRefresh();
      if (res && typeof res.finally === 'function') {
        res.finally(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          pullDistanceRef.current = 0;
        });
      } else {
        setIsRefreshing(false);
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    } else {
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
    touchStartY.current = null;
    isPulling.current = false;
  }, [isRefreshing, onPullRefresh]);

  return (
    <div
      ref={containerRef}
      className={`vl-container ${className}`}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {onPullRefresh && (
        <div
          className="vl-pull-indicator"
          style={{
            height: pullDistance,
            opacity: isRefreshing ? 1 : pullDistance / 60,
          }}
        >
          {isRefreshing ? (
            <span className="vl-spinner" />
          ) : (
            <span className="vl-pull-text">
              {pullDistance >= 60 ? '释放刷新' : '下拉刷新'}
            </span>
          )}
        </div>
      )}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item }) => (
          <div
            key={item.id || index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {isLoadingMore && (
        <div className="vl-load-more">
          <span className="vl-spinner" />
          <span>加载中...</span>
        </div>
      )}
    </div>
  );
});
