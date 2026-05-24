const router = require('express').Router();
const db = require('../database');

router.get('/', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM doctors ORDER BY name ASC').all());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { name, specialty, phone, email, location, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const r = db.prepare(
      'INSERT INTO doctors (name, specialty, phone, email, location, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, specialty || null, phone || null, email || null, location || null, notes || null);
    res.json({ id: r.lastInsertRowid, success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { name, specialty, phone, email, location, notes } = req.body;
    db.prepare(
      'UPDATE doctors SET name=?, specialty=?, phone=?, email=?, location=?, notes=? WHERE id=?'
    ).run(name, specialty || null, phone || null, email || null, location || null, notes || null, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM doctors WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
