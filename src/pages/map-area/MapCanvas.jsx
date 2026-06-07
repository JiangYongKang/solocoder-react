import { useEffect, useRef, useState, useCallback } from 'react';
import { worldToScreen, screenToWorld, clampZoom } from './mapUtils.js';
import { GRID_SIZE, MARKER_RADIUS, CLUSTER_RADIUS } from './constants.js';

function MapCanvas({
  center,
  zoom,
  onCenterChange,
  onZoomChange,
  onCanvasClick,
  clusters,
  onMarkerClick,
  onClusterClick,
  selectedMarkerId,
  routePoints,
  selectedRouteIds,
}) {
  const svgRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, centerX: 0, centerY: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const { width, height } = size;

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('[data-marker]') || e.target.closest('[data-cluster]')) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      centerX: center.x,
      centerY: center.y,
    };
  }, [center]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newCenterX = dragStartRef.current.centerX - dx / zoom;
    const newCenterY = dragStartRef.current.centerY - dy / zoom;
    onCenterChange({ x: newCenterX, y: newCenterY });
  }, [isDragging, zoom, onCenterChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = clampZoom(zoom * delta);

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldBefore = screenToWorld(mouseX, mouseY, center.x, center.y, zoom, width, height);
    const worldAfter = screenToWorld(mouseX, mouseY, center.x, center.y, newZoom, width, height);

    const newCenter = {
      x: center.x + (worldBefore.x - worldAfter.x),
      y: center.y + (worldBefore.y - worldAfter.y),
    };

    onZoomChange(newZoom);
    onCenterChange(newCenter);
  }, [zoom, center, width, height, onZoomChange, onCenterChange]);

  const handleClick = useCallback((e) => {
    if (e.target.closest('[data-marker]') || e.target.closest('[data-cluster]')) return;
    if (isDragging) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const world = screenToWorld(clickX, clickY, center.x, center.y, zoom, width, height);
    onCanvasClick(world);
  }, [center, zoom, width, height, onCanvasClick, isDragging]);

  const renderGrid = () => {
    const lines = [];
    const gridSize = GRID_SIZE;

    const leftWorld = center.x - width / 2 / zoom;
    const rightWorld = center.x + width / 2 / zoom;
    const topWorld = center.y - height / 2 / zoom;
    const bottomWorld = center.y + height / 2 / zoom;

    const startX = Math.floor(leftWorld / gridSize) * gridSize;
    const endX = Math.ceil(rightWorld / gridSize) * gridSize;
    const startY = Math.floor(topWorld / gridSize) * gridSize;
    const endY = Math.ceil(bottomWorld / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      const screen = worldToScreen(x, 0, center.x, center.y, zoom, width, height);
      lines.push(
        <line
          key={`v-${x}`}
          x1={screen.x}
          y1={0}
          x2={screen.x}
          y2={height}
          stroke="var(--border)"
          strokeWidth={x === 0 ? 1.5 : 0.5}
        />
      );
    }

    for (let y = startY; y <= endY; y += gridSize) {
      const screen = worldToScreen(0, y, center.x, center.y, zoom, width, height);
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={screen.y}
          x2={width}
          y2={screen.y}
          stroke="var(--border)"
          strokeWidth={y === 0 ? 1.5 : 0.5}
        />
      );
    }

    return lines;
  };

  const renderBlocks = () => {
    const blocks = [];
    const gridSize = GRID_SIZE;
    const leftWorld = center.x - width / 2 / zoom;
    const rightWorld = center.x + width / 2 / zoom;
    const topWorld = center.y - height / 2 / zoom;
    const bottomWorld = center.y + height / 2 / zoom;

    const startX = Math.floor(leftWorld / gridSize) * gridSize;
    const startY = Math.floor(topWorld / gridSize) * gridSize;

    const colors = [
      'rgba(170, 59, 255, 0.04)',
      'rgba(59, 130, 246, 0.04)',
      'rgba(16, 185, 129, 0.04)',
      'rgba(245, 158, 11, 0.04)',
    ];

    for (let x = startX; x <= rightWorld; x += gridSize) {
      for (let y = startY; y <= bottomWorld; y += gridSize) {
        const idx = Math.abs(Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 4;
        const screen = worldToScreen(x, y, center.x, center.y, zoom, width, height);
        const next = worldToScreen(x + gridSize, y + gridSize, center.x, center.y, zoom, width, height);
        blocks.push(
          <rect
            key={`b-${x}-${y}`}
            x={screen.x}
            y={screen.y}
            width={next.x - screen.x}
            height={next.y - screen.y}
            fill={colors[idx]}
          />
        );
      }
    }
    return blocks;
  };

  const renderRoute = () => {
    if (!Array.isArray(routePoints) || routePoints.length < 2) return null;
    const screenPoints = routePoints.map((p) => worldToScreen(p.x, p.y, center.x, center.y, zoom, width, height));
    const pathD = screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return (
      <g>
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
        <path
          d={pathD}
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeDasharray="8 8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'block',
        background: 'var(--bg)',
        userSelect: 'none',
      }}
    >
      {renderBlocks()}
      {renderGrid()}
      {renderRoute()}
      {clusters.map((item) => {
        const pos = worldToScreen(item.x, item.y, center.x, center.y, zoom, width, height);
        if (item.isCluster) {
          const count = item.markers.length;
          return (
            <g
              key={item.id}
              data-cluster
              onClick={(e) => {
                e.stopPropagation();
                onClusterClick(item);
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={CLUSTER_RADIUS + Math.min(count * 2, 16)}
                fill="var(--accent)"
                opacity={0.25}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={CLUSTER_RADIUS + Math.min(count, 10)}
                fill="var(--accent)"
                stroke="#fff"
                strokeWidth={2}
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize={14}
                fontWeight={600}
                style={{ pointerEvents: 'none' }}
              >
                {count}
              </text>
            </g>
          );
        }

        const isSelected = selectedMarkerId === item.id;
        const isRouteSelected = selectedRouteIds.includes(item.id);

        return (
          <g
            key={item.id}
            data-marker
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClick(item);
            }}
            style={{ cursor: 'pointer' }}
          >
            {isSelected && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={MARKER_RADIUS + 10}
                fill="var(--accent)"
                opacity={0.2}
              />
            )}
            {isRouteSelected && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={MARKER_RADIUS + 6}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={3}
                strokeDasharray="4 2"
              />
            )}
            <path
              d={`M ${pos.x} ${pos.y - MARKER_RADIUS * 2}
                  C ${pos.x - MARKER_RADIUS * 1.5} ${pos.y - MARKER_RADIUS * 2},
                    ${pos.x - MARKER_RADIUS * 1.5} ${pos.y - MARKER_RADIUS * 0.5},
                    ${pos.x} ${pos.y}
                  C ${pos.x + MARKER_RADIUS * 1.5} ${pos.y - MARKER_RADIUS * 0.5},
                    ${pos.x + MARKER_RADIUS * 1.5} ${pos.y - MARKER_RADIUS * 2},
                    ${pos.x} ${pos.y - MARKER_RADIUS * 2} Z`}
              fill={isRouteSelected ? '#10b981' : 'var(--accent)'}
              stroke="#fff"
              strokeWidth={2}
            />
            <circle
              cx={pos.x}
              cy={pos.y - MARKER_RADIUS * 1.3}
              r={MARKER_RADIUS * 0.45}
              fill="#fff"
            />
          </g>
        );
      })}
    </svg>
  );
}

export default MapCanvas;
