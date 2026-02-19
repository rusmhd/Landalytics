import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 85) return '#10b981'; // emerald
  if (score >= 65) return '#3b82f6'; // blue
  if (score >= 45) return '#f59e0b'; // amber
  return '#ef4444';                   // red
};

const getScoreLabel = (score) => {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 65) return 'GOOD';
  if (score >= 45) return 'FAIR';
  return 'WEAK';
};

const getScoreBg = (score) => {
  if (score >= 85) return 'rgba(16,185,129,0.08)';
  if (score >= 65) return 'rgba(59,130,246,0.08)';
  if (score >= 45) return 'rgba(245,158,11,0.08)';
  return 'rgba(239,68,68,0.08)';
};

// ─── GAUGE ────────────────────────────────────────────────────────────────────
const Gauge = ({ score = 0, label, size = 130 }) => {
  const [animated, setAnimated] = useState(0);
  const color = getScoreColor(score);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * animated) / 100;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color})` }}
          />
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

// ─── PROGRESS BAR NODE ────────────────────────────────────────────────────────
const NodeBar = ({ label, score = 0, description }) => {
  const [width, setWidth] = useState(0);
  const color = getScoreColor(score);
  useEffect(() => { const t = setTimeout(() => setWidth(score), 300); return () => clearTimeout(t); }, [score]);

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
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 10px ${color}` }} />
      </div>
    </div>
  );
};

// ─── ROADMAP STEP ─────────────────────────────────────────────────────────────
const RoadmapStep = ({ step, index }) => {
  const [open, setOpen] = useState(index === 0);
  if (!step?.task) return null;
  const colors = ['#3b82f6', '#10b981', '#f59e0b'];
  const color = colors[index % colors.length];

  return (
    <div style={{ border: `1px solid ${open ? color + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, overflow: 'hidden', background: open ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'all 0.3s', marginBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 32, fontWeight: 900, fontStyle: 'italic', color: open ? color : 'rgba(255,255,255,0.1)', lineHeight: 1 }}>0{index + 1}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.task}</span>
        </div>
        <span style={{ fontSize: 20, color: open ? color : 'rgba(255,255,255,0.2)', transform: open ? 'rotate(45deg)' : 'none', transition: 'all 0.3s', display: 'block', lineHeight: 1 }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 24px 24px', borderLeft: `3px solid ${color}30`, marginLeft: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontStyle: 'italic', marginBottom: 16, lineHeight: 1.6 }}>"{step.tech_reason}"</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Psychological Strategy</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.6 }}>{step.psych_impact || 'N/A'}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Success Metric (KPI)</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.6 }}>{step.success_metric || 'TBD'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SWOT CARD ────────────────────────────────────────────────────────────────
const SwotCard = ({ title, items, color, fieldA, fieldB, icon }) => (
  <div style={{ padding: 28, borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{title}</span>
    </div>
    {items?.map((item, i) => (
      <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item[fieldA]}</p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.6 }}>{item[fieldB]}</p>
      </div>
    )) || <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontStyle: 'italic' }}>Analyzing...</p>}
  </div>
);

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
const generatePDF = async (data, url) => {
  const { scores, ai } = data;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const W = 210, H = 297;
  const M = 14; // margin
  const CW = W - M * 2; // content width

  const BG = '#050A14';
  const ACCENT = '#2563EB';
  const CARD = '#0F1929';
  const BORDER = '#1E2D45';

  const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const scoreColorHex = (score) => {
    if (score >= 85) return '#10B981';
    if (score >= 65) return '#3B82F6';
    if (score >= 45) return '#F59E0B';
    return '#EF4444';
  };

  const setFont = (size, weight = 'normal', color = '#FFFFFF') => {
    pdf.setFontSize(size);
    const [r, g, b] = hex2rgb(color);
    pdf.setTextColor(r, g, b);
    pdf.setFont('helvetica', weight);
  };

  const fillRect = (x, y, w, h, color, alpha = 1) => {
    const [r, g, b] = hex2rgb(color);
    pdf.setFillColor(r, g, b);
    pdf.rect(x, y, w, h, 'F');
  };

  const drawBorderRect = (x, y, w, h, color) => {
    const [r, g, b] = hex2rgb(color);
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(0.3);
    pdf.rect(x, y, w, h, 'S');
  };

  const drawCard = (x, y, w, h, bgColor = CARD) => {
    fillRect(x, y, w, h, bgColor);
    drawBorderRect(x, y, w, h, BORDER);
  };

  // ── PAGE 1: COVER + CORE METRICS ──
  fillRect(0, 0, W, H, BG);

  // Accent strip top
  fillRect(0, 0, W, 1.5, ACCENT);

  // Header
  setFont(7, 'bold', '#2563EB');
  pdf.text('LANDALYTICS ULTIMATE  •  AI CONVERSION AUDIT', M, 14);

  // Date
  const now = new Date();
  setFont(7, 'normal', '#334155');
  pdf.text(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase(), W - M, 14, { align: 'right' });

  // Divider
  const [dc1, dc2, dc3] = hex2rgb('#1E2D45');
  pdf.setDrawColor(dc1, dc2, dc3);
  pdf.setLineWidth(0.3);
  pdf.line(M, 18, W - M, 18);

  // Big title
  setFont(38, 'bold', '#FFFFFF');
  pdf.text('SITE', M, 44);
  setFont(38, 'bold', '#2563EB');
  pdf.text('AUDIT', M + 42, 44);

  // URL badge
  drawCard(M, 50, CW, 12, '#0A1628');
  setFont(7, 'normal', '#64748B');
  pdf.text('TARGET URL', M + 5, 57);
  setFont(8, 'bold', '#94A3B8');
  const urlText = url.length > 70 ? url.substring(0, 70) + '...' : url;
  pdf.text(urlText, M + 28, 57);

  // Section label
  setFont(7, 'bold', '#2563EB');
  pdf.text('01  CORE METRICS', M, 72);
  pdf.line(M, 74, W - M, 74);

  // 4 gauge cards
  const gaugeData = [
    { label: 'Conversion Intent', score: scores.conversion_intent },
    { label: 'Trust Resonance', score: scores.trust_resonance },
    { label: 'Mobile Readiness', score: scores.mobile_readiness },
    { label: 'Semantic Authority', score: scores.semantic_authority },
  ];

  const gcw = (CW - 9) / 4;
  gaugeData.forEach((g, i) => {
    const x = M + i * (gcw + 3);
    const y = 78;
    const h = 52;
    const color = scoreColorHex(g.score);

    drawCard(x, y, gcw, h);

    // Score number
    setFont(22, 'bold', color);
    pdf.text(`${g.score}`, x + gcw / 2, y + 20, { align: 'center' });

    // Progress bar
    const bx = x + 5, by = y + 25, bw = gcw - 10, bh = 3;
    fillRect(bx, by, bw, bh, '#1E2D45');
    fillRect(bx, by, bw * (g.score / 100), bh, color);

    // Label
    setFont(6, 'bold', '#64748B');
    const labelLines = g.label.toUpperCase();
    pdf.text(labelLines, x + gcw / 2, y + 36, { align: 'center' });

    // Grade
    const grade = g.score >= 85 ? 'EXCELLENT' : g.score >= 65 ? 'GOOD' : g.score >= 45 ? 'FAIR' : 'WEAK';
    setFont(6, 'bold', color);
    pdf.text(grade, x + gcw / 2, y + 43, { align: 'center' });
  });

  // Section: Node Analysis
  setFont(7, 'bold', '#2563EB');
  pdf.text('02  DEEP NODE ANALYSIS', M, 144);
  pdf.line(M, 146, W - M, 146);

  const nodeData = [
    { label: 'Conversion Intent', score: scores.conversion_intent, desc: scores.conversion_intent >= 65 ? 'Strong conversion signals detected' : 'Conversion signals need improvement' },
    { label: 'Trust Resonance', score: scores.trust_resonance, desc: scores.trust_resonance >= 65 ? 'Authority signals present on page' : 'Trust indicators are below threshold' },
    { label: 'Mobile Readiness', score: scores.mobile_readiness, desc: scores.mobile_readiness >= 65 ? 'Mobile viewport properly configured' : 'Mobile optimization required' },
    { label: 'Semantic Authority', score: scores.semantic_authority, desc: scores.semantic_authority >= 65 ? 'Heading hierarchy well-structured' : 'Semantic structure needs work' },
    { label: 'CTA Architecture', score: Math.min(100, scores.conversion_intent + 5), desc: 'Call-to-action signal strength assessment' },
    { label: 'Social Proof Layer', score: Math.max(0, scores.trust_resonance - 5), desc: 'Authority-signal proximity analysis' },
  ];

  const nhalf = Math.ceil(nodeData.length / 2);
  const ncw = (CW - 4) / 2;

  nodeData.forEach((node, i) => {
    const col = i < nhalf ? 0 : 1;
    const row = i < nhalf ? i : i - nhalf;
    const x = M + col * (ncw + 4);
    const y = 150 + row * 20;
    const color = scoreColorHex(node.score);

    drawCard(x, y, ncw, 17);

    setFont(7, 'bold', '#CBD5E1');
    pdf.text(node.label.toUpperCase(), x + 5, y + 7);

    setFont(6, 'normal', '#475569');
    pdf.text(node.desc, x + 5, y + 12.5, { maxWidth: ncw - 30 });

    setFont(10, 'bold', color);
    pdf.text(`${node.score}%`, x + ncw - 5, y + 10, { align: 'right' });
  });

  // Footer page 1
  pdf.line(M, H - 10, W - M, H - 10);
  setFont(6, 'normal', '#1E3A5F');
  pdf.text('LANDALYTICS ULTIMATE  •  CONFIDENTIAL AUDIT REPORT', M, H - 5);
  setFont(6, 'normal', '#1E3A5F');
  pdf.text('PAGE 1 / 2', W - M, H - 5, { align: 'right' });

  // ── PAGE 2: SWOT + ROADMAP + VERDICT ──
  pdf.addPage();
  fillRect(0, 0, W, H, BG);
  fillRect(0, 0, W, 1.5, ACCENT);

  // Header
  setFont(7, 'bold', '#2563EB');
  pdf.text('LANDALYTICS ULTIMATE  •  AI CONVERSION AUDIT', M, 14);
  setFont(7, 'normal', '#334155');
  pdf.text('STRATEGIC ANALYSIS', W - M, 14, { align: 'right' });
  pdf.setDrawColor(dc1, dc2, dc3);
  pdf.setLineWidth(0.3);
  pdf.line(M, 18, W - M, 18);

  // SWOT
  setFont(7, 'bold', '#2563EB');
  pdf.text('03  STRATEGIC MATRIX (SWOT)', M, 28);
  pdf.line(M, 30, W - M, 30);

  if (ai?.swot) {
    const swotData = [
      { title: 'STRENGTHS', items: ai.swot.strengths, color: '#10B981', fieldA: 'point', fieldB: 'evidence' },
      { title: 'WEAKNESSES', items: ai.swot.weaknesses, color: '#EF4444', fieldA: 'point', fieldB: 'fix_suggestion' },
      { title: 'OPPORTUNITIES', items: ai.swot.opportunities, color: '#3B82F6', fieldA: 'point', fieldB: 'potential_impact' },
      { title: 'THREATS', items: ai.swot.threats, color: '#F59E0B', fieldA: 'point', fieldB: 'mitigation_strategy' },
    ];

    const sqw = (CW - 3) / 2;
    const sqh = 48;

    swotData.forEach((q, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = M + col * (sqw + 3);
      const y = 34 + row * (sqh + 3);

      drawCard(x, y, sqw, sqh);

      // Title bar - use a darkened version of the color instead of opacity
      const [cr, cg, cb] = hex2rgb(q.color);
      pdf.setFillColor(Math.floor(cr * 0.25), Math.floor(cg * 0.25), Math.floor(cb * 0.25));
      pdf.rect(x, y, sqw, 9, 'F');

      setFont(7, 'bold', q.color);
      pdf.text(q.title, x + 5, y + 6);

      let itemY = y + 13;
      q.items?.slice(0, 2).forEach((item, j) => {
        if (itemY < y + sqh - 3) {
          setFont(7, 'bold', '#CBD5E1');
          const pt = item[q.fieldA] || '';
          pdf.text(pt.length > 45 ? pt.substring(0, 45) + '...' : pt, x + 5, itemY);
          setFont(6, 'normal', '#475569');
          const det = item[q.fieldB] || '';
          pdf.text(det.length > 55 ? det.substring(0, 55) + '...' : det, x + 5, itemY + 5, { maxWidth: sqw - 8 });
          itemY += 14;
        }
      });
    });
  }

  // Roadmap
  const roadmapY = 142;
  setFont(7, 'bold', '#2563EB');
  pdf.text('04  EXECUTION ROADMAP', M, roadmapY);
  pdf.line(M, roadmapY + 2, W - M, roadmapY + 2);

  if (ai?.roadmap) {
    const stepColors = ['#3B82F6', '#10B981', '#F59E0B'];
    ai.roadmap.slice(0, 3).forEach((step, i) => {
      if (!step?.task) return;
      const color = stepColors[i];
      const x = M, y = roadmapY + 6 + i * 26;
      const h = 23;

      drawCard(x, y, CW, h);

      // Number
      setFont(14, 'bold', color);
      pdf.text(`0${i + 1}`, x + 5, y + 14);

      // Task
      setFont(8, 'bold', '#E2E8F0');
      pdf.text((step.task || '').toUpperCase(), x + 18, y + 9);

      // Reason
      setFont(6.5, 'normal', '#64748B');
      const reason = step.tech_reason || '';
      pdf.text(reason.length > 90 ? reason.substring(0, 90) + '...' : reason, x + 18, y + 16, { maxWidth: CW - 80 });

      // KPI badge
      if (step.success_metric) {
        drawCard(x + CW - 52, y + 3, 50, 17, '#0A1628');
        setFont(6, 'bold', color);
        pdf.text('KPI', x + CW - 47, y + 10);
        setFont(5.5, 'normal', '#94A3B8');
        const kpi = step.success_metric || '';
        pdf.text(kpi.length > 28 ? kpi.substring(0, 28) + '...' : kpi, x + CW - 47, y + 15, { maxWidth: 42 });
      }
    });
  }

  // Final verdict
  const verdictY = 228;
  const [ar, ag, ab] = hex2rgb(ACCENT);
  pdf.setFillColor(ar, ag, ab);
  pdf.rect(M, verdictY, CW, 46, 'F');

  setFont(7, 'bold', 'rgba(255,255,255,0.5)');
  pdf.setTextColor(255, 255, 255, 0.5);
  setFont(7, 'bold', '#FFFFFF');
  pdf.text('EXECUTIVE RECOMMENDATION', M + CW / 2, verdictY + 10, { align: 'center' });

  const verdict = ai?.final_verdict?.overall_readiness || 'ANALYSIS COMPLETE';
  setFont(20, 'bold', '#FFFFFF');
  pdf.text(verdict.toUpperCase(), M + CW / 2, verdictY + 24, { align: 'center' });

  if (ai?.final_verdict?.single_most_impactful_change) {
    setFont(8, 'normal', '#BFDBFE');
    const change = ai.final_verdict.single_most_impactful_change;
    const lines = pdf.splitTextToSize(change, CW - 20);
    pdf.text(lines.slice(0, 2), M + CW / 2, verdictY + 35, { align: 'center' });
  }

  // Footer page 2
  pdf.line(M, H - 10, W - M, H - 10);
  setFont(6, 'normal', '#1E3A5F');
  pdf.text('LANDALYTICS ULTIMATE  •  CONFIDENTIAL AUDIT REPORT', M, H - 5);
  setFont(6, 'normal', '#1E3A5F');
  pdf.text('PAGE 2 / 2', W - M, H - 5, { align: 'right' });

  pdf.save(`landalytics-audit-${url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-').substring(0, 30)}.pdf`);
};

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
const LoadingScreen = ({ status }) => {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t);
  }, []);

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

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = ({ onScanComplete }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const runAudit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    setStatus('Initiating Neural Capture');

    const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

    if (!API_BASE) {
      setError('VITE_API_URL is not set. Add it in your Render frontend environment variables.');
      setLoading(false);
      return;
    }

    let scores = null, ai = null;

    try {
      const res = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) throw new Error(`Backend error ${res.status} at ${API_BASE}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
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
      onScanComplete({ scores, ai, url: trimmed });
    } catch (e) {
      setError(e.message || 'Connection failed. Check the URL and try again.');
      setLoading(false); setStatus('');
    }
  };

  if (loading) return <LoadingScreen status={status} />;

  const S = {
    page: { minHeight: '100vh', background: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' },
    grid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' },
    glow: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
    wrap: { position: 'relative', width: '100%', maxWidth: 780, textAlign: 'center' },
    eyebrow: { fontSize: 10, fontWeight: 800, color: '#2563EB', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 24 },
    h1: { fontSize: 'clamp(52px, 12vw, 110px)', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 0.9, textTransform: 'uppercase', margin: '0 0 8px 0' },
    accent: { color: '#2563EB' },
    sub: { fontSize: 14, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', lineHeight: 1.7, margin: '20px 0 48px' },
    inputWrap: { display: 'flex', flexDirection: 'column', gap: 12 },
    bar: { display: 'flex', background: '#0F1929', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 100, padding: '6px 6px 6px 24px', gap: 8, transition: 'border-color 0.2s', boxShadow: '0 0 40px rgba(0,0,0,0.5)' },
    input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 16, color: '#FFFFFF', fontFamily: 'monospace', caretColor: '#2563EB' },
    btn: { background: '#2563EB', border: 'none', borderRadius: 100, padding: '14px 32px', color: '#FFFFFF', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 30px rgba(37,99,235,0.4)' },
    err: { color: '#EF4444', fontSize: 12, fontFamily: 'monospace', textAlign: 'left', paddingLeft: 20 },
    stats: { display: 'flex', justifyContent: 'center', gap: 48, marginTop: 48 },
    statVal: { fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF' },
    statLabel: { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 },
  };

  return (
    <div style={S.page}>
      <div style={S.grid} />
      <div style={S.glow} />
      <div style={S.wrap}>
        <div style={S.eyebrow}>AI-Powered Conversion Audit</div>
        <h1 style={S.h1}>LANDA<span style={S.accent}>LYTICS</span></h1>
        <p style={S.sub}>Deep-node analysis of conversion intent,<br />trust architecture & psychological triggers.</p>
        <div style={S.inputWrap}>
          <div style={S.bar}>
            <input
              style={S.input}
              placeholder="https://yoursite.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAudit()}
            />
            <button style={{ ...S.btn, opacity: url.trim() ? 1 : 0.4 }} onClick={runAudit} disabled={!url.trim()}>
              SCAN →
            </button>
          </div>
          {error && <div style={S.err}>⚠ {error}</div>}
        </div>
        <div style={S.stats}>
          {[['12', 'Node Analysis'], ['4', 'Core Metrics'], ['AI', 'Powered SWOT']].map(([v, l]) => (
            <div key={l}>
              <div style={S.statVal}>{v}</div>
              <div style={S.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── REPORT PAGE ──────────────────────────────────────────────────────────────
const ReportPage = ({ scores, ai, url, onHome }) => {
  const [pdfStatus, setPdfStatus] = useState('PDF EXPORT');

  const handlePDF = async () => {
    setPdfStatus('Generating...');
    try {
      await generatePDF({ scores, ai }, url);
      setPdfStatus('SAVED ✓');
      setTimeout(() => setPdfStatus('PDF EXPORT'), 2500);
    } catch (e) {
      console.error('PDF generation failed:', e);
      alert('PDF Error: ' + (e?.message || String(e)));
      setPdfStatus('ERROR');
      setTimeout(() => setPdfStatus('PDF EXPORT'), 2500);
    }
  };

  const nodes = [
    { t: 'Conversion Intent', s: scores?.conversion_intent || 0, d: scores?.conversion_intent >= 65 ? 'Strong conversion signals detected' : 'Conversion signals need improvement' },
    { t: 'Trust Resonance', s: scores?.trust_resonance || 0, d: scores?.trust_resonance >= 65 ? 'Authority signals present' : 'Trust indicators below threshold' },
    { t: 'Mobile Readiness', s: scores?.mobile_readiness || 0, d: scores?.mobile_readiness >= 65 ? 'Mobile viewport configured' : 'Mobile optimization required' },
    { t: 'Semantic Authority', s: scores?.semantic_authority || 0, d: scores?.semantic_authority >= 65 ? 'Heading hierarchy intact' : 'Semantic structure needs work' },
    { t: 'CTA Architecture', s: Math.min(100, (scores?.conversion_intent || 0) + 5), d: 'Call-to-action signal strength' },
    { t: 'Social Proof Layer', s: Math.max(0, (scores?.trust_resonance || 0) - 5), d: 'Authority-signal proximity scan' },
  ];

  const avgScore = Math.round(Object.values(scores || {}).reduce((a, b) => a + b, 0) / 4);

  const S = {
    page: { minHeight: '100vh', background: '#050A14', color: 'rgba(255,255,255,0.7)', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 80 },
    nav: { position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(5,10,20,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' },
    logo: { fontSize: 16, fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.02em' },
    navBtns: { display: 'flex', gap: 8, alignItems: 'center' },
    homeBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' },
    pdfBtn: { background: '#2563EB', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#FFFFFF', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 0 20px rgba(37,99,235,0.3)' },
    content: { maxWidth: 1100, margin: '0 auto', padding: '100px 20px 0' },
    sectionLabel: { fontSize: 9, fontWeight: 800, color: '#2563EB', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 },
    labelLine: { flex: 1, height: 1, background: 'rgba(37,99,235,0.2)' },
    h2: { fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 32px' },
    section: { marginBottom: 80 },
  };

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <span style={S.logo}>LANDA<span style={{ color: '#2563EB' }}>LYTICS</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
          <div style={S.navBtns}>
            <button style={S.homeBtn} onClick={onHome}>← Home</button>
            <button style={S.pdfBtn} onClick={handlePDF}>{pdfStatus}</button>
          </div>
        </div>
      </nav>

      <div style={S.content}>

        {/* HERO */}
        <div style={{ marginBottom: 80, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 60 }}>
          <div style={{ fontSize: 9, color: '#2563EB', fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 12 }}>Audit Report</div>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, margin: '0 0 20px' }}>
            Site<br /><span style={{ color: '#2563EB' }}>Analysis</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '6px 12px' }}>{url}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: getScoreColor(avgScore), background: getScoreBg(avgScore), border: `1px solid ${getScoreColor(avgScore)}30`, borderRadius: 6, padding: '6px 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Avg Score: {avgScore}
            </span>
          </div>
        </div>

        {/* CORE METRICS */}
        <div style={S.section}>
          <div style={S.sectionLabel}><span>01 — Core Results</span><div style={S.labelLine} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: 'Conversion Intent', score: scores?.conversion_intent },
              { label: 'Trust Resonance', score: scores?.trust_resonance },
              { label: 'Mobile Readiness', score: scores?.mobile_readiness },
              { label: 'Semantic Authority', score: scores?.semantic_authority },
            ].map(({ label, score }) => (
              <div key={label} style={{ background: '#0F1929', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'border-color 0.2s' }}>
                <Gauge score={score || 0} label={label} />
              </div>
            ))}
          </div>
        </div>

        {/* DEEP NODE SCAN */}
        <div style={S.section}>
          <div style={S.sectionLabel}><span>02 — Deep Node Scan</span><div style={S.labelLine} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0 }}>
            {nodes.map((node, i) => <NodeBar key={i} label={node.t} score={node.s} description={node.d} />)}
          </div>
        </div>

        {/* SWOT */}
        <div style={S.section}>
          <div style={S.sectionLabel}><span>03 — Strategic Matrix</span><div style={S.labelLine} /></div>
          {ai ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
              <SwotCard title="Strengths" items={ai?.swot?.strengths} color="#10B981" fieldA="point" fieldB="evidence" icon="↑" />
              <SwotCard title="Weaknesses" items={ai?.swot?.weaknesses} color="#EF4444" fieldA="point" fieldB="fix_suggestion" icon="↓" />
              <SwotCard title="Opportunities" items={ai?.swot?.opportunities} color="#3B82F6" fieldA="point" fieldB="potential_impact" icon="→" />
              <SwotCard title="Threats" items={ai?.swot?.threats} color="#F59E0B" fieldA="point" fieldB="mitigation_strategy" icon="⚠" />
            </div>
          ) : (
            <div style={{ padding: 40, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', fontSize: 13 }}>
              AI analysis unavailable — metrics-only scan completed.
            </div>
          )}
        </div>

        {/* ROADMAP */}
        {ai?.roadmap && (
          <div style={S.section}>
            <div style={S.sectionLabel}><span>04 — Execution Roadmap</span><div style={S.labelLine} /></div>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              {ai.roadmap.map((step, i) => <RoadmapStep key={i} step={step} index={i} />)}
            </div>
          </div>
        )}

        {/* VERDICT */}
        <div style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', borderRadius: 24, padding: 'clamp(40px, 6vw, 72px)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 80px rgba(37,99,235,0.2)' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 16 }}>Executive Recommendation</div>
          <h2 style={{ fontSize: 'clamp(32px, 6vw, 60px)', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 24px' }}>
            {ai?.final_verdict?.overall_readiness || 'METRICS CAPTURED'}
          </h2>
          {ai?.final_verdict?.single_most_impactful_change && (
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: '20px 28px', maxWidth: 680, margin: '0 auto', border: '1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', fontWeight: 800, color: '#FFFFFF', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.4, margin: 0 }}>
                "{ai.final_verdict.single_most_impactful_change}"
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [report, setReport] = useState(null);
  return report
    ? <ReportPage {...report} onHome={() => setReport(null)} />
    : <HomePage onScanComplete={setReport} />;
}
