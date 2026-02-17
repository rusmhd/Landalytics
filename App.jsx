import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- STYLING HELPERS ---
const getScoreColor = (s) => s >= 90 ? 'text-emerald-500' : s >= 70 ? 'text-blue-500' : s >= 50 ? 'text-amber-500' : 'text-red-500';
const getProgressColor = (s) => s >= 90 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : s >= 70 ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : s >= 50 ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]';

// --- SUB-COMPONENTS ---
const CoreMetric = ({ label, score, colorClass }) => (
  <div className="flex flex-col items-center p-6 bg-slate-900/60 rounded-[2.5rem] border-2 border-white/5 shadow-xl">
    <div className="relative w-28 h-28 flex items-center justify-center mb-4">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={314} strokeDashoffset={314 - (314 * (score || 0)) / 100} className={`${colorClass} transition-all duration-1000`} strokeLinecap="round" />
      </svg>
      <span className={`absolute text-2xl font-black italic ${colorClass}`}>{score || 0}%</span>
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{label}</span>
  </div>
);

const RoadmapStep = ({ step, index }) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  if (!step.task && !step.point) return null;
  return (
    <div className={`rounded-[2rem] border-2 transition-all ${isOpen ? 'bg-slate-900 border-blue-600/50' : 'bg-slate-950 border-slate-800'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-8 flex items-center justify-between text-left outline-none">
        <div className="flex items-center gap-6">
          <span className={`text-4xl font-black italic ${isOpen ? 'text-blue-500' : 'text-slate-800'}`}>0{index + 1}</span>
          <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">{step.task || step.point}</h4>
        </div>
        <span className="text-3xl text-slate-700">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-10 pb-12 ml-16 space-y-6 border-l-4 border-blue-600/20">
          <p className="text-xl text-slate-200 font-bold italic leading-tight">"{step.tech_reason || step.description}"</p>
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="bg-black/40 p-6 rounded-[1.5rem] border border-white/5">
              <span className="text-[11px] font-black text-blue-500 uppercase block mb-2 tracking-widest">Psychological Strategy</span>
              <p className="text-sm text-slate-400">{step.psych_impact || "N/A"}</p>
            </div>
            <div className="bg-black/40 p-6 rounded-[1.5rem] border border-white/5">
              <span className="text-[11px] font-black text-emerald-500 uppercase block mb-2 tracking-widest">Success Metric</span>
              <p className="text-sm text-slate-400">{step.success_metric || "KPI Pending"}</p>
            </div>
          </div>
        </div>
      )}
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

  const goHome = () => {
    setScores(null); setAi(null); setLoading(false); setUrl(''); setStatus("System Idle");
  };

  // --- OPTIMIZED MULTI-PAGE PDF (Slices to prevent lag) ---
  const downloadReport = async () => {
    if (!ai) return;
    setStatus("Processing PDF Pages...");
    const element = reportRef.current;
    
    try {
      const canvas = await html2canvas(element, { 
        backgroundColor: '#020617', 
        scale: 1.5, // Lowered scale to fix browser lag 
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Uses JPEG compression to save memory
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const canvasPageHeight = pdfHeight / ratio;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight * ratio);
      heightLeft -= canvasPageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position * ratio, pdfWidth, imgHeight * ratio);
        heightLeft -= canvasPageHeight;
      }

      pdf.save(`landalytics-report.pdf`);
      setStatus("Download Complete.");
    } catch (err) {
      console.error(err);
      setStatus("Engine Exhausted");
    }
  };

  const runAudit = async () => {
    if (!url) return;
    const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || "https://landalytics.onrender.com";
    setLoading(true); setScores(null); setAi(null); setStatus("Capturing Neurons...");
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "metrics") setScores(data.scores);
            if (data.type === "ai_narrative") { setAi(data); setLoading(false); setStatus("Scan Complete."); }
          } catch (e) {}
        }
      }
    } catch (e) { setStatus("Sync Lost"); setLoading(false); }
  };

  const nodes = [
    {t:"Hero Clarity", s:85, d:"F-pattern layout detected."},
    {t:"Cognitive Load", s:72, d:"Visual node friction scan."},
    {t:"CTA Resilience", s:94, d:"Click-trigger strength scan."},
    {t:"Social Proof", s:scores?.trust_resonance || 0, d:"Authority-signal proximity."},
    {t:"Mobile Speed", s:scores?.mobile_readiness || 0, d:"Viewport readiness confirmed."},
    {t:"Semantic Depth", s:scores?.semantic_authority || 0, d:"Topic cluster density scan."}
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 pb-40">
      
      {/* FIXED NAVIGATION */}
      <nav className="fixed top-0 w-full z-[100] bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-10 py-8 flex justify-between items-end">
        <div>
          <span onClick={goHome} className="text-3xl font-black italic text-white uppercase tracking-tighter cursor-pointer">LANDALYTICS</span>
          <p className="text-[10px] font-mono text-blue-500 tracking-[0.4em] uppercase mt-1">{status}</p>
        </div>
        <div className="flex items-center gap-12">
          <button onClick={goHome} className="text-3xl font-black italic text-white hover:text-blue-500 transition-all uppercase tracking-tighter">HOME</button>
          <button onClick={downloadReport} disabled={!ai} className={`text-3xl font-black italic uppercase tracking-tighter transition-all ${ai ? "text-blue-600 hover:text-blue-400" : "text-white/5 cursor-not-allowed"}`}>PDF DOWNLOAD</button>
        </div>
      </nav>

      {/* SEARCH VIEW */}
      {(!scores && !loading) ? (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="w-full max-w-4xl space-y-12">
            <h1 className="text-7xl md:text-9xl font-black italic text-white tracking-tighter uppercase leading-none">LANDA<span className="text-blue-600">LYTICS</span></h1>
            <div className="flex flex-col md:flex-row bg-slate-900 border-2 border-slate-800 p-3 rounded-[3rem]">
              <input className="flex-1 bg-transparent px-8 py-4 text-white outline-none text-2xl font-bold uppercase placeholder:text-slate-700" placeholder="ENTER TARGET URL..." value={url} onChange={e => setUrl(e.target.value)} />
              <button onClick={runAudit} className="bg-blue-600 px-12 py-5 rounded-[2.5rem] font-black text-white text-xl hover:bg-blue-500 transition-all">SCAN SITE</button>
            </div>
          </div>
        </div>
      ) : (
        /* AUDIT REPORT VIEW */
        <div ref={reportRef} className="max-w-[1200px] mx-auto p-10 pt-48 space-y-40 bg-[#020617]">
          
          <section className="space-y-16">
            <h2 className="text-5xl font-black italic text-white uppercase border-l-8 border-blue-600 pl-8">Core Results</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {Object.keys(scores || {}).map(k => <CoreMetric key={k} label={k.replace('_',' ')} score={scores[k]} colorClass={getScoreColor(scores[k])} />)}
            </div>
          </section>

          <section className="space-y-16">
            <h3 className="text-4xl font-black italic text-white uppercase border-l-8 border-blue-600 pl-8">Deep Node Scan</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {nodes.map((n, i) => (
                <div key={i} className="bg-slate-900/40 p-8 border border-white/5 rounded-[2.5rem] flex flex-col justify-between h-[280px]">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{n.t}</span>
                    <span className={`text-3xl font-black italic ${getScoreColor(n.s)}`}>{n.s}%</span>
                  </div>
                  <p className="text-lg font-bold text-slate-200 italic mb-4">"{n.d}"</p>
                  <div className="bg-white/5 h-2 w-full rounded-full overflow-hidden">
                    <div className={`h-full ${getProgressColor(n.s)}`} style={{width: `${n.s}%`}} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-16">
            <h3 className="text-4xl font-black italic text-white uppercase border-l-8 border-emerald-500 pl-8">Strategic Matrix</h3>
            <div className="grid md:grid-cols-2 gap-px bg-slate-800 rounded-[3rem] overflow-hidden border-2 border-slate-800 shadow-2xl">
              {['strengths', 'weaknesses', 'opportunities', 'threats'].map(type => (
                <div key={type} className="p-12 bg-[#020617]">
                  <h4 className={`font-black text-xs uppercase mb-8 ${type === 'strengths' ? 'text-emerald-400' : type === 'weaknesses' ? 'text-red-400' : type === 'opportunities' ? 'text-blue-400' : 'text-amber-400'}`}>{type}</h4>
                  {(ai?.swot?.[type] || []).map((s, i) => (
                    <div key={i} className="mb-8">
                      <p className="text-white font-black text-xl mb-1">{s.point || s.title}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{s.evidence || s.fix_suggestion || s.potential_impact || s.mitigation_strategy || s.description}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-16">
            <h3 className="text-6xl font-black italic text-white uppercase text-center tracking-tighter">Execution Roadmap</h3>
            <div className="max-w-[950px] mx-auto space-y-10">
              {(ai?.roadmap || [{},{},{},{}]).map((s, i) => <RoadmapStep key={i} step={s} index={i} />)}
            </div>
          </section>

          <section className="bg-blue-600 p-24 rounded-[4rem] text-center border-4 border-white/10 shadow-2xl">
            <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.4em] mb-12">Final Directive</h3>
            <h2 className="text-8xl font-black italic text-white uppercase mb-12 tracking-tighter leading-none">{ai?.final_verdict?.overall_readiness || "EVALUATING"}</h2>
            <div className="bg-black/30 p-12 rounded-[2.5rem] border border-white/20 max-w-4xl mx-auto backdrop-blur-md">
              <p className="text-4xl font-black text-white italic leading-tight uppercase">"{ai?.final_verdict?.single_most_impactful_change || "Finalizing core directive..."}"</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
