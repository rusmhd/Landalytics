import React, { useState, useEffect } from 'react';

const getScoreColor = (s) => s >= 85 ? '#10b981' : s >= 65 ? '#3b82f6' : s >= 45 ? '#f59e0b' : '#ef4444';
const getScoreLabel = (s) => s >= 85 ? 'EXCELLENT' : s >= 65 ? 'GOOD' : s >= 45 ? 'FAIR' : 'WEAK';
const getScoreBg = (s) => s >= 85 ? 'rgba(16,185,129,0.08)' : s >= 65 ? 'rgba(59,130,246,0.08)' : s >= 45 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

const GOAL_GROUPS = [
  {
    group: 'Optimization',
    goals: [
      { value: 'cro',                       label: 'Conversion Rate Optimization', icon: '📈', desc: 'Maximize the % of visitors who take action' },
      { value: 'landing_page_optimization', label: 'Landing Page Optimization',    icon: '🎯', desc: 'Improve a single page built for one goal' },
      { value: 'website_optimization',      label: 'Website Optimization',         icon: '🛠️', desc: 'Speed, SEO, UX and conversion holistically' },
      { value: 'website_redesign',          label: 'Website Redesign',             icon: '🎨', desc: 'Audit before or after a full redesign' },
      { value: 'ab_testing',                label: 'A/B Testing',                  icon: '🔬', desc: 'Identify elements worth split testing' },
      { value: 'multivariate_testing',      label: 'Multivariate Testing',         icon: '🧪', desc: 'Find winning combinations of page elements' },
      { value: 'personalization',           label: 'Website Personalization',      icon: '✨', desc: 'Spot opportunities to tailor content per user' },
    ],
  },
  {
    group: 'Growth & Retention',
    goals: [
      { value: 'grow_traffic',       label: 'Grow Website Traffic',              icon: '🚀', desc: 'On-page SEO signals that drive organic reach' },
      { value: 'customer_engagement',label: 'Customer Engagement',               icon: '💬', desc: 'Content and hooks that keep users on-page' },
      { value: 'cx_optimization',    label: 'Customer Experience Optimization',  icon: '⭐', desc: 'Reduce friction across the full user journey' },
      { value: 'customer_retention', label: 'Customer Retention',                icon: '🔄', desc: 'Signals that bring existing customers back' },
      { value: 'cart_abandonment',   label: 'Cart Abandonment',                  icon: '🛒', desc: 'Fix the leaks between browse and purchase' },
      { value: 'feature_rollout',    label: 'Feature Rollout',                   icon: '🚢', desc: 'Communicate new features clearly and drive adoption' },
    ],
  },
];
const GOALS = GOAL_GROUPS.flatMap(g => g.goals);

const Gauge = ({ score = 0, label, size = 130 }) => {
  const [anim, setAnim] = useState(0);
  const color = getScoreColor(score);
  const r = 44, circ = 2 * Math.PI * r;
  useEffect(() => { const t = setTimeout(() => setAnim(score), 200); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={circ - (circ * anim) / 100} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color})` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 26, fontWeight: 900, fontStyle: 'italic', color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 9, fontWeight: 900, color, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{getScoreLabel(score)}</div>
      </div>
    </div>
  );
};

const NodeBar = ({ label, score = 0, description }) => {
  const [w, setW] = useState(0);
  const color = getScoreColor(score);
  useEffect(() => { const t = setTimeout(() => setW(score), 300); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontStyle: 'italic' }}>{description}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 22, fontWeight: 900, fontStyle: 'italic', color }}>{score}%</span>
          <div style={{ fontSize: 8, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{getScoreLabel(score)}</div>
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 10px ${color}` }} />
      </div>
    </div>
  );
};

const RoadmapStep = ({ step, index }) => {
  const [open, setOpen] = useState(index === 0);
  if (!step?.task) return null;
  const color = ['#3b82f6','#10b981','#f59e0b'][index % 3];
  return (
    <div style={{ border: `1px solid ${open ? color+'40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, overflow: 'hidden', background: open ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'all 0.3s', marginBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 32, fontWeight: 900, fontStyle: 'italic', color: open ? color : 'rgba(255,255,255,0.1)', lineHeight: 1 }}>0{index+1}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.task}</span>
        </div>
        <span style={{ fontSize: 20, color: open ? color : 'rgba(255,255,255,0.2)', transform: open ? 'rotate(45deg)' : 'none', transition: 'all 0.3s', display: 'block', lineHeight: 1 }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 24px 24px', borderLeft: `3px solid ${color}30`, marginLeft: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontStyle: 'italic', marginBottom: 16, lineHeight: 1.6 }}>"{step.tech_reason}"</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['Psychological Strategy','#3b82f6',step.psych_impact],['Success Metric (KPI)','#10b981',step.success_metric]].map(([title, c, val]) => (
              <div key={title} style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>{title}</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.6 }}>{val || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SwotCard = ({ title, items, color, fieldA, fieldB, icon }) => (
  <div style={{ padding: 28, borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{title}</span>
    </div>
    {items?.map((item, i) => (
      <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < items.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item[fieldA]}</p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.6 }}>{item[fieldB]}</p>
      </div>
    )) || <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontStyle: 'italic' }}>Analyzing...</p>}
  </div>
);

const LoadingScreen = ({ status }) => {
  const [dots, setDots] = useState('');
  useEffect(() => { const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d+'.'), 400); return () => clearInterval(t); }, []);
  return (
    <div style={{ minHeight: '100vh', background: '#050A14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" style={{ position: 'absolute', animation: 'spin 1s linear infinite' }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(37,99,235,0.15)" strokeWidth="3" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="#2563EB" strokeWidth="3" strokeDasharray="60 200" strokeLinecap="round" />
        </svg>
        <svg width="80" height="80" style={{ position: 'absolute', animation: 'spin 1.6s linear reverse infinite' }}>
          <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="2" />
          <circle cx="40" cy="40" r="24" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="30 120" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 8 }}>{status}{dots}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>Neural capture in progress</div>
      </div>
    </div>
  );
};

const GoalSelector = ({ goal, setGoal }) => {
  const [open, setOpen] = useState(false);
  const selected = GOALS.find(g => g.value === goal) || GOALS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', width: '100%' }}>
      <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Select Audit Goal</span>
      <div style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
        {/* Trigger button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', padding: '13px 18px',
            background: '#0A1628', border: `1px solid ${open ? 'rgba(37,99,235,0.6)' : 'rgba(37,99,235,0.2)'}`,
            borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 10,
            boxShadow: open ? '0 0 20px rgba(37,99,235,0.15)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{selected.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{selected.label}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontStyle: 'italic' }}>{selected.desc}</div>
            </div>
          </div>
          <span style={{ color: '#2563EB', fontSize: 10, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </button>

        {/* Dropdown panel */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
            background: '#0A1628', border: '1px solid rgba(37,99,235,0.25)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.1)',
          }}>
            {GOAL_GROUPS.map((group, gi) => (
              <div key={group.group}>
                {/* Group header */}
                <div style={{
                  padding: '10px 16px 6px',
                  fontSize: 8, fontWeight: 900, color: '#2563EB',
                  textTransform: 'uppercase', letterSpacing: '0.3em',
                  borderTop: gi > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: 'rgba(37,99,235,0.04)',
                }}>
                  {group.group}
                </div>
                {/* Goals in group */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {group.goals.map(g => (
                    <button
                      key={g.value}
                      onClick={() => { setGoal(g.value); setOpen(false); }}
                      style={{
                        padding: '10px 16px', background: g.value === goal ? 'rgba(37,99,235,0.15)' : 'transparent',
                        border: 'none', borderRight: '1px solid rgba(255,255,255,0.03)',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'background 0.15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = g.value === goal ? 'rgba(37,99,235,0.15)' : 'transparent'}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{g.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 11, fontWeight: g.value === goal ? 800 : 600,
                          color: g.value === goal ? '#93C5FD' : 'rgba(255,255,255,0.7)',
                          letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{g.label}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.desc}</div>
                      </div>
                      {g.value === goal && <span style={{ flexShrink: 0, color: '#2563EB', fontSize: 11 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HomePage = ({ onScanComplete, onNav }) => {
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('cro');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const runAudit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError(''); setLoading(true); setStatus('Initiating Neural Capture');
    const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
    if (!API_BASE) { setError('VITE_API_URL is not set in Render environment variables.'); setLoading(false); return; }
    let scores = null, ai = null;
    try {
      const res = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, goal }),
      });
      if (!res.ok) throw new Error(`Backend error ${res.status} at ${API_BASE}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'metrics') { scores = data.scores; setStatus('Heuristics loaded — Running AI analysis'); }
            if (data.type === 'ai_narrative') { ai = data; setStatus('Scan complete'); }
            if (data.type === 'error') throw new Error(data.msg);
          } catch {}
        }
      }
      if (!scores) throw new Error('No data received. The site may be blocking requests.');
      onScanComplete({ scores, ai, url: trimmed, goal: GOALS.find(g => g.value === goal)?.label || goal });
    } catch (e) { setError(e.message || 'Connection failed.'); setLoading(false); setStatus(''); }
  };

  if (loading) return <LoadingScreen status={status} />;

  return (
    <div style={{ minHeight: '100vh', background: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.04) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse,rgba(37,99,235,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 820, textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 24 }}>AI-Powered Conversion Audit</div>
        <h1 style={{ fontSize: 'clamp(52px,12vw,110px)', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 0.9, textTransform: 'uppercase', margin: '0 0 8px' }}>
          LANDA<span style={{ color: '#2563EB' }}>LYTICS</span>
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', lineHeight: 1.7, margin: '20px 0 36px' }}>
          Deep-node analysis of conversion intent,<br />trust architecture & psychological triggers.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', background: '#0F1929', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 100, padding: '6px 6px 6px 24px', gap: 8, boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
            <input
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 16, color: '#FFFFFF', fontFamily: 'monospace', caretColor: '#2563EB' }}
              placeholder="https://yoursite.com"
              value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAudit()}
            />
            <button onClick={runAudit} disabled={!url.trim()}
              style={{ background: '#2563EB', border: 'none', borderRadius: 100, padding: '14px 32px', color: '#FFFFFF', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 30px rgba(37,99,235,0.4)', opacity: url.trim() ? 1 : 0.4 }}>
              SCAN →
            </button>
          </div>
          <GoalSelector goal={goal} setGoal={setGoal} />
          {error && <div style={{ color: '#EF4444', fontSize: 12, fontFamily: 'monospace', textAlign: 'left', paddingLeft: 20 }}>⚠ {error}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 48 }}>
          {[['12','Node Analysis'],['13','Audit Goals'],['AI','Powered SWOT']].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF' }}>{v}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer — always at bottom of home page */}
      <footer style={{
        textAlign: 'center', padding: '32px 24px 28px',
        borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 48,
      }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginBottom: 10, letterSpacing: '0.05em' }}>
          © {new Date().getFullYear()} Landalytics. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          {[['Privacy Policy','privacy'],['Terms of Use','terms']].map(([label, pg]) => (
            <button key={pg} onClick={() => onNav(pg)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em',
              textTransform: 'uppercase', fontWeight: 700,
              textDecoration: 'underline', textDecorationColor: 'rgba(37,99,235,0.3)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#93C5FD'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
            >{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
};

const ReportPage = ({ onNav, scores, ai, url, goal, onHome }) => {
  const nodes = [
    { t: 'HTTPS / SSL',         s: scores?.https_ssl         || 0, d: (scores?.https_ssl         ||0)>=65 ? 'Secure connection confirmed'        : 'SSL certificate not detected' },
    { t: 'Title Tag Quality',   s: scores?.title_tag         || 0, d: (scores?.title_tag         ||0)>=65 ? 'Title tag well optimised'           : 'Title tag needs improvement' },
    { t: 'H1–H3 Hierarchy',     s: scores?.heading_hierarchy || 0, d: (scores?.heading_hierarchy ||0)>=65 ? 'Heading structure is solid'         : 'Heading hierarchy is weak' },
    { t: 'Content Depth',       s: scores?.content_depth     || 0, d: (scores?.content_depth     ||0)>=65 ? 'Content length is sufficient'       : 'Content too thin for authority' },
    { t: 'Schema Markup',       s: scores?.schema_markup     || 0, d: (scores?.schema_markup     ||0)>=65 ? 'Structured data detected'           : 'No structured data found' },
    { t: 'Readability',         s: scores?.readability       || 0, d: (scores?.readability       ||0)>=65 ? 'Content is clear and scannable'     : 'Readability needs improvement' },
    { t: 'Meta Description',    s: scores?.meta_description  || 0, d: (scores?.meta_description  ||0)>=65 ? 'Meta description is optimised'      : 'Meta description needs work' },
    { t: 'Image Alt Text',      s: scores?.image_alt_text    || 0, d: (scores?.image_alt_text    ||0)>=65 ? 'Good alt text coverage'             : 'Alt text coverage is low' },
    { t: 'Internal Links',      s: scores?.internal_links    || 0, d: (scores?.internal_links    ||0)>=65 ? 'Link structure is healthy'          : 'Internal linking needs work' },
    { t: 'Keyword Placement',   s: scores?.keyword_placement || 0, d: (scores?.keyword_placement ||0)>=65 ? 'Keywords well positioned'           : 'Keyword placement needs work' },
    { t: 'Multimedia Usage',    s: scores?.multimedia        || 0, d: (scores?.multimedia        ||0)>=65 ? 'Good visual content mix'            : 'Add more visual content' },
    { t: 'Search Intent Match', s: scores?.search_intent     || 0, d: (scores?.search_intent     ||0)>=65 ? 'Content matches user intent'        : 'Intent alignment needs work' },
  ];
  const vals = Object.values(scores || {});
  const avg = vals.length ? Math.round(vals.reduce((a,b) => a+b, 0) / vals.length) : 0;
  const gauges = [
    { label: 'Conversion Intent',  score: scores?.conversion_intent },
    { label: 'Trust Resonance',    score: scores?.trust_resonance },
    { label: 'Mobile Readiness',   score: scores?.mobile_readiness },
    { label: 'Semantic Authority', score: scores?.semantic_authority },
    ...(scores?.page_speed !== undefined ? [{ label: 'Page Speed', score: scores.page_speed }] : []),
  ];
  const SL = { fontSize: 9, fontWeight: 800, color: '#2563EB', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 };
  const LL = { flex: 1, height: 1, background: 'rgba(37,99,235,0.2)' };

  return (
    <div style={{ minHeight: '100vh', background: '#050A14', color: 'rgba(255,255,255,0.7)', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 80 }}>
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(5,10,20,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
        <span style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', textTransform: 'uppercase' }}>LANDA<span style={{ color: '#2563EB' }}>LYTICS</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {goal && <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 100, padding: '4px 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{goal}</span>}
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
          <button onClick={onHome} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>← Home</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 20px 0' }}>
        <div style={{ marginBottom: 80, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 60 }}>
          <div style={{ fontSize: 9, color: '#2563EB', fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 12 }}>Audit Report</div>
          <h1 style={{ fontSize: 'clamp(40px,7vw,80px)', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, margin: '0 0 20px' }}>
            Site<br /><span style={{ color: '#2563EB' }}>Analysis</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '6px 12px' }}>{url}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: getScoreColor(avg), background: getScoreBg(avg), border: `1px solid ${getScoreColor(avg)}30`, borderRadius: 6, padding: '6px 12px', textTransform: 'uppercase' }}>Avg: {avg}</span>
            {goal && <span style={{ fontSize: 11, fontWeight: 700, color: '#93C5FD', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 6, padding: '6px 12px' }}>🎯 {goal}</span>}
          </div>
        </div>

        <div style={{ marginBottom: 80 }}>
          <div style={SL}><span>01 — Core Results</span><div style={LL} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
            {gauges.map(({ label, score }) => (
              <div key={label} style={{ background: '#0F1929', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Gauge score={score || 0} label={label} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 80 }}>
          <div style={SL}><span>02 — Deep Node Scan</span><div style={LL} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {nodes.map((n,i) => <NodeBar key={i} label={n.t} score={n.s} description={n.d} />)}
          </div>
        </div>

        <div style={{ marginBottom: 80 }}>
          <div style={SL}><span>03 — Strategic Matrix</span><div style={LL} /></div>
          {ai ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
              <SwotCard title="Strengths"     items={ai?.swot?.strengths}     color="#10B981" fieldA="point" fieldB="evidence"           icon="↑" />
              <SwotCard title="Weaknesses"    items={ai?.swot?.weaknesses}    color="#EF4444" fieldA="point" fieldB="fix_suggestion"      icon="↓" />
              <SwotCard title="Opportunities" items={ai?.swot?.opportunities} color="#3B82F6" fieldA="point" fieldB="potential_impact"    icon="→" />
              <SwotCard title="Threats"       items={ai?.swot?.threats}       color="#F59E0B" fieldA="point" fieldB="mitigation_strategy" icon="⚠" />
            </div>
          ) : (
            <div style={{ padding: 40, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', fontSize: 13 }}>AI analysis unavailable — metrics-only scan.</div>
          )}
        </div>

        {ai?.roadmap && (
          <div style={{ marginBottom: 80 }}>
            <div style={SL}><span>04 — Execution Roadmap</span><div style={LL} /></div>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              {ai.roadmap.map((step,i) => <RoadmapStep key={i} step={step} index={i} />)}
            </div>
          </div>
        )}

        <div style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', borderRadius: 24, padding: 'clamp(40px,6vw,72px)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 80px rgba(37,99,235,0.2)' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 16 }}>Executive Recommendation</div>
          <h2 style={{ fontSize: 'clamp(32px,6vw,60px)', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 24px' }}>
            {ai?.final_verdict?.overall_readiness || 'METRICS CAPTURED'}
          </h2>
          {ai?.final_verdict?.single_most_impactful_change && (
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: '20px 28px', maxWidth: 680, margin: '0 auto', border: '1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ fontSize: 'clamp(14px,2.5vw,20px)', fontWeight: 800, color: '#FFFFFF', fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1.4, margin: 0 }}>
                "{ai.final_verdict.single_most_impactful_change}"
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '32px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 40 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 10, letterSpacing: '0.05em' }}>
          © {new Date().getFullYear()} Landalytics. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          {[['Privacy Policy','privacy'],['Terms of Use','terms']].map(([label, pg]) => (
            <button key={pg} onClick={() => onNav && onNav(pg)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em',
              textTransform: 'uppercase', fontWeight: 700,
              textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.1)',
            }}>{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
};


// ---------------------------------------------------------------------------
// Shared legal page shell
// ---------------------------------------------------------------------------
const LegalPage = ({ title, onHome, children }) => (
  <div style={{ minHeight: '100vh', background: '#060E1A', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 64px' }}>
      {/* Back */}
      <button onClick={onHome} style={{
        background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
        gap: 6, color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 40,
      }}>← Back to Landalytics</button>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 12 }}>
          Legal
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, fontStyle: 'italic', color: '#fff', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Content */}
      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)' }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Landalytics. All rights reserved.</p>
      </div>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 14, fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{title}</h2>
    {children}
  </div>
);

const P = ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>;
const Li = ({ children }) => <li style={{ marginBottom: 6 }}>{children}</li>;

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------
const PrivacyPage = ({ onHome }) => (
  <LegalPage title="Privacy Policy" onHome={onHome}>
    <Section title="Overview">
      <P>Landalytics ("we", "our", or "us") operates the Landalytics website and landing page audit service. This Privacy Policy explains how we collect, use, and protect information when you use our service. By using Landalytics, you agree to the practices described in this policy.</P>
    </Section>

    <Section title="Information We Collect">
      <P><strong style={{color:'#e2e8f0'}}>Information you provide:</strong></P>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <Li>URLs you submit for analysis</Li>
        <Li>Your selected audit goal</Li>
        <Li>Any contact information you voluntarily provide (e.g. via email)</Li>
      </ul>
      <P><strong style={{color:'#e2e8f0'}}>Information collected automatically:</strong></P>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <Li>IP address (used for rate limiting — not stored long-term)</Li>
        <Li>Browser type and version</Li>
        <Li>Pages visited and time spent on site</Li>
        <Li>Referring URLs</Li>
      </ul>
    </Section>

    <Section title="How We Use Your Information">
      <P>We use the information collected to:</P>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <Li>Perform the requested landing page analysis</Li>
        <Li>Prevent abuse and enforce rate limits</Li>
        <Li>Improve the accuracy and quality of our analysis</Li>
        <Li>Communicate with you if you contact us directly</Li>
        <Li>Monitor and maintain service performance</Li>
      </ul>
      <P>We do not sell, rent, or share your personal information with third parties for marketing purposes.</P>
    </Section>

    <Section title="Third-Party Services">
      <P>Landalytics uses the following third-party services to deliver its functionality. Each has its own privacy policy:</P>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <Li><strong style={{color:'#e2e8f0'}}>Jina AI Reader (r.jina.ai)</strong> — used to fetch and process the URLs you submit. Your submitted URLs are sent to Jina's servers for processing.</Li>
        <Li><strong style={{color:'#e2e8f0'}}>Groq API</strong> — used to generate AI-powered analysis. Page content extracted from your URL may be sent to Groq for processing.</Li>
        <Li><strong style={{color:'#e2e8f0'}}>Google PageSpeed Insights API</strong> — used to measure page performance. Your submitted URL is sent to Google's servers.</Li>
        <Li><strong style={{color:'#e2e8f0'}}>Render</strong> — our cloud hosting provider. Infrastructure and server logs are managed by Render.</Li>
      </ul>
    </Section>

    <Section title="Data Retention">
      <P>We do not maintain a persistent database of user submissions. URLs and analysis results are processed in real-time and are not stored beyond the duration of your session. Server logs may be retained for up to 30 days for security and debugging purposes.</P>
    </Section>

    <Section title="Cookies">
      <P>Landalytics does not use tracking cookies or advertising cookies. We may use essential session cookies required for the site to function. We do not use Google Analytics, Facebook Pixel, or any behavioural tracking tools.</P>
    </Section>

    <Section title="Security">
      <P>We implement industry-standard security measures including HTTPS encryption, rate limiting, input validation, and SSRF prevention. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of data transmitted to our service.</P>
    </Section>

    <Section title="Children's Privacy">
      <P>Landalytics is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.</P>
    </Section>

    <Section title="Your Rights">
      <P>Depending on your jurisdiction, you may have rights regarding your personal data including the right to access, correct, or delete information we hold about you. To exercise these rights, contact us at the email below.</P>
    </Section>

    <Section title="Changes to This Policy">
      <P>We may update this Privacy Policy from time to time. We will notify users of material changes by updating the "Last updated" date at the top of this page. Continued use of the service after changes constitutes acceptance of the updated policy.</P>
    </Section>

    <Section title="Contact Us">
      <P>If you have questions about this Privacy Policy, please contact us at: <strong style={{color:'#93C5FD'}}>legal@landalytics.com</strong></P>
    </Section>
  </LegalPage>
);

// ---------------------------------------------------------------------------
// Terms of Use
// ---------------------------------------------------------------------------
const TermsPage = ({ onHome }) => (
  <LegalPage title="Terms of Use" onHome={onHome}>
    <Section title="Acceptance of Terms">
      <P>By accessing or using Landalytics ("Service"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms apply to all users of the Service.</P>
    </Section>

    <Section title="Description of Service">
      <P>Landalytics provides automated landing page analysis using AI-powered tools. The Service analyzes publicly accessible web pages and generates reports covering conversion readiness, SEO signals, trust indicators, and strategic recommendations. Landalytics is an analytical tool — it does not modify, access private areas of, or interact with the websites it analyzes beyond reading their publicly accessible content.</P>
    </Section>

    <Section title="Acceptable Use">
      <P>You agree to use the Service only for lawful purposes. You must not:</P>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <Li>Submit URLs for websites you do not own or have authorization to analyze</Li>
        <Li>Attempt to circumvent rate limits or access controls</Li>
        <Li>Use the Service to analyze URLs for the purpose of competitive intelligence in a manner that violates applicable law</Li>
        <Li>Submit malicious URLs, URLs pointing to illegal content, or URLs designed to exploit the Service</Li>
        <Li>Use automated scripts or bots to abuse the Service</Li>
        <Li>Reverse engineer, decompile, or attempt to extract the source code of the Service</Li>
        <Li>Resell or commercially redistribute analysis reports without written permission</Li>
      </ul>
    </Section>

    <Section title="Intellectual Property">
      <P>All content, design, code, and intellectual property of the Landalytics platform — including but not limited to the scoring methodology, SWOT framework, Conversion Readiness Index, and visual design — is owned by Landalytics and protected by applicable intellectual property laws.</P>
      <P>Analysis reports generated by the Service are provided for your personal or internal business use. You may not resell, license, or redistribute reports without prior written consent.</P>
    </Section>

    <Section title="Disclaimer of Warranties">
      <P>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. LANDALYTICS DOES NOT WARRANT THAT:</P>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <Li>The Service will be uninterrupted, error-free, or secure</Li>
        <Li>Analysis results will be accurate, complete, or suitable for any particular purpose</Li>
        <Li>The Service will meet your specific business requirements</Li>
        <Li>Any defects will be corrected</Li>
      </ul>
      <P>AI-generated analysis is provided for informational purposes only. You should not rely solely on Landalytics reports for business-critical decisions without independent verification.</P>
    </Section>

    <Section title="Limitation of Liability">
      <P>TO THE MAXIMUM EXTENT PERMITTED BY LAW, LANDALYTICS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</P>
      <P>Our total liability to you for any claims arising from use of the Service shall not exceed the amount you paid for the Service in the 12 months preceding the claim, or $100, whichever is greater.</P>
    </Section>

    <Section title="Third-Party Services">
      <P>The Service relies on third-party APIs and infrastructure. We are not responsible for the availability, accuracy, or actions of third-party services including Jina AI, Groq, Google, or Render. Use of the Service is subject to their respective terms and policies.</P>
    </Section>

    <Section title="Rate Limits and Fair Use">
      <P>To ensure service availability for all users, Landalytics enforces rate limits on API usage. Attempting to circumvent these limits is a violation of these Terms and may result in suspension of access.</P>
    </Section>

    <Section title="Termination">
      <P>We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</P>
    </Section>

    <Section title="Governing Law">
      <P>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in the applicable jurisdiction.</P>
    </Section>

    <Section title="Changes to Terms">
      <P>We reserve the right to modify these Terms at any time. Material changes will be communicated by updating the "Last updated" date. Continued use of the Service following changes constitutes your acceptance of the revised Terms.</P>
    </Section>

    <Section title="Contact Us">
      <P>For questions about these Terms, contact us at: <strong style={{color:'#93C5FD'}}>legal@landalytics.com</strong></P>
    </Section>
  </LegalPage>
);

export default function App() {
  const [report, setReport] = useState(null);

  // Read URL path on load — supports direct links to /privacy and /terms
  const getInitialPage = () => {
    const path = window.location.pathname;
    if (path === '/privacy') return 'privacy';
    if (path === '/terms')   return 'terms';
    return 'home';
  };
  const [page, setPage] = useState(getInitialPage);

  // Update browser URL when page changes
  const navigate = (pg) => {
    const path = pg === 'home' ? '/' : `/${pg}`;
    window.history.pushState({}, '', path);
    setPage(pg);
    window.scrollTo(0, 0);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPop = () => setPage(getInitialPage());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (page === 'privacy') return <PrivacyPage onHome={() => navigate('home')} />;
  if (page === 'terms')   return <TermsPage   onHome={() => navigate('home')} />;
  return report
    ? <ReportPage {...report} onHome={() => { navigate('home'); setReport(null); }} onNav={navigate} />
    : <HomePage onScanComplete={setReport} onNav={navigate} />;
}
