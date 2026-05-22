import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Trash2, ChevronDown, Heart } from 'lucide-react';

import API from '../api';
const card = { background:'linear-gradient(135deg,rgba(255,255,255,.5) 0%,rgba(254,252,232,.3) 100%)', borderRadius:'1.5rem', padding:'2rem', border:'1px solid #fde68a', marginBottom:'1.5rem' };
const MOODS = ['😔','😟','😐','🙂','😊'];
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

const MirlaNotesSection = () => {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [mood, setMood] = useState('');
  const [pain, setPain] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/notes`).then(r => {
      setNotes(r.data);
      const todayNote = r.data.find(n => n.date === today());
      if (todayNote) { setText(todayNote.note_text); setMood(todayNote.mood||''); setPain(todayNote.pain_level||5); setEnergy(todayNote.energy_level||5); }
    }).catch(()=>{});
  }, []);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API}/api/notes`, { date:today(), note_text:text, mood, pain_level:pain, energy_level:energy });
      const r = await axios.get(`${API}/api/notes`);
      setNotes(r.data);
      setSaved(true); setTimeout(()=>setSaved(false),2500);
    } catch {}
    finally { setSaving(false); }
  };

  const deleteNote = async (id) => {
    await axios.delete(`${API}/api/notes/${id}`);
    setNotes(notes.filter(n=>n.id!==id));
  };

  const saveEdit = async (id) => {
    await axios.put(`${API}/api/notes/${id}`, { note_text:editText, mood, pain_level:pain, energy_level:energy });
    const r = await axios.get(`${API}/api/notes`);
    setNotes(r.data); setEditId(null);
  };

  // Calendar dots — last 4 weeks
  const calDates = [];
  for (let i=27; i>=0; i--) { const d=new Date(); d.setDate(d.getDate()-i); calDates.push(d.toISOString().split('T')[0]); }
  const noteDates = new Set(notes.map(n=>n.date));

  return (
    <div className="space-y-6">
      {/* Today */}
      <div style={{...card, background:'linear-gradient(135deg,rgba(255,255,255,.7) 0%,rgba(254,252,232,.5) 100%)'}}>
        <div className="flex items-center gap-3 mb-6">
          <Heart className="text-red-400" size={24}/>
          <div>
            <h2 className="text-2xl font-light text-amber-900">For You, Mirla</h2>
            <p className="text-amber-600 text-sm font-light">{fmtDate(today())}</p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={e=>setText(e.target.value)}
          placeholder="How are you feeling today, Mirla? What's on your heart? This is your safe space..."
          className="w-full px-4 py-4 rounded-2xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-base leading-relaxed font-light"
          rows={5}
        />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-amber-700 mb-2 font-medium">How's your mood?</p>
            <div className="flex gap-2">{MOODS.map((m,i)=>(
              <button key={i} onClick={()=>setMood(m)} className={`text-2xl transition-transform hover:scale-125 ${mood===m?'scale-125':''}`}>{m}</button>
            ))}</div>
          </div>
          <div>
            <p className="text-xs text-amber-700 mb-2 font-medium">Pain level: <span className="font-bold text-amber-900">{pain}/10</span></p>
            <input type="range" min={1} max={10} value={pain} onChange={e=>setPain(+e.target.value)} className="w-full accent-amber-500"/>
            <div className="flex justify-between text-xs text-amber-400 mt-0.5"><span>None</span><span>Severe</span></div>
          </div>
          <div>
            <p className="text-xs text-amber-700 mb-2 font-medium">Energy: <span className="font-bold text-amber-900">{energy}/10</span></p>
            <input type="range" min={1} max={10} value={energy} onChange={e=>setEnergy(+e.target.value)} className="w-full accent-amber-500"/>
            <div className="flex justify-between text-xs text-amber-400 mt-0.5"><span>Exhausted</span><span>Great</span></div>
          </div>
        </div>

        <button onClick={save} disabled={saving||!text.trim()} className="mt-5 w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm disabled:opacity-50 bg-yellow-200 text-amber-900 hover:bg-yellow-300">
          {saving ? <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"/> : <Save size={16}/>}
          {saved ? '✓ Saved!' : 'Save Today\'s Note'}
        </button>
      </div>

      {/* Calendar */}
      <div style={card}>
        <h3 className="text-lg font-light text-amber-900 mb-3">Last 4 Weeks</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className="text-center text-xs text-amber-500 font-medium pb-1">{d}</div>)}
          {calDates.map(d=>(
            <div key={d} title={d} className={`h-7 rounded-lg flex items-center justify-center text-xs cursor-default transition-colors ${
              d===today() ? 'bg-yellow-300 text-amber-900 font-bold ring-2 ring-amber-400' :
              noteDates.has(d) ? 'bg-amber-200 text-amber-800' : 'bg-amber-50 text-amber-300'
            }`}>
              {noteDates.has(d) ? '💛' : new Date(d+'T12:00:00').getDate()}
            </div>
          ))}
        </div>
      </div>

      {/* Past notes */}
      {notes.filter(n=>n.date!==today()).length > 0 && (
        <div style={card}>
          <h3 className="text-lg font-light text-amber-900 mb-4">Previous Notes</h3>
          <div className="space-y-3">
            {notes.filter(n=>n.date!==today()).map(n=>(
              <div key={n.id} className="rounded-2xl border border-amber-200 bg-white bg-opacity-40">
                <button className="w-full text-left px-5 py-4" onClick={()=>setExpanded(expanded===n.id?null:n.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {n.mood && <span className="text-xl">{n.mood}</span>}
                      <div>
                        <p className="text-sm font-medium text-amber-900">{fmtDate(n.date)}</p>
                        {n.pain_level && <p className="text-xs text-amber-600">Pain {n.pain_level}/10 · Energy {n.energy_level}/10</p>}
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-amber-500 transition-transform ${expanded===n.id?'rotate-180':''}`}/>
                  </div>
                  {expanded!==n.id && <p className="text-sm text-amber-700 mt-2 line-clamp-2 font-light">{n.note_text}</p>}
                </button>
                {expanded===n.id && (
                  <div className="px-5 pb-5 border-t border-amber-100 pt-4">
                    {editId===n.id ? (
                      <div className="space-y-3">
                        <textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none h-24"/>
                        <div className="flex gap-2">
                          <button onClick={()=>saveEdit(n.id)} className="px-4 py-2 bg-yellow-200 text-amber-900 rounded-xl text-sm font-medium hover:bg-yellow-300">Save</button>
                          <button onClick={()=>setEditId(null)} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm hover:bg-amber-200">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-amber-800 whitespace-pre-wrap font-light leading-relaxed">{n.note_text}</p>
                        <div className="flex gap-3">
                          <button onClick={()=>{setEditId(n.id);setEditText(n.note_text);}} className="text-xs text-amber-600 hover:text-amber-800 underline">Edit</button>
                          <button onClick={()=>deleteNote(n.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12}/>Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default MirlaNotesSection;
