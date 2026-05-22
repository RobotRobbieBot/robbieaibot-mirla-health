import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

const ResearchTab = ({ db }) => {
  const [research, setResearch] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newItem, setNewItem] = useState({ title: '', authors: '', date: '', link: '', summary: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const tx = db.transaction('research', 'readonly');
    const store = tx.objectStore('research');
    const request = store.getAll();
    request.onsuccess = () => {
      if (request.result.length === 0) {
        fetchResearch();
      } else {
        setResearch(request.result);
        setLoading(false);
      }
    };
  }, [db]);

  const fetchResearch = async () => {
    try {
      const response = await fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=scleroderma&retmax=10&retmode=json');
      const data = await response.json();

      if (data.esearchresult.idlist && data.esearchresult.idlist.length > 0) {
        const pmids = data.esearchresult.idlist.slice(0, 10);
        const summaryResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`);
        const summaryData = await summaryResponse.json();

        const researchData = pmids.map(pmid => {
          const item = summaryData.result[pmid];
          return {
            id: Date.now() + Math.random(),
            title: item.title || 'Unnamed Study',
            authors: item.sortfirstauthor ? item.sortfirstauthor + ' et al.' : 'Unknown',
            date: item.pubdate ? item.pubdate.split(' ')[0] : 'Unknown',
            link: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
            summary: item.abstract ? item.abstract.substring(0, 200) + '...' : 'No abstract available'
          };
        });

        const tx = db.transaction('research', 'readwrite');
        const store = tx.objectStore('research');
        researchData.forEach(r => store.add(r));
        setResearch(researchData);
      }
    } catch (error) {
      console.error('Error fetching research:', error);
    } finally {
      setLoading(false);
    }
  };

  const addResearch = () => {
    if (!newItem.title) return;
    const tx = db.transaction('research', 'readwrite');
    const store = tx.objectStore('research');
    const item = { ...newItem, id: Date.now() };
    store.add(item);
    setResearch([...research, item]);
    setNewItem({ title: '', authors: '', date: '', link: '', summary: '' });
  };

  const deleteResearch = (id) => {
    const tx = db.transaction('research', 'readwrite');
    const store = tx.objectStore('research');
    store.delete(id);
    setResearch(research.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(254, 252, 232, 0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6">Research & Studies on Scleroderma</h2>

        {loading && <p className="text-amber-700 font-light mb-6">Loading latest research...</p>}

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <input type="text" placeholder="Study title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="text" placeholder="Authors" value={newItem.authors} onChange={(e) => setNewItem({ ...newItem, authors: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="text" placeholder="Publication date" value={newItem.date} onChange={(e) => setNewItem({ ...newItem, date: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <input type="url" placeholder="Link to study (https://...)" value={newItem.link} onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <textarea placeholder="Summary or notes" value={newItem.summary} onChange={(e) => setNewItem({ ...newItem, summary: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-20 resize-none" />
          <button onClick={addResearch} className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2">
            <Plus size={18} /> Add Research
          </button>
        </div>

        <div className="space-y-3">
          {!loading && research.length === 0 ? (
            <p className="text-amber-700 font-light">Add research studies and articles you find.</p>
          ) : (
            research.map((item) => (
              <div key={item.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="w-full text-left flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-amber-900 text-sm">{item.title}</h3>
                    {item.authors && <p className="text-xs text-amber-700 mt-1">{item.authors}</p>}
                  </div>
                  <ChevronDown size={20} className={`text-amber-600 transition-transform flex-shrink-0 ${expanded === item.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === item.id && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                    {item.date && <p className="text-sm text-amber-700"><strong>Published:</strong> {item.date}</p>}
                    {item.summary && <p className="text-sm text-amber-700">{item.summary}</p>}
                    {item.link && <p className="text-sm"><a href={item.link} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">Read full study →</a></p>}
                    <button onClick={() => deleteResearch(item.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mt-3">
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

export default ResearchTab;
