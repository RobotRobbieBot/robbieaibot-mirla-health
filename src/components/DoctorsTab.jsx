import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X, Users, Loader } from 'lucide-react';

const API = 'http://localhost:3001/api/doctors';

const DoctorsTab = () => {
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [newDoc, setNewDoc]     = useState({ name: '', specialty: '', phone: '', email: '', location: '', notes: '' });

  const fetchDoctors = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to load');
      setDoctors(await res.json());
      setError(null);
    } catch (e) {
      setError('Could not load care team — is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const addDoctor = async () => {
    if (!newDoc.name) return;
    setSaving(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });
      if (!res.ok) throw new Error('Save failed');
      const { id } = await res.json();
      setDoctors([...doctors, { ...newDoc, id }]);
      setNewDoc({ name: '', specialty: '', phone: '', email: '', location: '', notes: '' });
      setError(null);
    } catch (e) {
      setError('Could not save — ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteDoctor = async (id) => {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      setDoctors(doctors.filter(d => d.id !== id));
    } catch (e) {
      setError('Could not remove doctor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(254,252,232,0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6 flex items-center gap-3">
          <Users className="text-amber-500" size={28} /> Your Care Team
        </h2>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Doctor name" value={newDoc.name}
            onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="text" placeholder="Specialty (e.g. Rheumatologist)" value={newDoc.specialty}
            onChange={e => setNewDoc({ ...newDoc, specialty: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <div className="grid grid-cols-2 gap-3">
            <input type="tel" placeholder="Phone" value={newDoc.phone}
              onChange={e => setNewDoc({ ...newDoc, phone: e.target.value })}
              className="px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
            <input type="email" placeholder="Email (optional)" value={newDoc.email}
              onChange={e => setNewDoc({ ...newDoc, email: e.target.value })}
              className="px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <input type="text" placeholder="Office location" value={newDoc.location}
            onChange={e => setNewDoc({ ...newDoc, location: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Notes (e.g. next visit, questions to ask)" value={newDoc.notes}
            onChange={e => setNewDoc({ ...newDoc, notes: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-16 resize-none" />
          <button onClick={addDoctor} disabled={saving || !newDoc.name}
            className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />} Add to Care Team
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-amber-500 text-sm">
            <Loader size={16} className="animate-spin" /> Loading…
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-amber-600 font-light italic">Your care team will appear here.</p>
        ) : (
          <div className="space-y-3">
            {doctors.map(doc => (
              <div key={doc.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                  className="w-full text-left flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-amber-900">{doc.name}</h3>
                    {doc.specialty && <p className="text-sm text-amber-600">{doc.specialty}</p>}
                  </div>
                  <ChevronDown size={18} className={`text-amber-400 transition-transform ${expanded === doc.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === doc.id && (
                  <div className="mt-3 pt-3 border-t border-amber-100 space-y-1.5 text-sm text-amber-700">
                    {doc.phone    && <p>📞 <a href={`tel:${doc.phone}`}    className="underline">{doc.phone}</a></p>}
                    {doc.email    && <p>✉️ <a href={`mailto:${doc.email}`} className="underline">{doc.email}</a></p>}
                    {doc.location && <p>📍 {doc.location}</p>}
                    {doc.notes    && <p className="font-light mt-2">{doc.notes}</p>}
                    <button onClick={() => deleteDoctor(doc.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-2">
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

export default DoctorsTab;
