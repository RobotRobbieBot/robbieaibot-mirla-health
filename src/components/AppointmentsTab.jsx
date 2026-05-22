import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

const AppointmentsTab = ({ db }) => {
  const [appointments, setAppointments] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newAppt, setNewAppt] = useState({ doctor: '', date: '', time: '', location: '', prepNotes: '' });

  useEffect(() => {
    if (!db) return;
    const tx = db.transaction('appointments', 'readonly');
    const store = tx.objectStore('appointments');
    const request = store.getAll();
    request.onsuccess = () => setAppointments(request.result);
  }, [db]);

  const addAppointment = () => {
    if (!newAppt.doctor || !newAppt.date) return;
    const tx = db.transaction('appointments', 'readwrite');
    const store = tx.objectStore('appointments');
    const appt = { ...newAppt, id: Date.now() };
    store.add(appt);
    setAppointments([...appointments, appt]);
    setNewAppt({ doctor: '', date: '', time: '', location: '', prepNotes: '' });
  };

  const deleteAppointment = (id) => {
    const tx = db.transaction('appointments', 'readwrite');
    const store = tx.objectStore('appointments');
    store.delete(id);
    setAppointments(appointments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(254, 252, 232, 0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6">Appointments</h2>

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Doctor or specialist name" value={newAppt.doctor} onChange={(e) => setNewAppt({ ...newAppt, doctor: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={newAppt.date} onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })} className="px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
            <input type="time" value={newAppt.time} onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })} className="px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <input type="text" placeholder="Location (optional)" value={newAppt.location} onChange={(e) => setNewAppt({ ...newAppt, location: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Preparation notes or questions" value={newAppt.prepNotes} onChange={(e) => setNewAppt({ ...newAppt, prepNotes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-20 resize-none" />
          <button onClick={addAppointment} className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2">
            <Plus size={18} /> Add Appointment
          </button>
        </div>

        <div className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-amber-700 font-light">No appointments yet.</p>
          ) : (
            appointments.map((appt) => (
              <div key={appt.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === appt.id ? null : appt.id)} className="w-full text-left flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-amber-900">{appt.doctor}</h3>
                    <p className="text-sm text-amber-700">{appt.date} {appt.time && `at ${appt.time}`}</p>
                  </div>
                  <ChevronDown size={20} className={`text-amber-600 transition-transform ${expanded === appt.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === appt.id && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                    {appt.location && <p className="text-sm text-amber-700"><strong>Location:</strong> {appt.location}</p>}
                    {appt.prepNotes && <p className="text-sm text-amber-700"><strong>Notes:</strong> {appt.prepNotes}</p>}
                    <button onClick={() => deleteAppointment(appt.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mt-3">
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

export default AppointmentsTab;
