const router = require('express').Router();
const { analyzeDrugForMirla, analyzeInteractions } = require('../services/claudeService');
router.post('/drug', async (req,res) => {
  try { res.json(await analyzeDrugForMirla(req.body.drugName, req.body.mechanism||'', req.body.research||'')); }
  catch(e) { res.status(500).json({error:e.message}); }
});
router.post('/interactions', async (req,res) => {
  try { res.json(await analyzeInteractions(req.body.currentMeds, req.body.newDrug)); }
  catch(e) { res.status(500).json({error:e.message}); }
});
module.exports = router;
