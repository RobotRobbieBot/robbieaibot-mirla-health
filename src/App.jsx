import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X, Calendar, Users, Pill } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const MirlaHealthHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initDB = () => {
      const request = indexedDB.open('MirlaHealthHub', 1);
      request.onsuccess = (e) => {
        setDb(e.target.result);
      };
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains('data')) {
          database.createObjectStore('data', { keyPath: 'key' });
        }
      };
    };
    initDB();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-emerald-50">
      <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-emerald-400 px-4 py-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Mirla's Health Journey</h1>
        <p className="opacity-90">Your scleroderma care, in one place. You've got this. 💛</p>
      </div>

      <div className="sticky top-0 bg-white border-b shadow-sm z-40">
        <div className="max-w-4xl mx-auto px-4 flex gap-2 py-3">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'appointments', label: '📅 Appointments' },
            { id: 'doctors', label: '👨‍⚕️ Doctors' },
            { id: 'medications', label: '💊 Medications' },
            { id: 'exercises', label: '💪 Exercises' },
            { id: 'notes', label: '📝 Notes' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeTab === tab.id ? 'bg-rose-400 text-white' : 'bg-gray-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <div className="text-center"><h2 className="text-2xl font-bold">Welcome to Mirla's Health Journey</h2><p className="mt-4">Everything you need for your scleroderma care in one place.</p></div>}
        {activeTab === 'appointments' && <div><h2 className="text-2xl font-bold mb-4">Appointments</h2><p>Manage your doctor visits here.</p></div>}
        {activeTab === 'doctors' && <div><h2 className="text-2xl font-bold mb-4">Your Health Team</h2><p>Track your doctors and specialists.</p></div>}
        {activeTab === 'medications' && <div><h2 className="text-2xl font-bold mb-4">Medications</h2><p>Track your current medications.</p></div>}
        {activeTab === 'exercises' && <div><h2 className="text-2xl font-bold mb-4">Safe Exercises</h2><p>SSc-safe exercises for your health.</p></div>}
        {activeTab === 'notes' && <div><h2 className="text-2xl font-bold mb-4">Private Notes</h2><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Your private notes..." className="w-full h-64 p-4 border rounded" /></div>}
      </div>
    </div>
  );
};

export default MirlaHealthHub;
