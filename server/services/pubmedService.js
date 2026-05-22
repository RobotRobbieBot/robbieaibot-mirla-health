const axios = require('axios');
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const delay = ms => new Promise(r => setTimeout(r, ms));

async function searchPapers(query, max = 15) {
  try {
    const s = await axios.get(`${BASE}/esearch.fcgi`, { params: { db:'pubmed', term:query, retmax:max, retmode:'json', sort:'relevance' }, timeout: 10000 });
    const ids = s.data.esearchresult?.idlist || [];
    if (!ids.length) return [];
    const sum = await axios.get(`${BASE}/esummary.fcgi`, { params: { db:'pubmed', id:ids.join(','), retmode:'json' }, timeout: 10000 });
    const res = sum.data.result;
    return ids.map(id => {
      const p = res[id]; if (!p) return null;
      return { pubmed_id: id, title: p.title||'', authors: (p.authors||[]).map(a=>a.name).join(', '), year: p.pubdate ? parseInt(p.pubdate) : null, journal: p.fulljournalname||'', url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, doi: p.elocationid||'' };
    }).filter(Boolean);
  } catch (e) { console.error('PubMed error:', e.message); return []; }
}

async function searchDrugForSSc(drugName) {
  const queries = [
    `${drugName} scleroderma systemic sclerosis`,
    `${drugName} SSc fibrosis randomized controlled trial`,
    `${drugName} IL-6 TGF-beta fibroblast`
  ];
  const all = [];
  for (const q of queries) {
    const papers = await searchPapers(q, 8);
    all.push(...papers);
    await delay(350);
  }
  const seen = new Set();
  return all.filter(p => { if (seen.has(p.pubmed_id)) return false; seen.add(p.pubmed_id); return true; });
}

module.exports = { searchPapers, searchDrugForSSc };
