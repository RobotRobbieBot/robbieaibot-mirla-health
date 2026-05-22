const cron = require('node-cron');
const db = require('../database');
const { generateWeeklyReport } = require('./claudeService');
const { sendWeeklyReport } = require('./emailService');

function weekBounds() {
  const now = new Date();
  const d = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - (d===0?6:d-1));
  const sun = new Date(mon); sun.setDate(mon.getDate()+6);
  return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] };
}

async function generateAndSendReport() {
  const { start, end } = weekBounds();
  const labs  = db.prepare('SELECT * FROM lab_results WHERE date >= ? ORDER BY date DESC LIMIT 7').all(start);
  const drugs = db.prepare('SELECT * FROM drug_recommendations ORDER BY match_percentage DESC LIMIT 5').all();
  const notes = db.prepare('SELECT * FROM mirla_notes WHERE date >= ? ORDER BY date').all(start);
  const trials= db.prepare("SELECT * FROM clinical_trials WHERE status='RECRUITING' LIMIT 5").all();
  const redFlags = labs.filter(l => (l.il6&&l.il6>50)||(l.fvc&&l.fvc<65)||(l.mrss&&l.mrss>30));
  const content = await generateWeeklyReport({ labs, drugs, notes, trials, redFlags });
  db.prepare('INSERT INTO weekly_reports (week_start,week_end,full_content,red_flags) VALUES (?,?,?,?)').run(start, end, content, JSON.stringify(redFlags));
  await sendWeeklyReport(content, start, end);
  db.prepare('UPDATE mirla_notes SET included_in_weekly=1 WHERE date >= ?').run(start);
  console.log('✅ Weekly report generated for', start, '-', end);
}

function startScheduler() {
  cron.schedule('0 9 * * 0', generateAndSendReport, { timezone:'America/New_York' });
  console.log('📅 Scheduler started — reports every Sunday 9am ET');
}

module.exports = { startScheduler, generateAndSendReport };
