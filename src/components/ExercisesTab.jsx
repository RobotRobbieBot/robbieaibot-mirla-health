import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

const ExercisesTab = ({ db }) => {
  const [exercises, setExercises] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newEx, setNewEx] = useState({ name: '', description: '', frequency: '', notes: '' });

  useEffect(() => {
    if (!db) return;
    const tx = db.transaction('exercises', 'readonly');
    const store = tx.objectStore('exercises');
    const request = store.getAll();
    request.onsuccess = () => setExercises(request.result);
  }, [db]);

  const addExercise = () => {
    if (!newEx.name) return;
    const tx = db.transaction('exercises', 'readwrite');
    const store = tx.objectStore('exercises');
    const ex = { ...newEx, id: Date.now() };
    store.add(ex);
    setExercises([...exercises, ex]);
    setNewEx({ name: '', description: '', frequency: '', notes: '' });
  };

  const deleteExercise = (id) => {
    const tx = db.transaction('exercises', 'readwrite');
    const store = tx.objectStore('exercises');
    store.delete(id);
    setExercises(exercises.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(254, 252, 232, 0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6">Gentle Movement</h2>

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Exercise name" value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Description or how it feels" value={newEx.description} onChange={(e) => setNewEx({ ...newEx, description: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-20 resize-none" />
          <input type="text" placeholder="How often (e.g., 3x per week)" value={newEx.frequency} onChange={(e) => setNewEx({ ...newEx, frequency: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Notes or modifications" value={newEx.notes} onChange={(e) => setNewEx({ ...newEx, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-16 resize-none" />
          <button onClick={addExercise} className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2">
            <Plus size={18} /> Add Exercise
          </button>
        </div>

        <div className="space-y-3">
          {exercises.length === 0 ? (
            <p className="text-amber-700 font-light">Add gentle movements that feel good for your body.</p>
          ) : (
            exercises.map((ex) => (
              <div key={ex.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === ex.id ? null : ex.id)} className="w-full text-left flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-amber-900">{ex.name}</h3>
                    {ex.frequency && <p className="text-sm text-amber-700">{ex.frequency}</p>}
                  </div>
                  <ChevronDown size={20} className={`text-amber-600 transition-transform ${expanded === ex.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === ex.id && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                    {ex.description && <p className="text-sm text-amber-700">{ex.description}</p>}
                    {ex.notes && <p className="text-sm text-amber-700"><strong>Notes:</strong> {ex.notes}</p>}
                    <button onClick={() => deleteExercise(ex.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mt-3">
                      <X size={16} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExercisesTab;
