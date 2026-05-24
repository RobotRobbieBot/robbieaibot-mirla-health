const router = require('express').Router();
const db = require('../database');

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM appointments ORDER BY date ASC, time ASC').all();
    res.json(rows.map(r => ({ ...r, prepNotes: r.prep_notes })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { doctor, date, time, location, prepNotes } = req.body;
    if (!doctor || !date) return res.status(400).json({ error: 'doctor and date are required' });
    const r = db.prepare(
      'INSERT INTO appointments (doctor, date, time, location, prep_notes) VALUES (?, ?, ?, ?, ?)'
    ).run(doctor, date, time || null, location || null, prepNotes || null);
    res.json({ id: r.lastInsertRowid, success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { doctor, date, time, location, prepNotes } = req.body;
    db.prepare(
      'UPDATE appointments SET doctor=?, date=?, time=?, location=?, prep_notes=? WHERE id=?'
    ).run(doctor, date, time || null, location || null, prepNotes || null, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM appointments WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
