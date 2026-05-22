import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

const DoctorsTab = ({ db }) => {
  const [doctors, setDoctors] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newDoc, setNewDoc] = useState({ name: '', specialty: '', phone: '', email: '', location: '' });

  useEffect(() => {
    if (!db) return;
    const tx = db.transaction('doctors', 'readonly');
    const store = tx.objectStore('doctors');
    const request = store.getAll();
    request.onsuccess = () => setDoctors(request.result);
  }, [db]);

  const addDoctor = () => {
    if (!newDoc.name) return;
    const tx = db.transaction('doctors', 'readwrite');
    const store = tx.objectStore('doctors');
    const doc = { ...newDoc, id: Date.now() };
    store.add(doc);
    setDoctors([...doctors, doc]);
    setNewDoc({ name: '', specialty: '', phone: '', email: '', location: '' });
  };

  const deleteDoctor = (id) => {
    const tx = db.transaction('doctors', 'readwrite');
    const store = tx.objectStore('doctors');
    store.delete(id);
    setDoctors(doctors.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(254, 252, 232, 0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6">Your Care Team</h2>

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Doctor name" value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="text" placeholder="Specialty (e.g., Rheumatologist)" value={newDoc.specialty} onChange={(e) => setNewDoc({ ...newDoc, specialty: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="tel" placeholder="Phone" value={newDoc.phone} onChange={(e) => setNewDoc({ ...newDoc, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="email" placeholder="Email (optional)" value={newDoc.email} onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="text" placeholder="Office location" value={newDoc.location} onChange={(e) => setNewDoc({ ...newDoc, location: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <button onClick={addDoctor} className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2">
            <Plus size={18} /> Add Doctor
          </button>
        </div>

        <div className="space-y-3">
          {doctors.length === 0 ? (
            <p className="text-amber-700 font-light">Your care team will appear here.</p>
          ) : (
            doctors.map((doc) => (
              <div key={doc.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === doc.id ? null : doc.id)} className="w-full text-left flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-amber-900">{doc.name}</h3>
                    {doc.specialty && <p className="text-sm text-amber-700">{doc.specialty}</p>}
                  </div>
                  <ChevronDown size={20} className={`text-amber-600 transition-transform ${expanded === doc.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === doc.id && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                    {doc.phone && <p className="text-sm text-amber-700"><strong>Phone:</strong> <a href={`tel:${doc.phone}`} className="text-amber-600 hover:text-amber-700 underline">{doc.phone}</a></p>}
                    {doc.email && <p className="text-sm text-amber-700"><strong>Email:</strong> <a href={`mailto:${doc.email}`} className="text-amber-600 hover:text-amber-700 underline">{doc.email}</a></p>}
                    {doc.location && <p className="text-sm text-amber-700"><strong>Location:</strong> {doc.location}</p>}
                    <button onClick={() => deleteDoctor(doc.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mt-3">
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

export default DoctorsTab;
