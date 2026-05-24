import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X, Calendar, Loader } from 'lucide-react';

const API = 'http://localhost:3001/api/appointments';

const AppointmentsTab = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);
  const [expanded, setExpanded]         = useState(null);
  const [newAppt, setNewAppt]           = useState({ doctor: '', date: '', time: '', location: '', prepNotes: '' });

  const fetchAppointments = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to load appointments');
      setAppointments(await res.json());
      setError(null);
    } catch (e) {
      setError('Could not load appointments — is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const addAppointment = async () => {
    if (!newAppt.doctor || !newAppt.date) return;
    setSaving(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppt),
      });
      if (!res.ok) throw new Error('Save failed');
      const { id } = await res.json();
      const updated = [...appointments, { ...newAppt, id }]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setAppointments(updated);
      setNewAppt({ doctor: '', date: '', time: '', location: '', prepNotes: '' });
      setError(null);
    } catch (e) {
      setError('Could not save appointment — ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      setAppointments(appointments.filter(a => a.id !== id));
    } catch (e) {
      setError('Could not delete appointment');
    }
  };

  const upcoming = appointments.filter(a => new Date(a.date) >= new Date().setHours(0,0,0,0));
  const past     = appointments.filter(a => new Date(a.date) < new Date().setHours(0,0,0,0));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(254,252,232,0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6 flex items-center gap-3">
          <Calendar className="text-amber-500" size={28} /> Appointments
        </h2>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Add form */}
        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Doctor or specialist name" value={newAppt.doctor}
            onChange={e => setNewAppt({ ...newAppt, doctor: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={newAppt.date}
              onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
              className="px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
            <input type="time" value={newAppt.time}
              onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}
              className="px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <input type="text" placeholder="Location (optional)" value={newAppt.location}
            onChange={e => setNewAppt({ ...newAppt, location: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Preparation notes or questions to ask" value={newAppt.prepNotes}
            onChange={e => setNewAppt({ ...newAppt, prepNotes: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-20 resize-none" />
          <button onClick={addAppointment} disabled={saving || !newAppt.doctor || !newAppt.date}
            className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />} Add Appointment
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-amber-500 text-sm">
            <Loader size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">Upcoming</h3>
                <div className="space-y-3">
                  {upcoming.map(appt => (
                    <ApptCard key={appt.id} appt={appt} expanded={expanded} setExpanded={setExpanded} onDelete={deleteAppointment} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">Past</h3>
                <div className="space-y-3 opacity-60">
                  {past.slice().reverse().map(appt => (
                    <ApptCard key={appt.id} appt={appt} expanded={expanded} setExpanded={setExpanded} onDelete={deleteAppointment} />
                  ))}
                </div>
              </div>
            )}
            {appointments.length === 0 && (
              <p className="text-amber-600 font-light italic">No appointments yet — add your first one above.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ApptCard = ({ appt, expanded, setExpanded, onDelete }) => (
  <div className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
    <button onClick={() => setExpanded(expanded === appt.id ? null : appt.id)}
      className="w-full text-left flex justify-between items-center">
      <div>
        <h3 className="font-medium text-amber-900">{appt.doctor}</h3>
        <p className="text-sm text-amber-600">
          {appt.date}{appt.time ? ` at ${appt.time}` : ''}{appt.location ? ` · ${appt.location}` : ''}
        </p>
      </div>
      <ChevronDown size={18} className={`text-amber-400 transition-transform ${expanded === appt.id ? 'rotate-180' : ''}`} />
    </button>
    {expanded === appt.id && (
      <div className="mt-3 pt-3 border-t border-amber-100 space-y-2">
        {appt.prepNotes && <p className="text-sm text-amber-700 font-light"><strong>Notes:</strong> {appt.prepNotes}</p>}
        <button onClick={() => onDelete(appt.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-2">
          <X size={14} /> Remove
        </button>
      </div>
    )}
  </div>
);

export default AppointmentsTab;
