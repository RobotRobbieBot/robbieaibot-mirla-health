import React, { useState, useEffect } from 'react';
import axios from 'axios';

import API from '../api';

const DRUG_NAMES = [
  'Tocilizumab', 'Nintedanib', 'Dasatinib', 'Baricitinib', 'Tofacitinib',
  'Abatacept', 'Rituximab', 'Imatinib', 'Pirfenidone', 'A20-mRNA Therapy',
  'Belimumab', 'Lenabasum'
];

function EvidenceBadge({ year }) {
  if (!year) return null;
  const age = new Date().getFullYear() - year;
  if (age <= 3) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Recent ({year})</span>;
  if (age <= 7) return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">{year}</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">{year}</span>;
}

export default function EvidenceSynthesis({ initialDrug }) {
  const [selectedDrug, setSelectedDrug] = useState(initialDrug || DRUG_NAMES[0]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialDrug) {
      setSelectedDrug(initialDrug);
      handleSearch(initialDrug);
    }
  }, [initialDrug]);

  async function handleSearch(drugName) {
    const drug = drugName || selectedDrug;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await axios.get(`${API}/api/research/${encodeURIComponent(drug)}`);
      setPapers(res.data);
    } catch (e) {
      setError('Failed to search PubMed: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light text-amber-900">Evidence Synthesis</h2>
        <p className="text-amber-600 text-sm mt-1">Search PubMed for SSc-relevant research on each drug</p>
      </div>

      {/* Search Controls */}
      <div className="rounded-2xl border border-amber-200 bg-white bg-opacity-60 p-5">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-amber-700 mb-1 font-medium">Select Drug</label>
            <select
              value={selectedDrug}
              onChange={e => setSelectedDrug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {DRUG_NAMES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : 'Search PubMed'}
            </button>
          </div>
        </div>
        <p className="text-xs text-amber-500 mt-2 italic">
          Searches: "{selectedDrug} scleroderma", "{selectedDrug} SSc fibrosis", "{selectedDrug} IL-6 TGF-beta"
        </p>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading && (
        <div className="rounded-2xl border border-amber-200 bg-white bg-opacity-60 p-10 text-center">
          <div className="inline-block w-10 h-10 border-4 border-amber-300 border-t-amber-700 rounded-full animate-spin mb-4" />
          <p className="text-amber-700 font-medium">Searching PubMed...</p>
          <p className="text-amber-500 text-sm mt-1">Querying 3 search strategies</p>
        </div>
      )}

      {!loading && searched && papers.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-white bg-opacity-60 p-10 text-center">
          <p className="text-amber-600 italic">No papers found for {selectedDrug} + SSc.</p>
          <p className="text-amber-500 text-sm mt-2">This drug may be experimental or have limited SSc-specific literature.</p>
        </div>
      )}

      {!loading && papers.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-amber-700 font-medium">{papers.length} papers found for <span className="font-bold">{selectedDrug}</span> in SSc research:</p>
          {papers.map((paper, i) => (
            <div key={paper.pubmed_id || i}
              className="rounded-2xl border border-amber-200 bg-white bg-opacity-60 p-4 hover:border-amber-300 transition-all">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-amber-800 hover:text-amber-600 hover:underline leading-snug"
                    >
                      {paper.title || 'Untitled'}
                    </a>
                    <EvidenceBadge year={paper.year} />
                  </div>
                  <p className="text-xs text-amber-600 mt-1 truncate">{paper.authors}</p>
                  {paper.journal && (
                    <p className="text-xs text-amber-500 mt-0.5 italic">{paper.journal}</p>
                  )}
                  {paper.abstract && (
                    <p className="text-xs text-amber-700 mt-2 leading-relaxed line-clamp-3">{paper.abstract}</p>
                  )}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {paper.pubmed_id && (
                      <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        PMID: {paper.pubmed_id}
                      </span>
                    )}
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 transition-colors"
                    >
                      View on PubMed
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searched && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 bg-opacity-60 p-10 text-center">
          <p className="text-amber-600 italic">Select a drug and click "Search PubMed" to find relevant research.</p>
        </div>
      )}
    </div>
  );
}
