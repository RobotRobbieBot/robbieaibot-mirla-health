import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Upload, FileText, Clock, Link2, User, Trash2, Search,
  CheckCircle, AlertCircle, Loader, RefreshCw, ChevronDown, ChevronUp, X
} from 'lucide-react';
import API from '../api';

const card = {
  background: 'linear-gradient(135deg,rgba(255,255,255,.6) 0%,rgba(254,252,232,.4) 100%)',
  borderRadius: '1.5rem', padding: '1.75rem', border: '1px solid #fde68a', marginBottom: '1.25rem'
};

const DOC_TYPE_LABELS = {
  lab_report: '🧪 Lab Report', clinical_note: '📋 Clinical Note',
  imaging_report: '🩻 Imaging', discharge_summary: '🏥 Discharge Summary',
  specialist_letter: '✉️ Specialist Letter', medication_record: '💊 Medication Record',
  pathology_report: '🔬 Pathology', operative_note: '⚕️ Operative Note',
  referral: '📨 Referral', other: '📄 Other'
};

const SEVERITY_COLOURS = {
  critical:   'bg-red-100 text-red-700 border-red-200',
  urgent:     'bg-orange-100 text-orange-700 border-orange-200',
  notable:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  routine:    'bg-green-100 text-green-700 border-green-200',
};

const CONNECTION_COLOURS = {
  causal:            'bg-red-50 border-red-200 text-red-800',
  medication_effect: 'bg-orange-50 border-orange-200 text-orange-800',
  pattern:           'bg-purple-50 border-purple-200 text-purple-800',
  temporal:          'bg-blue-50 border-blue-200 text-blue-800',
  condition_overlap: 'bg-amber-50 border-amber-200 text-amber-800',
  progression:       'bg-pink-50 border-pink-200 text-pink-800',
};

export default function MedicalHistory() {
  const [activeTab, setActiveTab]         = useState('upload');
  const [dragging, setDragging]           = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [uploadQueue, setUploadQueue]     = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [documents, setDocuments]         = useState([]);
  const [timeline, setTimeline]           = useState([]);
  const [profile, setProfile]             = useState(null);
  const [connections, setConnections]     = useState([]);
  const [search, setSearch]               = useState('');
  const [filterType, setFilterType]       = useState('all');
  const [refreshing, setRefreshing]       = useState(false);
  const [expandedDoc, setExpandedDoc]     = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    loadDocuments(); loadTimeline(); loadProfile(); loadConnections();
  }, []);

  async function loadDocuments() {
    try { const r = await axios.get(`${API}/api/history/documents`); setDocuments(r.data); }
    catch {}
  }
  async function loadTimeline() {
    try { const r = await axios.get(`${API}/api/history/timeline`); setTimeline(r.data); }
    catch {}
  }
  async function loadProfile() {
    try { const r = await axios.get(`${API}/api/history/profile`); setProfile(r.data); }
    catch {}
  }
  async function loadConnections() {
    try { const r = await axios.get(`${API}/api/history/connections`); setConnections(r.data); }
    catch {}
  }

  const handleFiles = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    setUploadQueue(Array.from(files).map(f => ({ name: f.name, status: 'pending' })));

    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('files', f));

    try {
      setUploadQueue(q => q.map(f => ({ ...f, status: 'processing' })));
      const r = await axios.post(`${API}/api/history/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResults(r.data.results || []);
      setUploadQueue(q => q.map((f, i) => ({
        ...f,
        status: r.data.results?.[i]?.status === 'ok' ? 'done' : 'error',
        summary: r.data.results?.[i]?.summary,
        doc_type: r.data.results?.[i]?.doc_type,
      })));
      await Promise.all([loadDocuments(), loadTimeline(), loadProfile(), loadConnections()]);
    } catch (e) {
      setUploadQueue(q => q.map(f => ({ ...f, status: 'error', error: e.message })));
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  async function deleteDoc(id) {
    await axios.delete(`${API}/api/history/documents/${id}`);
    setDocuments(d => d.filter(doc => doc.id !== id));
    setTimeline(t => t.filter(e => e.source_doc_id !== id));
  }

  async function refreshConnections() {
    setRefreshing(true);
    try {
      await axios.post(`${API}/api/history/refresh-connections`);
      await Promise.all([loadConnections(), loadProfile()]);
    } catch {}
    setRefreshing(false);
  }

  const filteredDocs = documents.filter(d => {
    if (filterType !== 'all' && d.doc_type !== filterType) return false;
    if (search && !d.summary?.toLowerCase().includes(search.toLowerCase()) &&
        !d.filename?.toLowerCase().includes(search.toLowerCase()) &&
        !d.provider?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tabs = [
    { id: 'upload',      label: 'Upload',      icon: Upload },
    { id: 'library',     label: `Library (${documents.length})`, icon: FileText },
    { id: 'timeline',    label: `Timeline (${timeline.length})`, icon: Clock },
    { id: 'connections', label: `Connections (${connections.length})`, icon: Link2 },
    { id: 'profile',     label: 'Profile',     icon: User },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div style={card}>
        <h2 className="text-3xl font-light text-amber-900 mb-1">📁 Medical History</h2>
        <p className="text-amber-600 font-light text-sm">
          Upload any medical document — labs, notes, scans, discharge letters, photos of paper records.
          Claude reads everything, builds Mirla's timeline, and finds connections across her history.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              activeTab === t.id
                ? 'bg-amber-400 text-white border-amber-400 shadow-sm'
                : 'bg-white bg-opacity-60 text-amber-700 border-amber-200 hover:border-amber-300'
            }`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* ── UPLOAD TAB ───────────────────────────────────────────────── */}
      {activeTab === 'upload' && (
        <div style={card}>
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragging ? 'border-amber-400 bg-yellow-50' : 'border-amber-300 hover:border-amber-400 hover:bg-yellow-50'
            } ${uploading ? 'pointer-events-none' : ''}`}
          >
            <input ref={fileRef} type="file" multiple
              accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.heic,.heif,.gif,.webp"
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            {uploading ? (
              <div className="space-y-3">
                <Loader className="mx-auto text-amber-400 animate-spin" size={40} />
                <p className="text-amber-700 font-light text-lg">Claude is reading the documents…</p>
                <p className="text-amber-500 text-sm">Classifying, extracting facts, building timeline</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto text-amber-400" size={40} />
                <p className="text-amber-800 font-light text-lg">Drop files here or click to browse</p>
                <p className="text-amber-600 text-sm">Drop as many as you like — lab results, doctor notes, discharge letters, scans, photos of paper records</p>
                <div className="flex justify-center gap-2 flex-wrap mt-2">
                  {['PDF','JPG','PNG','HEIC','TXT','CSV'].map(t => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">{t}</span>
                  ))}
                </div>
                <p className="text-amber-400 text-xs">Up to 50 files · 50MB each</p>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {uploadQueue.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-medium text-amber-900">Processing</h3>
              {uploadQueue.map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3 bg-white bg-opacity-60 border border-amber-100">
                  {f.status === 'done'       && <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />}
                  {f.status === 'error'      && <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />}
                  {f.status === 'processing' && <Loader className="text-amber-400 animate-spin flex-shrink-0 mt-0.5" size={18} />}
                  {f.status === 'pending'    && <div className="w-4 h-4 rounded-full border-2 border-amber-300 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-900 truncate">{f.name}</p>
                    {f.doc_type && <span className="text-xs text-amber-600">{DOC_TYPE_LABELS[f.doc_type]}</span>}
                    {f.summary && <p className="text-xs text-amber-700 mt-1 font-light">{f.summary}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LIBRARY TAB ──────────────────────────────────────────────── */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div style={card} className="!py-4">
            <div className="flex gap-3 flex-wrap items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" size={16} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-amber-200 bg-white bg-opacity-70 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm text-amber-900 focus:outline-none">
                <option value="all">All types</option>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div style={card} className="text-center text-amber-500 py-8">No documents yet. Upload Mirla's medical records above.</div>
          ) : (
            filteredDocs.map(doc => (
              <div key={doc.id} style={card} className="!py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                      </span>
                      {doc.doc_date && <span className="text-xs text-amber-500">{doc.doc_date}</span>}
                      {doc.provider && <span className="text-xs text-amber-500">· {doc.provider}</span>}
                      {doc.specialty && <span className="text-xs text-amber-400">· {doc.specialty}</span>}
                    </div>
                    <p className="text-sm font-medium text-amber-900 truncate">{doc.filename}</p>
                    <p className="text-sm text-amber-700 font-light mt-1">{doc.summary}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                      className="p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                      {expandedDoc === doc.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => deleteDoc(doc.id)}
                      className="p-1.5 rounded-lg text-amber-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {expandedDoc === doc.id && <DocDetail id={doc.id} />}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TIMELINE TAB ─────────────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div style={card}>
          <h3 className="text-lg font-medium text-amber-900 mb-5">Medical Timeline</h3>
          {timeline.length === 0 ? (
            <p className="text-amber-500 text-sm italic">Upload medical documents to build Mirla's timeline.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-amber-200" />
              <div className="space-y-4 pl-10">
                {timeline.map((event, i) => (
                  <div key={event.id} className="relative">
                    <div className={`absolute -left-6 top-2 w-3 h-3 rounded-full border-2 border-white ${
                      event.severity === 'critical' ? 'bg-red-500' :
                      event.severity === 'urgent' ? 'bg-orange-400' :
                      event.severity === 'notable' ? 'bg-yellow-400' : 'bg-amber-300'
                    }`} />
                    <div className={`rounded-xl p-3 border text-sm ${SEVERITY_COLOURS[event.severity] || SEVERITY_COLOURS.routine}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-xs opacity-70 flex-shrink-0">{event.event_date}</span>
                      </div>
                      {event.description && <p className="font-light text-xs">{event.description}</p>}
                      {event.condition_tags?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {event.condition_tags.map((tag, j) => (
                            <span key={j} className="text-xs px-1.5 py-0.5 rounded-full bg-white bg-opacity-60">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONNECTIONS TAB ──────────────────────────────────────────── */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          <div style={card} className="!py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-700 font-light">
                Claude finds links across Mirla's entire history — medication effects, patterns, condition overlaps.
              </p>
              <button onClick={refreshConnections} disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium transition-all disabled:opacity-50">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Finding…' : 'Refresh'}
              </button>
            </div>
          </div>
          {connections.length === 0 ? (
            <div style={card} className="text-center text-amber-500 py-8 italic text-sm">
              Upload more documents and click Refresh — Claude will find patterns across Mirla's history.
            </div>
          ) : (
            connections.map(c => (
              <div key={c.id} className={`rounded-2xl p-4 border ${CONNECTION_COLOURS[c.connection_type] || 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Link2 size={14} />
                  <span className="text-xs font-bold uppercase tracking-wide">{c.connection_type?.replace(/_/g, ' ')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.confidence === 'high' ? 'bg-green-100 text-green-700' : c.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.confidence} confidence
                  </span>
                </div>
                <p className="text-sm font-light leading-relaxed">{c.description}</p>
                <p className="text-xs mt-2 opacity-60">
                  {c.doc_a_name} ({c.doc_a_date}) ↔ {c.doc_b_name} ({c.doc_b_date})
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PROFILE TAB ──────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {!profile || Object.keys(profile).length === 0 ? (
            <div style={card} className="text-center text-amber-500 py-8 italic text-sm">
              Upload medical records — Claude will build Mirla's evolving health profile automatically.
            </div>
          ) : (
            <>
              {profile.updated_at && (
                <p className="text-xs text-amber-400 text-right">Last updated: {new Date(profile.updated_at).toLocaleString()}</p>
              )}
              {[
                { key: 'diagnoses', label: '🩺 Diagnoses', icon: '🩺' },
                { key: 'condition_timeline', label: '📅 Health Journey', icon: '📅' },
                { key: 'procedures', label: '⚕️ Procedures', icon: '⚕️' },
                { key: 'key_findings', label: '🔑 Key Findings', icon: '🔑' },
                { key: 'allergies', label: '⚠️ Allergies & Reactions', icon: '⚠️' },
              ].map(({ key, label }) => {
                const items = profile[key];
                if (!items?.length) return null;
                return (
                  <div key={key} style={card}>
                    <h3 className="font-medium text-amber-900 mb-3">{label}</h3>
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li key={i} className="text-sm text-amber-800 font-light flex gap-2">
                          <span className="text-amber-300 mt-1">•</span><span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Lazy-loaded document detail
function DocDetail({ id }) {
  const [doc, setDoc] = useState(null);
  useEffect(() => {
    axios.get(`${API}/api/history/documents/${id}`).then(r => setDoc(r.data)).catch(() => {});
  }, [id]);
  if (!doc) return <div className="mt-3 text-amber-400 text-sm">Loading…</div>;
  const facts = doc.key_facts || {};
  return (
    <div className="mt-4 pt-4 border-t border-amber-100 space-y-3 text-sm">
      {facts.findings?.length > 0 && (
        <div><p className="font-medium text-amber-800 mb-1">Findings</p>
          <ul className="space-y-1">{facts.findings.map((f,i) => <li key={i} className="text-amber-700 font-light flex gap-2"><span className="text-amber-300">•</span>{f}</li>)}</ul>
        </div>
      )}
      {facts.medications?.length > 0 && (
        <div><p className="font-medium text-amber-800 mb-1">Medications mentioned</p>
          <ul className="space-y-1">{facts.medications.map((m,i) => <li key={i} className="text-amber-700 font-light flex gap-2"><span className="text-amber-300">•</span>{m}</li>)}</ul>
        </div>
      )}
      {facts.recommendations?.length > 0 && (
        <div><p className="font-medium text-amber-800 mb-1">Recommendations</p>
          <ul className="space-y-1">{facts.recommendations.map((r,i) => <li key={i} className="text-amber-700 font-light flex gap-2"><span className="text-amber-300">•</span>{r}</li>)}</ul>
        </div>
      )}
      {doc.connections_to_watch?.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <p className="font-medium text-amber-800 mb-1">🔗 Connections to watch</p>
          <ul className="space-y-1">{doc.connections_to_watch.map((c,i) => <li key={i} className="text-amber-700 font-light text-xs">{c}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
