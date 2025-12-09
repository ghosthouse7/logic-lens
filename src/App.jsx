import { useState, useEffect } from 'react'
import { Code2, Play, GitGraph, Loader2, Zap, LayoutTemplate, Clock, Database, Flame, Languages, Lightbulb, Maximize2, X } from 'lucide-react'
import mermaid from 'mermaid'

mermaid.initialize({ 
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
})

function App() {
  const [inputCode, setInputCode] = useState('')
  const [diagramCode, setDiagramCode] = useState('')
  const [language, setLanguage] = useState('English') 
  const [analysis, setAnalysis] = useState({ time: '', space: '', roast: '', hint: '' }) 
  const [loading, setLoading] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    if (diagramCode) {
      setTimeout(() => {
        mermaid.contentLoaded()
      }, 100)
    }
  }, [diagramCode, isFullScreen])

  const handleVisualize = async () => {
    if (!inputCode) return alert("Please enter some code first!")
    
    setLoading(true)
    setDiagramCode('') 
    setAnalysis({ time: '', space: '', roast: '', hint: '' })

    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) return alert("API Key missing! Check .env file")

    // DYNAMIC PROMPT GENERATION (Fixes the confusion)
    let roastInstruction = `A short, sarcastic, funny roast about the code quality in ${language}.`
    
    if (language.includes("Bengali") || language.includes("Hindi")) {
      roastInstruction += " IMPORTANT: Output in 'ROMANIZED' English text (e.g. 'Tor matha kharap'). Do NOT use native script."
    } else if (language === "Shakespearean") {
      roastInstruction += " Use Old English style (Thou, art, doth, verily, zounds). Be dramatic."
    } else if (language === "Pirate") {
      roastInstruction += " Use Pirate slang (Ahoy, matey, walk the plank). Be aggressive."
    } else if (language === "GenZ Slang") {
      roastInstruction += " Use GenZ brainrot slang (fr, no cap, skibidi, cringe, L code). Be trendy."
    }

    const prompt = `
      You are a Senior Software Architect and a strict mentor.
      Analyze the user's code. Return a JSON object with 5 fields:
      1. "graph": Mermaid.js code (start with "graph TD").
      2. "timeComplexity": The Big O time complexity (e.g., "O(n)").
      3. "spaceComplexity": The Big O space complexity (e.g., "O(1)").
      4. "roast": ${roastInstruction}
      5. "hint": A specific, technical suggestion to OPTIMIZE the code. Keep this helpful and serious in English.

      RULES:
      - Return ONLY raw JSON. No markdown.
      - Diagram nodes must be short.
      
      USER CODE:
      ${inputCode}
    `

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", 
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2, 
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json()
      const content = JSON.parse(data.choices[0].message.content)

      setDiagramCode(content.graph)
      setAnalysis({
        time: content.timeComplexity,
        space: content.spaceComplexity,
        roast: content.roast,
        hint: content.hint 
      })

    } catch (error) {
      console.error("Error:", error)
      alert(`Failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <header className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 30px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '12px' }}>
            <GitGraph color="#38bdf8" size={32} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#f8fafc', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Logic<span style={{ color: '#38bdf8' }}>Lens</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={14} color="#eab308" fill="#eab308" /> AI-Powered Code Mentor
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT: CODE INPUT */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', borderRadius: '16px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#38bdf8' }}>
              <Code2 size={20} /> Source Code
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Languages size={16} color="#94a3b8"/>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  background: '#0f172a', color: '#f8fafc', border: '1px solid #334155',
                  borderRadius: '6px', padding: '4px 8px', outline: 'none', fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                <option value="English">English</option>
                <option value="Bengali">Bengali (Strict Dada)</option>
                <option value="Hindi">Hindi (Roaster)</option>
                <option value="Shakespearean">Shakespearean</option>
                <option value="Pirate">Pirate Speak</option>
                <option value="GenZ Slang">GenZ Slang</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
          </div>
          
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="// Paste your code here..."
            style={{
              flex: 1, backgroundColor: '#0f172a', color: '#f1f5f9',
              border: '1px solid #334155', borderRadius: '12px', padding: '20px',
              fontFamily: "'Fira Code', monospace", fontSize: '14px', resize: 'none', outline: 'none'
            }}
          />
          
          <button 
            onClick={handleVisualize}
            disabled={loading}
            className="glow-button"
            style={{
              backgroundColor: loading ? '#334155' : '#38bdf8',
              color: loading ? '#94a3b8' : '#0f172a',
              border: 'none', padding: '16px', borderRadius: '12px',
              fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
            }}>
            {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" size={20} />} 
            {loading ? "Analyze Logic..." : "Visualize & Optimize"}
          </button>
        </div>

        {/* RIGHT: OUTPUTS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* FLOWCHART (Top Half) */}
          <div className="glass-card" style={{ flex: 3, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#10b981' }}>
                 <LayoutTemplate size={20} /> Flowchart
               </span>
               {/* ZOOM BUTTON */}
               {diagramCode && (
                 <button 
                   onClick={() => setIsFullScreen(true)}
                   style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                   title="View Full Screen"
                 >
                   <Maximize2 size={18} /> <span style={{fontSize: '0.8rem'}}>Expand</span>
                 </button>
               )}
             </div>
             
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', overflow: 'auto', background: '#0f172a', borderRadius: '12px' }}>
               {diagramCode ? (
                 <div className="mermaid" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', padding: '20px' }}>{diagramCode}</div>
               ) : (
                 <p style={{ opacity: 0.5 }}>Waiting for code...</p>
               )}
             </div>
          </div>

          {/* METRICS ROW */}
          <div style={{ display: 'flex', gap: '15px' }}>
             <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Clock size={18} color="#60a5fa" />
                <span style={{ fontWeight: 'bold', color: '#93c5fd' }}>{analysis.time || "-"}</span>
             </div>
             <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Database size={18} color="#34d399" />
                <span style={{ fontWeight: 'bold', color: '#6ee7b7' }}>{analysis.space || "-"}</span>
             </div>
          </div>

          {/* ROAST & HINT AREA (Bottom Half) */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* HINT CARD */}
            <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', color: '#facc15' }}>
                 <Lightbulb size={18} />
                 <span style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>Optimization Tip</span>
               </div>
               <p style={{ margin: 0, fontSize: '0.9rem', color: '#fef08a' }}>{analysis.hint || "Run code to get optimization tips..."}</p>
            </div>

            {/* ROAST CARD */}
            <div className="glass-card" style={{ flex: 1, borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', color: '#f87171' }}>
                 <Flame size={18} />
                 <span style={{ fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>AI Roast ({language})</span>
               </div>
               <p style={{ margin: 0, fontSize: '0.9rem', color: '#fca5a5', fontStyle: 'italic' }}>
                 {analysis.roast ? `"${analysis.roast}"` : "Waiting to roast..."}
               </p>
            </div>
          </div>

        </div>
      </div>

      {/* FULL SCREEN MODAL */}
      {isFullScreen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 100,
          display: 'flex', flexDirection: 'column', padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <button 
              onClick={() => setIsFullScreen(false)}
              style={{ background: '#334155', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', background: '#0f172a', borderRadius: '16px', border: '1px solid #334155' }}>
             <div className="mermaid" style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
               {diagramCode}
             </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App