import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  worldToScreen,
  screenToWorld,
  clampZoom,
  getRoutePoints,
} from './routeUtils.js';
import {
  GRID_SPACING,
  MAP_BACKGROUND,
  ROAD_COLOR,
  ROAD_MAJOR_COLOR,
  MARKER_COLORS,
  MARKER_RADIUS,
} from './constants.js';

function generateRoadLines() {
  const lines = [];
  const range = 2000;
  const spacing = GRID_SPACING;
  const majorSpacing = spacing * 4;

  for (let x = -range; x <= range; x += spacing) {
    const isMajor = x % majorSpacing === 0;
    lines.push({ orientation: 'vertical', position: x, isMajor });
  }
  for (let y = -range; y <= range; y += spacing) {
    const isMajor = y % majorSpacing === 0;
    lines.push({ orientation: 'horizontal', position: y, isMajor });
  }
  return lines;
}

function RouteMapCanvas({
  center,
  zoom,
  onCenterChange,
  onZoomChange,
  start,
  waypoints,
  end,
  onCanvasClick,
  onMarkerDragStart,
  onMarkerDrag,
  onMarkerDragEnd,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  const isDraggingMap = useRef(false);
  const isDraggingMarker = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, centerX: 0, centerY: 0 });
  const didMoveRef = useRef(false);
  const draggedMarkerRef = useRef(null);

  const roadLines = useMemo(() => generateRoadLines(), []);
  const routePoints = useMemo(() => getRoutePoints(start, waypoints, end), [start, waypoints, end]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: Math.max(rect.width, 400), height: Math.max(rect.height, 400) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const { width, height } = size;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = MAP_BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    ctx.lineCap = 'round';
    for (const line of roadLines) {
      const color = line.isMajor ? ROAD_MAJOR_COLOR : ROAD_COLOR;
      const lineWidth = line.isMajor ? 3 : 1.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * zoom;

      if (line.orientation === 'vertical') {
        const screen = worldToScreen(line.position, 0, center.x, center.y, zoom, width, height);
        if (screen.x < -50 || screen.x > width + 50) continue;
        ctx.beginPath();
        ctx.moveTo(screen.x, 0);
        ctx.lineTo(screen.x, height);
        ctx.stroke();
      } else {
        const screen = worldToScreen(0, line.position, center.x, center.y, zoom, width, height);
        if (screen.y < -50 || screen.y > height + 50) continue;
        ctx.beginPath();
        ctx.moveTo(0, screen.y);
        ctx.lineTo(width, screen.y);
        ctx.stroke();
      }
    }

    if (routePoints.length >= 2) {
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < routePoints.length; i++) {
        const p = routePoints[i];
        const sp = worldToScreen(p.x, p.y, center.x, center.y, zoom, width, height);
        if (i === 0) ctx.moveTo(sp.x, sp.y);
        else ctx.lineTo(sp.x, sp.y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      for (let i = 0; i < routePoints.length; i++) {
        const p = routePoints[i];
        const sp = worldToScreen(p.x, p.y, center.x, center.y, zoom, width, height);
        if (i === 0) ctx.moveTo(sp.x, sp.y);
        else ctx.lineTo(sp.x, sp.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const markersToDraw = [];
    if (start) markersToDraw.push({ ...start, type: 'start', label: '起' });
    if (Array.isArray(waypoints)) {
      waypoints.forEach((w, i) => markersToDraw.push({ ...w, type: 'waypoint', label: String(i + 1) }));
    }
    if (end) markersToDraw.push({ ...end, type: 'end', label: '终' });

    for (const m of markersToDraw) {
      const sp = worldToScreen(m.x, m.y, center.x, center.y, zoom, width, height);
      const radius = MARKER_RADIUS * Math.max(zoom, 0.6);
      const color = MARKER_COLORS[m.type] || MARKER_COLORS.waypoint;

      ctx.beginPath();
      ctx.arc(sp.x, sp.y, radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(12 * Math.max(zoom, 0.7))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.label, sp.x, sp.y);

      const tagBg = color;
      const tagText = m.type === 'start' ? '起点' : m.type === 'end' ? '终点' : `途经点${m.label}`;
      ctx.font = `12px sans-serif`;
      const tw = ctx.measureText(tagText).width + 12;
      const th = 20;
      const tx = sp.x + radius + 6;
      const ty = sp.y - th / 2;
      ctx.fillStyle = tagBg;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, th, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, tx + tw / 2, ty + th / 2 + 1);
    }
  }, [width, height, center, zoom, roadLines, routePoints, start, waypoints, end]);

  useEffect(() => {
    draw();
  }, [draw]);

  const hitTestMarker = useCallback((screenX, screenY) => {
    const markers = [];
    if (start) markers.push({ ...start, type: 'start' });
    if (Array.isArray(waypoints)) {
      waypoints.forEach((w) => markers.push({ ...w, type: 'waypoint' }));
    }
    if (end) markers.push({ ...end, type: 'end' });

    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i];
      const sp = worldToScreen(m.x, m.y, center.x, center.y, zoom, width, height);
      const r = MARKER_RADIUS * Math.max(zoom, 0.6) + 6;
      const dx = screenX - sp.x;
      const dy = screenY - sp.y;
      if (dx * dx + dy * dy <= r * r) {
        return m;
      }
    }
    return null;
  }, [start, waypoints, end, center, zoom, width, height]);

  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const hit = hitTestMarker(sx, sy);
    if (hit) {
      isDraggingMarker.current = true;
      draggedMarkerRef.current = hit;
      didMoveRef.current = false;
      if (onMarkerDragStart) onMarkerDragStart(hit);
      return;
    }

    isDraggingMap.current = true;
    didMoveRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      centerX: center.x,
      centerY: center.y,
    };
  }, [hitTestMarker, center, onMarkerDragStart]);

  const handleMouseMove = useCallback((e) => {
    if (isDraggingMarker.current && draggedMarkerRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy, center.x, center.y, zoom, width, height);
      didMoveRef.current = true;
      if (onMarkerDrag) onMarkerDrag(draggedMarkerRef.current, world);
      return;
    }

    if (isDraggingMap.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didMoveRef.current = true;
      }
      const newCenterX = dragStartRef.current.centerX - dx / zoom;
      const newCenterY = dragStartRef.current.centerY - dy / zoom;
      onCenterChange({ x: newCenterX, y: newCenterY });
    }
  }, [center, zoom, width, height, onCenterChange, onMarkerDrag]);

  const handleMouseUp = useCallback((e) => {
    if (isDraggingMarker.current) {
      if (onMarkerDragEnd && draggedMarkerRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy, center.x, center.y, zoom, width, height);
        onMarkerDragEnd(draggedMarkerRef.current, world, didMoveRef.current);
      }
      isDraggingMarker.current = false;
      draggedMarkerRef.current = null;
      return;
    }

    if (isDraggingMap.current) {
      if (!didMoveRef.current && onCanvasClick) {
        const rect = canvasRef.current.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy, center.x, center.y, zoom, width, height);
        onCanvasClick(world);
      }
      isDraggingMap.current = false;
    }
  }, [center, zoom, width, height, onCanvasClick, onMarkerDragEnd]);

  const handleMouseLeave = useCallback((e) => {
    handleMouseUp(e);
  }, [handleMouseUp]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = clampZoom(zoom * delta);

    const rect = canvasRef.current.getBoundingClientRect();
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

  return (
    <div ref={containerRef} className="route-map-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height, cursor: isDraggingMap.current ? 'grabbing' : 'grab', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
    </div>
  );
}

export default RouteMapCanvas;
