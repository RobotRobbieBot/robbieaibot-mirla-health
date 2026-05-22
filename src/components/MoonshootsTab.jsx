import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

const MoonshootsTab = ({ db }) => {
  const [moonshots, setMoonshots] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newMoonshot, setNewMoonshot] = useState({ name: '', description: '', link: '', stage: '', notes: '' });

  useEffect(() => {
    if (!db) return;
    const tx = db.transaction('moonshots', 'readonly');
    const store = tx.objectStore('moonshots');
    const request = store.getAll();
    request.onsuccess = () => setMoonshots(request.result);
  }, [db]);

  const addMoonshot = () => {
    if (!newMoonshot.name) return;
    const tx = db.transaction('moonshots', 'readwrite');
    const store = tx.objectStore('moonshots');
    const moonshot = { ...newMoonshot, id: Date.now() };
    store.add(moonshot);
    setMoonshots([...moonshots, moonshot]);
    setNewMoonshot({ name: '', description: '', link: '', stage: '', notes: '' });
  };

  const deleteMoonshot = (id) => {
    const tx = db.transaction('moonshots', 'readwrite');
    const store = tx.objectStore('moonshots');
    store.delete(id);
    setMoonshots(moonshots.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(254, 252, 232, 0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6">Experimental & Emerging Treatments</h2>

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Treatment name" value={newMoonshot.name} onChange={(e) => setNewMoonshot({ ...newMoonshot, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="How it works / Description" value={newMoonshot.description} onChange={(e) => setNewMoonshot({ ...newMoonshot, description: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-20 resize-none" />
          <input type="text" placeholder="Stage (e.g., Preclinical, Early trials, Emerging)" value={newMoonshot.stage} onChange={(e) => setNewMoonshot({ ...newMoonshot, stage: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="url" placeholder="Link to more info (https://...)" value={newMoonshot.link} onChange={(e) => setNewMoonshot({ ...newMoonshot, link: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Your thoughts or questions" value={newMoonshot.notes} onChange={(e) => setNewMoonshot({ ...newMoonshot, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-20 resize-none" />
          <button onClick={addMoonshot} className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2">
            <Plus size={18} /> Add Moonshot
          </button>
        </div>

        <div className="space-y-3">
          {moonshots.length === 0 ? (
            <p className="text-amber-700 font-light">Explore emerging and experimental treatments.</p>
          ) : (
            moonshots.map((moonshot) => (
              <div key={moonshot.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === moonshot.id ? null : moonshot.id)} className="w-full text-left flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-amber-900">{moonshot.name}</h3>
                    {moonshot.stage && <p className="text-sm text-amber-700">{moonshot.stage}</p>}
                  </div>
                  <ChevronDown size={20} className={`text-amber-600 transition-transform ${expanded === moonshot.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === moonshot.id && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                    {moonshot.description && <p className="text-sm text-amber-700">{moonshot.description}</p>}
                    {moonshot.notes && <p className="text-sm text-amber-700"><strong>Your notes:</strong> {moonshot.notes}</p>}
                    {moonshot.link && <p className="text-sm"><a href={moonshot.link} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">Learn more →</a></p>}
                    <button onClick={() => deleteMoonshot(moonshot.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mt-3">
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

export default MoonshootsTab;
