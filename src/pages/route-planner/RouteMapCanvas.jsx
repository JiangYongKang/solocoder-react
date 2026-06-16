import { useEffect, useRef, useCallback, useState } from 'react';
import { MAP_ELEMENTS } from './constants.js';
import {
  worldToScreen,
  screenToWorld,
  clampZoom,
  getDistance,
  getLineDashPattern,
} from './routeUtils.js';
import { TRAVEL_MODES } from './constants.js';

export default function RouteMapCanvas({
  waypoints,
  selectedWaypointId,
  routes,
  selectedRouteId,
  travelMode,
  center,
  zoom,
  width,
  height,
  onCenterChange,
  onZoomChange,
  onCanvasClick,
  onWaypointSelect,
  onWaypointDragEnd,
}) {
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mapStartRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = useState('crosshair');

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    const toScreen = (x, y) => worldToScreen(x, y, center.x, center.y, zoom, width, height);

    ctx.save();
    MAP_ELEMENTS.parks.forEach((park) => {
      const topLeft = toScreen(park.x - park.width / 2, park.y - park.height / 2);
      ctx.fillStyle = park.color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      const w = park.width * zoom;
      const h = park.height * zoom;
      const r = 8 * zoom;
      ctx.roundRect(topLeft.x, topLeft.y, w, h, r);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.restore();

    ctx.save();
    MAP_ELEMENTS.rivers.forEach((river) => {
      if (river.points.length < 2) return;
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 12 * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      const first = toScreen(river.points[0].x, river.points[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < river.points.length; i++) {
        const p = toScreen(river.points[i].x, river.points[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    ctx.restore();

    const drawRoad = (road) => {
      if (!road.points || road.points.length < 2) return;
      ctx.strokeStyle = road.color;
      ctx.lineWidth = road.width * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const first = toScreen(road.points[0].x, road.points[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < road.points.length; i++) {
        const p = toScreen(road.points[i].x, road.points[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    };

    MAP_ELEMENTS.mainRoads.forEach(drawRoad);
    MAP_ELEMENTS.minorRoads.forEach(drawRoad);

    ctx.save();
    MAP_ELEMENTS.buildings.forEach((b) => {
      const topLeft = toScreen(b.x - b.width / 2, b.y - b.height / 2);
      ctx.fillStyle = b.color;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 6 * zoom;
      ctx.shadowOffsetY = 2 * zoom;
      const w = b.width * zoom;
      const h = b.height * zoom;
      const r = 6 * zoom;
      ctx.beginPath();
      ctx.roundRect(topLeft.x, topLeft.y, w, h, r);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.max(10, 12 * zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = toScreen(b.x, b.y);
      ctx.fillText(b.name, label.x, label.y);
    });
    ctx.restore();

    if (Array.isArray(waypoints)) {
      ctx.save();
      ctx.setLineDash([8 * zoom, 6 * zoom]);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2 * zoom;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const first = toScreen(waypoints[0].x, waypoints[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < waypoints.length; i++) {
        const p = toScreen(waypoints[i].x, waypoints[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (Array.isArray(routes)) {
      routes.forEach((route) => {
        if (!route.path || route.path.length < 2) return;
        const isSelected = route.id === selectedRouteId;
        ctx.save();
        ctx.strokeStyle = route.color;
        ctx.lineWidth = isSelected ? 5 * zoom : 3 * zoom;
        ctx.globalAlpha = isSelected ? 1 : 0.35;
        const mode = TRAVEL_MODES[route.travelMode || travelMode];
        if (mode) {
          ctx.setLineDash(getLineDashPattern(mode.lineStyle).map((v) => v * zoom));
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const first = toScreen(route.path[0].x, route.path[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < route.path.length; i++) {
          const p = toScreen(route.path[i].x, route.path[i].y);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
      });
    }

    const drawPin = (wp, index) => {
      const pos = toScreen(wp.x, wp.y);
      const pinSize = 14 * zoom;
      const pinHeight = 20 * zoom;
      const isSelected = wp.id === selectedWaypointId;
      ctx.save();
      ctx.fillStyle = isSelected ? '#EF4444' : '#3B82F6';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 4 * zoom;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y + pinHeight);
      ctx.bezierCurveTo(
        pos.x - pinSize, pos.y + pinHeight * 0.4,
        pos.x - pinSize, pos.y,
        pos.x, pos.y
      );
      ctx.bezierCurveTo(
        pos.x + pinSize, pos.y,
        pos.x + pinSize, pos.y + pinHeight * 0.4,
        pos.x, pos.y + pinHeight
      );
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - pinSize * 0.3, pinSize * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.fillStyle = isSelected ? '#EF4444' : '#3B82F6';
      ctx.font = `bold ${Math.max(9, 11 * zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = index === 0 ? '起' : (index === waypoints.length - 1 ? '终' : String(index));
      ctx.fillText(label, pos.x, pos.y - pinSize * 0.3);
      if (wp.name) {
        ctx.fillStyle = '#1E293B';
        ctx.font = `${Math.max(10, 12 * zoom)}px sans-serif`;
        const textY = pos.y - pinSize * 1.8;
        const textWidth = ctx.measureText(wp.name).width;
        const padding = 4 * zoom;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.roundRect(pos.x - textWidth / 2 - padding, textY - 10 * zoom, textWidth + padding * 2, 18 * zoom, 4 * zoom);
        ctx.fill();
        ctx.fillStyle = '#1E293B';
        ctx.fillText(wp.name, pos.x, textY);
      }
      ctx.restore();
    };

    if (Array.isArray(waypoints)) {
      waypoints.forEach((wp, i) => drawPin(wp, i));
    }
  }, [waypoints, selectedWaypointId, routes, selectedRouteId, travelMode, center, zoom, width, height]);

  useEffect(() => {
    drawMap();
  }, [drawMap]);

  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    lastMoveRef.current = { x: mx, y: my };

    if (waypoints && waypoints.length > 0) {
      for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];
        const sp = worldToScreen(wp.x, wp.y, center.x, center.y, zoom, width, height);
        if (getDistance({ x: mx, y: my }, sp) < 25 * zoom) {
          isDraggingRef.current = true;
          dragTargetRef.current = { type: 'waypoint', id: wp.id, index: i };
          dragStartRef.current = { x: mx, y: my };
          setCursorStyle('grabbing');
          onWaypointSelect && onWaypointSelect(wp.id);
          return;
        }
      }
    }

    isDraggingRef.current = true;
    dragTargetRef.current = { type: 'map' };
    mapStartRef.current = { ...center };
    dragStartRef.current = { x: mx, y: my };
    setCursorStyle('grab');
  }, [waypoints, center, zoom, width, height, onWaypointSelect]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    lastMoveRef.current = { x: mx, y: my };

    const target = dragTargetRef.current;
    if (!target) return;

    if (target.type === 'map') {
      const dx = (mx - dragStartRef.current.x) / zoom;
      const dy = (my - dragStartRef.current.y) / zoom;
      onCenterChange && onCenterChange({
        x: mapStartRef.current.x - dx,
        y: mapStartRef.current.y - dy,
      });
    } else if (target.type === 'waypoint') {
      const wp = waypoints.find((w) => w.id === target.id);
      if (wp) {
        const world = screenToWorld(mx, my, center.x, center.y, zoom, width, height);
        const updatedWaypoints = waypoints.map((w) =>
          w.id === wp.id ? { ...w, x: world.x, y: world.y } : w
        );
        onWaypointDragEnd && onWaypointDragEnd(updatedWaypoints);
      }
    }
  }, [waypoints, center, zoom, width, height, onCenterChange, onWaypointDragEnd]);

  const handleMouseUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const movedDistance = getDistance(
      { x: dragStartRef.current.x, y: dragStartRef.current.y },
      { x: lastMoveRef.current.x, y: lastMoveRef.current.y }
    );
    const target = dragTargetRef.current;

    if (target && target.type === 'map' && movedDistance < 5) {
      const world = screenToWorld(mx, my, center.x, center.y, zoom, width, height);
      onCanvasClick && onCanvasClick(world);
    }

    isDraggingRef.current = false;
    dragTargetRef.current = null;
    setCursorStyle('crosshair');
  }, [center, zoom, width, height, onCanvasClick]);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    dragTargetRef.current = null;
    setCursorStyle('crosshair');
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newZoom = clampZoom(zoom + delta * 0.1);
    if (newZoom !== zoom) {
      onZoomChange && onZoomChange(newZoom);
    }
  }, [zoom, onZoomChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        cursor: cursorStyle,
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
