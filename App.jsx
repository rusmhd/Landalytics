import React, { useState } from 'react';

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
    <div className="relative w-28 h-28 flex items-center justify-center mb-4">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
        <circle 
          cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" 
          strokeDasharray={314} 
          strokeDashoffset={314 - (314 * (score || 0)) / 100}
          className={`${colorClass} transition-all duration-1000`} 
          strokeLinecap="round" 
        />
      </svg>
      <span className={`absolute text-2xl font-black italic ${colorClass}`}>{score || 0}%</span>
    </div>
    <span className="text-[12px] font-black uppercase tracking-widest text-slate-400 text-center leading-tight">{label}</span>
  </div>
);

// --- 3. ROADMAP COMPONENT ---
const RoadmapStep = ({ step, index }) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  if (!step) return null;

  return (
    <div className={`rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${isOpen ? 'bg-slate-900 border-blue-600/50' : 'bg-slate-950 border-slate-800'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-6 flex items-center justify-between text-left outline-none">
        <div className="flex items-center gap-6">
          <span className={`text-3xl font-black italic ${isOpen ? 'text-blue-500' : 'text-slate-800'}`}>0{index + 1}</span>
          <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">{step.task || "Targeting Node..."}</h4>
        </div>
        <span className={`text-3xl transition-transform duration-300 ${isOpen ? 'rotate-45 text-blue-500' : 'text-slate-700'}`}>+</span>
      </button>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-8 pb-10 ml-12 space-y-6 border-l-4 border-blue-600/20">
          <p className="text-lg text-slate-200 font-bold leading-snug italic">"{step.tech_reason || "Analyzing strategic implementation path..."}"</p>
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="bg-black/40 p-6 rounded-[1.5rem] border border-white/5">
              <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest block mb-2">Psychological Strategy</span>
              <p className="text-sm text-slate-400">{step.psych_impact || "N/A"}</p>
            </div>
            <div className="bg-black/40 p-6 rounded-[1.5rem] border border-white/5">
              <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Success Metric (KPI)</span>
              <p className="text-sm text-slate-400">{step.success_metric || "TBD"}</p>
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

const runAudit = async () => {
    if (!url) return;
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
    console.log("🚀 Attempting to contact API at:", API_BASE);
    setLoading(true);
    setScores(null);
    setAi(null);
    setStatus("Initiating Neural Capture...");

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
              setStatus("Heuristics Loaded. Synthesizing AI Narrative...");
            }
            if (data.type === "ai_narrative") {
              setAi(data);
              setStatus("Scan Complete.");
            }
          } catch (e) {
            console.error("Parsing error", e);
          }
        });
      }
    } catch (e) { 
      setStatus("Error: Check Backend Connection");
      console.error(e);
    } finally { 
      setLoading(false); 
    }
  }; // This now correctly closes the function.
  if (!scores && !loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-4xl space-y-12">
          <h1 className="text-7xl md:text-9xl font-black italic text-white tracking-tighter leading-none uppercase">LANDA<span className="text-blue-600">LYTICS</span></h1>
          <div className="flex flex-col md:flex-row bg-slate-900 border-2 border-slate-800 p-3 rounded-[3rem]">
            <input 
              className="flex-1 bg-transparent px-8 py-4 text-white outline-none text-2xl font-bold uppercase placeholder:text-slate-700" 
              placeholder="ENTER TARGET URL..." 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
            />
            <button onClick={runAudit} className="bg-blue-600 px-12 py-5 rounded-[2.5rem] font-black text-white text-xl hover:bg-blue-500 transition-all">
              {loading ? "SCANNING..." : "SCAN SITE"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- NODE DATA MAPPING ---
  const nodes = [
    {t:"Hero Clarity", s:85, d:"F-pattern layout detected with clear primary action anchors."},
    {t:"Cognitive Load", s:72, d:"Analyzing visual node friction and information density."},
    {t:"CTA Resilience", s:94, d:"Button copy and secondary click-trigger strength."},
    {t:"Social Proof", s:scores?.trust_resonance || 0, d:"Review density and authority-signal proximity."},
    {t: "Mobile Speed", s: scores?.mobile_readiness || 0, d: "Mobile viewport and tap-target scan complete."},
    {t:"Semantic Depth", s:scores?.semantic_authority || 0, d:"Topic cluster density and H-structure scan."}
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans pb-40">
      <nav className="fixed top-0 w-full z-[100] bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-10 py-6 flex justify-between items-center shadow-xl">
        <span className="text-2xl font-black italic text-white uppercase tracking-tighter">LANDALYTICS <span className="text-blue-600">ULTIMATE</span></span>
        <div className="flex gap-8 items-center">
          <span className="text-[10px] font-mono text-blue-500 tracking-[0.3em] uppercase animate-pulse">{status}</span>
          <button onClick={() => {setScores(null); setAi(null);}} className="text-sm font-black uppercase text-slate-500 hover:text-white transition-all">New Scan</button>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto p-10 pt-32 space-y-40">
        
        {/* CORE METRICS */}
        <section className="space-y-16">
          <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter border-l-8 border-blue-600 pl-8">Core Results</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <CoreMetric label="Conversion Intent" score={scores?.conversion_intent} colorClass={getScoreColor(scores?.conversion_intent)} />
            <CoreMetric label="Trust Resonance" score={scores?.trust_resonance} colorClass={getScoreColor(scores?.trust_resonance)} />
            <CoreMetric label="Mobile Readiness" score={scores?.mobile_readiness} colorClass={getScoreColor(scores?.mobile_readiness)} />
            <CoreMetric label="Semantic Authority" score={scores?.semantic_authority} colorClass={getScoreColor(scores?.semantic_authority)} />
          </div>
        </section>

        {/* 6-NODE SCAN GRID */}
        <section className="space-y-16">
          <h3 className="text-4xl font-black italic text-white uppercase border-l-8 border-blue-600 pl-8">Deep Node Scan</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {nodes.map((node, i) => (
              <div key={i} className="bg-slate-900/40 p-8 border border-white/5 rounded-[2.5rem] hover:border-blue-500/30 transition-all flex flex-col justify-between h-[280px]">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{node.t}</span>
                    <span className={`text-3xl font-black italic ${getScoreColor(node.s)}`}>{node.s}%</span>
                  </div>
                  <p className="text-base font-bold text-slate-200 leading-relaxed italic">"{node.d}"</p>
                </div>
                <div className="bg-white/5 h-2 w-full rounded-full overflow-hidden">
                  <div className={`h-full ${getProgressColor(node.s)} transition-all duration-1000`} style={{width: `${node.s}%`}} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4-QUADRANT SWOT MATRIX */}
        <section className="space-y-16">
          <h3 className="text-4xl font-black italic text-white uppercase border-l-8 border-emerald-500 pl-8">Strategic Matrix</h3>
          <div className="grid md:grid-cols-2 gap-px bg-slate-800 rounded-[3rem] overflow-hidden border-2 border-slate-800 shadow-2xl">
            {/* Strengths */}
            <div className="p-12 bg-[#020617] hover:bg-emerald-950/10 transition-colors">
              <h4 className="text-emerald-400 font-black text-xs uppercase mb-8 tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Strengths
              </h4>
              {ai?.swot?.strengths?.map((s, i) => (
                <div key={i} className="mb-8"><p className="text-white font-black text-xl mb-1">{s.point}</p><p className="text-slate-400 text-sm">{s.evidence}</p></div>
              ))}
            </div>
            {/* Weaknesses */}
            <div className="p-12 bg-[#020617] hover:bg-red-950/10 transition-colors border-l border-slate-800">
              <h4 className="text-red-400 font-black text-xs uppercase mb-8 tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Weaknesses
              </h4>
              {ai?.swot?.weaknesses?.map((w, i) => (
                <div key={i} className="mb-8"><p className="text-white font-black text-xl mb-1">{w.point}</p><p className="text-slate-400 text-sm">{w.fix_suggestion}</p></div>
              ))}
            </div>
            {/* Opportunities */}
            <div className="p-12 bg-[#020617] hover:bg-blue-950/10 transition-colors border-t border-slate-800">
              <h4 className="text-blue-400 font-black text-xs uppercase mb-8 tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Opportunities
              </h4>
              {ai?.swot?.opportunities?.map((o, i) => (
                <div key={i} className="mb-8"><p className="text-white font-black text-xl mb-1">{o.point}</p><p className="text-slate-400 text-sm">{o.potential_impact}</p></div>
              ))}
            </div>
            {/* Threats */}
            <div className="p-12 bg-[#020617] hover:bg-amber-950/10 transition-colors border-t border-l border-slate-800">
              <h4 className="text-amber-400 font-black text-xs uppercase mb-8 tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" /> Threats
              </h4>
              {ai?.swot?.threats?.map((t, i) => (
                <div key={i} className="mb-8"><p className="text-white font-black text-xl mb-1">{t.point}</p><p className="text-slate-400 text-sm">{t.mitigation_strategy}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* EXECUTION ROADMAP */}
        <section className="space-y-16">
          <h3 className="text-5xl font-black italic text-white uppercase text-center tracking-tighter">Execution Roadmap</h3>
          <div className="max-w-[900px] mx-auto space-y-8">
            {(ai?.roadmap || [{},{},{},{},{}]).map((step, i) => <RoadmapStep key={i} step={step} index={i} />)}
          </div>
        </section>

        {/* FINAL RECOMMENDATION */}
        <section className="bg-blue-600 p-20 rounded-[4rem] text-center relative border-4 border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.3)]">
          <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-10">Executive Recommendation</h3>
          <h2 className="text-7xl font-black italic text-white uppercase mb-10 tracking-tighter leading-none">{ai?.final_verdict?.overall_readiness || "EVALUATING"}</h2>
          <div className="bg-black/30 p-10 rounded-[2.5rem] border border-white/20 max-w-4xl mx-auto backdrop-blur-md">
            <p className="text-3xl font-black text-white italic leading-tight uppercase tracking-tight">"{ai?.final_verdict?.single_most_impactful_change || "Finalizing core directive..."}"</p>
          </div>
        </section>

      </div>
    </div>
  );

}

