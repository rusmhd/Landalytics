import React, { useState, useEffect } from 'react';

const getScoreColor = (s) => s >= 85 ? '#10b981' : s >= 65 ? '#3b82f6' : s >= 45 ? '#f59e0b' : '#ef4444';
const getScoreLabel = (s) => s >= 85 ? 'EXCELLENT' : s >= 65 ? 'GOOD' : s >= 45 ? 'FAIR' : 'WEAK';
const getScoreBg = (s) => s >= 85 ? 'rgba(16,185,129,0.08)' : s >= 65 ? 'rgba(59,130,246,0.08)' : s >= 45 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

const GOALS = [
  { value: 'lead_generation', label: 'Lead Generation',    icon: '🎯' },
  { value: 'saas_trial',      label: 'SaaS Free Trial',    icon: '🚀' },
  { value: 'ecommerce',       label: 'E-commerce / Sales', icon: '🛒' },
  { value: 'newsletter',      label: 'Newsletter Signup',  icon: '📩' },
  { value: 'book_demo',       label: 'Book a Demo',        icon: '📅' },
  { value: 'app_download',    label: 'App Download',       icon: '📲' },
];

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

const HomePage = ({ onScanComplete }) => {
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('lead_generation');
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Select Page Goal</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {GOALS.map(g => (
                <button key={g.value} onClick={() => setGoal(g.value)} style={{
                  background: goal === g.value ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${goal === g.value ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 100, padding: '7px 16px',
                  color: goal === g.value ? '#93C5FD' : 'rgba(255,255,255,0.3)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{g.icon}</span><span>{g.label}</span>
                </button>
              ))}
            </div>
          </div>
          {error && <div style={{ color: '#EF4444', fontSize: 12, fontFamily: 'monospace', textAlign: 'left', paddingLeft: 20 }}>⚠ {error}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 48 }}>
          {[['12','Node Analysis'],['4','Core Metrics'],['AI','Powered SWOT']].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF' }}>{v}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReportPage = ({ scores, ai, url, goal, onHome }) => {
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
    </div>
  );
};

export default function App() {
  const [report, setReport] = useState(null);
  return report
    ? <ReportPage {...report} onHome={() => setReport(null)} />
    : <HomePage onScanComplete={setReport} />;
}
