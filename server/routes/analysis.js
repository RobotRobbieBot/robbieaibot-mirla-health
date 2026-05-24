const router = require('express').Router();
const db = require('../database');
const { analyzeDrugForMirla, analyzeInteractions } = require('../services/claudeService');
const { runFullAnalysis, chatWithAgent } = require('../services/analysisAgent');
const { generateDoctorBrief, generateTestBrief } = require('../services/doctorBrief');

// ── Existing routes ──────────────────────────────────────────────────────
router.post('/drug', async (req,res) => {
  try { res.json(await analyzeDrugForMirla(req.body.drugName, req.body.mechanism||'', req.body.research||'')); }
  catch(e) { res.status(500).json({error:e.message}); }
});
router.post('/interactions', async (req,res) => {
  try { res.json(await analyzeInteractions(req.body.currentMeds, req.body.newDrug)); }
  catch(e) { res.status(500).json({error:e.message}); }
});

// ── Medical Intelligence Agent ───────────────────────────────────────────
router.post('/run', async (req, res) => {
  try {
    const labs = db.prepare(
      `SELECT * FROM lab_results WHERE source_file IS NOT NULL ORDER BY date DESC LIMIT 15`
    ).all();
    if (labs.length === 0) return res.status(400).json({ error: 'No lab results found. Upload PDFs first.' });

    const result = await runFullAnalysis(labs);
    const info = db.prepare(
      `INSERT INTO analysis_reports (lab_ids, critical_flags, report_text, pubmed_refs, trials_refs, raw_context)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      labs.map(l => l.id).join(','),
      JSON.stringify(result.criticalFlags),
      result.report,
      result.pubmedRefs,
      result.trialsRefs,
      JSON.stringify(result.context)
    );
    res.json({ id: info.lastInsertRowid, report: result.report, criticalFlags: result.criticalFlags, trials: result.trialsRefs });
  } catch (e) { console.error('Analysis error:', e); res.status(500).json({ error: e.message }); }
});

router.get('/latest', (req, res) => {
  const report = db.prepare(`SELECT * FROM analysis_reports ORDER BY created_at DESC LIMIT 1`).get();
  if (!report) return res.json(null);
  const messages = db.prepare(
    `SELECT role, content, created_at FROM chat_messages WHERE report_id = ? ORDER BY created_at ASC`
  ).all(report.id);
  res.json({ ...report, criticalFlags: JSON.parse(report.critical_flags || '[]'), chatHistory: messages });
});

router.get('/history', (req, res) => {
  const reports = db.prepare(`SELECT id, created_at, critical_flags FROM analysis_reports ORDER BY created_at DESC LIMIT 20`).all();
  res.json(reports.map(r => ({ ...r, criticalFlags: JSON.parse(r.critical_flags || '[]') })));
});

router.post('/chat/:reportId', async (req, res) => {
  const { reportId } = req.params;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  const report = db.prepare(`SELECT * FROM analysis_reports WHERE id = ?`).get(reportId);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  const history = db.prepare(`SELECT role, content FROM chat_messages WHERE report_id = ? ORDER BY created_at ASC`).all(reportId);
  try {
    const reply = await chatWithAgent(report.report_text, history, message);
    db.prepare(`INSERT INTO chat_messages (report_id, role, content) VALUES (?, ?, ?)`).run(reportId, 'user', message);
    db.prepare(`INSERT INTO chat_messages (report_id, role, content) VALUES (?, ?, ?)`).run(reportId, 'assistant', reply);
    res.json({ reply });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Doctor Brief ─────────────────────────────────────────────────────────
router.post('/doctor-brief', async (req, res) => {
  const { drug, context } = req.body;
  if (!drug) return res.status(400).json({ error: 'Drug name required' });
  try {
    const result = await generateDoctorBrief(drug, context || '');
    const info = db.prepare(
      `INSERT INTO doctor_briefs (drug_name, brief_text, papers, trials) VALUES (?, ?, ?, ?)`
    ).run(drug, result.brief, JSON.stringify(result.papers), JSON.stringify(result.trials));
    res.json({ id: info.lastInsertRowid, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/doctor-briefs', (req, res) => {
  const briefs = db.prepare(
    `SELECT id, drug_name, created_at, substr(brief_text, 1, 200) as preview FROM doctor_briefs ORDER BY created_at DESC`
  ).all();
  res.json(briefs);
});

router.get('/doctor-brief/:id', (req, res) => {
  const b = db.prepare(`SELECT * FROM doctor_briefs WHERE id = ?`).get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Not found' });
  res.json({ ...b, papers: JSON.parse(b.papers || '[]'), trials: JSON.parse(b.trials || '[]') });
});

// ── Test Request Briefs ───────────────────────────────────────────────────
router.post('/test-brief', async (req, res) => {
  const { test, reason } = req.body;
  if (!test) return res.status(400).json({ error: 'Test name required' });
  try {
    const result = await generateTestBrief(test, reason || '');
    const info = db.prepare(
      `INSERT INTO doctor_briefs (drug_name, brief_text, papers, trials) VALUES (?, ?, ?, ?)`
    ).run(`TEST: ${test}`, result.brief, JSON.stringify(result.papers), JSON.stringify([]));
    res.json({ id: info.lastInsertRowid, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
