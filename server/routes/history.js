const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { processDocument, findConnections, updatePatientProfile } = require('../services/documentProcessor');

const uploadDir = path.join(__dirname, '../../uploads/history');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-z0-9.\-_]/gi, '_')}`)
  }),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// ── Upload + process one or many files ─────────────────────────────────────
router.post('/upload', upload.array('files', 50), async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

  const results = [];

  for (const file of files) {
    try {
      console.log(`📄 Processing: ${file.originalname}`);
      const result = await processDocument(file.path, file.originalname);

      if (!result) {
        results.push({ file: file.originalname, status: 'error', error: 'Could not process document' });
        continue;
      }

      const info = db.prepare(`
        INSERT INTO medical_documents
          (filename, doc_type, doc_date, provider, specialty, summary, key_facts, extracted_text, source_file)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        file.originalname, result.doc_type, result.doc_date,
        result.provider, result.specialty, result.summary,
        JSON.stringify(result.key_facts || {}),
        (result.extracted_text || '').substring(0, 5000),
        file.filename
      );

      // Add timeline event
      const te = result.key_facts?.timeline_event;
      if (te?.title && result.doc_date) {
        db.prepare(`
          INSERT INTO medical_timeline (event_date, event_type, title, description, source_doc_id, condition_tags, severity)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          result.doc_date, te.event_type || 'other', te.title,
          te.description || result.summary, info.lastInsertRowid,
          JSON.stringify(result.key_facts?.diagnoses || []),
          te.severity || 'routine'
        );
      }

      results.push({
        file: file.originalname,
        status: 'ok',
        id: info.lastInsertRowid,
        doc_type: result.doc_type,
        doc_date: result.doc_date,
        provider: result.provider,
        summary: result.summary,
        connections_to_watch: result.connections_to_watch || []
      });

    } catch (e) {
      console.error(`Error processing ${file.originalname}:`, e.message);
      results.push({ file: file.originalname, status: 'error', error: e.message });
    }
  }

  // After batch — update profile and find connections async
  setImmediate(async () => {
    try {
      await updatePatientProfile(db);
      const connections = await findConnections(db);
      if (connections.length > 0) {
        // Clear old connections and save new ones
        db.prepare('DELETE FROM document_connections').run();
        connections.forEach(c => {
          try {
            db.prepare(`INSERT INTO document_connections (doc_a_id, doc_b_id, connection_type, description, confidence)
              VALUES (?, ?, ?, ?, ?)`).run(c.doc_a_id, c.doc_b_id, c.connection_type, c.description, c.confidence);
          } catch {}
        });
        console.log(`🔗 Found ${connections.length} connections`);
      }
    } catch (e) { console.error('Post-upload processing error:', e.message); }
  });

  res.json({ processed: results.length, results });
});

// ── Get all documents ───────────────────────────────────────────────────────
router.get('/documents', (req, res) => {
  const { type, search } = req.query;
  let query = `SELECT id, filename, doc_type, doc_date, provider, specialty, summary, created_at FROM medical_documents`;
  const params = [];
  const conditions = [];
  if (type && type !== 'all') { conditions.push('doc_type = ?'); params.push(type); }
  if (search) { conditions.push('(summary LIKE ? OR filename LIKE ? OR provider LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY doc_date DESC, created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// ── Get timeline ────────────────────────────────────────────────────────────
router.get('/timeline', (req, res) => {
  const events = db.prepare(
    `SELECT * FROM medical_timeline ORDER BY event_date ASC`
  ).all();
  res.json(events.map(e => ({ ...e, condition_tags: JSON.parse(e.condition_tags || '[]') })));
});

// ── Get patient profile ─────────────────────────────────────────────────────
router.get('/profile', (req, res) => {
  const profile = db.prepare('SELECT * FROM patient_profile WHERE id = 1').get();
  if (!profile) return res.json({});
  res.json({
    diagnoses:          JSON.parse(profile.diagnoses || '[]'),
    procedures:         JSON.parse(profile.procedures || '[]'),
    allergies:          JSON.parse(profile.allergies || '[]'),
    key_findings:       JSON.parse(profile.key_findings || '[]'),
    condition_timeline: JSON.parse(profile.condition_timeline || '[]'),
    updated_at:         profile.updated_at
  });
});

// ── Get connections ─────────────────────────────────────────────────────────
router.get('/connections', (req, res) => {
  const connections = db.prepare(`
    SELECT dc.*, da.filename as doc_a_name, da.doc_type as doc_a_type, da.doc_date as doc_a_date,
           db.filename as doc_b_name, db.doc_type as doc_b_type, db.doc_date as doc_b_date
    FROM document_connections dc
    LEFT JOIN medical_documents da ON dc.doc_a_id = da.id
    LEFT JOIN medical_documents db ON dc.doc_b_id = db.id
    ORDER BY dc.found_at DESC
  `).all();
  res.json(connections);
});

// ── Get single document ─────────────────────────────────────────────────────
router.get('/documents/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM medical_documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ ...doc, key_facts: JSON.parse(doc.key_facts || '{}') });
});

// ── Delete document ─────────────────────────────────────────────────────────
router.delete('/documents/:id', (req, res) => {
  db.prepare('DELETE FROM medical_timeline WHERE source_doc_id = ?').run(req.params.id);
  db.prepare('DELETE FROM medical_documents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Trigger connection refresh ──────────────────────────────────────────────
router.post('/refresh-connections', async (req, res) => {
  try {
    await updatePatientProfile(db);
    const connections = await findConnections(db);
    db.prepare('DELETE FROM document_connections').run();
    connections.forEach(c => {
      try {
        db.prepare(`INSERT INTO document_connections (doc_a_id, doc_b_id, connection_type, description, confidence) VALUES (?, ?, ?, ?, ?)`)
          .run(c.doc_a_id, c.doc_b_id, c.connection_type, c.description, c.confidence);
      } catch {}
    });
    res.json({ connections: connections.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
