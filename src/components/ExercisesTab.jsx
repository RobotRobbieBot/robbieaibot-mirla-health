import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X, Lightbulb, Loader } from 'lucide-react';

const API = 'http://localhost:3001/api/exercises';

const ExercisesTab = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [newEx, setNewEx]         = useState({ name: '', description: '', frequency: '', notes: '' });

  const fetchExercises = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to load');
      setExercises(await res.json());
      setError(null);
    } catch (e) {
      setError('Could not load exercises — is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExercises(); }, []);

  const addExercise = async () => {
    if (!newEx.name) return;
    setSaving(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEx),
      });
      if (!res.ok) throw new Error('Save failed');
      const { id } = await res.json();
      setExercises([...exercises, { ...newEx, id }]);
      setNewEx({ name: '', description: '', frequency: '', notes: '' });
      setError(null);
    } catch (e) {
      setError('Could not save — ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteExercise = async (id) => {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      setExercises(exercises.filter(e => e.id !== id));
    } catch (e) {
      setError('Could not remove exercise');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(254,252,232,0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-2 flex items-center gap-3">
          <Lightbulb className="text-amber-500" size={28} /> Gentle Movement
        </h2>
        <p className="text-amber-600 font-light text-sm mb-6">Movement that feels good for your body — at your own pace, always.</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Exercise or movement name" value={newEx.name}
            onChange={e => setNewEx({ ...newEx, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Description or how it helps" value={newEx.description}
            onChange={e => setNewEx({ ...newEx, description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-20 resize-none" />
          <input type="text" placeholder="How often (e.g. 3× per week, daily)" value={newEx.frequency}
            onChange={e => setNewEx({ ...newEx, frequency: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Notes or modifications for your body" value={newEx.notes}
            onChange={e => setNewEx({ ...newEx, notes: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-16 resize-none" />
          <button onClick={addExercise} disabled={saving || !newEx.name}
            className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />} Add Movement
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-amber-500 text-sm">
            <Loader size={16} className="animate-spin" /> Loading…
          </div>
        ) : exercises.length === 0 ? (
          <p className="text-amber-600 font-light italic">Add gentle movements that feel good for your body.</p>
        ) : (
          <div className="space-y-3">
            {exercises.map(ex => (
              <div key={ex.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                  className="w-full text-left flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-amber-900">{ex.name}</h3>
                    {ex.frequency && <p className="text-sm text-amber-600">{ex.frequency}</p>}
                  </div>
                  <ChevronDown size={18} className={`text-amber-400 transition-transform ${expanded === ex.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === ex.id && (
                  <div className="mt-3 pt-3 border-t border-amber-100 space-y-1.5 text-sm text-amber-700 font-light">
                    {ex.description && <p>{ex.description}</p>}
                    {ex.notes && <p><strong>Notes:</strong> {ex.notes}</p>}
                    <button onClick={() => deleteExercise(ex.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-2">
                      <X size={13} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExercisesTab;
