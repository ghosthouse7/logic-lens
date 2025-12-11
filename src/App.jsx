import { useState, useEffect, useRef } from 'react'
// FIXED IMPORTS: Added BookOpen, Rabbit, Trash2
import { Code2, Play, GitGraph, Loader2, Zap, LayoutTemplate, Clock, Database, Flame, Languages, Lightbulb, Maximize2, X, Wand2, AlertTriangle, CheckCircle2, Menu, Github, BookOpen, Rabbit, Trash2 } from 'lucide-react'
import mermaid from 'mermaid'

// CONFIG
mermaid.initialize({ 
  startOnLoad: true,
  theme: 'base',
  securityLevel: 'loose',
  suppressErrorRendering: true, 
  flowchart: { curve: 'basis', padding: 20 },
  themeVariables: {
    primaryColor: '#1e293b',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#38bdf8',
    lineColor: '#94a3b8',
    secondaryColor: '#0f172a',
    tertiaryColor: '#1e1b4b'
  }
})

// HELPER COMPONENTS
const MenuItem = ({ icon: Icon, label, link, onClick, color }) => (
    <a 
        className="menu-item"
        href={link || '#'}
        target={link ? "_blank" : "_self"}
        rel="noopener noreferrer"
        onClick={onClick}
        style={{ color: color || '#94a3b8', textDecoration: 'none' }} 
    >
        <Icon size={18} />
        <span>{label}</span>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [appState, setAppState] = useState('WELCOME'); 
  const [showSuccess, setShowSuccess] = useState(false) 
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const mermaidRef = useRef(null)
  const modalRef = useRef(null) 

  // --- LOGIC FUNCTIONS ---
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

  const renderMermaid = async () => {
    if (diagramCode) {
      try {
        await mermaid.parse(diagramCode);
        
        if (mermaidRef.current) {
            mermaidRef.current.removeAttribute('data-processed');
            mermaidRef.current.innerHTML = diagramCode; 
            await mermaid.run({ nodes: [mermaidRef.current] }); 
        }
        if (isFullScreen && modalRef.current) {
            modalRef.current.removeAttribute('data-processed');
            modalRef.current.innerHTML = diagramCode;
            await mermaid.run({ nodes: [modalRef.current] });
        }
        setErrorMsg('');
      } catch (e) {
        console.error("Mermaid Render Fail:", e);
        setErrorMsg("⚠️ Diagram Logic too complex to visualize. Check Analysis below.");
      }
    }
  };

  useEffect(() => { setTimeout(renderMermaid, 200); }, [diagramCode, isFullScreen]);

  const handleVisualize = async (codeToUse = inputCode, langToUse = language) => {
    if (!codeToUse.trim()) return alert("Please enter some code first!")
    
    setLoading(true);
    setActiveTab('Flowchart'); 
    
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) { setLoading(false); return alert("Missing API Key! Check .env file"); }

    let roastInstruction = `A funny roast in ${langToUse}.`
    if (langToUse !== "English") { roastInstruction += " CRITICAL: Output in ROMANIZED English alphabets only. NO NATIVE SCRIPTS." }

    const prompt = `
      You are an elite AI. Analyze the code. Return a strictly valid JSON.
      
      INSTEAD OF GRAPH CODE, RETURN A LIST OF STEPS.
      "steps": [ {"id": "s1", "type": "io", "label": "Read input"}, {"id": "s2", "type": "decision", "label": "Is n < 0"} ]
      
      JSON OUTPUT FORMAT:
      {
        "steps": [],
        "timeComplexity": "Big O",
        "spaceComplexity": "Big O",
        "roast": "${roastInstruction}",
        "hint": "Optimization tip",
        "fixedCode": "Refactored optimized code. IF CODE IS ALREADY GOOD, RETURN THE ORIGINAL CODE. DO NOT RETURN NULL."
      }
      USER CODE: ${codeToUse}
    `

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.1, response_format: { type: "json_object" }})
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const content = JSON.parse(data.choices[0].message.content)
      const safeGraph = generateSafeFlowchart(content.steps);

      setDiagramCode(safeGraph)
      setAnalysis({ time: content.timeComplexity, space: content.spaceComplexity, roast: content.roast, hint: content.hint, fixedCode: content.fixedCode || codeToUse })

      try { await mermaid.parse(safeGraph); setErrorMsg(''); } 
      catch { setErrorMsg("⚠️ Diagram Logic too complex to visualize. Check Analysis below."); }

    } catch (error) {
      console.error("API Error:", error)
      setErrorMsg(`Agent Disconnected: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    if (inputCode && !loading) { handleVisualize(inputCode, language); }
  }, [language]);

  const applyFix = () => {
    if (analysis.fixedCode && analysis.fixedCode !== "null") {
      const newCode = analysis.fixedCode;
      setInputCode(newCode); 
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setAnalysis(prev => ({ ...prev, fixedCode: null })); 
      handleVisualize(newCode, language); 
    } else { alert("Code is already optimal!"); }
  }

  const handleReset = () => {
    setInputCode(''); setDiagramCode('');
    setAnalysis({ time: '', space: '', roast: '', hint: '', fixedCode: '' });
    setIsMenuOpen(false);
  }
  
  const TabButton = ({ tabName }) => (
    <button onClick={() => setActiveTab(tabName)} style={{ padding: '10px 15px', fontWeight: 'bold', fontSize: '0.9rem', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', background: activeTab === tabName ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)', color: activeTab === tabName ? '#0f172a' : '#f8fafc', transition: 'all 0.2s', boxShadow: activeTab === tabName ? '0 -4px 10px rgba(56, 189, 248, 0.4)' : 'none', }}>
      {tabName}
    </button>
  );

  const successShowCheck = () => {
    return showSuccess ? <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#fff', fontWeight:'bold'}}><CheckCircle2 size={16}/> Code Updated!</span> : null;
  }

  // RENDER CONTENT
  const renderContent = () => {
    switch (activeTab) {
        case 'Flowchart': return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
              <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}><Clock size={18} color="#60a5fa" /><span style={{ fontWeight: 'bold', color: '#93c5fd' }}>Time: {analysis.time || "-"}</span></div>
              <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}><Database size={18} color="#34d399" /><span style={{ fontWeight: 'bold', color: '#6ee7b7' }}>Space: {analysis.space || "-"}</span></div>
            </div>
            <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#10b981' }}><LayoutTemplate size={20} /> Logic Flowchart</span>
                {diagramCode && !errorMsg && (<button onClick={() => setIsFullScreen(true)} style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Maximize2 size={18} /> <span style={{fontSize: '0.8rem'}}>Expand</span></button>)}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', background: '#020617', borderRadius: '12px', border: '1px solid #1e293b', padding: '20px' }}>
                {errorMsg ? (<div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}><AlertTriangle size={48} style={{ margin: '0 auto 10px', display: 'block' }} /><p style={{ fontWeight: 'bold' }}>{errorMsg}</p><button onClick={() => handleVisualize(inputCode, language)} style={{marginTop:'10px', padding:'5px 10px', background:'#334155', border:'none', color:'white', borderRadius:'5px', cursor:'pointer'}}>Retry</button></div>) : (<div ref={mermaidRef} className="mermaid" style={{ width: '100%' }}></div>)}
                {!diagramCode && !errorMsg && !loading && (<div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity: 0.5 }}><Zap size={48} style={{ marginBottom:'10px', color:'#334155' }} /><p>Awaiting Code Input...</p></div>)}
              </div>
            </div>
          </div>
        );
        case 'Analysis': return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
               <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}><Clock size={18} color="#60a5fa" /><span style={{ fontWeight: 'bold', color: '#60a5fa' }}>Time Complexity</span></div>
               <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}><Database size={18} color="#34d399" /><span style={{ fontWeight: 'bold', color: '#34d399' }}>Space Complexity</span></div>
            </div>
            <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#facc15' }}><Lightbulb size={18} /><span style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>Agent Suggestion</span></div>
                 {analysis.fixedCode && analysis.fixedCode !== "null" && (<button onClick={applyFix} style={{ background: '#eab308', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 0 20px rgba(234, 179, 8, 0.4)' }}><Wand2 size={12} /> Auto-Fix Code</button>)}
               </div>
               <p style={{ margin: 0, fontSize: '0.9rem', color: '#fef08a' }}>{successShowCheck() || (analysis.hint || "Run code to get optimization tips...")}</p>
            </div>
            <div style={{ flex: 1, minHeight: '100px'}}></div>
          </div>
        );
        case 'Roast': return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '20px' }}>
            <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', color: '#f87171' }}><Flame size={18} /><span style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>AI Roast ({language})</span></div>
               <p style={{ margin: 0, fontSize: '0.9rem', color: '#fca5a5', fontStyle: 'italic' }}>{analysis.roast ? `"${analysis.roast}"` : "Waiting to roast..."}</p>
            </div>
            <div style={{ flex: 1, minHeight: '200px'}}></div>
          </div>
        );
        default: return null;
    }
  };

  if (appState === 'WELCOME') return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '40px', textAlign: 'center', background: '#020617' }}>
          <h1 style={{ fontSize: '3rem', color: '#38bdf8', textShadow: '0 0 20px rgba(56,189,248,0.7)', fontWeight: '800' }}>LogicLens</h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginTop: '10px', marginBottom: '30px' }}>Your AI-Powered Code Visualizer, Mentor, and Roaster.</p>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '15px', borderRadius: '12px', width: '200px' }}><GitGraph color="#38bdf8" size={32} /><p style={{ marginTop: '10px', fontWeight: 'bold' }}>Visual Flowcharting</p></div>
              <div style={{ background: 'rgba(234, 179, 8, 0.2)', padding: '15px', borderRadius: '12px', width: '200px' }}><Wand2 color="#facc15" size={32} /><p style={{ marginTop: '10px', fontWeight: 'bold' }}>O(n²) Auto-Fixing</p></div>
          </div>
          <button onClick={() => setAppState('MAIN')} style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', color: '#0f172a', padding: '15px 40px', borderRadius: '12px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', border: 'none', boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)' }}>START ANALYSIS 🚀</button>
          <p style={{ marginTop: '30px', color: '#475569', fontSize: '0.8rem' }}>Built with Groq AI, Vercel, and CodeRabbit.</p>
      </div>
  );
  
  return (
    <div style={{ minWidth: '320px', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <header className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 30px', borderRadius: '16px', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '10px', borderRadius: '12px', boxShadow: '0 0 10px rgba(56,189,248,0.3)' }}><GitGraph color="#38bdf8" size={32} /></div>
          <div><h1 style={{ margin: 0, fontSize: '1.8rem', color: '#f8fafc', fontWeight: '800', letterSpacing: '-1px', textShadow: '0 0 20px rgba(56,189,248,0.5)' }}>Logic<span style={{ color: '#38bdf8' }}>Lens</span></h1><p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}><Zap size={12} color="#eab308" /> AI-Powered Agent</p></div>
        </div>
        
        {/* HAMBURGER MENU ICON */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '50%', transition: 'background 0.2s', backgroundColor: isMenuOpen ? 'rgba(56, 189, 248, 0.3)' : 'transparent', zIndex: 1001 }}><Menu size={28} color="#38bdf8" /></button>

        {/* SOLID MENU BOX */}
        {isMenuOpen && (
            <div style={{
                position: 'absolute', top: '100%', right: '20px', zIndex: 1000, 
                width: '250px', padding: '10px', marginTop: '10px', borderRadius: '12px',
                background: '#0f172a', // SOLID COLOR
                border: '1px solid #334155', boxShadow: '0 10px 20px rgba(0,0,0,0.8)'
            }}>
                <div style={{ color: '#f8fafc', padding: '5px 0', borderBottom: '1px solid #334155', marginBottom: '5px', fontWeight: 'bold' }}>Submission Links</div>
                <MenuItem icon={Github} label="GitHub Repo" link="https://github.com/ghosthouse7/logic-lens" color="#f87171" />
                <MenuItem icon={BookOpen} label="Documentation (README)" link="https://github.com/ghosthouse7/logic-lens/blob/main/README.md" />
                <MenuItem icon={Rabbit} label="CodeRabbit Review" link="https://coderabbit.ai/" />
                <div style={{ borderTop: '1px solid #334155', margin: '5px 0' }}></div>
                <MenuItem icon={Trash2} label="Reset App" onClick={handleReset} color="#facc15" />
                <MenuItem icon={X} label="Close" onClick={() => setIsMenuOpen(false)} />
            </div>
        )}
      </header>
      
      {/* Menu CSS */}
      <style>{` .menu-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; cursor: pointer; transition: background 0.2s; border-radius: 6px; color: #94a3b8; text-decoration: none; } .menu-item:hover { background: rgba(56, 189, 248, 0.1); color: #f8fafc; } `}</style>
      
      {/* MAIN AREA */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#38bdf8' }}><Code2 size={20} /> Input Code</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Languages size={16} color="#94a3b8"/>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', outline: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                <option value="English">English</option><option value="Bengali">Bengali (Strict Dada)</option><option value="Hindi">Hindi (Roaster)</option><option value="GenZ Slang">GenZ Slang</option><option value="Pirate">Pirate Speak</option><option value="Shakespearean">Shakespearean</option><option value="Chinese">Chinese (Sarcastic)</option><option value="Japanese">Japanese (Anime)</option><option value="Spanish">Spanish</option><option value="French">French</option>
              </select>
            </div>
          </div>
          <textarea value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="// Paste your code here..." style={{ flex: 1, backgroundColor: '#020617', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px', padding: '20px', fontFamily: "'Fira Code', monospace", fontSize: '14px', resize: 'none', outline: 'none', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }} />
          <button onClick={() => handleVisualize(inputCode, language)} disabled={loading} style={{ background: loading ? '#334155' : 'linear-gradient(90deg, #38bdf8, #818cf8)', color: loading ? '#94a3b8' : '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: loading ? 'none' : '0 0 20px rgba(56, 189, 248, 0.4)', transition: 'transform 0.2s' }}>{loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" size={20} />} {loading ? "Agent is Thinking..." : "Visualize & Analyze"}</button>
        </div>

        {/* RIGHT */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0px', borderRadius: '16px', padding: '0px' }}>
           <div style={{ display: 'flex', borderBottom: '1px solid #334155', padding: '10px 20px 0 20px', gap: '5px' }}>
             <TabButton tabName="Flowchart" /><TabButton tabName="Analysis" /><TabButton tabName="Roast" />
           </div>
           <div style={{ flex: 1, padding: '15px 20px 20px 20px', overflow: 'auto' }}>
             {renderContent()}
           </div>
        </div>
      </div>

      {/* MODAL */}
      {isFullScreen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}><button onClick={() => setIsFullScreen(false)} style={{ background: '#334155', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X size={24} /></button></div>
          <div style={{ flex: 1, overflow: 'auto', background: '#020617', borderRadius: '16px', border: '1px solid #334155', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'40px' }}><div ref={modalRef} className="mermaid" style={{ width: '100%' }}></div></div>
        </div>
      )}
    </div>
  )
}

export default App