const router = require('express').Router();
const db = require('../database');
const { rankAllDrugs } = require('../services/drugRankingService');
router.get('/', (req,res) => {
  const drugs = db.prepare('SELECT * FROM drug_recommendations ORDER BY match_percentage DESC').all();
  res.json(drugs.length ? drugs : []);
});
router.post('/rank', async (req,res) => {
  try { res.json(await rankAllDrugs()); }
  catch(e) { res.status(500).json({error:e.message}); }
});
router.get('/medications', (req,res) => res.json(db.prepare('SELECT * FROM medications ORDER BY final_score DESC').all()));
module.exports = router;
