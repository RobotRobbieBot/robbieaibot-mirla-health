import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, AlertCircle, Search, Plus, X } from 'lucide-react';

import API from '../api';
const card = { background:'linear-gradient(135deg,rgba(255,255,255,.5) 0%,rgba(254,252,232,.3) 100%)', borderRadius:'1.5rem', padding:'2rem', border:'1px solid #fde68a', marginBottom:'1.5rem' };

const SEVERITY_CONFIG = {
  none:            { color:'bg-green-100 text-green-800 border-green-200',  icon:CheckCircle,    label:'No Interaction' },
  mild:            { color:'bg-blue-100 text-blue-800 border-blue-200',     icon:CheckCircle,    label:'Mild' },
  moderate:        { color:'bg-yellow-100 text-yellow-800 border-yellow-200',icon:AlertCircle,   label:'Moderate — Monitor' },
  severe:          { color:'bg-orange-100 text-orange-800 border-orange-200',icon:AlertTriangle, label:'Severe — Caution' },
  contraindicated: { color:'bg-red-100 text-red-800 border-red-200',        icon:AlertTriangle,  label:'Contraindicated' },
  unknown:         { color:'bg-gray-100 text-gray-700 border-gray-200',     icon:AlertCircle,    label:'Unknown' },
};

const InteractionChecker = () => {
  const [currentMeds, setCurrentMeds] = useState(['MMF','Nifedipine','Sildenafil','Omeprazole']);
  const [newMed, setNewMed] = useState('');
  const [checkDrug, setCheckDrug] = useState('');
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const addMed = () => { if (newMed.trim()) { setCurrentMeds([...currentMeds, newMed.trim()]); setNewMed(''); } };
  const removeMed = m => setCurrentMeds(currentMeds.filter(x=>x!==m));

  const check = async () => {
    if (!checkDrug.trim()) return;
    setLoading(true); setChecked(true);
    try {
      const r = await axios.post(`${API}/api/analysis/interactions`, { currentMeds: currentMeds.join(', '), newDrug: checkDrug });
      setInteractions(Array.isArray(r.data) ? r.data : []);
    } catch { setInteractions([]); }
    finally { setLoading(false); }
  };

  const worst = interactions.reduce((w,i) => {
    const rank = {none:0,mild:1,moderate:2,severe:3,contraindicated:4,unknown:1};
    return (rank[i.severity]||0) > (rank[w]||0) ? i.severity : w;
  }, 'none');

  return (
    <div className="space-y-6">
      <div style={card}>
        <h2 className="text-3xl font-light text-amber-900 mb-2">Drug Interaction Checker</h2>
        <p className="text-amber-700 font-light mb-6 text-sm">Claude AI checks your current medications against any new drug for interactions. Always confirm with your pharmacist and physician.</p>

        {/* Current meds */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-amber-800 mb-3">Mirla's Current Medications</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {currentMeds.map(m=>(
              <span key={m} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm border border-amber-200">
                {m}<button onClick={()=>removeMed(m)} className="text-amber-500 hover:text-amber-800 transition-colors"><X size={12}/></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Add a medication..." value={newMed} onChange={e=>setNewMed(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addMed()} className="flex-1 px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"/>
            <button onClick={addMed} className="px-3 py-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all"><Plus size={16}/></button>
          </div>
        </div>

        {/* Check drug */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <h3 className="text-sm font-medium text-amber-800 mb-3">Check New Drug or Supplement</h3>
          <div className="flex gap-3">
            <input type="text" placeholder="e.g. Tocilizumab, Ibuprofen, Vitamin D..." value={checkDrug} onChange={e=>setCheckDrug(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} className="flex-1 px-4 py-3 rounded-xl bg-white bg-opacity-70 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"/>
            <button onClick={check} disabled={loading||!checkDrug.trim()} className="px-6 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
              <Search size={15}/>{loading?'Checking...':'Check'}
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-6 text-amber-600 font-light">Claude AI is analyzing interactions with {checkDrug}...</div>}

        {!loading && checked && (
          <div className="space-y-4">
            {/* Summary banner */}
            {interactions.length > 0 && (() => {
              const cfg = SEVERITY_CONFIG[worst] || SEVERITY_CONFIG.none;
              const Icon = cfg.icon;
              return (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cfg.color}`}>
                  <Icon size={20}/>
                  <div>
                    <p className="font-medium text-sm">Overall: {cfg.label}</p>
                    <p className="text-xs opacity-80">{interactions.length} interaction{interactions.length!==1?'s':''} found for {checkDrug}</p>
                  </div>
                </div>
              );
            })()}

            {interactions.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-green-200 bg-green-50">
                <CheckCircle size={20} className="text-green-600"/>
                <div>
                  <p className="font-medium text-sm text-green-800">No significant interactions found</p>
                  <p className="text-xs text-green-600">Confirm with your pharmacist before starting any new medication.</p>
                </div>
              </div>
            ) : (
              interactions.map((ix, i) => {
                const cfg = SEVERITY_CONFIG[ix.severity?.toLowerCase()] || SEVERITY_CONFIG.unknown;
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`rounded-2xl border p-5 ${cfg.color}`}>
                    <div className="flex items-start gap-3">
                      <Icon size={18} className="flex-shrink-0 mt-0.5"/>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm">{ix.drug_a}</span>
                          <span className="text-xs opacity-70">+</span>
                          <span className="font-semibold text-sm">{ix.drug_b}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        {ix.description && <p className="text-sm leading-relaxed mb-2 opacity-90">{ix.description}</p>}
                        {ix.recommendation && <p className="text-xs font-medium opacity-80">💡 {ix.recommendation}</p>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <p className="text-xs text-amber-500 italic text-center mt-2">⚕️ Always consult your physician and pharmacist before starting new medications.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default InteractionChecker;
