import React, { useState } from 'react';
import axios from 'axios';
import { Search, ExternalLink, MapPin, Users, Calendar, Phone, Mail } from 'lucide-react';

import API from '../api';
const DRUGS = ['Tocilizumab','Nintedanib','Dasatinib','Baricitinib','Tofacitinib','Abatacept','Rituximab','Imatinib','Pirfenidone','Belimumab','Lenabasum'];
const card = { background:'linear-gradient(135deg,rgba(255,255,255,.5) 0%,rgba(254,252,232,.3) 100%)', borderRadius:'1.5rem', padding:'2rem', border:'1px solid #fde68a', marginBottom:'1.5rem' };

const statusColor = s => {
  if (s === 'RECRUITING') return 'bg-green-100 text-green-800';
  if (s === 'ENROLLING_BY_INVITATION') return 'bg-blue-100 text-blue-800';
  if (s === 'NOT_YET_RECRUITING') return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-700';
};

const phaseColor = p => {
  if (p?.includes('3')) return 'bg-purple-100 text-purple-800';
  if (p?.includes('2')) return 'bg-blue-100 text-blue-800';
  if (p?.includes('1')) return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-600';
};

const TrialMatcher = () => {
  const [drug, setDrug] = useState('Tocilizumab');
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true); setSearched(true);
    try {
      const r = await axios.get(`${API}/api/trials/${encodeURIComponent(drug)}`);
      setTrials(r.data);
    } catch { setTrials([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div style={card}>
        <h2 className="text-3xl font-light text-amber-900 mb-2">Clinical Trial Matcher</h2>
        <p className="text-amber-700 font-light mb-6 text-sm">Live search of ClinicalTrials.gov for Systemic Sclerosis trials matching Mirla's profile.</p>

        <div className="flex gap-3 mb-6">
          <select value={drug} onChange={e => setDrug(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300">
            {DRUGS.map(d => <option key={d}>{d}</option>)}
          </select>
          <button onClick={search} disabled={loading} className="px-6 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
            <Search size={16}/>{loading ? 'Searching...' : 'Find Trials'}
          </button>
        </div>

        {loading && <div className="text-center py-8 text-amber-600 font-light">Searching ClinicalTrials.gov for {drug} + Systemic Sclerosis...</div>}

        {!loading && searched && trials.length === 0 && (
          <div className="text-center py-8 text-amber-600 font-light">No active trials found for {drug}. Try another drug or check back as new trials open.</div>
        )}

        <div className="space-y-4">
          {trials.map((t, i) => (
            <div key={t.nct_id || i} className="rounded-2xl border border-amber-200 bg-white bg-opacity-40 overflow-hidden">
              <button className="w-full text-left p-5" onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="flex flex-wrap gap-2 mb-2">
                  {t.phase && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseColor(t.phase)}`}>{t.phase}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status?.replace(/_/g,' ')}</span>
                </div>
                <h3 className="font-medium text-amber-900 text-sm leading-snug">{t.title}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-amber-600">
                  {t.location && <span className="flex items-center gap-1"><MapPin size={11}/>{t.location.split(';')[0]}</span>}
                  {t.institution && <span className="flex items-center gap-1"><Users size={11}/>{t.institution}</span>}
                  {t.enrollment_count > 0 && <span className="flex items-center gap-1"><Users size={11}/>{t.enrollment_count} participants</span>}
                  {t.start_date && <span className="flex items-center gap-1"><Calendar size={11}/>Started {t.start_date}</span>}
                </div>
              </button>
              {expanded === i && (
                <div className="px-5 pb-5 border-t border-amber-100 space-y-3 pt-4">
                  {t.inclusion_criteria && (
                    <div>
                      <p className="text-xs font-medium text-amber-800 mb-1">Eligibility Criteria</p>
                      <p className="text-xs text-amber-700 leading-relaxed line-clamp-6 whitespace-pre-line">{t.inclusion_criteria.substring(0,600)}{t.inclusion_criteria.length>600?'...':''}</p>
                    </div>
                  )}
                  {(t.contact_name || t.contact_email || t.contact_phone) && (
                    <div>
                      <p className="text-xs font-medium text-amber-800 mb-1">Contact</p>
                      <div className="space-y-1">
                        {t.contact_name && <p className="text-xs text-amber-700">{t.contact_name}</p>}
                        {t.contact_email && <p className="text-xs text-amber-700 flex items-center gap-1"><Mail size={11}/><a href={`mailto:${t.contact_email}`} className="underline">{t.contact_email}</a></p>}
                        {t.contact_phone && <p className="text-xs text-amber-700 flex items-center gap-1"><Phone size={11}/>{t.contact_phone}</p>}
                      </div>
                    </div>
                  )}
                  {t.completion_date && <p className="text-xs text-amber-600">Est. completion: {t.completion_date}</p>}
                  {t.url && (
                    <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-amber-700 underline hover:text-amber-900">
                      <ExternalLink size={13}/>View on ClinicalTrials.gov →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TrialMatcher;
