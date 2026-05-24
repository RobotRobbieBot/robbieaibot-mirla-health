const router = require('express').Router();
const db = require('../database');

router.get('/', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM exercises ORDER BY created_at ASC').all());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { name, description, frequency, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const r = db.prepare(
      'INSERT INTO exercises (name, description, frequency, notes) VALUES (?, ?, ?, ?)'
    ).run(name, description || null, frequency || null, notes || null);
    res.json({ id: r.lastInsertRowid, success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { name, description, frequency, notes } = req.body;
    db.prepare(
      'UPDATE exercises SET name=?, description=?, frequency=?, notes=? WHERE id=?'
    ).run(name, description || null, frequency || null, notes || null, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM exercises WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
