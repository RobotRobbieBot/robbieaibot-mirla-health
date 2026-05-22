import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Users, Lightbulb, BookOpen, Microscope, Zap } from 'lucide-react';

import OverviewTab     from './components/OverviewTab';
import AppointmentsTab from './components/AppointmentsTab';
import DoctorsTab      from './components/DoctorsTab';
import ExercisesTab    from './components/ExercisesTab';
import ResearchTab     from './components/ResearchTab';
import TrialsTab       from './components/TrialsTab';
import MoonshootsTab   from './components/MoonshootsTab';
import NotesTab        from './components/NotesTab';

const DAILY_QUOTES = [
  { quote: "Strength Through Faith", reference: "Philippians 4:13" },
  { quote: "The Lord is close to the brokenhearted", reference: "Psalm 34:18" },
  { quote: "Peace I leave with you; my peace I give to you", reference: "John 14:27" },
  { quote: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God", reference: "Philippians 4:6" },
  { quote: "Cast all your anxiety on him because he cares for you", reference: "1 Peter 5:7" },
  { quote: "I can do all this through him who gives me strength", reference: "Philippians 4:13" },
  { quote: "Be gentle with yourself. You are loved. You are worthy", reference: "Psalm 139:14" },
  { quote: "For God has not given us a spirit of fear, but of power, love and a sound mind", reference: "2 Timothy 1:7" },
];

const getDailyQuote = () => {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

const TABS = [
  { id: 'overview',      label: 'Overview',    icon: Heart },
  { id: 'appointments',  label: 'Appointments', icon: Calendar },
  { id: 'doctors',       label: 'Doctors',      icon: Users },
  { id: 'exercises',     label: 'Exercises',    icon: Lightbulb },
  { id: 'research',      label: 'Research',     icon: Microscope },
  { id: 'trials',        label: 'Trials',       icon: Zap },
  { id: 'moonshots',     label: 'Moonshots',    icon: Zap },
  { id: 'notes',         label: 'Notes',        icon: BookOpen },
];

const MirlaHealthHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [db, setDb] = useState(null);
  const dailyQuote = getDailyQuote();

  useEffect(() => {
    const request = indexedDB.open('MirlaHealthHub', 1);
    request.onerror = () => console.error('DB error');
    request.onsuccess = (e) => setDb(e.target.result);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      ['appointments', 'doctors', 'exercises', 'notes', 'research', 'trials', 'moonshots'].forEach(store => {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-amber-50 to-yellow-100" style={{
      backgroundImage: `radial-gradient(circle at 20% 50%, rgba(253, 224, 71, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.08) 0%, transparent 50%)`
    }}>
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none opacity-5 mix-blend-multiply" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M100,50 L110,80 L140,85 L115,105 L125,135 L100,115 L75,135 L85,105 L60,85 L90,80 Z' fill='%23FBF914' stroke='%23F59E0B' stroke-width='2'/%3E%3C/svg%3E")`,
        backgroundSize: '300px 300px',
      }} />

      {/* Header */}
      <header className="relative z-10 border-b border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(251, 191, 36, 0.4) 100%)'
      }}>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-5xl font-light text-amber-900 mb-3 tracking-wide">Mirla's Health Journey</h1>
          <p className="text-amber-700 text-lg italic font-light">{dailyQuote.quote}</p>
          <p className="text-amber-600 text-sm mt-1">— {dailyQuote.reference}</p>
        </div>
      </header>

      {/* Nav */}
      <nav className="relative z-10 border-b border-amber-200 overflow-x-auto" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
        <div className="max-w-4xl mx-auto px-4 flex gap-1 py-3">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-yellow-200 text-amber-900 font-medium shadow-sm'
                    : 'bg-white bg-opacity-40 text-amber-700 hover:bg-opacity-60'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {activeTab === 'overview'     && <OverviewTab />}
        {activeTab === 'appointments' && db && <AppointmentsTab db={db} />}
        {activeTab === 'doctors'      && db && <DoctorsTab      db={db} />}
        {activeTab === 'exercises'    && db && <ExercisesTab    db={db} />}
        {activeTab === 'research'     && db && <ResearchTab     db={db} />}
        {activeTab === 'trials'       && db && <TrialsTab       db={db} />}
        {activeTab === 'moonshots'    && db && <MoonshootsTab   db={db} />}
        {activeTab === 'notes'        && db && <NotesTab        db={db} />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-10 text-amber-700 text-sm border-t border-amber-200 mt-12" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
        <p className="font-light">No one else sees it. Just you and your journey.</p>
      </footer>
    </div>
  );
};

export default MirlaHealthHub;
