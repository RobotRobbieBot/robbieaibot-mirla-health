import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Bell, BellOff, Check, ChevronDown, Pill, AlertTriangle, Info, Loader } from 'lucide-react';

// ─── Time slots matching Mirla's exact schedule ───────────────────────────────
const TIME_SLOTS = [
  { id: 'wake',       label: 'Wake',        emoji: '⏰', hour: 6,  minute: 30, context: 'Empty stomach',      warn: '⚠️ Wait 45 min before anything else' },
  { id: 'breakfast',  label: 'Breakfast',   emoji: '🌅', hour: 7,  minute: 45, context: 'With food & fat',    warn: null },
  { id: 'midmorning', label: 'Mid-Morning', emoji: '☀️', hour: 10, minute: 0,  context: '',                   warn: null },
  { id: 'lunch',      label: 'Lunch',       emoji: '🌤️', hour: 12, minute: 30, context: 'With meal',          warn: null },
  { id: 'afternoon',  label: 'Afternoon',   emoji: '🌇', hour: 15, minute: 0,  context: 'Fatigue support',    warn: null },
  { id: 'dinner',     label: 'Dinner',      emoji: '🌆', hour: 18, minute: 0,  context: 'With meal',          warn: null },
  { id: 'bedtime',    label: 'Bedtime',     emoji: '🌙', hour: 21, minute: 30, context: '1 hr before sleep',  warn: null },
];

const SPACING_RULES = [
  { rule: 'Levothyroxine + Calcium / Iron / Magnesium', gap: '4 hr minimum' },
  { rule: 'Methylfolate + Iron / Magnesium / Antacids', gap: '2 hr minimum' },
  { rule: 'Liposomal Curcumin + Magnesium',            gap: 'Space 2 hr if possible' },
];

const COLORS = [
  { id: 'amber',  bg: 'bg-amber-50',  border: 'border-amber-300',  dot: 'bg-amber-400',  text: 'text-amber-900'  },
  { id: 'rose',   bg: 'bg-rose-50',   border: 'border-rose-300',   dot: 'bg-rose-400',   text: 'text-rose-900'   },
  { id: 'teal',   bg: 'bg-teal-50',   border: 'border-teal-300',   dot: 'bg-teal-500',   text: 'text-teal-900'   },
  { id: 'violet', bg: 'bg-violet-50', border: 'border-violet-300', dot: 'bg-violet-400', text: 'text-violet-900' },
  { id: 'sky',    bg: 'bg-sky-50',    border: 'border-sky-300',    dot: 'bg-sky-400',    text: 'text-sky-900'    },
  { id: 'green',  bg: 'bg-green-50',  border: 'border-green-300',  dot: 'bg-green-500',  text: 'text-green-900'  },
];
const getColor = (id) => COLORS.find(c => c.id === id) || COLORS[0];

// ─── Mirla's complete supplement stack ────────────────────────────────────────
const DEFAULT_SUPPS = [
  // WAKE
  { name: 'Warm water + sea salt',  dose: 'Pinch in warm water',  times: ['wake'],       withMeal: false, notes: 'Morning ritual — hydrate before anything', color: 'sky',    split: null, warning: null },
  { name: 'Levothyroxine',          dose: 'As prescribed',        times: ['wake'],       withMeal: false, notes: 'Empty stomach only. Wait 45 min before eating or other supps.', color: 'rose', split: null, warning: '⚠️ Wait 45 min before breakfast' },

  // BREAKFAST
  { name: 'Vitamin D3',             dose: '5,000 IU',             times: ['breakfast'],  withMeal: true,  notes: 'Fat-soluble — take with fat', color: 'amber', split: null, warning: null },
  { name: 'Vitamin K2 (MK-7)',      dose: '100–200 mcg',          times: ['breakfast'],  withMeal: true,  notes: 'Works with D3', color: 'amber', split: null, warning: null },
  { name: 'Omega-3 (EPA+DHA)',       dose: '1,000–1,500 mg',       times: ['breakfast'],  withMeal: true,  notes: 'Dose 1 of 2 · with fat', color: 'teal',  split: '1/2', warning: null },
  { name: 'Methylfolate',           dose: '400–800 mcg',          times: ['breakfast'],  withMeal: true,  notes: 'Space 2 hr from iron / magnesium / antacids', color: 'green', split: null, warning: null },
  { name: 'B12 (sublingual)',       dose: '1,000 mcg',            times: ['breakfast'],  withMeal: false, notes: 'Hold under tongue for best absorption', color: 'green', split: null, warning: null },
  { name: 'Riboflavin (B2)',        dose: '400 mg',               times: ['breakfast'],  withMeal: true,  notes: '', color: 'green', split: null, warning: null },
  { name: 'CoQ10 (Ubiquinol)',      dose: '100–200 mg',           times: ['breakfast'],  withMeal: true,  notes: 'Fat-soluble — take with fat', color: 'rose', split: null, warning: null },
  { name: 'Digestive Enzymes',      dose: '1–2 caps',             times: ['breakfast'],  withMeal: true,  notes: 'Take with first bite of food', color: 'green', split: null, warning: null },
  { name: 'Breathe Tincture',       dose: '1 dropper',            times: ['breakfast'],  withMeal: false, notes: 'In warm tea', color: 'violet', split: null, warning: null },

  // MID-MORNING
  { name: 'NAC',                    dose: '600 mg',               times: ['midmorning'], withMeal: false, notes: 'Dose 1 of 2', color: 'teal', split: '1/2', warning: null },
  { name: 'L-Citrulline',           dose: '1,500–3,000 mg',       times: ['midmorning'], withMeal: false, notes: 'Dose 1 of 2 · in water', color: 'sky',  split: '1/2', warning: null },
  { name: "Lion's Mane Tincture",   dose: '1 dropper',            times: ['midmorning'], withMeal: false, notes: 'In tea or under tongue', color: 'violet', split: null, warning: null },

  // LUNCH
  { name: 'Liposomal Curcumin',     dose: '500–1,000 mg',         times: ['lunch'],      withMeal: true,  notes: 'With fat · space 2 hr from magnesium if possible', color: 'amber', split: null, warning: null },
  { name: 'Zinc Picolinate',        dose: '15–30 mg',             times: ['lunch'],      withMeal: true,  notes: '', color: 'sky',   split: null, warning: null },
  { name: 'Selenium',               dose: '200 mcg',              times: ['lunch'],      withMeal: true,  notes: '', color: 'sky',   split: null, warning: null },
  { name: 'Myo-inositol',           dose: '600 mg',               times: ['lunch'],      withMeal: false, notes: 'Dose 1 of 2', color: 'teal', split: '1/2', warning: null },
  { name: 'PEA',                    dose: '600 mg',               times: ['lunch'],      withMeal: false, notes: 'Dose 1 of 2', color: 'rose', split: '1/2', warning: null },
  { name: 'Digestive Enzymes',      dose: '1–2 caps',             times: ['lunch'],      withMeal: true,  notes: 'Take with first bite', color: 'green', split: null, warning: null },
  { name: 'Turkey Tail Tincture',   dose: '1 dropper',            times: ['lunch'],      withMeal: false, notes: 'With lunch', color: 'violet', split: null, warning: null },

  // AFTERNOON
  { name: 'Magnesium Malate',       dose: '400–800 mg',           times: ['afternoon'],  withMeal: false, notes: 'Fatigue & muscle support · 4 hr from Levothyroxine', color: 'sky', split: null, warning: null },
  { name: 'L-Citrulline',           dose: '1,500–3,000 mg',       times: ['afternoon'],  withMeal: false, notes: 'Dose 2 of 2 · in water', color: 'sky',  split: '2/2', warning: null },
  { name: 'NAC',                    dose: '600 mg',               times: ['afternoon'],  withMeal: false, notes: 'Dose 2 of 2', color: 'teal', split: '2/2', warning: null },

  // DINNER
  { name: 'Omega-3 (EPA+DHA)',       dose: '1,000–1,500 mg',       times: ['dinner'],     withMeal: true,  notes: 'Dose 2 of 2 · with fat', color: 'teal',  split: '2/2', warning: null },
  { name: 'PEA',                    dose: '600 mg',               times: ['dinner'],     withMeal: false, notes: 'Dose 2 of 2', color: 'rose', split: '2/2', warning: null },
  { name: 'Myo-inositol',           dose: '600 mg',               times: ['dinner'],     withMeal: false, notes: 'Dose 2 of 2', color: 'teal', split: '2/2', warning: null },
  { name: 'Digestive Enzymes',      dose: '1–2 caps',             times: ['dinner'],     withMeal: true,  notes: 'Take with first bite', color: 'green', split: null, warning: null },

  // BEDTIME
  { name: 'Magnesium Glycinate',    dose: '200–400 mg',           times: ['bedtime'],    withMeal: false, notes: '4 hr from Levothyroxine · supports sleep', color: 'sky',    split: null, warning: null },
  { name: 'Probiotic',              dose: '25–50 billion CFU',    times: ['bedtime'],    withMeal: false, notes: '', color: 'green',  split: null, warning: null },
  { name: 'Reishi Tincture',        dose: '1 dropper',            times: ['bedtime'],    withMeal: false, notes: 'In chamomile tea', color: 'violet', split: null, warning: null },
];

// ─── Persistence ──────────────────────────────────────────────────────────────
// Supplement definitions → SQLite via API (survives browser clears)
// Daily taken-tracking   → localStorage (ephemeral; resets each day — that's intentional)
const API_SUPPS  = 'http://localhost:3001/api/supplements';
const TAKEN_KEY  = (date) => `mirla_taken_${date}`;
const today      = () => new Date().toISOString().split('T')[0];
const loadTaken  = (date) => { try { return JSON.parse(localStorage.getItem(TAKEN_KEY(date)) || '{}'); } catch { return {}; } };
const saveTaken  = (date, d) => localStorage.setItem(TAKEN_KEY(date), JSON.stringify(d));

// ─── Notifications ────────────────────────────────────────────────────────────
const canNotify  = () => 'Notification' in window;
const hasPermit  = () => canNotify() && Notification.permission === 'granted';
const sendNotif  = (title, body) => {
  if (!hasPermit()) return;
  try { new Notification(title, { body, silent: true, tag: 'mirla-supps-' + Date.now() }); } catch { /* */ }
};

// ─── Empty add-form ────────────────────────────────────────────────────────────
const emptyForm = { name: '', dose: '', times: [], withMeal: false, notes: '', color: 'amber', split: null, warning: null };

// ═════════════════════════════════════════════════════════════════════════════
const SupplementsTab = () => {
  const [supps,       setSupps]       = useState([]);
  const [loadingSupps,setLoadingSupps]= useState(true);
  const [apiError,    setApiError]    = useState(null);
  const [taken,       setTaken]       = useState(() => loadTaken(today()));
  const [form,        setForm]        = useState(emptyForm);
  const [showForm,    setShowForm]    = useState(false);
  const [expanded,    setExpanded]    = useState(null);
  const [showRules,   setShowRules]   = useState(false);
  const [notifPerm,   setNotifPerm]   = useState(canNotify() ? Notification.permission : 'unavailable');
  const [toast,       setToast]       = useState(null);
  const [activeView,  setActiveView]  = useState('schedule'); // 'schedule' | 'manage'
  const lastFiredRef  = useRef({});

  // Load supplements from server; seed defaults on first run
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_SUPPS);
        if (!res.ok) throw new Error('Server error');
        const data = await res.json();
        if (data.length === 0) {
          // First run — seed the full stack into the DB
          const seedRes = await fetch(`${API_SUPPS}/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supplements: DEFAULT_SUPPS }),
          });
          if (seedRes.ok) {
            const seeded = await fetch(API_SUPPS);
            setSupps(await seeded.json());
          }
        } else {
          setSupps(data);
        }
        setApiError(null);
      } catch (e) {
        setApiError('Could not reach server — supplements may not save.');
        // Fallback: show defaults in-memory so the UI is still usable
        setSupps(DEFAULT_SUPPS.map((s, i) => ({ ...s, id: Date.now() + i, active: true })));
      } finally {
        setLoadingSupps(false);
      }
    })();
  }, []);

  // Midnight reset
  useEffect(() => {
    const id = setInterval(() => setTaken(loadTaken(today())), 60_000);
    return () => clearInterval(id);
  }, []);

  // Reminder ticker
  useEffect(() => {
    if (!hasPermit()) return;
    const tick = () => {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes(), d = today();
      TIME_SLOTS.forEach(slot => {
        const key = `${d}_${slot.id}`;
        if (h === slot.hour && m === slot.minute && !lastFiredRef.current[key]) {
          lastFiredRef.current[key] = true;
          const due = supps.filter(s => s.active !== false && s.times.includes(slot.id));
          if (!due.length) return;
          const names = due.map(s => s.name).join(', ');
          sendNotif(`${slot.emoji} ${slot.label} supplements`, names);
          setToast({ msg: `${slot.label} — ${names}`, warn: slot.warn });
          setTimeout(() => setToast(null), 10_000);
        }
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [supps, notifPerm]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const requestNotif = async () => {
    if (!canNotify()) return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
    if (p === 'granted') sendNotif('💊 Reminders on', "Mirla's supplement reminders are active.");
  };

  const toggleTime = (tid) => setForm(f => ({
    ...f, times: f.times.includes(tid) ? f.times.filter(t => t !== tid) : [...f.times, tid],
  }));

  const addSupp = async () => {
    if (!form.name.trim() || !form.times.length) return;
    try {
      const res = await fetch(API_SUPPS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, active: true }),
      });
      if (!res.ok) throw new Error('Save failed');
      const { id } = await res.json();
      setSupps(prev => [...prev, { ...form, id, active: true }]);
      setForm(emptyForm); setShowForm(false);
    } catch (e) {
      setApiError('Could not save supplement — ' + e.message);
    }
  };

  const deleteSupp = async (id) => {
    try {
      await fetch(`${API_SUPPS}/${id}`, { method: 'DELETE' });
      setSupps(prev => prev.filter(s => s.id !== id));
    } catch { setApiError('Could not remove supplement'); }
  };

  const toggleActive = async (id) => {
    const supp = supps.find(s => s.id === id);
    if (!supp) return;
    const updated = { ...supp, active: !supp.active };
    try {
      await fetch(`${API_SUPPS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setSupps(prev => prev.map(s => s.id === id ? updated : s));
    } catch { setApiError('Could not update supplement'); }
  };

  const toggleTaken = (suppId, slotId) => {
    const key = `${suppId}_${slotId}`, d = today();
    const next = { ...taken, [key]: !taken[key] };
    setTaken(next); saveTaken(d, next);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeSupps  = supps.filter(s => s.active !== false);
  const slotSupps    = (slotId) => activeSupps.filter(s => s.times.includes(slotId));
  const totalToday   = activeSupps.reduce((n, s) => n + s.times.length, 0);
  const takenToday   = Object.values(taken).filter(Boolean).length;
  const pct          = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0;
  const allDone      = totalToday > 0 && takenToday >= totalToday;

  // ── Styles ────────────────────────────────────────────────────────────────
  const card = {
    background: 'linear-gradient(135deg,rgba(255,255,255,.5) 0%,rgba(254,252,232,.3) 100%)',
    borderRadius: '1.5rem', padding: '2rem', border: '1px solid #fde68a', marginBottom: '1.5rem',
  };

  return (
    <div className="space-y-5">

      {/* ── API error banner ───────────────────────────────────────────────── */}
      {apiError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={15}/> {apiError}
          <button onClick={() => setApiError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14}/></button>
        </div>
      )}

      {/* ── Loading state ──────────────────────────────────────────────────── */}
      {loadingSupps && (
        <div className="flex items-center gap-2 text-amber-500 text-sm px-1">
          <Loader size={16} className="animate-spin"/> Loading supplement stack…
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl px-5 py-3 shadow-lg border border-amber-300 flex items-start gap-3"
          style={{ background: 'rgba(255,251,235,0.97)' }}>
          <span className="text-xl mt-0.5">💊</span>
          <div className="flex-1">
            <p className="text-amber-900 text-sm font-medium">{toast.msg}</p>
            {toast.warn && <p className="text-orange-600 text-xs mt-0.5 font-medium">{toast.warn}</p>}
          </div>
          <button onClick={() => setToast(null)} className="text-amber-400 hover:text-amber-600 mt-0.5"><X size={14}/></button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={card}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-3xl font-light text-amber-900 flex items-center gap-3">
              <Pill className="text-amber-500" size={26}/> Supplement Stack
            </h2>
            <p className="text-amber-500 text-sm font-light italic mt-1">
              {supps.length} supplements · {TIME_SLOTS.length} time windows 💛
            </p>
          </div>

          {/* Notification button */}
          <button
            onClick={notifPerm === 'granted' ? undefined : requestNotif}
            disabled={notifPerm === 'unavailable'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all
              ${notifPerm === 'granted'
                ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 cursor-pointer'}`}>
            {notifPerm === 'granted' ? <Bell size={15}/> : <BellOff size={15}/>}
            {notifPerm === 'granted' ? 'Reminders on' : 'Enable reminders'}
          </button>
        </div>

        {/* Progress */}
        {totalToday > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-amber-600 mb-1.5">
              <span>{allDone ? '✨ All done for today — well done Mirla!' : `${takenToday} of ${totalToday} taken today`}</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <div className="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: allDone ? '#10b981' : 'linear-gradient(90deg,#fbbf24,#f59e0b)' }}/>
            </div>
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-2 mt-5">
          {['schedule','manage'].map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border
                ${activeView === v ? 'bg-yellow-200 border-amber-400 text-amber-900' : 'bg-white bg-opacity-60 border-amber-200 text-amber-600 hover:bg-amber-50'}`}>
              {v === 'schedule' ? '📋 Today' : '✏️ Manage stack'}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TODAY'S SCHEDULE VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'schedule' && (
        <>
          {/* Spacing rules accordion */}
          <div className="rounded-2xl border border-orange-200 overflow-hidden"
            style={{ background: 'rgba(255,247,237,0.6)' }}>
            <button className="w-full flex items-center justify-between px-5 py-3 text-left"
              onClick={() => setShowRules(!showRules)}>
              <span className="flex items-center gap-2 text-sm font-medium text-orange-700">
                <AlertTriangle size={15}/> Spacing rules
              </span>
              <ChevronDown size={15} className={`text-orange-400 transition-transform ${showRules ? 'rotate-180' : ''}`}/>
            </button>
            {showRules && (
              <div className="px-5 pb-4 space-y-2 border-t border-orange-100">
                {SPACING_RULES.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-orange-800"><strong>{r.rule}</strong> — {r.gap}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time slot cards */}
          <div className="space-y-4">
            {TIME_SLOTS.map(slot => {
              const due = slotSupps(slot.id);
              if (due.length === 0) return null;
              const slotTaken = due.filter(s => taken[`${s.id}_${slot.id}`]).length;
              const slotDone  = slotTaken === due.length;

              return (
                <div key={slot.id} style={card} className="!mb-0">
                  {/* Slot header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-amber-900 flex items-center gap-2">
                        <span className="text-lg">{slot.emoji}</span>
                        {slot.label}
                        {slot.context && (
                          <span className="text-xs font-normal text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">
                            {slot.context}
                          </span>
                        )}
                      </h3>
                      {slot.warn && (
                        <p className="text-xs text-orange-600 font-medium mt-0.5 flex items-center gap-1">
                          <AlertTriangle size={11}/> {slot.warn}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${slotDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {slotTaken}/{due.length}
                    </span>
                  </div>

                  {/* Supplement rows */}
                  <div className="space-y-2">
                    {due.map(s => {
                      const key  = `${s.id}_${slot.id}`;
                      const done = !!taken[key];
                      const col  = getColor(s.color);
                      return (
                        <button key={key} onClick={() => toggleTaken(s.id, slot.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left group
                            ${done ? 'bg-green-50 border-green-200 opacity-60' : `${col.bg} ${col.border} hover:brightness-95`}`}>

                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                            ${done ? 'bg-green-400 border-green-400' : `border-gray-300 group-hover:border-amber-400`}`}>
                            {done && <Check size={11} className="text-white" strokeWidth={3}/>}
                          </div>

                          {/* Name + dose */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium ${done ? 'line-through text-gray-400' : col.text}`}>
                                {s.name}
                              </span>
                              {s.split && (
                                <span className="text-xs text-white bg-amber-400 bg-opacity-80 px-1.5 py-0.5 rounded-full leading-none">
                                  {s.split}
                                </span>
                              )}
                              {s.warning && (
                                <span className="text-xs text-orange-600 font-medium flex items-center gap-0.5">
                                  <AlertTriangle size={10}/> {s.warning}
                                </span>
                              )}
                            </div>
                            {s.dose && (
                              <p className="text-xs text-gray-400 font-light mt-0.5">
                                {s.dose}{s.withMeal ? ' · with food' : ''}
                              </p>
                            )}
                          </div>

                          {/* Notes info icon */}
                          {s.notes && !done && (
                            <span title={s.notes} className="text-amber-300 hover:text-amber-500 flex-shrink-0">
                              <Info size={13}/>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MANAGE STACK VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'manage' && (
        <div style={card}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-light text-amber-900">All Supplements ({supps.length})</h3>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-200 text-amber-900 hover:bg-yellow-300 transition-all text-sm font-medium shadow-sm">
              <Plus size={15}/> Add
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="mb-6 pb-6 border-b border-amber-200 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-amber-700 mb-1 block font-medium">Name *</label>
                  <input type="text" placeholder="e.g. Vitamin C"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl bg-white bg-opacity-70 border border-amber-200 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/>
                </div>
                <div>
                  <label className="text-xs text-amber-700 mb-1 block font-medium">Dose</label>
                  <input type="text" placeholder="e.g. 1,000 mg"
                    value={form.dose} onChange={e => setForm({...form, dose: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl bg-white bg-opacity-70 border border-amber-200 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"/>
                </div>
              </div>

              <div>
                <label className="text-xs text-amber-700 mb-2 block font-medium">When to take *</label>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button key={slot.id} type="button" onClick={() => toggleTime(slot.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all border font-medium
                        ${form.times.includes(slot.id)
                          ? 'bg-amber-300 border-amber-400 text-amber-900'
                          : 'bg-white bg-opacity-60 border-amber-200 text-amber-600 hover:bg-amber-50'}`}>
                      {slot.emoji} {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-amber-700">
                  <input type="checkbox" checked={form.withMeal}
                    onChange={e => setForm({...form, withMeal: e.target.checked})}
                    className="rounded border-amber-300"/>
                  Take with food
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-600">Colour:</span>
                  <div className="flex gap-1.5">
                    {COLORS.map(c => (
                      <button key={c.id} type="button" onClick={() => setForm({...form, color: c.id})}
                        className={`w-5 h-5 rounded-full ${c.dot} transition-all ${form.color === c.id ? 'ring-2 ring-offset-1 ring-amber-400 scale-110' : 'opacity-60 hover:opacity-100'}`}/>
                    ))}
                  </div>
                </div>
              </div>

              <textarea placeholder="Notes (spacing rules, absorption tips...)"
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-white bg-opacity-70 border border-amber-200 text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 h-16 resize-none"/>

              <div className="flex gap-3">
                <button onClick={addSupp} disabled={!form.name.trim() || !form.times.length}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                  Save
                </button>
                <button onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="px-4 py-2.5 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-600 hover:bg-amber-50 text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Supplements grouped by time slot */}
          <div className="space-y-5">
            {TIME_SLOTS.map(slot => {
              const group = supps.filter(s => s.times.includes(slot.id));
              if (!group.length) return null;
              return (
                <div key={slot.id}>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    {slot.emoji} {slot.label}
                    <span className="font-normal normal-case text-amber-400">— {slot.context || ''}</span>
                  </p>
                  <div className="space-y-1.5">
                    {group.map(s => {
                      const col    = getColor(s.color);
                      const active = s.active !== false;
                      return (
                        <div key={s.id + slot.id}
                          className={`rounded-xl border ${active ? `${col.bg} ${col.border}` : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                          <button onClick={() => setExpanded(expanded === `${s.id}-${slot.id}` ? null : `${s.id}-${slot.id}`)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${active ? col.dot : 'bg-gray-300'}`}/>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-amber-900">{s.name}</span>
                                {s.split && <span className="text-xs bg-amber-200 text-amber-700 px-1.5 rounded-full">{s.split}</span>}
                              </div>
                              {s.dose && <p className="text-xs text-amber-500 font-light">{s.dose}{s.withMeal ? ' · with food' : ''}</p>}
                            </div>
                            <ChevronDown size={14} className={`text-amber-400 flex-shrink-0 transition-transform ${expanded === `${s.id}-${slot.id}` ? 'rotate-180' : ''}`}/>
                          </button>

                          {expanded === `${s.id}-${slot.id}` && (
                            <div className="px-3.5 pb-3 pt-1 border-t border-amber-100 space-y-2">
                              {s.notes && <p className="text-xs text-amber-600 font-light">📝 {s.notes}</p>}
                              <div className="flex gap-2">
                                <button onClick={() => toggleActive(s.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all
                                    ${active ? 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}>
                                  {active ? '⏸ Pause' : '▶ Resume'}
                                </button>
                                <button onClick={() => deleteSupp(s.id)}
                                  className="px-3 py-1 rounded-lg text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center gap-1">
                                  <X size={11}/> Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplementsTab;
