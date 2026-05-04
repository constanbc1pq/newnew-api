import { useRef, useEffect, useCallback } from 'react';
import { useActualTheme } from '../../context/Theme';

const NODE_COUNT = 50;
const MAX_DIST = 150;
const SPEED = 0.3;

export default function NetworkBackground() {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const rafRef = useRef(null);
  const theme = useActualTheme();

  const initNodes = useCallback((w, h) => {
    nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: Math.random() * 2 + 1,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nodesRef.current.length === 0) initNodes(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const isDark = theme === 'dark';
    const nodeColor = isDark ? 'rgba(124,58,237,0.6)' : 'rgba(124,58,237,0.35)';
    const lineColor = isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)';

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1 - dist / MAX_DIST;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme, initNodes]);

  return (
    <canvas
      ref={canvasRef}
      className='absolute inset-0 w-full h-full pointer-events-none'
      style={{ opacity: theme === 'dark' ? 0.7 : 0.4 }}
    />
  );
}
