const router = require('express').Router();
const db = require('../database');
const { searchForMirla } = require('../services/trialsService');
router.get('/:drug', async (req,res) => {
  const drug = decodeURIComponent(req.params.drug);
  const cached = db.prepare('SELECT * FROM clinical_trials WHERE drug_name=?').all(drug);
  if (cached.length) return res.json(cached);
  try {
    const trials = await searchForMirla(drug);
    for (const t of trials) {
      try { db.prepare('INSERT OR IGNORE INTO clinical_trials (nct_id,drug_name,title,phase,status,location,institution,inclusion_criteria,contact_name,contact_email,contact_phone,enrollment_count,start_date,completion_date,url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(t.nct_id,drug,t.title,t.phase,t.status,t.location,t.institution,t.inclusion_criteria,t.contact_name,t.contact_email,t.contact_phone,t.enrollment_count,t.start_date,t.completion_date,t.url); } catch {}
    }
    res.json(trials);
  } catch(e) { res.status(500).json({error:e.message}); }
});
module.exports = router;
