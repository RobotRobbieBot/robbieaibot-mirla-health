import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Brain, AlertTriangle, Send, RefreshCw, ChevronDown, ChevronUp, FlaskConical, BookOpen, MessageCircle, Loader, FileText, Printer, ExternalLink, Plus } from 'lucide-react';
import API from '../api';

const card = {
  background: 'linear-gradient(135deg,rgba(255,255,255,.6) 0%,rgba(254,252,232,.4) 100%)',
  borderRadius: '1.5rem', padding: '1.75rem', border: '1px solid #fde68a', marginBottom: '1.25rem'
};

const FLAG_COLOURS = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-500' },
  HIGH:     { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-400' },
  MODERATE: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-400' },
};

// Render markdown-like text simply
function ReportText({ text }) {
  if (!text) return null;
  return (
    <div className="space-y-3 text-amber-900 font-light leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith('# '))  return <h2 key={i} className="text-xl font-semibold text-amber-900 mt-4">{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-medium text-amber-800 mt-3">{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="font-medium text-amber-800 mt-2">{line.slice(4)}</h4>;
        if (line.match(/^[1-9]\d?\./)) return <p key={i} className="ml-2">{line}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} className="ml-4 flex gap-2"><span className="text-amber-400 mt-1">•</span><span>{line.slice(2)}</span></p>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold">{line.slice(2,-2)}</p>;
        // inline bold
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </p>
        );
      })}
    </div>
  );
}

export default function MedicalAgent() {
  const [report, setReport]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState('');
  const [error, setError]             = useState('');
  const [showReport, setShowReport]   = useState(true);
  const [chatInput, setChatInput]     = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => { loadLatest(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  async function loadLatest() {
    try {
      const r = await axios.get(`${API}/api/analysis/latest`);
      if (r.data) {
        setReport(r.data);
        setChatHistory(r.data.chatHistory || []);
      }
    } catch {}
  }

  async function runAnalysis() {
    setLoading(true);
    setError('');
    const msgs = ['Gathering lab results...', 'Searching PubMed for latest research...', 'Checking open clinical trials...', 'Running Claude analysis...', 'Almost done...'];
    let i = 0;
    setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); setLoadingMsg(msgs[i]); }, 4000);
    try {
      const r = await axios.post(`${API}/api/analysis/run`);
      setReport(r.data);
      setChatHistory([]);
      setShowReport(true);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingMsg('');
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || !report?.id) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatHistory(h => [...h, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const r = await axios.post(`${API}/api/analysis/chat/${report.id}`, { message: msg });
      setChatHistory(h => [...h, { role: 'assistant', content: r.data.reply }]);
    } catch (e) {
      setChatHistory(h => [...h, { role: 'assistant', content: '⚠️ Error: ' + (e.response?.data?.error || e.message) }]);
    } finally {
      setChatLoading(false);
    }
  }

  const flags = report?.criticalFlags || [];
  const criticals = flags.filter(f => f.level === 'CRITICAL');
  const highs     = flags.filter(f => f.level === 'HIGH');
  const moderates = flags.filter(f => f.level === 'MODERATE');

  return (
    <div className="space-y-5">

      {/* Header */}
      <div style={card}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-light text-amber-900 mb-1 flex items-center gap-3">
              <Brain className="text-amber-500" size={32} /> Medical Intelligence Agent
            </h2>
            <p className="text-amber-600 font-light text-sm">
              Analyses Mirla's labs using live PubMed research, clinical trials, and AI — covering SSc, fibromyalgia, Hashimoto's, migraines and Raynaud's.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-medium transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {loading ? loadingMsg : (report ? 'Run New Analysis' : 'Run First Analysis')}
          </button>
        </div>
        {error && <p className="mt-3 text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}
        {!report && !loading && (
          <p className="mt-4 text-amber-500 text-sm italic">No analysis yet. Upload lab PDFs then click "Run First Analysis".</p>
        )}
      </div>

      {/* Critical flags */}
      {flags.length > 0 && (
        <div className="space-y-2">
          {[...criticals, ...highs, ...moderates].map((f, i) => {
            const c = FLAG_COLOURS[f.level] || FLAG_COLOURS.MODERATE;
            return (
              <div key={i} className={`rounded-2xl p-4 border ${c.bg} ${c.border} flex gap-3 items-start`}>
                <AlertTriangle className={c.text} size={20} />
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white mr-2 ${c.badge}`}>{f.level}</span>
                  <span className={`text-sm font-medium ${c.text}`}>{f.test}: </span>
                  <span className={`text-sm ${c.text}`}>{f.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report */}
      {report?.report_text && (
        <div style={card}>
          <button
            onClick={() => setShowReport(v => !v)}
            className="w-full flex items-center justify-between text-amber-900 font-medium mb-3"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={18} className="text-amber-500" />
              Full Analysis Report
              <span className="text-xs text-amber-500 font-light">
                {report.created_at ? new Date(report.created_at).toLocaleString() : ''}
              </span>
            </span>
            {showReport ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showReport && (
            <div className="mt-2 max-h-[600px] overflow-y-auto pr-2">
              <ReportText text={report.report_text} />
            </div>
          )}
        </div>
      )}

      {/* Clinical Trials */}
      {report?.trials_refs && (
        <div style={card}>
          <h3 className="text-lg font-medium text-amber-900 mb-3 flex items-center gap-2">
            <FlaskConical size={18} className="text-amber-500" /> Open Clinical Trials
          </h3>
          <div className="space-y-2">
            {report.trials_refs.split('\n').filter(Boolean).map((t, i) => (
              <p key={i} className="text-sm text-amber-800 font-light">{t}</p>
            ))}
          </div>
        </div>
      )}

      {/* Chat */}
      {report?.id && (
        <div style={card}>
          <h3 className="text-lg font-medium text-amber-900 mb-4 flex items-center gap-2">
            <MessageCircle size={18} className="text-amber-500" /> Ask a Question
          </h3>

          {/* Suggested questions */}
          {chatHistory.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                'Could the high lipase be from Nintedanib?',
                'What does the chloride and CO2 pattern mean?',
                'Are there any trials Mirla could join?',
                'How does Hashimoto\'s affect her SSc?',
                'What should I watch for with her current meds?',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setChatInput(q); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors border border-amber-200"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto mb-4 pr-2">
            {chatHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'max-w-[80%] bg-amber-400 text-white rounded-tr-sm'
                    : 'w-full bg-white border border-amber-200 text-amber-900 font-light rounded-tl-sm'
                }`}>
                  {m.role === 'assistant' ? <ReportText text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-amber-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask anything about Mirla's results..."
              className="flex-1 px-4 py-3 rounded-xl bg-white bg-opacity-70 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || chatLoading}
              className="px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-amber-400 mt-2 text-center">⚕️ Always review findings with Mirla's medical team before making any changes.</p>
        </div>
      )}

      {/* ── Test Request Briefs ────────────────────────────────────── */}
      <TestBriefSection />

      {/* ── Doctor Brief Generator ─────────────────────────────────── */}
      <DoctorBriefSection />

    </div>
  );
}

// ── Test Brief Section ─────────────────────────────────────────────────────
function TestBriefSection() {
  const [testInput, setTestInput]   = useState('');
  const [reason, setReason]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [brief, setBrief]           = useState(null);
  const [error, setError]           = useState('');

  // Tests grouped by priority / category
  const RECOMMENDED_TESTS = [
    { group: '🚨 Overdue Now', tests: ['CBC with differential', 'HbA1c', 'Fasting glucose', 'Magnesium'] },
    { group: '🫀 SSc Disease Activity', tests: ['IL-6', 'TGF-beta', 'FVC (lung function)', 'NT-proBNP (heart/lung pressure)', 'Echocardiogram', 'HRCT chest scan', 'mRSS skin score'] },
    { group: '🦋 Thyroid & Autoimmune', tests: ['TSH', 'Free T4', 'TPO antibodies', 'Thyroglobulin antibodies', 'ANA panel', 'Anti-Scl-70 antibodies'] },
    { group: '🌿 Nutrients & Deficiencies', tests: ['Vitamin D', 'B12', 'Ferritin / Iron studies', 'Calcium', 'Zinc', 'Omega-3 index'] },
    { group: '🩸 Vascular & Raynaud\'s', tests: ['Nailfold capillaroscopy', 'Cold provocation test', 'Homocysteine'] },
  ];

  async function generate(testName, reasonText) {
    setLoading(true); setError(''); setBrief(null);
    setTestInput(testName);
    try {
      const r = await axios.post(`${API}/api/analysis/test-brief`, {
        test: testName, reason: reasonText || reason
      });
      setBrief(r.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(255,255,255,.6) 0%,rgba(254,252,232,.4) 100%)', borderRadius:'1.5rem', padding:'1.75rem', border:'1px solid #fde68a', marginBottom:'1.25rem' }}>
      <h3 className="text-lg font-medium text-amber-900 mb-1 flex items-center gap-2">
        <FlaskConical size={18} className="text-amber-500" /> Understand Your Tests
      </h3>
      <p className="text-amber-600 font-light text-sm mb-5">
        Tap any test to learn exactly what it measures, why it matters for <em>your</em> conditions, what the results mean — and the exact words to ask your doctor for it.
      </p>

      {/* Grouped test buttons */}
      <div className="space-y-4 mb-5">
        {RECOMMENDED_TESTS.map(({ group, tests }) => (
          <div key={group}>
            <p className="text-xs font-semibold text-amber-700 mb-2">{group}</p>
            <div className="flex flex-wrap gap-2">
              {tests.map((t, i) => (
                <button key={i} onClick={() => generate(t, '')}
                  disabled={loading && testInput === t}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {loading && testInput === t
                    ? <Loader size={10} className="animate-spin" />
                    : <BookOpen size={10} />}
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <input value={testInput} onChange={e => setTestInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate(testInput, reason)}
          placeholder="Or type any test name..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white bg-opacity-70 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
        />
        <button onClick={() => generate(testInput, reason)} disabled={!testInput.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-white transition-all disabled:opacity-50 text-sm font-medium">
          {loading ? <Loader size={16} className="animate-spin" /> : 'Learn'}
        </button>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

      {/* Generated test brief */}
      {brief && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-amber-900 flex items-center gap-2">
              <BookOpen size={16} className="text-amber-500" /> {brief.test}
            </h4>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 transition-colors">
              <Printer size={13} /> Print
            </button>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-amber-100 max-h-[550px] overflow-y-auto print:max-h-none">
            <BriefText text={brief.brief} />
          </div>
          {brief.papers?.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-amber-700 mb-1">📚 Research</p>
              {brief.papers.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs text-amber-700 hover:underline">
                  <ExternalLink size={11} className="mt-0.5 flex-shrink-0 text-amber-400" />
                  <span className="font-light">{p.title} ({p.year})</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Doctor Brief Section ───────────────────────────────────────────────────
function DoctorBriefSection() {
  const [drugInput, setDrugInput]   = useState('');
  const [context, setContext]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [brief, setBrief]           = useState(null);
  const [history, setHistory]       = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    try { const r = await axios.get(`${API}/api/analysis/doctor-briefs`); setHistory(r.data); }
    catch {}
  }

  async function generate() {
    if (!drugInput.trim()) return;
    setLoading(true); setError(''); setBrief(null);
    try {
      const r = await axios.post(`${API}/api/analysis/doctor-brief`, { drug: drugInput.trim(), context });
      setBrief(r.data);
      loadHistory();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }

  const QUICK_DRUGS = [
    'Low Dose Naltrexone', 'Tocilizumab', 'Rituximab', 'Curcumin',
    'Acupuncture for Raynaud\'s', 'Psilocybin-assisted therapy', 'CAR-T cell therapy',
    'N-Acetylcysteine', 'Magnesium glycinate', 'Ginkgo biloba'
  ];

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(255,255,255,.6) 0%,rgba(254,252,232,.4) 100%)', borderRadius:'1.5rem', padding:'1.75rem', border:'1px solid #fde68a', marginBottom:'1.25rem' }}>
      <h3 className="text-lg font-medium text-amber-900 mb-1 flex items-center gap-2">
        <FileText size={18} className="text-amber-500" /> Doctor Brief Generator
      </h3>
      <p className="text-amber-600 font-light text-sm mb-4">
        Type any drug, supplement, or treatment idea — mainstream or alternative — and get a one-page brief Mirla can bring to her appointment, with the research to back it up.
      </p>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_DRUGS.map((d, i) => (
          <button key={i} onClick={() => setDrugInput(d)}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors border border-amber-200 flex items-center gap-1">
            <Plus size={10} />{d}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="space-y-3">
        <input
          value={drugInput}
          onChange={e => setDrugInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Drug name, supplement, or treatment (e.g. Low Dose Naltrexone, acupuncture, psilocybin)"
          className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-70 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
        />
        <input
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Optional: why you're asking (e.g. 'for fibromyalgia pain and SSc itch')"
          className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-70 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
        />
        <button
          onClick={generate}
          disabled={!drugInput.trim() || loading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
          {loading ? 'Generating brief + pulling research…' : 'Generate Doctor Brief'}
        </button>
      </div>

      {error && <p className="mt-3 text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

      {/* Generated brief */}
      {brief && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-amber-900">Brief: {brief.drug}</h4>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 transition-colors"
            >
              <Printer size={13} /> Print / Save
            </button>
          </div>

          {/* Brief text */}
          <div className="bg-white rounded-2xl p-5 border border-amber-100 max-h-[500px] overflow-y-auto print:max-h-none">
            <BriefText text={brief.brief} />
          </div>

          {/* Papers */}
          {brief.papers?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-amber-700 mb-2">📚 Research papers pulled from PubMed</p>
              <div className="space-y-1.5">
                {brief.papers.map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 text-xs text-amber-700 hover:text-amber-900 group">
                    <ExternalLink size={12} className="mt-0.5 flex-shrink-0 text-amber-400 group-hover:text-amber-600" />
                    <span className="font-light leading-relaxed hover:underline">
                      {p.title} — {p.authors} ({p.year})
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Trials */}
          {brief.trials?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-amber-700 mb-2">🧪 Active clinical trials</p>
              <div className="space-y-1">
                {brief.trials.map((t, i) => (
                  <a key={i} href={t.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 text-xs text-amber-700 hover:text-amber-900 group">
                    <ExternalLink size={12} className="mt-0.5 flex-shrink-0 text-amber-400" />
                    <span className="font-light hover:underline">{t.title} ({t.nctId}) — {t.status}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous briefs */}
      {history.length > 0 && (
        <div className="mt-5 pt-4 border-t border-amber-100">
          <button onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-800">
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Previous briefs ({history.length})
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.map(b => (
                <div key={b.id}
                  onClick={async () => {
                    const r = await axios.get(`${API}/api/analysis/doctor-brief/${b.id}`);
                    setBrief(r.data); setDrugInput(r.data.drug_name);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors">
                  <span className="text-sm text-amber-800 font-medium">{b.drug_name}</span>
                  <span className="text-xs text-amber-400">{new Date(b.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefText({ text }) {
  if (!text) return null;
  return (
    <div className="space-y-2 text-sm text-gray-800 leading-relaxed print:text-black">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith('# '))  return <h2 key={i} className="text-lg font-bold text-gray-900 mt-3 print:text-black">{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-gray-800 mt-3 border-b border-gray-200 pb-1">{line.slice(3)}</h3>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold">{line.slice(2,-2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} className="ml-3 flex gap-2"><span className="text-amber-400 mt-0.5">•</span><span>{line.slice(2)}</span></p>;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <p key={i}>{parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}</p>;
      })}
    </div>
  );
}
