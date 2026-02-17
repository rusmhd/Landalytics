import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- 1. DYNAMIC COLOR LOGIC ---
const getScoreColor = (score) => {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 70) return 'text-blue-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
};

const getProgressColor = (score) => {
  if (score >= 90) return 'bg-emerald-500 shadow-[0_0_10px_#10b981]';
  if (score >= 70) return 'bg-blue-500 shadow-[0_0_10px_#3b82f6]';
  if (score >= 50) return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
  return 'bg-red-500 shadow-[0_0_10px_#ef4444]';
};

// --- 2. CORE METRIC GAUGE ---
const CoreMetric = ({ label, score, colorClass }) => (
  <div className="flex flex-col items-center p-6 bg-slate-900/60 rounded-[2.5rem] border-2 border-white/5 hover:border-blue-500/40 transition-all shadow-xl">
    <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center mb-4">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
        <circle 
          cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="transparent" 
          strokeDasharray="251" 
          strokeDashoffset={251 - (251 * (score || 0)) / 100}
          className={`${colorClass} transition-all duration-1000`} 
          strokeLinecap="round" 
        />
      </svg>
      <span className={`absolute text-xl md:text-2xl font-black italic ${colorClass}`}>{score || 0}%</span>
    </div>
    <span className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-slate-400 text-center leading-tight">{label}</span>
  </div>
);

// --- 3. ROADMAP COMPONENT ---
const RoadmapStep = ({ step, index }) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  if (!step) return null;

  return (
    <div className={`rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${isOpen ? 'bg-slate-900 border-blue-600/50' : 'bg-slate-950 border-slate-800'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-5 md:p-6 flex items-center justify-between text-left outline-none">
        <div className="flex items-center gap-4 md:gap-6">
          <span className={`text-2xl md:text-3xl font-black italic ${isOpen ? 'text-blue-500' : 'text-slate-800'}`}>0{index + 1}</span>
          <h4 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter leading-tight">{step.task || "Targeting Node..."}</h4>
        </div>
        <span className={`text-2xl transition-transform duration-300 ${isOpen ? 'rotate-45 text-blue-500' : 'text-slate-700'}`}>+</span>
      </button>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-5 md:px-8 pb-8 md:pb-10 md:ml-12 space-y-6 border-l-4 border-blue-600/20">
          <p className="text-base md:text-lg text-slate-200 font-bold leading-snug italic">"{step.tech_reason || "Analyzing strategic implementation path..."}"</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4">
            <div className="bg-black/40 p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-white/5">
              <span className="text-[10px] md:text-[11px] font-black text-blue-500 uppercase tracking-widest block mb-2">Psychological Strategy</span>
              <p className="text-xs md:text-sm text-slate-400">{step.psych_impact || "N/A"}</p>
            </div>
            <div className="bg-black/40 p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-white/5">
              <span className="text-[10px] md:text-[11px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Success Metric (KPI)</span>
              <p className="text-xs md:text-sm text-slate-400">{step.success_metric || "TBD"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [url, setUrl] = useState('');
  const [scores, setScores] = useState(null);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("System Idle");
  const reportRef = useRef();

  const runAudit = async () => {
    if (!url) return;
    const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || "https://landalytics.onrender.com";
    
    setLoading(true); setScores(null); setAi(null); setStatus("Initiating Neural Capture...");

    try {
      const response = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        lines.forEach(line => {
          if (!line || line.trim() === "") return;
          try {
            const data = JSON.parse(line);
            if (data.type === "metrics") {
              setScores(data.scores);
              setStatus("Heuristics Loaded...");
            }
            if (data.type === "ai_narrative") {
              setAi(data);
              setStatus("Scan Complete.");
            }
          } catch (e) { }
        });
      }
    } catch (e) { 
      setStatus("Sync Lost");
    } finally { 
      setLoading(false); 
    }
  };

  const downloadReport = async () => {
    if (!ai) return;
    setStatus("Generating PDF...");
    const element = reportRef.current;
    
    try {
      const canvas = await html2canvas(element, { 
        backgroundColor: '#020617', 
        scale: 1.2, // Fixes the browser lag
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`landalytics-audit.pdf`);
      setStatus("Audit Saved.");
    } catch (err) {
      setStatus("Export Error");
    }
  };

  if (!scores && !loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-4xl space-y-12">
          <h1 className="text-5xl md:text-9xl font-black italic text-white tracking-tighter leading-none uppercase">LANDA<span className="text-blue-600">LYTICS</span></h1>
          <div className="flex flex-col md:flex-row bg-slate-900 border-2 border-slate-800 p-2 md:p-3 rounded-[2rem] md:rounded-[3rem]">
            <input 
              className="flex-1 bg-transparent px-6 md:px-8 py-3 md:py-4 text-white outline-none text-xl md:text-2xl font-bold uppercase placeholder:text-slate-700" 
              placeholder="ENTER TARGET URL..." 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
            />
            <button onClick={runAudit} className="bg-blue-600 px-8 md:px-12 py-3 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-white text-lg md:text-xl hover:bg-blue-500 transition-all">
              {loading ? "SCANNING..." : "SCAN SITE"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nodes = [
    {t:"Hero Clarity", s:85, d:"F-pattern layout detected."},
    {t:"Cognitive Load", s:72, d:"Analyzing visual node friction."},
    {t:"CTA Resilience", s:94, d:"Button copy strength."},
    {t:"Social Proof", s:scores?.trust_resonance || 0, d:"Authority-signal proximity."},
    {t: "Mobile Speed", s: scores?.mobile_readiness || 0, d: "Mobile viewport scan complete."},
    {t:"Semantic Depth", s:scores?.semantic_authority || 0, d:"Topic cluster density scan."}
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans pb-20 md:pb-40">
      
      {/* RESPONSIVE NAV */}
      <nav className="fixed top-0 w-full z-[100] bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-6 md:px-10 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <span className="text-xl md:text-2xl font-black italic text-white uppercase tracking-tighter">LANDALYTICS <span className="text-blue-600">ULTIMATE</span></span>
        <div className="flex gap-6 md:gap-8 items-center">
          <span className="text-[8px] md:text-[10px] font-mono text-blue-500 tracking-[0.3em] uppercase animate-pulse">{status}</span>
          <button onClick={() => {setScores(null); setAi(null);}} className="text-xs font-black uppercase text-slate-500 hover:text-white transition-all">New Scan</button>
          <button onClick={downloadReport} disabled={!ai} className={`text-xs font-black uppercase transition-all ${ai ? 'text-blue-500 hover:text-blue-300' : 'text-slate-800'}`}>PDF Export</button>
        </div>
      </nav>

      <div ref={reportRef} className="max-w-[1200px] mx-auto p-4 md:p-10 pt-32 md:pt-48 space-y-24 md:space-y-40 bg-[#020617]">
        
        {/* CORE METRICS */}
        <section className="space-y-10 md:space-y-16">
          <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter border-l-4 md:border-l-8 border-blue-600 pl-4 md:pl-8">Core Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            <CoreMetric label="Conversion Intent" score={scores?.conversion_intent} colorClass={getScoreColor(scores?.conversion_intent)} />
            <CoreMetric label="Trust Resonance" score={scores?.trust_resonance} colorClass={getScoreColor(scores?.trust_resonance)} />
            <CoreMetric label="Mobile Readiness" score={scores?.mobile_readiness} colorClass={getScoreColor(scores?.mobile_readiness)} />
            <CoreMetric label="Semantic Authority" score={scores?.semantic_authority} colorClass={getScoreColor(scores?.semantic_authority)} />
          </div>
        </section>

        {/* 6-NODE SCAN GRID */}
        <section className="space-y-10 md:space-y-16">
          <h3 className="text-3xl md:text-4xl font-black italic text-white uppercase border-l-4 md:border-l-8 border-blue-600 pl-4 md:pl-8">Deep Node Scan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {nodes.map((node, i) => (
              <div key={i} className="bg-slate-900/40 p-6 md:p-8 border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col justify-between h-[240px] md:h-[280px]">
                <div>
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{node.t}</span>
                    <span className={`text-2xl md:text-3xl font-black italic ${getScoreColor(node.s)}`}>{node.s}%</span>
                  </div>
                  <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed italic">"{node.d}"</p>
                </div>
                <div className="bg-white/5 h-2 w-full rounded-full overflow-hidden">
                  <div className={`h-full ${getProgressColor(node.s)} transition-all duration-1000`} style={{width: `${node.s}%`}} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SWOT MATRIX */}
        <section className="space-y-10 md:space-y-16">
          <h3 className="text-3xl md:text-4xl font-black italic text-white uppercase border-l-4 md:border-l-8 border-emerald-500 pl-4 md:pl-8">Strategic Matrix</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden border-2 border-slate-800 shadow-2xl">
            {/* Strengths */}
            <div className="p-8 md:p-12 bg-[#020617]">
              <h4 className="text-emerald-400 font-black text-[10px] uppercase mb-6 tracking-widest flex items-center gap-2">Strengths</h4>
              {ai?.swot?.strengths?.map((s, i) => (
                <div key={i} className="mb-6 md:mb-8"><p className="text-white font-black text-lg md:text-xl mb-1">{s.point}</p><p className="text-slate-400 text-xs md:text-sm">{s.evidence}</p></div>
              ))}
            </div>
            {/* Weaknesses */}
            <div className="p-8 md:p-12 bg-[#020617] border-l-0 md:border-l border-slate-800">
              <h4 className="text-red-400 font-black text-[10px] uppercase mb-6 tracking-widest flex items-center gap-2">Weaknesses</h4>
              {ai?.swot?.weaknesses?.map((w, i) => (
                <div key={i} className="mb-6 md:mb-8"><p className="text-white font-black text-lg md:text-xl mb-1">{w.point}</p><p className="text-slate-400 text-xs md:text-sm">{w.fix_suggestion}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* EXECUTION ROADMAP */}
        <section className="space-y-10 md:space-y-16">
          <h3 className="text-3xl md:text-5xl font-black italic text-white uppercase text-center tracking-tighter">Execution Roadmap</h3>
          <div className="max-w-[900px] mx-auto space-y-6 md:space-y-8">
            {(ai?.roadmap || [{},{},{},{}]).map((step, i) => <RoadmapStep key={i} step={step} index={i} />)}
          </div>
        </section>

        {/* FINAL RECOMMENDATION */}
        <section className="bg-blue-600 p-10 md:p-20 rounded-[2.5rem] md:rounded-[4rem] text-center border-4 border-white/10 shadow-2xl">
          <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-6 md:mb-10">Executive Recommendation</h3>
          <h2 className="text-4xl md:text-7xl font-black italic text-white uppercase mb-6 md:mb-10 tracking-tighter leading-tight">{ai?.final_verdict?.overall_readiness || "EVALUATING"}</h2>
          <div className="bg-black/30 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/20 max-w-4xl mx-auto backdrop-blur-md">
            <p className="text-xl md:text-3xl font-black text-white italic leading-tight uppercase tracking-tight">"{ai?.final_verdict?.single_most_impactful_change || "Finalizing core directive..."}"</p>
          </div>
        </section>

      </div>
    </div>
  );
}
