const router = require('express').Router();
const db = require('../database');

// Helper: parse times JSON safely
const parseTimes = (t) => { try { return JSON.parse(t || '[]'); } catch { return []; } };

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM supplements ORDER BY sort_order ASC, created_at ASC').all();
    res.json(rows.map(r => ({
      ...r,
      times:    parseTimes(r.times),
      withMeal: !!r.with_meal,
      active:   !!r.active,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { name, dose, times, withMeal, notes, color, split, warning, active, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const r = db.prepare(
      `INSERT INTO supplements (name, dose, times, with_meal, notes, color, split, warning, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name,
      dose || null,
      JSON.stringify(times || []),
      withMeal ? 1 : 0,
      notes || null,
      color || 'amber',
      split || null,
      warning || null,
      active !== false ? 1 : 0,
      sort_order || 0
    );
    res.json({ id: r.lastInsertRowid, success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bulk-seed endpoint — used on first run to migrate from localStorage defaults
router.post('/seed', (req, res) => {
  try {
    const { supplements } = req.body;
    if (!Array.isArray(supplements)) return res.status(400).json({ error: 'supplements array required' });
    const existing = db.prepare('SELECT COUNT(*) as n FROM supplements').get();
    if (existing.n > 0) return res.json({ skipped: true, reason: 'already seeded' });

    const insert = db.prepare(
      `INSERT INTO supplements (name, dose, times, with_meal, notes, color, split, warning, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertMany = db.transaction((supps) => {
      supps.forEach((s, i) => insert.run(
        s.name, s.dose || null, JSON.stringify(s.times || []),
        s.withMeal ? 1 : 0, s.notes || null, s.color || 'amber',
        s.split || null, s.warning || null, 1, i
      ));
    });
    insertMany(supplements);
    res.json({ success: true, count: supplements.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { name, dose, times, withMeal, notes, color, split, warning, active, sort_order } = req.body;
    db.prepare(
      `UPDATE supplements SET name=?, dose=?, times=?, with_meal=?, notes=?, color=?, split=?, warning=?, active=?, sort_order=?
       WHERE id=?`
    ).run(
      name, dose || null, JSON.stringify(times || []),
      withMeal ? 1 : 0, notes || null, color || 'amber',
      split || null, warning || null, active !== false ? 1 : 0,
      sort_order || 0, req.params.id
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM supplements WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
