import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

const TrialsTab = ({ db }) => {
  const [trials, setTrials] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newTrial, setNewTrial] = useState({ name: '', status: '', location: '', institution: '', link: '', notes: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const tx = db.transaction('trials', 'readonly');
    const store = tx.objectStore('trials');
    const request = store.getAll();
    request.onsuccess = () => {
      if (request.result.length === 0) {
        fetchTrials();
      } else {
        setTrials(request.result);
        setLoading(false);
      }
    };
  }, [db]);

  const fetchTrials = async () => {
    try {
      const response = await fetch('https://clinicaltrials.gov/api/query/full_studies?expr=scleroderma&fmt=json&pageSize=10');
      const data = await response.json();

      if (data.NStudiesReturned > 0) {
        const trialsData = data.NStudiesResultList.NStudiesResults.slice(0, 10).map(study => ({
          id: Date.now() + Math.random(),
          name: study.ProtocolSection?.IdentificationModule?.OfficialTitle || 'Unnamed Trial',
          status: study.ProtocolSection?.StatusModule?.OverallStatus || 'Unknown',
          location: study.ProtocolSection?.ContactsLocationsModule?.Locations?.[0]?.City || 'Multiple locations',
          institution: study.ProtocolSection?.SponsorCollaboratorsModule?.LeadSponsor?.LeadSponsorName || 'Unknown',
          link: `https://clinicaltrials.gov/ct2/show/${study.ProtocolSection?.IdentificationModule?.NCTId}`,
          notes: study.ProtocolSection?.DescriptionsModule?.BriefSummary || 'No description available'
        }));

        const tx = db.transaction('trials', 'readwrite');
        const store = tx.objectStore('trials');
        trialsData.forEach(trial => store.add(trial));
        setTrials(trialsData);
      }
    } catch (error) {
      console.error('Error fetching trials:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTrial = () => {
    if (!newTrial.name) return;
    const tx = db.transaction('trials', 'readwrite');
    const store = tx.objectStore('trials');
    const trial = { ...newTrial, id: Date.now() };
    store.add(trial);
    setTrials([...trials, trial]);
    setNewTrial({ name: '', status: '', location: '', institution: '', link: '', notes: '' });
  };

  const deleteTrial = (id) => {
    const tx = db.transaction('trials', 'readwrite');
    const store = tx.objectStore('trials');
    store.delete(id);
    setTrials(trials.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(254, 252, 232, 0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6">Clinical Trials for Scleroderma</h2>

        {loading && <p className="text-amber-700 font-light mb-6">Loading active trials...</p>}

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Trial name" value={newTrial.name} onChange={(e) => setNewTrial({ ...newTrial, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="text" placeholder="Status (e.g., Recruiting, Active)" value={newTrial.status} onChange={(e) => setNewTrial({ ...newTrial, status: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="text" placeholder="Location" value={newTrial.location} onChange={(e) => setNewTrial({ ...newTrial, location: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="text" placeholder="Institution / Sponsor" value={newTrial.institution} onChange={(e) => setNewTrial({ ...newTrial, institution: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="url" placeholder="Link to trial info (https://...)" value={newTrial.link} onChange={(e) => setNewTrial({ ...newTrial, link: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Your notes" value={newTrial.notes} onChange={(e) => setNewTrial({ ...newTrial, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-20 resize-none" />
          <button onClick={addTrial} className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2">
            <Plus size={18} /> Add Trial
          </button>
        </div>

        <div className="space-y-3">
          {!loading && trials.length === 0 ? (
            <p className="text-amber-700 font-light">Track clinical trials you're interested in.</p>
          ) : (
            trials.map((trial) => (
              <div key={trial.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === trial.id ? null : trial.id)} className="w-full text-left flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-amber-900 text-sm">{trial.name}</h3>
                    {trial.status && <p className="text-xs text-amber-700 mt-1">{trial.status}</p>}
                  </div>
                  <ChevronDown size={20} className={`text-amber-600 transition-transform flex-shrink-0 ${expanded === trial.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === trial.id && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                    {trial.location && <p className="text-sm text-amber-700"><strong>Location:</strong> {trial.location}</p>}
                    {trial.institution && <p className="text-sm text-amber-700"><strong>Sponsor:</strong> {trial.institution}</p>}
                    {trial.notes && <p className="text-sm text-amber-700">{trial.notes}</p>}
                    {trial.link && <p className="text-sm"><a href={trial.link} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">View trial details →</a></p>}
                    <button onClick={() => deleteTrial(trial.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mt-3">
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

export default TrialsTab;
