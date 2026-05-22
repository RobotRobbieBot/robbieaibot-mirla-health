const router = require('express').Router();
const db = require('../database');
router.get('/', (req,res) => res.json(db.prepare('SELECT * FROM lab_results ORDER BY date DESC LIMIT 100').all()));
router.post('/', (req,res) => {
  const { date,il6,tgf_beta,a20,potassium,creatinine,wbc,mrss,fvc,hemoglobin,platelets,alt,ast,notes } = req.body;
  const r = db.prepare('INSERT INTO lab_results (date,il6,tgf_beta,a20,potassium,creatinine,wbc,mrss,fvc,hemoglobin,platelets,alt,ast,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(date,il6,tgf_beta,a20,potassium,creatinine,wbc,mrss,fvc,hemoglobin,platelets,alt,ast,notes);
  res.json({ id:r.lastInsertRowid, success:true });
});
router.delete('/:id', (req,res) => { db.prepare('DELETE FROM lab_results WHERE id=?').run(req.params.id); res.json({success:true}); });
module.exports = router;
