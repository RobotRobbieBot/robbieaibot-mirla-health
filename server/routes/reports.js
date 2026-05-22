const router = require('express').Router();
const db = require('../database');
const { generateAndSendReport } = require('../services/scheduler');
router.get('/', (req,res) => res.json(db.prepare('SELECT * FROM weekly_reports ORDER BY created_at DESC LIMIT 10').all()));
router.post('/send', async (req,res) => {
  try { await generateAndSendReport(); res.json({success:true,message:'Report sent to Robbie'}); }
  catch(e) { res.status(500).json({error:e.message}); }
});
module.exports = router;
