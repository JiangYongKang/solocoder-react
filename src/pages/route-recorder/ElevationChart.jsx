import { useEffect, useRef } from 'react';
import { MARKER_COLORS } from './constants.js';

function ElevationChart({ elevationData }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const sizeRef = useRef({ width: 300, height: 160 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        sizeRef.current = { width: Math.max(rect.width, 200), height: 160 };
        draw();
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elevationData]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = 'var(--code-bg, #f8fafc)';
    ctx.fillRect(0, 0, width, height);

    const elevations = elevationData?.elevations || [];
    const climb = elevationData?.climb || 0;
    const descent = elevationData?.descent || 0;

    if (elevations.length < 2) {
      ctx.fillStyle = 'var(--text, #64748b)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('请先设置起点和终点', width / 2, height / 2 - 10);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'var(--text, #94a3b8)';
      ctx.fillText('在地图上点击或输入坐标添加', width / 2, height / 2 + 14);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 44 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    let minElev = Infinity;
    let maxElev = -Infinity;
    for (const e of elevations) {
      if (e.elevation < minElev) minElev = e.elevation;
      if (e.elevation > maxElev) maxElev = e.elevation;
    }
    const elevRange = Math.max(maxElev - minElev, 50);
    minElev = Math.max(0, minElev - elevRange * 0.15);
    maxElev = maxElev + elevRange * 0.15;
    const finalRange = maxElev - minElev;

    ctx.strokeStyle = 'var(--border, #e2e8f0)';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'var(--text, #94a3b8)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const t = i / yTicks;
      const y = padding.top + chartH * (1 - t);
      const elev = minElev + finalRange * t;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(elev)}m`, padding.left - 6, y);
    }

    const getX = (i) => padding.left + (i / (elevations.length - 1)) * chartW;
    const getY = (e) => padding.top + chartH * (1 - (e.elevation - minElev) / finalRange);

    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    grad.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

    ctx.beginPath();
    ctx.moveTo(getX(0), padding.top + chartH);
    for (let i = 0; i < elevations.length; i++) {
      ctx.lineTo(getX(i), getY(elevations[i]));
    }
    ctx.lineTo(getX(elevations.length - 1), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < elevations.length; i++) {
      const x = getX(i);
      const y = getY(elevations[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px sans-serif';
    for (let i = 0; i < elevations.length; i++) {
      const e = elevations[i];
      const x = getX(i);
      const y = getY(e);

      let color = MARKER_COLORS.waypoint;
      if (e.point?.type === 'start') color = MARKER_COLORS.start;
      else if (e.point?.type === 'end') color = MARKER_COLORS.end;

      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      let label = `P${i + 1}`;
      if (e.point?.type === 'start') label = '起';
      else if (e.point?.type === 'end') label = '终';
      ctx.fillStyle = 'var(--text, #64748b)';
      ctx.fillText(label, x, padding.top + chartH + 6);
    }

    const statY = 6;
    const statGap = 90;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(padding.left + 2, statY + 3, 8, 8);
    ctx.fillStyle = 'var(--text-h, #1e293b)';
    ctx.fillText(`爬升 ${climb}m`, padding.left + 14, statY);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(padding.left + 2 + statGap, statY + 3, 8, 8);
    ctx.fillStyle = 'var(--text-h, #1e293b)';
    ctx.fillText(`下降 ${descent}m`, padding.left + 14 + statGap, statY);
  };

  return (
    <div ref={containerRef} className="elevation-chart-wrap">
      <canvas ref={canvasRef} style={{ width: '100%', height: 160, display: 'block' }} />
    </div>
  );
}

export default ElevationChart;
