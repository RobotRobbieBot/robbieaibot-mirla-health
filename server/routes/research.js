const router = require('express').Router();
const db = require('../database');
const { searchDrugForSSc } = require('../services/pubmedService');
router.get('/:drug', async (req,res) => {
  const drug = decodeURIComponent(req.params.drug);
  const cached = db.prepare('SELECT * FROM research_papers WHERE drug_name=? LIMIT 20').all(drug);
  if (cached.length) return res.json(cached);
  try {
    const papers = await searchDrugForSSc(drug);
    for (const p of papers.slice(0,15)) {
      try { db.prepare('INSERT OR IGNORE INTO research_papers (drug_name,pubmed_id,title,authors,year,url,doi) VALUES (?,?,?,?,?,?,?)').run(drug,p.pubmed_id,p.title,p.authors,p.year,p.url,p.doi); } catch {}
    }
    res.json(papers);
  } catch(e) { res.status(500).json({error:e.message}); }
});
module.exports = router;
