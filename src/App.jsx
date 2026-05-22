import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Users, Lightbulb, BookOpen, Microscope, Zap, Activity, Upload, FlaskConical, AlertTriangle, ClipboardList, Send } from 'lucide-react';

import OverviewTab         from './components/OverviewTab';
import AppointmentsTab     from './components/AppointmentsTab';
import DoctorsTab          from './components/DoctorsTab';
import ExercisesTab        from './components/ExercisesTab';
import ResearchTab         from './components/ResearchTab';
import TrialsTab           from './components/TrialsTab';
import MoonshootsTab       from './components/MoonshootsTab';
import NotesTab            from './components/NotesTab';
import LabDashboard        from './components/LabDashboard';
import DrugRecommendations from './components/DrugRecommendations';
import EvidenceSynthesis   from './components/EvidenceSynthesis';
import TrialMatcher        from './components/TrialMatcher';
import MirlaDataUpload     from './components/MirlaDataUpload';
import MirlaNotesSection   from './components/MirlaNotesSection';
import MonitoringSchedule  from './components/MonitoringSchedule';
import InteractionChecker  from './components/InteractionChecker';

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
  // ── Personal ──────────────────────────────────────────────
  { id: 'overview',      label: 'Overview',       icon: Heart,          group: 'personal' },
  { id: 'mymirla',       label: 'For You Mirla',  icon: Heart,          group: 'personal' },
  { id: 'appointments',  label: 'Appointments',   icon: Calendar,       group: 'personal' },
  { id: 'doctors',       label: 'Doctors',        icon: Users,          group: 'personal' },
  { id: 'exercises',     label: 'Exercises',      icon: Lightbulb,      group: 'personal' },
  { id: 'notes',         label: 'Notes',          icon: BookOpen,       group: 'personal' },
  // ── AI Intelligence ───────────────────────────────────────
  { id: 'labs',          label: 'Lab Trends',     icon: Activity,       group: 'intel' },
  { id: 'upload',        label: 'Upload Labs',    icon: Upload,         group: 'intel' },
  { id: 'drugs',         label: 'AI Drug Rank',   icon: Zap,            group: 'intel' },
  { id: 'evidence',      label: 'Evidence',       icon: Microscope,     group: 'intel' },
  { id: 'trialsmatch',   label: 'Trial Match',    icon: FlaskConical,   group: 'intel' },
  { id: 'interactions',  label: 'Interactions',   icon: AlertTriangle,  group: 'intel' },
  { id: 'monitoring',    label: 'Monitoring',     icon: ClipboardList,  group: 'intel' },
  // ── Archive ───────────────────────────────────────────────
  { id: 'research',      label: 'Research',       icon: Microscope,     group: 'archive' },
  { id: 'trials',        label: 'Trials',         icon: Zap,            group: 'archive' },
  { id: 'moonshots',     label: 'Moonshots',      icon: Zap,            group: 'archive' },
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

      {/* Nav — grouped */}
      <nav className="relative z-10 border-b border-amber-200 overflow-x-auto" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
        <div className="max-w-5xl mx-auto px-4 py-2 space-y-1">
          {/* Personal row */}
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-amber-400 font-medium self-center px-1 mr-1">Personal</span>
            {TABS.filter(t=>t.group==='personal').map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 text-sm ${activeTab===tab.id?'bg-yellow-200 text-amber-900 font-medium shadow-sm':'bg-white bg-opacity-40 text-amber-700 hover:bg-opacity-60'}`}>
                  <Icon size={14}/>{tab.label}
                </button>
              );
            })}
          </div>
          {/* AI Intelligence row */}
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-amber-400 font-medium self-center px-1 mr-1">AI Intel</span>
            {TABS.filter(t=>t.group==='intel').map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 text-sm ${activeTab===tab.id?'bg-amber-300 text-amber-900 font-medium shadow-sm':'bg-amber-50 bg-opacity-80 text-amber-700 hover:bg-opacity-100 border border-amber-200'}`}>
                  <Icon size={14}/>{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {activeTab === 'overview'      && <OverviewTab />}
        {activeTab === 'mymirla'       && <MirlaNotesSection />}
        {activeTab === 'appointments'  && db && <AppointmentsTab db={db} />}
        {activeTab === 'doctors'       && db && <DoctorsTab      db={db} />}
        {activeTab === 'exercises'     && db && <ExercisesTab    db={db} />}
        {activeTab === 'notes'         && db && <NotesTab        db={db} />}
        {activeTab === 'labs'          && <LabDashboard />}
        {activeTab === 'upload'        && <MirlaDataUpload />}
        {activeTab === 'drugs'         && <DrugRecommendations />}
        {activeTab === 'evidence'      && <EvidenceSynthesis />}
        {activeTab === 'trialsmatch'   && <TrialMatcher />}
        {activeTab === 'interactions'  && <InteractionChecker />}
        {activeTab === 'monitoring'    && <MonitoringSchedule />}
        {activeTab === 'research'      && db && <ResearchTab     db={db} />}
        {activeTab === 'trials'        && db && <TrialsTab       db={db} />}
        {activeTab === 'moonshots'     && db && <MoonshootsTab   db={db} />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-10 text-amber-700 text-sm border-t border-amber-200 mt-12" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
        <p className="font-light">No one else sees it. Just you and your journey.</p>
      </footer>
    </div>
  );
};

export default MirlaHealthHub;
