'use client';

import { useEffect, useRef } from 'react';

interface FirefliesProps {
  color?: string;
  count?: number;
  className?: string;
}

export function Fireflies({ color = 'rgba(180,150,235,0.9)', count = 22, className }: FirefliesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    interface Dot { x: number; y: number; r: number; vx: number; vy: number; ph: number; sp: number; }
    let w = 0, h = 0, dots: Dot[] = [];
    let raf: number;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = canvas!.width = rect.width * devicePixelRatio;
      h = canvas!.height = rect.height * devicePixelRatio;
    }
    function seed() {
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 1.8 + 0.6) * devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.012 + 0.004,
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy; d.ph += d.sp;
        if (d.x < 0) d.x = w; if (d.x > w) d.x = 0;
        if (d.y < 0) d.y = h; if (d.y > h) d.y = 0;
        const a = 0.35 + Math.sin(d.ph) * 0.35;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(/[\d.]+\)$/, a.toFixed(2) + ')');
        ctx.shadowBlur = 8 * devicePixelRatio;
        ctx.shadowColor = color;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    resize(); seed(); tick();
    const onResize = () => { resize(); seed(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [color, count]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
