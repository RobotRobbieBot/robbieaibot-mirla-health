import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import API from '../api';
const card = { background:'linear-gradient(135deg,rgba(255,255,255,.5) 0%,rgba(254,252,232,.3) 100%)', borderRadius:'1.5rem', padding:'2rem', border:'1px solid #fde68a', marginBottom:'1.5rem' };

const LABS = [
  { key:'il6',       label:'IL-6 (pg/mL)',      refMax:7,   refMin:null, color:'#ef4444', warnAbove:20  },
  { key:'tgf_beta',  label:'TGF-β (ng/mL)',     refMax:10,  refMin:null, color:'#f97316', warnAbove:15  },
  { key:'mrss',      label:'mRSS Score',         refMax:10,  refMin:null, color:'#a855f7', warnAbove:20  },
  { key:'fvc',       label:'FVC (%)',            refMax:null,refMin:80,   color:'#3b82f6', warnBelow:70  },
  { key:'wbc',       label:'WBC (K/µL)',         refMax:11,  refMin:4.5,  color:'#10b981', warnAbove:11  },
  { key:'creatinine',label:'Creatinine (mg/dL)', refMax:1.2, refMin:null, color:'#6366f1', warnAbove:1.5 },
  { key:'glucose',   label:'Glucose (mg/dL)',    refMax:100, refMin:70,   color:'#f59e0b', warnAbove:125 },
  { key:'potassium', label:'Potassium (mEq/L)',  refMax:5.1, refMin:3.5,  color:'#14b8a6', warnAbove:5.5 },
  { key:'hemoglobin',label:'Hemoglobin (g/dL)',  refMax:17,  refMin:12,   color:'#ec4899', warnBelow:11  },
  { key:'lipase',    label:'Lipase (U/L)',        refMax:82,  refMin:11,   color:'#8b5cf6', warnAbove:200 },
];

function getTrend(data, key) {
  const vals = data.filter(d => d[key] != null).slice(-3);
  if (vals.length < 2) return 'stable';
  const diff = vals[vals.length-1][key] - vals[0][key];
  if (Math.abs(diff) < 0.5) return 'stable';
  return diff > 0 ? 'rising' : 'falling';
}

function TrendIcon({ trend, badIfRising = true }) {
  if (trend === 'rising') return badIfRising ? <TrendingUp className="text-red-500" size={16}/> : <TrendingUp className="text-green-500" size={16}/>;
  if (trend === 'falling') return badIfRising ? <TrendingDown className="text-green-500" size={16}/> : <TrendingDown className="text-red-500" size={16}/>;
  return <Minus className="text-amber-500" size={16}/>;
}

const emptyForm = { date:'', il6:'', tgf_beta:'', a20:'', potassium:'', creatinine:'', wbc:'', mrss:'', fvc:'', hemoglobin:'', platelets:'', alt:'', ast:'', notes:'' };

const LabDashboard = () => {
  const [labs, setLabs] = useState([]);
  const [form, setForm] = useState({...emptyForm, date: new Date().toISOString().split('T')[0]});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('il6');

  useEffect(() => { axios.get(`${API}/api/labs`).then(r => setLabs(r.data)).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  const chartData = [...labs].reverse().map(l => ({ date:l.date, ...l }));

  const addLab = async () => {
    if (!form.date) return;
    const payload = {};
    Object.keys(form).forEach(k => { payload[k] = form[k]==='' ? null : (k==='date'||k==='notes'||k==='source_file' ? form[k] : parseFloat(form[k])||null); });
    const res = await axios.post(`${API}/api/labs`, payload);
    setLabs([{...payload, id:res.data.id}, ...labs]);
    setForm({...emptyForm, date: new Date().toISOString().split('T')[0]});
    setShowForm(false);
  };

  const deleteLab = async (id) => { await axios.delete(`${API}/api/labs/${id}`); setLabs(labs.filter(l=>l.id!==id)); };

  const latest = labs[0] || {};

  const flagColor = (lab, val) => {
    if (val == null) return 'text-amber-400';
    if (lab.warnAbove && val > lab.warnAbove) return 'text-red-600 font-bold';
    if (lab.warnBelow && val < lab.warnBelow) return 'text-red-600 font-bold';
    if (lab.refMax && val > lab.refMax) return 'text-yellow-600';
    if (lab.refMin && val < lab.refMin) return 'text-yellow-600';
    return 'text-green-700';
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {LABS.map(lab => {
          const val = latest[lab.key];
          const trend = getTrend(labs, lab.key);
          return (
            <button key={lab.key} onClick={()=>setActiveChart(lab.key)}
              className={`rounded-2xl p-4 border text-left transition-all ${activeChart===lab.key?'border-amber-400 shadow-md bg-yellow-50':'border-amber-200 bg-white bg-opacity-50'}`}>
              <p className="text-xs text-amber-600 font-light mb-1">{lab.label}</p>
              <p className={`text-2xl font-light ${flagColor(lab, val)}`}>{val ?? '—'}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon trend={trend} badIfRising={lab.key !== 'fvc'} />
                <span className="text-xs text-amber-500">{trend}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div style={card}>
          <h3 className="text-lg font-light text-amber-900 mb-4">{LABS.find(l=>l.key===activeChart)?.label} Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
              <XAxis dataKey="date" tick={{fontSize:11, fill:'#92400e'}} />
              <YAxis tick={{fontSize:11, fill:'#92400e'}} />
              <Tooltip contentStyle={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'12px'}} />
              {LABS.find(l=>l.key===activeChart)?.refMax && <ReferenceLine y={LABS.find(l=>l.key===activeChart).refMax} stroke="#ef4444" strokeDasharray="4 4" label={{value:'Ref Max',fill:'#ef4444',fontSize:10}} />}
              {LABS.find(l=>l.key===activeChart)?.refMin && <ReferenceLine y={LABS.find(l=>l.key===activeChart).refMin} stroke="#ef4444" strokeDasharray="4 4" label={{value:'Ref Min',fill:'#ef4444',fontSize:10}} />}
              <Line type="monotone" dataKey={activeChart} stroke={LABS.find(l=>l.key===activeChart)?.color||'#f59e0b'} strokeWidth={2} dot={{r:4,fill:'#fff',strokeWidth:2}} activeDot={{r:6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add lab */}
      <div style={card}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-light text-amber-900">Lab Results</h3>
          <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-200 text-amber-900 hover:bg-yellow-300 transition-all text-sm font-medium">
            <Plus size={16}/> Add Labs
          </button>
        </div>

        {showForm && (
          <div className="mb-6 pb-6 border-b border-amber-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-amber-700 mb-1 block">Date *</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">IL-6 (ref &lt;7)</label><input type="number" step="0.1" placeholder="e.g. 45" value={form.il6} onChange={e=>setForm({...form,il6:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">TGF-β (ref &lt;10)</label><input type="number" step="0.1" placeholder="e.g. 22.5" value={form.tgf_beta} onChange={e=>setForm({...form,tgf_beta:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">mRSS Score (ref &lt;10)</label><input type="number" step="0.1" placeholder="e.g. 28" value={form.mrss} onChange={e=>setForm({...form,mrss:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">FVC % (ref &gt;80)</label><input type="number" step="0.1" placeholder="e.g. 68" value={form.fvc} onChange={e=>setForm({...form,fvc:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">WBC (K/µL)</label><input type="number" step="0.1" placeholder="e.g. 6.5" value={form.wbc} onChange={e=>setForm({...form,wbc:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">Creatinine (mg/dL)</label><input type="number" step="0.01" placeholder="e.g. 0.9" value={form.creatinine} onChange={e=>setForm({...form,creatinine:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">Potassium (mEq/L)</label><input type="number" step="0.1" placeholder="e.g. 4.2" value={form.potassium} onChange={e=>setForm({...form,potassium:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">Hemoglobin (g/dL)</label><input type="number" step="0.1" placeholder="e.g. 12.5" value={form.hemoglobin} onChange={e=>setForm({...form,hemoglobin:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
              <div><label className="text-xs text-amber-700 mb-1 block">A20 (if available)</label><input type="number" step="0.1" placeholder="A20 level" value={form.a20} onChange={e=>setForm({...form,a20:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/></div>
            </div>
            <textarea placeholder="Notes about this visit..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 text-sm placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-16 resize-none"/>
            <button onClick={addLab} className="w-full py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm">Save Lab Results</button>
          </div>
        )}

        {loading ? <p className="text-amber-600 font-light">Loading labs...</p> : labs.length === 0 ? <p className="text-amber-600 font-light">No lab results yet. Add your first entry above.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-amber-700 font-medium border-b border-amber-200">
                <th className="text-left py-2 pr-3 whitespace-nowrap">Date</th>
                <th className="text-left pr-3">Source</th>
                <th className="text-right pr-2">WBC</th>
                <th className="text-right pr-2">Hgb</th>
                <th className="text-right pr-2">Gluc</th>
                <th className="text-right pr-2">Cr</th>
                <th className="text-right pr-2">K+</th>
                <th className="text-right pr-2">Lipase</th>
                <th className="text-right pr-2">IL-6</th>
                <th className="text-right pr-2">FVC%</th>
                <th className="text-left pl-3">Notes</th>
                <th></th>
              </tr></thead>
              <tbody>{labs.filter(l => l.source_file || l.il6 || l.tgf_beta || l.mrss || l.fvc).map(l => (
                <tr key={l.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                  <td className="py-2 pr-3 text-amber-800 whitespace-nowrap font-medium">{l.date}</td>
                  <td className="pr-3 text-amber-500 text-xs max-w-[100px] truncate" title={l.source_file}>
                    {l.source_file ? l.source_file.replace(/^\d+-/, '').replace('.pdf','') : '—'}
                  </td>
                  <td className={`text-right pr-2 ${l.wbc>11?'text-red-600 font-semibold':l.wbc&&l.wbc<4.5?'text-yellow-600':l.wbc?'text-green-700':'text-amber-300'}`}>{l.wbc??'—'}</td>
                  <td className={`text-right pr-2 ${l.hemoglobin&&l.hemoglobin<11?'text-red-600 font-semibold':l.hemoglobin&&l.hemoglobin>17?'text-yellow-600':l.hemoglobin?'text-green-700':'text-amber-300'}`}>{l.hemoglobin??'—'}</td>
                  <td className={`text-right pr-2 ${l.glucose&&l.glucose>125?'text-red-600 font-semibold':l.glucose&&l.glucose>100?'text-yellow-600':l.glucose&&l.glucose<70?'text-yellow-600':l.glucose?'text-green-700':'text-amber-300'}`}>{l.glucose??'—'}</td>
                  <td className={`text-right pr-2 ${l.creatinine>1.5?'text-red-600 font-semibold':l.creatinine>1.2?'text-yellow-600':l.creatinine?'text-green-700':'text-amber-300'}`}>{l.creatinine??'—'}</td>
                  <td className={`text-right pr-2 ${l.potassium&&(l.potassium>5.5||l.potassium<3.5)?'text-red-600 font-semibold':l.potassium&&(l.potassium>5.1||l.potassium<3.5)?'text-yellow-600':l.potassium?'text-green-700':'text-amber-300'}`}>{l.potassium??'—'}</td>
                  <td className={`text-right pr-2 ${l.lipase&&l.lipase>200?'text-red-600 font-semibold':l.lipase&&l.lipase>82?'text-yellow-600':l.lipase?'text-green-700':'text-amber-300'}`}>{l.lipase??'—'}</td>
                  <td className={`text-right pr-2 ${l.il6>20?'text-red-600 font-semibold':l.il6>7?'text-yellow-600':l.il6?'text-green-700':'text-amber-300'}`}>{l.il6??'—'}</td>
                  <td className={`text-right pr-2 ${l.fvc&&l.fvc<65?'text-red-600 font-semibold':l.fvc&&l.fvc<80?'text-yellow-600':l.fvc?'text-green-700':'text-amber-300'}`}>{l.fvc??'—'}</td>
                  <td className="pl-3 text-amber-600 text-xs max-w-[200px]" title={l.notes}>{l.notes ? l.notes.substring(0,60)+(l.notes.length>60?'…':'') : ''}</td>
                  <td><button onClick={()=>deleteLab(l.id)} className="ml-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14}/></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default LabDashboard;
