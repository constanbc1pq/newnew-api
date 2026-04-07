import { useRef, useEffect } from 'react';
import { useActualTheme } from '../../context/Theme';

const CELL_SIZE = 12;

export default function GameOfLifeBackground() {
  const canvasRef = useRef(null);
  const gridRef = useRef(null);
  const rafRef = useRef(null);
  const lastTickRef = useRef(0);
  const theme = useActualTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, cols, rows;

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
      cols = Math.ceil(w / CELL_SIZE);
      rows = Math.ceil(h / CELL_SIZE);
      // Initialize random grid
      gridRef.current = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Math.random() < 0.15 ? 1 : 0)
      );
    };

    resize();
    window.addEventListener('resize', resize);

    const nextGen = () => {
      const g = gridRef.current;
      if (!g) return;
      const next = g.map((row, y) =>
        row.map((cell, x) => {
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dy === 0 && dx === 0) continue;
              const ny = (y + dy + rows) % rows;
              const nx = (x + dx + cols) % cols;
              n += g[ny][nx];
            }
          }
          if (cell === 1) return (n === 2 || n === 3) ? 1 : 0;
          return n === 3 ? 1 : 0;
        })
      );
      gridRef.current = next;
    };

    const isDark = theme === 'dark';
    const cellColor = isDark ? 'rgba(167,139,250,0.08)' : 'rgba(124,58,237,0.06)';
    const lineColor = isDark ? 'rgba(250,250,250,0.03)' : 'rgba(9,9,11,0.03)';

    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);

      // Draw grid lines
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= w; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw live cells
      const g = gridRef.current;
      if (g) {
        ctx.fillStyle = cellColor;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (g[y][x]) {
              ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            }
          }
        }
      }

      // Tick every 200ms
      if (now - lastTickRef.current > 200) {
        nextGen();
        lastTickRef.current = now;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      role='img'
      aria-label='Background animation'
      className='absolute inset-0 w-full h-full pointer-events-none'
    />
  );
}
