import { useState, useEffect, useRef } from 'react'
import { 
  Code2, Play, GitGraph, Loader2, Zap, LayoutTemplate, 
  Clock, Database, Flame, Languages, Lightbulb, Maximize2, 
  X, Wand2, AlertTriangle, CheckCircle2, ArrowRight, 
  Github, BookOpen, Terminal, ChevronDown, Menu, Rabbit, Trash2, Mail, MessageSquare 
} from 'lucide-react'
import mermaid from 'mermaid'

// CONFIG
mermaid.initialize({ 
  startOnLoad: true, 
  theme: 'default', 
  securityLevel: 'loose', 
  suppressErrorRendering: true,
  flowchart: { curve: 'basis', padding: 20 },
})

const MenuItem = ({ icon: Icon, label, link, onClick, color }) => (
    <a href={link || '#'} target={link ? "_blank" : "_self"} rel="noopener noreferrer" onClick={onClick}
       style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', cursor: 'pointer', borderRadius: '6px', textDecoration: 'none', color: color || '#475569', transition: 'background 0.2s' }}
       onMouseOver={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1e293b'; }}
       onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = color || '#475569'; }}
    >
        <Icon size={18} /><span>{label}</span>
    </a>
);

function App() {
  const [inputCode, setInputCode] = useState('')
  const [diagramCode, setDiagramCode] = useState('')
  const [language, setLanguage] = useState('English') 
  const [analysis, setAnalysis] = useState({ time: '', space: '', roast: '', hint: '', fixedCode: '' }) 
  const [loading, setLoading] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [activeTab, setActiveTab] = useState('Flowchart'); 
  const [errorMsg, setErrorMsg] = useState(''); 
  const [showSuccess, setShowSuccess] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  const mermaidRef = useRef(null)
  const modalRef = useRef(null) 
  const workspaceRef = useRef(null) 

  // --- SAFE FLOWCHART ---
  const generateSafeFlowchart = (steps) => {
    if (!steps || !Array.isArray(steps)) return 'graph TD\nError["Analysis Failed"]';
    let chart = 'graph TD\n';
    if (steps.length > 0) { chart += `Start([Start]) --> ${steps[0].id}\n`; } 
    else { return 'graph TD\nStart([Start]) --> End([End])\n'; }

    steps.forEach((step, index) => {
      const cleanLabel = step.label ? step.label.replace(/["(){}<>]/g, "'") : "Step";
      let shapeNode = '';
      if (step.type === 'decision') { shapeNode = `${step.id}{"${cleanLabel}?"}`; } 
      else if (step.type === 'io') { shapeNode = `${step.id}[/"${cleanLabel}"/]`; } 
      else { shapeNode = `${step.id}["${cleanLabel}"]`; }

      if (index < steps.length - 1) { chart += `${shapeNode} --> ${steps[index + 1].id}\n`; } 
      else { chart += `${shapeNode} --> End([End])\n`; }
    });
    return chart;
  }

  // --- RENDER MERMAID ---
  const renderMermaid = async () => {
    if (diagramCode && (activeTab === 'Flowchart' || isFullScreen)) {
      try {
        await mermaid.parse(diagramCode);
        
        // 1. Render in Main Box
        if (mermaidRef.current) {
            mermaidRef.current.innerHTML = '';
            mermaidRef.current.removeAttribute('data-processed');
            mermaidRef.current.innerHTML = diagramCode;
            await mermaid.run({ nodes: [mermaidRef.current] }); 
        }
        
        // 2. Render in Modal
        if (isFullScreen && modalRef.current) {
            modalRef.current.innerHTML = '';
            modalRef.current.removeAttribute('data-processed');
            modalRef.current.innerHTML = diagramCode;
            await mermaid.run({ nodes: [modalRef.current] });
        }
        setErrorMsg('');
      } catch (e) {
        console.error("Mermaid Fail:", e);
        if(!diagramCode) setErrorMsg("⚠️ Logic too complex.");
      }
    }
  };

  useEffect(() => { 
      const timer = setTimeout(renderMermaid, 200);
      return () => clearTimeout(timer);
  }, [diagramCode, isFullScreen, activeTab]);

  // --- API CALL ---
  const handleVisualize = async (codeOverride = null, langOverride = null) => {
    const codeToUse = codeOverride !== null ? codeOverride : inputCode;
    const langToUse = langOverride !== null ? langOverride : language;

    if (!codeToUse.trim()) return alert("Please enter code!")
    
    setLoading(true);
    if (!codeOverride && !langOverride) setActiveTab('Flowchart'); 
    
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) { setLoading(false); return alert("Missing API Key!"); }

    // --- PROMPT ENGINEERING FOR BENGALI DADA ---
    let roastPrompt = `Funny roast in ${langToUse}`;
    if (langToUse === "Bengali") {
        roastPrompt = "Roast the user in 'Romanized Bengali' (Banglish) like a strict angry elder brother (Dada). Use words like 'Gadhah', 'Ki likhechish', 'Matha kharap', 'Chup kor'. Be funny but strict.";
    }

    const prompt = `
      Analyze code. Return JSON.
      STEPS: List for flowchart. Types: 'process', 'decision', 'io'.
      JSON: {
        "steps": [{"id": "s1", "type": "io", "label": "Read input"}, {"id": "s2", "type": "decision", "label": "n < 0?"}],
        "timeComplexity": "O(n)", "spaceComplexity": "O(1)",
        "roast": "${roastPrompt}",
        "hint": "Fix hint", "fixedCode": "Better code"
      }
      CODE: ${codeToUse}
    `

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.1, response_format: { type: "json_object" }})
      });
      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      const safeGraph = generateSafeFlowchart(content.steps);
      
      setDiagramCode(safeGraph);
      setAnalysis({ time: content.timeComplexity, space: content.spaceComplexity, roast: content.roast, hint: content.hint, fixedCode: content.fixedCode || codeToUse });
      
    } catch (e) { console.error(e); setErrorMsg("API Error."); } 
    finally { setLoading(false); }
  }

  // --- AUTO FIX (With Button State) ---
  const applyFix = () => {
    if (analysis.fixedCode) {
        const fixed = analysis.fixedCode;
        setInputCode(fixed);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000); // 3 Seconds "Fixed" state
        
        // 1. Force Switch to Flowchart Tab
        setActiveTab('Flowchart'); 
        
        // 2. Trigger Analysis for New Code
        handleVisualize(fixed, language); 
    }
  }

  const handleLanguageChange = (e) => {
      const newLang = e.target.value;
      setLanguage(newLang);
      if (inputCode.trim() && !loading) handleVisualize(inputCode, newLang);
  }

  const handleFeedback = () => {
      if (!feedback.trim()) return;
      window.location.href = `mailto:kmeghasar@gmail.com?subject=LogicLens Feedback&body=${encodeURIComponent(feedback)}`;
      setFeedback('');
      alert("Opening email client...");
  }

  const scrollToWork = () => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  const handleReset = () => { setInputCode(''); setDiagramCode(''); setAnalysis({ time: '', space: '', roast: '', hint: '', fixedCode: '' }); setIsMenuOpen(false); }

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', color: '#0f172a' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', position: 'fixed', top: 0, width: '100%', zIndex: 100, borderBottom: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '1.2rem', color: '#0f172a' }}>
          <div style={{background:'#0f172a', padding:'6px', borderRadius:'6px', display:'flex'}}><Zap size={18} color="white"/></div> LogicLens
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        {isMenuOpen && (
            <div style={{ position: 'absolute', top: '70px', right: '20px', width: '250px', padding: '15px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>Checklist</div>
                <MenuItem icon={Github} label="GitHub Repo" link="https://github.com/ghosthouse7/logic-lens" color="#0f172a" />
                <MenuItem icon={BookOpen} label="Documentation" link="https://github.com/ghosthouse7/logic-lens/blob/main/README.md" />
                <MenuItem icon={Rabbit} label="CodeRabbit Review" link="https://coderabbit.ai/" />
                <div style={{ borderTop: '1px solid #f1f5f9', margin: '10px 0' }}></div>
                <MenuItem icon={Trash2} label="Reset Workspace" onClick={handleReset} color="#ef4444" />
            </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section style={{ paddingTop: '140px', paddingBottom: '80px', paddingLeft:'20px', paddingRight:'20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '20px', padding: '6px 16px', background: '#eff6ff', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '600', color: '#2563eb', border: '1px solid #dbeafe' }}>🚀 Powered by Groq Llama 3 & Vercel</div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', lineHeight: '1.1', color: '#0f172a', marginBottom: '20px', letterSpacing: '-1px' }}>Decode your logic. <br/> <span style={{ color: '#3b82f6' }}>Optimize your impact.</span></h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '600px', lineHeight: '1.6', marginBottom: '40px', fontStyle: 'italic' }}>"Programming isn't about what you know; it's about what you can figure out. Let LogicLens figure it out for you."</p>
        <button onClick={scrollToWork} className="btn-primary" style={{ padding: '16px 40px', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a', color: 'white', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.39)' }}>Start Analyzing <ArrowRight size={20} /></button>
        <div style={{ marginTop: '60px', animation: 'bounce 2s infinite' }}><ChevronDown color="#94a3b8" /></div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div className="service-card" style={{ padding: '30px', borderRadius: '16px', background:'white', border:'1px solid #e2e8f0' }}><div style={{ background: '#eff6ff', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#2563eb' }}><GitGraph size={24} /></div><h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', color: '#1e293b' }}>Visual Flowcharts</h3><p style={{ color: '#64748b', fontSize: '0.95rem' }}>Convert spaghetti code into professional Mermaid.js diagrams instantly.</p></div>
          <div className="service-card" style={{ padding: '30px', borderRadius: '16px', background:'white', border:'1px solid #e2e8f0' }}><div style={{ background: '#fffbeb', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#d97706' }}><Wand2 size={24} /></div><h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', color: '#1e293b' }}>O(n) Auto-Fix</h3><p style={{ color: '#64748b', fontSize: '0.95rem' }}>AI Agent detects inefficient loops and refactors them to O(n) or O(log n).</p></div>
          <div className="service-card" style={{ padding: '30px', borderRadius: '16px', background:'white', border:'1px solid #e2e8f0' }}><div style={{ background: '#fef2f2', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#dc2626' }}><Flame size={24} /></div><h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', color: '#1e293b' }}>Code Roast</h3><p style={{ color: '#64748b', fontSize: '0.95rem' }}>Get brutal, witty feedback in Hindi, Bengali or GenZ slang.</p></div>
        </div>
      </section>

      {/* WORKSPACE */}
      <section ref={workspaceRef} style={{ padding: '60px 20px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div><h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>Workspace</h2><p style={{ color: '#64748b' }}>Paste your code below to begin analysis.</p></div>
            
            {/* LANGUAGE SELECTOR */}
            <select value={language} onChange={handleLanguageChange} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontWeight: '600', color: '#334155' }}>
              <option value="English">English</option>
              <option value="Bengali">Bengali (Strict Dada)</option>
              <option value="Hindi">Hindi (Roaster)</option>
              <option value="GenZ Slang">GenZ Slang</option>
              <option value="Pirate">Pirate Speak</option>
              <option value="Shakespearean">Shakespearean</option>
              <option value="Japanese">Japanese (Anime)</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '350px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center', color: '#64748b', fontWeight: '600', fontSize: '0.9rem', background: '#f1f5f9' }}><Code2 size={16}/> Source Code</div>
              <textarea value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="// Paste your recursive mess here..." style={{ flex: 1, padding: '20px', border: 'none', resize: 'none', outline: 'none', background: 'transparent', fontFamily: 'monospace', fontSize: '14px' }} />
              <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                <button onClick={() => handleVisualize(null, null)} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px', background: loading ? '#94a3b8' : '#0f172a', color: 'white' }}>{loading ? <Loader2 className="animate-spin" /> : <Play size={18} />} {loading ? "Analyzing..." : "Run Analysis"}</button>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '350px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden', height: '600px', display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                 {['Flowchart', 'Analysis', 'Roast'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '15px', background: activeTab === tab ? 'white' : '#f8fafc', border: 'none', borderBottom: activeTab === tab ? '2px solid #0f172a' : 'none', fontWeight: '600', color: activeTab === tab ? '#0f172a' : '#94a3b8', cursor: 'pointer' }}>{tab}</button>))}
               </div>
               
               <div style={{ flex: 1, padding: '20px', overflow: 'auto', background: '#ffffff', position: 'relative' }}>
                 {activeTab === 'Flowchart' && (
                   <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {diagramCode ? 
                        <div key={diagramCode} className="mermaid" onClick={() => setIsFullScreen(true)} style={{cursor: 'zoom-in', width:'100%'}} ref={mermaidRef}></div> 
                        : <div style={{textAlign:'center', color:'#94a3b8'}}><LayoutTemplate size={40} style={{opacity:0.3, margin:'0 auto 10px'}}/><p>Visualization awaits...</p></div>}
                   </div>
                 )}
                 {activeTab === 'Analysis' && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}><div style={{fontWeight:'600', color:'#2563eb', fontSize:'0.9rem', marginBottom:'5px'}}>Time</div><div style={{fontSize:'1.5rem', fontWeight:'700', color:'#1e3a8a'}}>{analysis.time || "-"}</div></div>
                        <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}><div style={{fontWeight:'600', color:'#16a34a', fontSize:'0.9rem', marginBottom:'5px'}}>Space</div><div style={{fontSize:'1.5rem', fontWeight:'700', color:'#14532d'}}>{analysis.space || "-"}</div></div>
                      </div>
                      {analysis.fixedCode && (
                        <div style={{ padding: '20px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{fontWeight:'700', color:'#b45309'}}>Suggestion</span>
                          
                          {/* SMART BUTTON - CHANGES ON CLICK */}
                          <button 
                            onClick={applyFix} 
                            disabled={showSuccess}
                            style={{background: showSuccess ? '#16a34a' : '#d97706', color:'white', border:'none', padding:'5px 12px', borderRadius:'6px', cursor: showSuccess ? 'default' : 'pointer', fontSize:'0.8rem', fontWeight:'600', transition:'all 0.3s', display:'flex', alignItems:'center', gap:'5px'}}
                          >
                             {showSuccess ? <CheckCircle2 size={14}/> : <Wand2 size={14}/>} 
                             {showSuccess ? "Fixed!" : "Auto-Fix"}
                          </button>

                          </div>
                          <p style={{ color: '#92400e', fontSize: '0.95rem' }}>{analysis.hint}</p>
                        </div>
                      )}
                   </div>
                 )}
                 {activeTab === 'Roast' && (
                   <div style={{ padding: '30px', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fecaca', textAlign: 'center' }}>
                     <Flame size={32} color="#dc2626" style={{ margin: '0 auto 15px' }} />
                     <p style={{ color: '#991b1b', fontStyle: 'italic', fontSize: '1.1rem' }}>"{analysis.roast || "Select a language and run analysis..."}"</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEEDBACK & FOOTER */}
      <section style={{ padding: '60px 20px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
           <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px', color: '#0f172a' }}>Feedback?</h3>
           <p style={{ color: '#64748b', marginBottom: '20px' }}>Help us make LogicLens smarter. Drop a suggestion!</p>
           <div style={{ display: 'flex', gap: '10px' }}>
             <input type="text" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Your feedback..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
             <button style={{ padding: '12px 24px', background: '#0f172a', color: 'white', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }} onClick={handleFeedback}>Send</button>
           </div>
        </div>
      </section>

      <footer style={{ padding: '30px', background: 'white', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}><p style={{ color: '#64748b', fontSize: '0.9rem' }}>© 2025 LogicLens. Built for WeMakeDevs Hackathon.</p></footer>

      {/* MODAL FIX */}
      {isFullScreen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 5000, display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a' }}>Logic Flowchart</span>
              <button onClick={() => setIsFullScreen(false)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close X</button>
           </div>
           <div style={{ flex: 1, overflow: 'auto', padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: 'white' }}>
              <div ref={modalRef} className="mermaid" style={{ minWidth: '100%' }}></div>
           </div>
        </div>
      )}
    </div>
  )
}

export default App