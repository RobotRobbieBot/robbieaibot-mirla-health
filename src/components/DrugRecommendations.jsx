import React, { useState, useEffect } from 'react';
import axios from 'axios';

import API from '../api';

function ScoreBar({ value, label }) {
  const color = value >= 80 ? 'bg-green-400' : value >= 60 ? 'bg-yellow-400' : 'bg-amber-400';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-amber-700">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MatchBadge({ score }) {
  if (score >= 80) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">{score}% match</span>;
  if (score >= 60) return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">{score}% match</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">{score}% match</span>;
}

export default function DrugRecommendations({ onViewEvidence, onFindTrials }) {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchDrugs(); }, []);

  async function fetchDrugs() {
    try {
      const res = await axios.get(`${API}/api/drugs`);
      setDrugs(res.data);
    } catch (e) {
      setError('Could not load recommendations. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setRanking(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/drugs/rank`);
      setDrugs(res.data);
    } catch (e) {
      setError('Analysis failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setRanking(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-light text-amber-900">AI Drug Ranking</h2>
          <p className="text-amber-600 text-sm mt-1">Ranked by pathway match, evidence, safety &amp; trial availability for Mirla's SSc profile</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={ranking}
          className="px-5 py-2 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          {ranking ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : 'Run Analysis'}
        </button>
      </div>

      {/* Mirla Profile Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="font-medium">Mirla's Profile: </span>
        IL-6=45 pg/mL (HIGH) · TGF-β=22.5 ng/mL (ELEVATED) · mRSS=28 (SEVERE) · FVC=68% (REDUCED) · Current: MMF, Nifedipine, Sildenafil, Omeprazole
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {ranking && (
        <div className="rounded-2xl border border-amber-200 bg-white bg-opacity-60 p-8 text-center">
          <div className="inline-block w-10 h-10 border-4 border-amber-300 border-t-amber-700 rounded-full animate-spin mb-4" />
          <p className="text-amber-700 font-medium">Searching clinical trials &amp; ranking drugs...</p>
          <p className="text-amber-500 text-sm mt-1">This may take 30-60 seconds</p>
        </div>
      )}

      {loading && !ranking && (
        <div className="text-center py-10 text-amber-600">Loading recommendations...</div>
      )}

      {!loading && !ranking && drugs.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-white bg-opacity-60 p-10 text-center">
          <p className="text-amber-600 italic">No rankings yet.</p>
          <p className="text-amber-500 text-sm mt-2">Click "Run Analysis" to rank all drugs for Mirla's profile.</p>
        </div>
      )}

      {/* Drug Cards */}
      {!ranking && drugs.length > 0 && (
        <div className="space-y-3">
          {drugs.map((drug, i) => (
            <div key={drug.drug_name || i}
              className="rounded-2xl border border-amber-200 bg-white bg-opacity-60 overflow-hidden transition-all">
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-medium text-amber-900 text-lg">{drug.drug_name}</h3>
                      {drug.drug_class && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {drug.drug_class}
                        </span>
                      )}
                    </div>
                  </div>
                  <MatchBadge score={drug.match_percentage} />
                </div>

                {/* Score Bars */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ScoreBar value={drug.mechanism_score} label="Mechanism" />
                  <ScoreBar value={drug.evidence_score} label="Evidence" />
                  <ScoreBar value={drug.safety_score} label="Safety" />
                  <ScoreBar value={drug.trial_score} label="Trials" />
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() => setExpanded(expanded === drug.drug_name ? null : drug.drug_name)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all"
                  >
                    {expanded === drug.drug_name ? 'Hide Details' : 'View Details'}
                  </button>
                  {onViewEvidence && (
                    <button
                      onClick={() => onViewEvidence(drug.drug_name)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all"
                    >
                      View Evidence
                    </button>
                  )}
                  {onFindTrials && (
                    <button
                      onClick={() => onFindTrials(drug.drug_name)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-all"
                    >
                      Find Trials
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === drug.drug_name && (
                <div className="border-t border-amber-100 p-5 bg-amber-50 bg-opacity-40">
                  {drug.reasoning && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Mechanism &amp; Reasoning</p>
                      <p className="text-sm text-amber-800 leading-relaxed">{drug.reasoning}</p>
                    </div>
                  )}
                  {drug.evidence_summary && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Evidence Summary</p>
                      <p className="text-sm text-amber-800 leading-relaxed">{drug.evidence_summary}</p>
                    </div>
                  )}
                  {drug.contraindications && (
                    <div>
                      <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Contraindications</p>
                      <p className="text-sm text-red-700 leading-relaxed">{drug.contraindications}</p>
                    </div>
                  )}
                  <p className="text-xs text-amber-500 mt-3 italic">Scoring: 30% mechanism + 40% evidence + 20% safety + 10% trial availability</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
