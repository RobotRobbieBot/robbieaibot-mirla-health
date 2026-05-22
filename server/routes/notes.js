const router = require('express').Router();
const db = require('../database');
router.get('/', (req,res) => res.json(db.prepare('SELECT * FROM mirla_notes ORDER BY date DESC').all()));
router.post('/', (req,res) => {
  const {date,note_text,mood,pain_level,energy_level} = req.body;
  const ex = db.prepare('SELECT id FROM mirla_notes WHERE date=?').get(date);
  if (ex) { db.prepare('UPDATE mirla_notes SET note_text=?,mood=?,pain_level=?,energy_level=?,updated_at=CURRENT_TIMESTAMP WHERE date=?').run(note_text,mood,pain_level,energy_level,date); return res.json({success:true,updated:true}); }
  const r = db.prepare('INSERT INTO mirla_notes (date,note_text,mood,pain_level,energy_level) VALUES (?,?,?,?,?)').run(date,note_text,mood,pain_level,energy_level);
  res.json({id:r.lastInsertRowid,success:true});
});
router.put('/:id', (req,res) => { const {note_text,mood,pain_level,energy_level}=req.body; db.prepare('UPDATE mirla_notes SET note_text=?,mood=?,pain_level=?,energy_level=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(note_text,mood,pain_level,energy_level,req.params.id); res.json({success:true}); });
router.delete('/:id', (req,res) => { db.prepare('DELETE FROM mirla_notes WHERE id=?').run(req.params.id); res.json({success:true}); });
module.exports = router;
