'use client';

import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, AlertOctagon } from 'lucide-react';

const ROW1 = [
  { label: "Today's signups",    val: '14',     delta: '+22%', up: true },
  { label: 'Active subscribers', val: '203',    delta: '+8%',  up: true },
  { label: 'MRR',                val: '$3,045', delta: '+11%', up: true },
  { label: 'AI cost today',      val: '$4.20',  delta: '-3%',  up: false, neutral: true },
];
const ROW2 = [
  { label: 'Activation rate',  val: '68%',   delta: '+4%',   up: true },
  { label: 'Paid conversion',  val: '6.2%',  delta: '+0.5%', up: true },
  { label: 'Share rate',       val: '44%',   delta: '+6%',   up: true },
  { label: 'Churn',            val: '3.1%',  delta: '+0.3%', up: false },
];

function MetricCard({ label, val, delta, up, neutral }: typeof ROW1[0] & { neutral?: boolean }) {
  const Icon = up ? TrendingUp : TrendingDown;
  const col = neutral ? 'var(--app-text-2)' : up ? 'var(--app-success)' : 'var(--app-danger)';
  return (
    <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-soft)' }}>
      <div style={{ fontSize: 12, color: 'var(--app-text-2)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, margin: '6px 0 4px' }}>{val}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, color: col }}>
        <Icon size={13} /> {delta} this week
      </div>
    </div>
  );
}

function LineChart({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return <canvas ref={canvasRef} style={{ width: '100%', height: 200 }} />;
}
function BarChart({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return <canvas ref={canvasRef} style={{ width: '100%', height: 180 }} />;
}
function DonutChart({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return <canvas ref={canvasRef} style={{ width: '100%', height: 170 }} />;
}

export default function AdminDashboardPage() {
  const lineRef  = useRef<HTMLCanvasElement>(null);
  const barRef   = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Line chart — daily signups
    if (lineRef.current) {
      const c = lineRef.current;
      const ctx = c.getContext('2d')!;
      const w = c.offsetWidth * devicePixelRatio;
      const h = 200 * devicePixelRatio;
      c.width = w; c.height = h;
      const data = [4,7,5,9,12,8,14,11,16,10,13,18,15,20,17,14,19,22,16,24,21,18,26,23,20,28,25,22,30,27];
      const pad = 24 * devicePixelRatio, pts = data.length;
      const maxV = Math.max(...data);
      const sx = (w - pad * 2) / (pts - 1);
      const sy = (h - pad * 2) / maxV;
      ctx.strokeStyle = '#7C5CDB'; ctx.lineWidth = 2.5 * devicePixelRatio;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = pad + i * sx, y = h - pad - v * sy;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      // fill
      ctx.lineTo(pad + (pts - 1) * sx, h - pad);
      ctx.lineTo(pad, h - pad);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(124,92,219,0.18)');
      grad.addColorStop(1, 'rgba(124,92,219,0)');
      ctx.fillStyle = grad; ctx.fill();
    }

    // Bar chart — MRR
    if (barRef.current) {
      const c = barRef.current;
      const ctx = c.getContext('2d')!;
      const w = c.offsetWidth * devicePixelRatio;
      const h = 180 * devicePixelRatio;
      c.width = w; c.height = h;
      const data = Array.from({ length: 12 }, (_, i) => 1800 + i * 120 + Math.random() * 100);
      const maxV = Math.max(...data);
      const pad = 20 * devicePixelRatio;
      const bw = (w - pad * 2) / data.length * 0.6;
      const gap = (w - pad * 2) / data.length;
      data.forEach((v, i) => {
        const x = pad + i * gap + (gap - bw) / 2;
        const bh = (v / maxV) * (h - pad * 2);
        ctx.fillStyle = i === data.length - 1 ? '#7C5CDB' : '#C8B8E8';
        ctx.beginPath();
        ctx.roundRect(x, h - pad - bh, bw, bh, 4 * devicePixelRatio);
        ctx.fill();
      });
    }

    // Donut chart — credit consumption
    if (donutRef.current) {
      const c = donutRef.current;
      const ctx = c.getContext('2d')!;
      const size = 170 * devicePixelRatio;
      c.width = size; c.height = size;
      const cx = size / 2, cy = size / 2, r = size * 0.36, ir = size * 0.22;
      const slices = [
        { label: 'Generation',   pct: 0.45, color: '#7C5CDB' },
        { label: 'Regeneration', pct: 0.20, color: '#C8B8E8' },
        { label: 'Prompts',      pct: 0.30, color: '#B09EE8' },
        { label: 'OG regen',     pct: 0.05, color: '#E8E0FF' },
      ];
      let start = -Math.PI / 2;
      slices.forEach(s => {
        const end = start + s.pct * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
        ctx.fillStyle = s.color; ctx.fill();
        start = end;
      });
      ctx.beginPath(); ctx.arc(cx, cy, ir, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
    }
  }, []);

  return (
    <div style={{ padding: '28px clamp(20px,3vw,40px) 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h1>
        <span style={{ color: 'var(--app-text-2)', fontSize: 13 }}>Last 30 days · updated 2 min ago</span>
      </div>

      {/* metric rows */}
      {[ROW1, ROW2].map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
          {row.map(m => <MetricCard key={m.label} {...m} />)}
        </div>
      ))}

      {/* charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, margin: '26px 0 16px', alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, fontWeight: 700 }}>User growth — daily signups</h3>
          <LineChart canvasRef={lineRef} />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, fontWeight: 700 }}>Credit consumption</h3>
          <DonutChart canvasRef={donutRef} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {[['Generation', '#7C5CDB', '45%'], ['Regeneration', '#C8B8E8', '20%'], ['Prompts', '#B09EE8', '30%'], ['OG regen', '#E8E0FF', '5%']].map(([label, color, pct]) => (
              <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--app-text-2)' }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: color as string, flexShrink: 0 }} />
                {label} <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--app-text)' }}>{pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MRR bar */}
      <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 16, padding: 20, marginBottom: 26, boxShadow: 'var(--shadow-soft)' }}>
        <h3 style={{ fontSize: 15, marginBottom: 16, fontWeight: 700 }}>Revenue trend — MRR, 90 days</h3>
        <BarChart canvasRef={barRef} />
      </div>

      {/* alerts */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginBottom: 14 }}>Alerts</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: AlertTriangle,  text: 'Moderation queue',        sub: '7 pending review',    danger: false },
          { icon: AlertOctagon,   text: 'AI generation failure rate', sub: '5.1% · threshold 5%', danger: true },
        ].map(({ icon: Icon, text, sub, danger }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid var(--app-border)', borderLeft: `4px solid var(--app-${danger ? 'danger' : 'warning'})`, borderRadius: 12, padding: '14px 16px' }}>
            <Icon size={20} style={{ color: `var(--app-${danger ? 'danger' : 'warning'})`, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{text}</span>
            <span style={{ fontSize: 13, color: 'var(--app-text-2)' }}>{sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
